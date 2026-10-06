/**
 * 管理員驗證（後端）：帳密只存在環境變數，成功後發出 HMAC 簽章 token。
 * 使用 Web Crypto，Cloudflare Workers 與 Node 20+ 皆可執行。
 *
 * 需要的環境變數（請用 `wrangler secret put` 或 Cloudflare 後台設定，不要寫進程式碼）：
 *   ADMIN_USERNAME      管理員帳號
 *   ADMIN_PASSWORD      管理員密碼
 *   ADMIN_TOKEN_SECRET  簽章用的隨機長字串（建議 32 字元以上）
 * 任一未設定 → 管理功能一律拒絕（fail closed）。
 */

export interface AdminEnv {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_TOKEN_SECRET?: string;
  [key: string]: any;
}

const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 小時
const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

/** 固定時間比較，避免從回應時間猜密碼 */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const key = await hmacKey('compare-key', 'sign');
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function isConfigured(env: AdminEnv): boolean {
  return !!(env.ADMIN_USERNAME && env.ADMIN_PASSWORD && env.ADMIN_TOKEN_SECRET);
}

export async function verifyAdminCredentials(env: AdminEnv, username: string, password: string): Promise<boolean> {
  if (!isConfigured(env)) return false;
  const userOk = await safeEqual(String(username || '').trim().toLowerCase(), String(env.ADMIN_USERNAME).trim().toLowerCase());
  const passOk = await safeEqual(String(password || ''), String(env.ADMIN_PASSWORD));
  return userOk && passOk;
}

export async function issueAdminToken(env: AdminEnv): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = toBase64Url(enc.encode(JSON.stringify({ role: 'admin', exp: expiresAt })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(String(env.ADMIN_TOKEN_SECRET), 'sign'), enc.encode(payload));
  return { token: `${payload}.${toBase64Url(new Uint8Array(sig))}`, expiresAt };
}

export async function verifyAdminToken(env: AdminEnv, token: string | null | undefined): Promise<boolean> {
  if (!token || !isConfigured(env)) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(String(env.ADMIN_TOKEN_SECRET), 'verify'),
      fromBase64Url(sig),
      enc.encode(payload)
    );
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return data?.role === 'admin' && typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function getBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
