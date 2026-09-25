import { PagesFunction, jsonResponse, resetTrips } from '../../lib/tripsStore';

export const onRequestPost: PagesFunction = async (context) => {
  try {
    await resetTrips(context.env.TRIPS_KV);
    return jsonResponse({ success: true, message: '伺服器端資料已重設' });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Failed to reset' }, { status: 500 });
  }
};
