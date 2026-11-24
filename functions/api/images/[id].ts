import { PagesFunction, jsonResponse } from '../../lib/tripsStore';

/** GET /api/images/:id：回傳圖片本體（網址為不可猜的隨機 ID，可長期快取） */
export const onRequestGet: PagesFunction = async (context) => {
  const { env, params } = context;
  const id = String(params.id || '');
  if (!/^[0-9a-f]{24}$/.test(id)) {
    return jsonResponse({ success: false, error: '圖片不存在' }, { status: 404 });
  }
  const raw = await env.TRIPS_KV.get(`img:${id}`);
  const m = raw ? raw.match(/^data:(image\/[a-z]+);base64,(.*)$/s) : null;
  if (!m) {
    return jsonResponse({ success: false, error: '圖片不存在' }, { status: 404 });
  }
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, {
    headers: {
      'Content-Type': m[1],
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
