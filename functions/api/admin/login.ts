import { PagesFunction, jsonResponse } from '../../lib/tripsStore';
import { verifyAdminCredentials, issueAdminToken } from '../../lib/adminAuth';

const MAX_ATTEMPTS = 8; // 每個 IP 在視窗內最多嘗試次數
const WINDOW_SECONDS = 15 * 60;

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rlKey = `rl:login:${ip}`;
  let attempts = 0;
  try {
    attempts = parseInt((await env.TRIPS_KV.get(rlKey)) || '0', 10) || 0;
  } catch {
    // KV 失敗時不阻擋，但仍會驗證帳密
  }
  if (attempts >= MAX_ATTEMPTS) {
    return jsonResponse(
      { success: false, error: '嘗試次數過多，請 15 分鐘後再試。' },
      { status: 429 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: '請求格式錯誤' }, { status: 400 });
  }

  const ok = await verifyAdminCredentials(env, body?.username, body?.password);
  if (!ok) {
    try {
      await env.TRIPS_KV.put(rlKey, String(attempts + 1), { expirationTtl: WINDOW_SECONDS });
    } catch {
      // ignore
    }
    return jsonResponse({ success: false, error: '帳號或密碼錯誤！請確認後重新輸入。' }, { status: 401 });
  }

  try {
    await env.TRIPS_KV.delete(rlKey);
  } catch {
    // ignore
  }
  const { token, expiresAt } = await issueAdminToken(env);
  return jsonResponse({ success: true, token, expiresAt });
};
