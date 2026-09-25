import {
  PagesFunction,
  jsonResponse,
  checkIsAdmin,
  resetTrips,
} from '../../lib/tripsStore';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  if (!checkIsAdmin(request)) {
    return jsonResponse(
      { success: false, error: '權限不足' },
      { status: 403 }
    );
  }

  try {
    await resetTrips(env.TRIPS_KV);
    return jsonResponse({
      success: true,
      message: '團務系統已重設為標準三團測試範例',
    });
  } catch (e) {
    console.error('Reset error:', e);
    return jsonResponse(
      { success: false, error: '重設團務失敗' },
      { status: 500 }
    );
  }
};
