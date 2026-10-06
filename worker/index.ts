import { onRequestGet as healthGet } from '../functions/api/health';
import { onRequest as memberLookup } from '../functions/api/members/lookup';
import { onRequestGet as tripsGet, onRequestPost as tripsPost } from '../functions/api/trips/index';
import {
  onRequestGet as tripIdGet,
  onRequestPut as tripIdPut,
  onRequestDelete as tripIdDelete,
} from '../functions/api/trips/[tripId]';
import { onRequestPost as tripsResetPost } from '../functions/api/trips/reset';
import { onRequestPost as adminLoginPost } from '../functions/api/admin/login';
import { Env as TripsEnv } from '../functions/lib/tripsStore';

export interface Env extends TripsEnv {
  ASSETS?: {
    fetch: (request: Request | string, init?: RequestInit) => Promise<Response>;
  };
}

function createEventContext<P extends string = any>(
  request: Request,
  env: Env,
  params: Record<P, string | string[]> = {} as any,
  ctx?: any
) {
  return {
    request,
    functionPath: new URL(request.url).pathname,
    waitUntil: ctx && typeof ctx.waitUntil === 'function' ? (p: Promise<any>) => ctx.waitUntil(p) : () => {},
    next: async () => new Response('Not found', { status: 404 }),
    env,
    params,
    data: {},
  };
}

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx?: any): Promise<Response> {
    return withSecurityHeaders(await handle(request, env, ctx));
  },
};

async function handle(request: Request, env: Env, ctx?: any): Promise<Response> {
  {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // 1. 本系統與前端同網域，不開放跨網域存取（不回 Access-Control-Allow-Origin）
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    // 2. Identify API subpath (supports both /tool23/api/... and /api/...)
    let apiSubpath: string | null = null;
    if (pathname.startsWith('/tool23/api/')) {
      apiSubpath = pathname.slice('/tool23'.length);
    } else if (pathname.startsWith('/api/')) {
      apiSubpath = pathname;
    } else if (pathname === '/tool23/api' || pathname === '/api') {
      apiSubpath = '/api';
    }

    // 3. Dispatch API routes
    if (apiSubpath) {
      if (apiSubpath === '/api/health') {
        if (method === 'GET') {
          return healthGet(createEventContext(request, env, {}, ctx));
        }
        return new Response('Method Not Allowed', { status: 405 });
      }

      if (apiSubpath === '/api/members/lookup') {
        return memberLookup(createEventContext(request, env, {}, ctx));
      }

      if (apiSubpath === '/api/trips/reset') {
        if (method === 'POST') {
          return tripsResetPost(createEventContext(request, env, {}, ctx));
        }
        return new Response('Method Not Allowed', { status: 405 });
      }

      if (apiSubpath === '/api/trips') {
        if (method === 'GET') {
          return tripsGet(createEventContext(request, env, {}, ctx));
        }
        if (method === 'POST') {
          return tripsPost(createEventContext(request, env, {}, ctx));
        }
        return new Response('Method Not Allowed', { status: 405 });
      }

      const tripIdMatch = apiSubpath.match(/^\/api\/trips\/([^/]+)$/);
      if (tripIdMatch) {
        const tripId = decodeURIComponent(tripIdMatch[1]);
        const eventCtx = createEventContext(request, env, { tripId }, ctx);
        if (method === 'GET') {
          return tripIdGet(eventCtx);
        }
        if (method === 'PUT') {
          return tripIdPut(eventCtx);
        }
        if (method === 'DELETE') {
          return tripIdDelete(eventCtx);
        }
        return new Response('Method Not Allowed', { status: 405 });
      }

      if (apiSubpath === '/api/admin/login') {
        if (method === 'POST') {
          return adminLoginPost(createEventContext(request, env, {}, ctx));
        }
        return new Response('Method Not Allowed', { status: 405 });
      }

      return new Response(JSON.stringify({ success: false, error: 'API Route Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // 4. Static Assets Handling
    if (env.ASSETS) {
      let res = await env.ASSETS.fetch(request);
      if (res.status === 404 && pathname.startsWith('/tool23')) {
        const looksLikeAssetFile = /\.[a-zA-Z0-9]+$/.test(pathname);
        if (!looksLikeAssetFile) {
          const fallbackUrl = new URL('/tool23/index.html', request.url);
          res = await env.ASSETS.fetch(new Request(fallbackUrl, request));
        }
      }
      return res;
    }

    return new Response('Not Found', { status: 404 });
  }
}
