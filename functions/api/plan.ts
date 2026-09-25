import {
  PagesFunction,
  jsonResponse,
  getTrip,
  getAllTrips,
  saveTrip,
} from '../lib/tripsStore';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const planId = url.searchParams.get('id');

  if (planId) {
    const trip = await getTrip(env.TRIPS_KV, planId);
    if (trip) {
      return jsonResponse({ success: true, hasSavedData: true, plan: trip });
    }
  }

  const all = await getAllTrips(env.TRIPS_KV);
  if (all.length > 0) {
    return jsonResponse({ success: true, hasSavedData: true, plan: all[0] });
  }

  return jsonResponse({ success: true, hasSavedData: false, plan: null });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Missing plan payload' }, { status: 400 });
  }

  const { plan, planId } = body || {};
  if (!plan) {
    return jsonResponse({ success: false, error: 'Missing plan payload' }, { status: 400 });
  }

  const targetId = planId || plan.tripId || plan.id || 'TRIP-001';
  plan.tripId = targetId;
  plan.id = targetId;

  const success = await saveTrip(env.TRIPS_KV, plan);
  if (success) {
    return jsonResponse({
      success: true,
      message: '資料已成功儲存至伺服器！',
      updatedAt: new Date().toISOString(),
    });
  } else {
    return jsonResponse(
      { success: false, error: 'Failed to write plan to storage' },
      { status: 500 }
    );
  }
};
