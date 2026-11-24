import type { KVNamespace } from './tripsStore';

/**
 * 儲存層：以 Cloudflare D1（免費額度每天可寫入約 10 萬列）取代 KV 作為主要儲存，
 * 避開 KV 免費方案「每天僅 1,000 次寫入」的限制。
 *
 * - 對外介面與 KVNamespace 相同，其他程式碼不需改動。
 * - 若尚未綁定 D1（env.DB 不存在），自動退回直接使用 KV，網站照常運作。
 * - 讀取時若 D1 沒有資料，會退回讀舊的 KV 資料；行程資料會在第一次列表時整批搬進 D1。
 */

const MIGRATED_KEY = '__meta:trips_migrated';

let tableReady: Promise<void> | null = null;

function ensureTable(db: any): Promise<void> {
  if (!tableReady) {
    tableReady = db
      .prepare(
        'CREATE TABLE IF NOT EXISTS kv_store (k TEXT PRIMARY KEY, v TEXT, deleted INTEGER NOT NULL DEFAULT 0, expires_at INTEGER)'
      )
      .run()
      .then(() => undefined)
      .catch((e: any) => {
        tableReady = null;
        throw e;
      });
  }
  return tableReady;
}

export function getStore(env: any): KVNamespace {
  const db = env?.DB;
  const kv: KVNamespace | undefined = env?.TRIPS_KV;
  if (!db) return kv as KVNamespace;

  const now = () => Math.floor(Date.now() / 1000);

  async function readRow(key: string): Promise<{ v: string | null; deleted: number; expires_at: number | null } | null> {
    const row = await db.prepare('SELECT v, deleted, expires_at FROM kv_store WHERE k = ?').bind(key).first();
    return row || null;
  }

  async function isMigrated(): Promise<boolean> {
    const row = await readRow(MIGRATED_KEY);
    return !!row;
  }

  async function writeRow(key: string, value: string | null, deleted: number, expiresAt: number | null) {
    await db
      .prepare(
        'INSERT INTO kv_store (k, v, deleted, expires_at) VALUES (?, ?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, deleted = excluded.deleted, expires_at = excluded.expires_at'
      )
      .bind(key, value, deleted, expiresAt)
      .run();
  }

  /** 把舊 KV 內的行程一次搬進 D1（D1 已有的列不覆蓋）。成功才寫入完成標記。 */
  async function migrateTripsFromKv(): Promise<void> {
    if (!kv) {
      await writeRow(MIGRATED_KEY, '1', 0, null);
      return;
    }
    let cursor: string | undefined;
    do {
      const res: any = await kv.list({ prefix: 'trip:', cursor });
      for (const k of res.keys || []) {
        const exists = await readRow(k.name);
        if (exists) continue;
        const raw = await kv.get(k.name);
        if (raw) await writeRow(k.name, raw, 0, null);
      }
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
    await writeRow(MIGRATED_KEY, '1', 0, null);
  }

  return {
    async get(key: string) {
      await ensureTable(db);
      const row = await readRow(key);
      if (row) {
        if (row.deleted) return null;
        if (row.expires_at && row.expires_at < now()) return null;
        return row.v;
      }
      // D1 沒有 → 退回舊 KV（舊圖片、尚未搬移的行程）
      if (!kv) return null;
      if (key.startsWith('img:') || (key.startsWith('trip:') && !(await isMigrated()))) {
        try {
          return await kv.get(key);
        } catch {
          return null;
        }
      }
      return null;
    },

    async put(key: string, value: string, options?: any) {
      await ensureTable(db);
      const ttl = options?.expirationTtl;
      await writeRow(key, value, 0, ttl ? now() + Number(ttl) : null);
    },

    async delete(key: string) {
      await ensureTable(db);
      // 留下「已刪除」標記，避免舊 KV 裡的同名資料又冒出來
      await writeRow(key, null, 1, null);
    },

    async list(options?: { prefix?: string; limit?: number; cursor?: string }) {
      await ensureTable(db);
      const prefix = options?.prefix || '';
      if (prefix.startsWith('trip:') && !(await isMigrated())) {
        try {
          await migrateTripsFromKv();
        } catch (e) {
          console.error('Migrating trips from KV failed (will retry next time):', e);
          // D1 完全沒有行程時不能當作「空」，否則會被誤判成要重新建立預設資料
          const cnt: any = await db
            .prepare("SELECT COUNT(*) AS c FROM kv_store WHERE k LIKE 'trip:%' AND deleted = 0")
            .first();
          if (!cnt || !cnt.c) throw e;
        }
      }
      const res = await db
        .prepare(
          "SELECT k FROM kv_store WHERE substr(k, 1, ?) = ? AND deleted = 0 AND (expires_at IS NULL OR expires_at >= ?) AND k NOT LIKE '\\_\\_meta:%' ESCAPE '\\' ORDER BY k"
        )
        .bind(prefix.length, prefix, now())
        .all();
      return {
        keys: (res.results || []).map((r: any) => ({ name: r.k as string })),
        list_complete: true,
      };
    },
  };
}
