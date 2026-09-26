import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initializeAndMigrateTrips,
  getAllTrips,
  getTrip,
  saveTrip,
  deleteTrip,
  toTripSummary,
  memberMatches,
  lookupMemberTrips,
} from './serverTrips';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize multi-trip storage & seed migration on server startup
initializeAndMigrateTrips();

// Helper: Check if request has Admin authorization
function checkIsAdmin(req: http.IncomingMessage, searchParams: URLSearchParams): boolean {
  const adminHeader = req.headers['x-admin-auth'];
  const adminQuery = searchParams.get('adminAuth');
  return adminHeader === 'true' || adminQuery === 'true';
}

// Helper: Extract Member Identity from headers or query
function extractMemberIdentity(req: http.IncomingMessage, searchParams: URLSearchParams) {
  const email = (req.headers['x-member-email'] as string) || searchParams.get('email');
  const phone = (req.headers['x-member-phone'] as string) || searchParams.get('phone');
  const name = (req.headers['x-member-name'] as string) || searchParams.get('name');
  const memberId = (req.headers['x-member-id'] as string) || searchParams.get('memberId');

  if (!email && !phone && !name && !memberId) {
    return null;
  }

  return {
    email: email ? decodeURIComponent(email).trim() : undefined,
    phone: phone ? decodeURIComponent(phone).trim() : undefined,
    name: name ? decodeURIComponent(name).trim() : undefined,
    memberId: memberId ? decodeURIComponent(memberId).trim() : undefined,
  };
}

// Helper: Send JSON response with standard CORS & UTF-8 headers
function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-admin-auth, x-member-email, x-member-phone, x-member-name, x-member-id',
  });
  res.end(JSON.stringify(data));
}

// Helper: Parse JSON body
async function getJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Main Server Runner
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  let vite: any = null;

  if (isDev) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
      let pathname = parsedUrl.pathname;
      if (pathname.startsWith('/tool01/')) {
        pathname = pathname.slice('/tool01'.length);
      } else if (pathname === '/tool01') {
        pathname = '/';
      }
      const searchParams = parsedUrl.searchParams;
      const method = (req.method || 'GET').toUpperCase();

      // Handle CORS Preflight
      if (method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, x-admin-auth, x-member-email, x-member-phone, x-member-name, x-member-id',
        });
        res.end();
        return;
      }

      // API Routes
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
      }

      // 0. Member Name Lookup Entry Point (POST or GET)
      if (pathname === '/api/members/lookup') {
        const body = method === 'POST' ? await getJsonBody(req) : {};
        const name = (body?.name || searchParams.get('name')) as string | undefined;
        const disambiguateKey = (body?.disambiguateKey || searchParams.get('disambiguateKey')) as
          | string
          | undefined;

        if (!name || typeof name !== 'string' || !name.trim()) {
          return sendJson(res, 400, {
            success: false,
            error: '請輸入您的姓名',
            allowedTripIds: [],
            trips: [],
          });
        }

        const result = lookupMemberTrips(name, disambiguateKey);

        if (!result.found) {
          return sendJson(res, 404, {
            success: false,
            error: result.error || '找不到您的團務資料，請確認姓名是否正確',
            allowedTripIds: [],
            trips: [],
          });
        }

        return sendJson(res, 200, {
          success: true,
          ...result,
        });
      }

      // 1. /api/trips (GET & POST)
      if (pathname === '/api/trips') {
        if (method === 'GET') {
          const isAdmin = checkIsAdmin(req, searchParams);
          const memberIden = extractMemberIdentity(req, searchParams);
          const allTrips = getAllTrips();

          if (isAdmin) {
            const summaries = allTrips.map(toTripSummary);
            return sendJson(res, 200, {
              success: true,
              role: 'admin',
              trips: summaries,
              allowedTripIds: allTrips.map((t) => t.tripId || t.id),
            });
          }

          if (memberIden && (memberIden.name || memberIden.email || memberIden.phone)) {
            const result = lookupMemberTrips(memberIden.name || '', memberIden.memberId);
            if (result.found && !result.ambiguous) {
              return sendJson(res, 200, {
                success: true,
                role: 'member',
                memberQuery: memberIden,
                trips: result.trips,
                allowedTripIds: result.allowedTripIds,
              });
            }

            const matchingTrips = allTrips.filter((trip) => {
              if (!trip.members || !Array.isArray(trip.members)) return false;
              return trip.members.some((m) => memberMatches(m, memberIden));
            });

            const summaries = matchingTrips.map(toTripSummary);
            return sendJson(res, 200, {
              success: true,
              role: 'member',
              memberQuery: memberIden,
              trips: summaries,
              allowedTripIds: matchingTrips.map((t) => t.tripId || t.id),
            });
          }

          return sendJson(res, 200, {
            success: true,
            role: 'guest',
            trips: [],
            allowedTripIds: [],
            prompt: '請輸入姓名以查詢您所屬之團務',
          });
        }

        if (method === 'POST') {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: '權限不足：僅有管理者可建立團務' });
          }

          const body = await getJsonBody(req);
          const { trip } = body || {};
          if (!trip || !trip.title) {
            return sendJson(res, 400, { success: false, error: '請提供有效的團務資料與活動名稱' });
          }

          let tripId = trip.tripId || trip.id;
          if (!tripId || tripId.startsWith('exp_')) {
            const all = getAllTrips();
            tripId = `TRIP-${String(all.length + 1).padStart(3, '0')}`;
          }
          trip.tripId = tripId;
          trip.id = tripId;

          const success = saveTrip(trip);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              tripId,
              message: `團務【${trip.title}】(${tripId}) 建立成功！`,
              trip,
            });
          } else {
            return sendJson(res, 500, { success: false, error: '儲存新團務至硬碟失敗' });
          }
        }
      }

      // 6. Reset trips (POST /api/trips/reset)
      if (pathname === '/api/trips/reset' && method === 'POST') {
        if (!checkIsAdmin(req, searchParams)) {
          return sendJson(res, 403, { success: false, error: '權限不足' });
        }

        try {
          const TRIPS_DIR = path.join(process.cwd(), 'data', 'trips');
          if (fs.existsSync(TRIPS_DIR)) {
            const files = fs.readdirSync(TRIPS_DIR);
            for (const f of files) {
              fs.unlinkSync(path.join(TRIPS_DIR, f));
            }
          }
          initializeAndMigrateTrips();
          return sendJson(res, 200, { success: true, message: '團務系統已重設為標準三團測試範例' });
        } catch (e) {
          console.error('Reset error:', e);
          return sendJson(res, 500, { success: false, error: '重設團務失敗' });
        }
      }

      // 2, 4, 5. Specific trip operations (/api/trips/:tripId)
      const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)$/);
      if (tripMatch) {
        const tripId = decodeURIComponent(tripMatch[1]);

        if (method === 'GET') {
          const trip = getTrip(tripId);
          if (!trip) {
            return sendJson(res, 404, { success: false, error: `找不到團務編號 ${tripId}` });
          }

          const isAdmin = checkIsAdmin(req, searchParams);
          if (isAdmin) {
            return sendJson(res, 200, { success: true, role: 'admin', trip });
          }

          const memberIden = extractMemberIdentity(req, searchParams);
          if (memberIden && trip.members && Array.isArray(trip.members)) {
            const isMember = trip.members.some((m) => memberMatches(m, memberIden));
            if (isMember) {
              return sendJson(res, 200, { success: true, role: 'member', trip });
            }

            return sendJson(res, 403, {
              success: false,
              error: `存取受限：您並未在此團務【${trip.title}】的名冊中，無法查看此團務。`,
            });
          }

          return sendJson(res, 403, {
            success: false,
            error: '請先輸入姓名以查看您的所屬團務進度表。',
          });
        }

        if (method === 'PUT') {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: '權限不足：僅有管理者可修改團務' });
          }

          const body = await getJsonBody(req);
          const { trip } = body || {};
          if (!trip) {
            return sendJson(res, 400, { success: false, error: '缺少團務更新資料' });
          }

          trip.tripId = tripId;
          trip.id = tripId;

          const success = saveTrip(trip);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              tripId,
              message: `團務【${trip.title}】(${tripId}) 資料已即時更新至伺服器`,
              updatedAt: new Date().toISOString(),
            });
          } else {
            return sendJson(res, 500, { success: false, error: '更新團務資料至硬碟失敗' });
          }
        }

        if (method === 'DELETE') {
          if (!checkIsAdmin(req, searchParams)) {
            return sendJson(res, 403, { success: false, error: '權限不足：僅有管理者可刪除團務' });
          }

          const success = deleteTrip(tripId);
          if (success) {
            return sendJson(res, 200, { success: true, message: `團務 (${tripId}) 已成功刪除` });
          } else {
            return sendJson(res, 500, { success: false, error: `刪除團務 ${tripId} 失敗` });
          }
        }
      }

      // Backward compatibility routes for legacy callers
      if (pathname === '/api/plan') {
        if (method === 'GET') {
          const planId = searchParams.get('id');
          if (planId) {
            const trip = getTrip(planId);
            if (trip) {
              return sendJson(res, 200, { success: true, hasSavedData: true, plan: trip });
            }
          }

          const all = getAllTrips();
          if (all.length > 0) {
            return sendJson(res, 200, { success: true, hasSavedData: true, plan: all[0] });
          }

          return sendJson(res, 200, { success: true, hasSavedData: false, plan: null });
        }

        if (method === 'POST') {
          const body = await getJsonBody(req);
          const { plan, planId } = body || {};
          if (!plan) {
            return sendJson(res, 400, { success: false, error: 'Missing plan payload' });
          }

          const targetId = planId || plan.tripId || plan.id || 'TRIP-001';
          plan.tripId = targetId;
          plan.id = targetId;

          const success = saveTrip(plan);
          if (success) {
            return sendJson(res, 200, {
              success: true,
              message: '資料已成功儲存至伺服器！',
              updatedAt: new Date().toISOString(),
            });
          } else {
            return sendJson(res, 500, { success: false, error: 'Failed to write plan to storage' });
          }
        }
      }

      if (pathname === '/api/plan/reset' && method === 'POST') {
        try {
          initializeAndMigrateTrips();
          return sendJson(res, 200, { success: true, message: '伺服器端資料已重設' });
        } catch (e) {
          return sendJson(res, 500, { success: false, error: 'Failed to reset' });
        }
      }

      // Static MIME Type Mapping
      const MIME_TYPES: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.webp': 'image/webp',
      };

      // Non-API routes: hand over to Vite middleware in dev or serve static in prod
      if (isDev && vite) {
        vite.middlewares(req, res);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        const tool01Path = path.join(distPath, 'tool01');

        // Look for static file in tool01 or dist
        let candidatePath: string | null = null;
        const candidates = [
          path.join(tool01Path, pathname),
          path.join(distPath, pathname),
          path.join(distPath, parsedUrl.pathname),
        ];

        for (const p of candidates) {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            candidatePath = p;
            break;
          }
        }

        if (candidatePath) {
          const ext = path.extname(candidatePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(candidatePath).pipe(res);
        } else {
          // If request has a file extension (e.g. .js, .css, .png), return 404
          const hasFileExt = path.extname(pathname).length > 0;
          if (hasFileExt) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('File Not Found');
            return;
          }

          // Otherwise SPA fallback to index.html
          const tool01Index = path.join(tool01Path, 'index.html');
          const distIndex = path.join(distPath, 'index.html');
          const indexHtml = fs.existsSync(tool01Index)
            ? tool01Index
            : fs.existsSync(distIndex)
            ? distIndex
            : null;

          if (indexHtml) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(indexHtml).pipe(res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
          }
        }
      }
    } catch (err) {
      console.error('Unhandled request error:', err);
      sendJson(res, 500, { success: false, error: 'Internal Server Error' });
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
