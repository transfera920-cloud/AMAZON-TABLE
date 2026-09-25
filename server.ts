import express from 'express';
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

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limit for large Excel sheets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize multi-trip storage & seed migration on server startup
initializeAndMigrateTrips();

// Helper: Check if request has Admin authorization
function checkIsAdmin(req: express.Request): boolean {
  const adminHeader = req.headers['x-admin-auth'];
  const adminQuery = req.query.adminAuth;
  return adminHeader === 'true' || adminQuery === 'true';
}

// Helper: Extract Member Identity from headers or query
function extractMemberIdentity(req: express.Request) {
  const email = (req.headers['x-member-email'] || req.query.email) as string | undefined;
  const phone = (req.headers['x-member-phone'] || req.query.phone) as string | undefined;
  const name = (req.headers['x-member-name'] || req.query.name) as string | undefined;
  const memberId = (req.headers['x-member-id'] || req.query.memberId) as string | undefined;

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

// ==========================================
// API Routes
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 0. Member Name Lookup Entry Point (No password, just name)
// POST or GET /api/members/lookup
app.all('/api/members/lookup', (req, res) => {
  const name = (req.body?.name || req.query?.name) as string | undefined;
  const disambiguateKey = (req.body?.disambiguateKey || req.query?.disambiguateKey) as string | undefined;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: '請輸入您的姓名',
      allowedTripIds: [],
      trips: [],
    });
  }

  const result = lookupMemberTrips(name, disambiguateKey);

  if (!result.found) {
    return res.status(404).json({
      success: false,
      error: result.error || '找不到您的團務資料，請確認姓名是否正確',
      allowedTripIds: [],
      trips: [],
    });
  }

  return res.json({
    success: true,
    ...result,
  });
});

// 1. GET /api/trips - List Trips
// - Admin sees ALL trips
// - Member sees ONLY trips they participate in
// - Guest sees empty list to enforce name entry
app.get('/api/trips', (req, res) => {
  const isAdmin = checkIsAdmin(req);
  const memberIden = extractMemberIdentity(req);
  const allTrips = getAllTrips();

  if (isAdmin) {
    const summaries = allTrips.map(toTripSummary);
    return res.json({
      success: true,
      role: 'admin',
      trips: summaries,
      allowedTripIds: allTrips.map((t) => t.tripId || t.id),
    });
  }

  if (memberIden && (memberIden.name || memberIden.email || memberIden.phone)) {
    // Lookup member's allowed trips in real time
    const result = lookupMemberTrips(memberIden.name || '', memberIden.memberId);
    if (result.found && !result.ambiguous) {
      return res.json({
        success: true,
        role: 'member',
        memberQuery: memberIden,
        trips: result.trips,
        allowedTripIds: result.allowedTripIds,
      });
    }

    // Fallback filter
    const matchingTrips = allTrips.filter((trip) => {
      if (!trip.members || !Array.isArray(trip.members)) return false;
      return trip.members.some((m) => memberMatches(m, memberIden));
    });

    const summaries = matchingTrips.map(toTripSummary);
    return res.json({
      success: true,
      role: 'member',
      memberQuery: memberIden,
      trips: summaries,
      allowedTripIds: matchingTrips.map((t) => t.tripId || t.id),
    });
  }

  // Guest / unauthenticated: return empty list to prompt name entry
  return res.json({
    success: true,
    role: 'guest',
    trips: [],
    allowedTripIds: [],
    prompt: '請輸入姓名以查詢您所屬之團務',
  });
});

// 2. GET /api/trips/:tripId - Read Specific Trip
// - Admin can read any trip
// - Member can only read if they belong to that trip
// - Guest without member identity is denied
app.get('/api/trips/:tripId', (req, res) => {
  const { tripId } = req.params;
  const trip = getTrip(tripId);

  if (!trip) {
    return res.status(404).json({ success: false, error: `找不到團務編號 ${tripId}` });
  }

  const isAdmin = checkIsAdmin(req);
  if (isAdmin) {
    return res.json({ success: true, role: 'admin', trip });
  }

  const memberIden = extractMemberIdentity(req);
  if (memberIden && trip.members && Array.isArray(trip.members)) {
    const isMember = trip.members.some((m) => memberMatches(m, memberIden));
    if (isMember) {
      return res.json({ success: true, role: 'member', trip });
    }

    // Member exists but does NOT belong to this trip -> 403 Forbidden!
    return res.status(403).json({
      success: false,
      error: `存取受限：您並未在此團務【${trip.title}】的名冊中，無法查看此團務。`,
    });
  }

  // Not admin and no recognized member identity -> 403 Forbidden
  return res.status(403).json({
    success: false,
    error: '請先輸入姓名以查看您的所屬團務進度表。',
  });
});

// 3. POST /api/trips - Create New Trip (Admin only)
app.post('/api/trips', (req, res) => {
  if (!checkIsAdmin(req)) {
    return res.status(403).json({ success: false, error: '權限不足：僅有管理者可建立團務' });
  }

  const { trip } = req.body;
  if (!trip || !trip.title) {
    return res.status(400).json({ success: false, error: '請提供有效的團務資料與活動名稱' });
  }

  // Ensure unique tripId
  let tripId = trip.tripId || trip.id;
  if (!tripId || tripId.startsWith('exp_')) {
    const all = getAllTrips();
    tripId = `TRIP-${String(all.length + 1).padStart(3, '0')}`;
  }
  trip.tripId = tripId;
  trip.id = tripId;

  const success = saveTrip(trip);
  if (success) {
    res.json({
      success: true,
      tripId,
      message: `團務【${trip.title}】(${tripId}) 建立成功！`,
      trip,
    });
  } else {
    res.status(500).json({ success: false, error: '儲存新團務至硬碟失敗' });
  }
});

// 4. PUT /api/trips/:tripId - Update Trip (Admin only)
app.put('/api/trips/:tripId', (req, res) => {
  if (!checkIsAdmin(req)) {
    return res.status(403).json({ success: false, error: '權限不足：僅有管理者可修改團務' });
  }

  const { tripId } = req.params;
  const { trip } = req.body;
  if (!trip) {
    return res.status(400).json({ success: false, error: '缺少團務更新資料' });
  }

  trip.tripId = tripId;
  trip.id = tripId;

  const success = saveTrip(trip);
  if (success) {
    res.json({
      success: true,
      tripId,
      message: `團務【${trip.title}】(${tripId}) 資料已即時更新至伺服器`,
      updatedAt: new Date().toISOString(),
    });
  } else {
    res.status(500).json({ success: false, error: '更新團務資料至硬碟失敗' });
  }
});

// 5. DELETE /api/trips/:tripId - Delete Trip (Admin only)
app.delete('/api/trips/:tripId', (req, res) => {
  if (!checkIsAdmin(req)) {
    return res.status(403).json({ success: false, error: '權限不足：僅有管理者可刪除團務' });
  }

  const { tripId } = req.params;
  const success = deleteTrip(tripId);
  if (success) {
    res.json({ success: true, message: `團務 (${tripId}) 已成功刪除` });
  } else {
    res.status(500).json({ success: false, error: `刪除團務 ${tripId} 失敗` });
  }
});

// 6. POST /api/trips/reset - Reset sample trips (Admin only)
app.post('/api/trips/reset', (req, res) => {
  if (!checkIsAdmin(req)) {
    return res.status(403).json({ success: false, error: '權限不足' });
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
    res.json({ success: true, message: '團務系統已重設為標準三團測試範例' });
  } catch (e) {
    console.error('Reset error:', e);
    res.status(500).json({ success: false, error: '重設團務失敗' });
  }
});

// Backward compatibility routes for legacy callers
app.get('/api/plan', (req, res) => {
  const planId = req.query.id as string | undefined;
  if (planId) {
    const trip = getTrip(planId);
    if (trip) {
      return res.json({ success: true, hasSavedData: true, plan: trip });
    }
  }

  const all = getAllTrips();
  if (all.length > 0) {
    return res.json({ success: true, hasSavedData: true, plan: all[0] });
  }

  res.json({ success: true, hasSavedData: false, plan: null });
});

app.post('/api/plan', (req, res) => {
  const { plan, planId } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, error: 'Missing plan payload' });
  }

  const targetId = planId || plan.tripId || plan.id || 'TRIP-001';
  plan.tripId = targetId;
  plan.id = targetId;

  const success = saveTrip(plan);
  if (success) {
    res.json({
      success: true,
      message: '資料已成功儲存至伺服器！',
      updatedAt: new Date().toISOString(),
    });
  } else {
    res.status(500).json({ success: false, error: 'Failed to write plan to storage' });
  }
});

app.post('/api/plan/reset', (req, res) => {
  try {
    initializeAndMigrateTrips();
    res.json({ success: true, message: '伺服器端資料已重設' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to reset' });
  }
});

// Vite Middleware for Dev vs Static for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
