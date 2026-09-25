import {
  PagesFunction,
  jsonResponse,
  checkIsAdmin,
  extractMemberIdentity,
  getTrip,
  saveTrip,
  deleteTrip,
  memberMatches,
} from '../../lib/tripsStore';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env, params } = context;
  const tripId = params.tripId as string;
  const trip = await getTrip(env.TRIPS_KV, tripId);

  if (!trip) {
    return jsonResponse(
      { success: false, error: `找不到團務編號 ${tripId}` },
      { status: 404 }
    );
  }

  const isAdmin = checkIsAdmin(request);
  if (isAdmin) {
    return jsonResponse({ success: true, role: 'admin', trip });
  }

  const memberIden = extractMemberIdentity(request);
  if (memberIden && trip.members && Array.isArray(trip.members)) {
    const isMember = trip.members.some((m) => memberMatches(m, memberIden));
    if (isMember) {
      return jsonResponse({ success: true, role: 'member', trip });
    }

    return jsonResponse(
      {
        success: false,
        error: `存取受限：您並未在此團務【${trip.title}】的名冊中，無法查看此團務。`,
      },
      { status: 403 }
    );
  }

  return jsonResponse(
    {
      success: false,
      error: '請先輸入姓名以查看您的所屬團務進度表。',
    },
    { status: 403 }
  );
};

export const onRequestPut: PagesFunction = async (context) => {
  const { request, env, params } = context;
  if (!checkIsAdmin(request)) {
    return jsonResponse(
      { success: false, error: '權限不足：僅有管理者可修改團務' },
      { status: 403 }
    );
  }

  const tripId = params.tripId as string;
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { success: false, error: '缺少團務更新資料' },
      { status: 400 }
    );
  }

  const { trip } = body || {};
  if (!trip) {
    return jsonResponse(
      { success: false, error: '缺少團務更新資料' },
      { status: 400 }
    );
  }

  trip.tripId = tripId;
  trip.id = tripId;

  const success = await saveTrip(env.TRIPS_KV, trip);
  if (success) {
    return jsonResponse({
      success: true,
      tripId,
      message: `團務【${trip.title}】(${tripId}) 資料已即時更新至伺服器`,
      updatedAt: new Date().toISOString(),
    });
  } else {
    return jsonResponse(
      { success: false, error: '更新團務資料至 KV 失敗' },
      { status: 500 }
    );
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const { request, env, params } = context;
  if (!checkIsAdmin(request)) {
    return jsonResponse(
      { success: false, error: '權限不足：僅有管理者可刪除團務' },
      { status: 403 }
    );
  }

  const tripId = params.tripId as string;
  const success = await deleteTrip(env.TRIPS_KV, tripId);
  if (success) {
    return jsonResponse({
      success: true,
      message: `團務 (${tripId}) 已成功刪除`,
    });
  } else {
    return jsonResponse(
      { success: false, error: `刪除團務 ${tripId} 失敗` },
      { status: 500 }
    );
  }
};
