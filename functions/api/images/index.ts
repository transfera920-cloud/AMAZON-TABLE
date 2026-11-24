import { PagesFunction, jsonResponse, checkIsAdmin } from '../../lib/tripsStore';

const MAX_DATAURL_LENGTH = 1_500_000; // 單張圖片（base64 字串）上限約 1.5MB

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** POST /api/images：管理員上傳一張圖片（body: { dataUrl }），回傳 { id } */
export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  if (!(await checkIsAdmin(request, env))) {
    return jsonResponse({ success: false, error: '權限不足：僅有管理者可上傳圖片' }, { status: 403 });
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: '缺少圖片資料' }, { status: 400 });
  }
  const dataUrl = body?.dataUrl;
  if (typeof dataUrl !== 'string' || !/^data:image\/(jpeg|png|webp|gif);base64,/.test(dataUrl)) {
    return jsonResponse({ success: false, error: '圖片格式不正確' }, { status: 400 });
  }
  if (dataUrl.length > MAX_DATAURL_LENGTH) {
    return jsonResponse({ success: false, error: '單張圖片過大' }, { status: 413 });
  }
  const id = randomId();
  try {
    await env.TRIPS_KV.put(`img:${id}`, dataUrl);
  } catch (e: any) {
    console.error('Error saving image to KV:', e);
    // 把 KV 的實際錯誤原因帶回去（例如每日寫入次數用完、binding 設定錯誤），方便判斷
    return jsonResponse(
      { success: false, error: `圖片儲存失敗：${String(e?.message || e).slice(0, 200)}` },
      { status: 500 }
    );
  }
  return jsonResponse({ success: true, id });
};
