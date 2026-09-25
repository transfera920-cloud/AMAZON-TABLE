import {
  PagesFunction,
  jsonResponse,
  checkIsAdmin,
  extractMemberIdentity,
  seedTripsIfEmpty,
  getAllTrips,
  saveTrip,
  toTripSummary,
  lookupMemberTripsFromList,
  memberMatches,
} from '../../lib/tripsStore';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const isAdmin = checkIsAdmin(request);
  const memberIden = extractMemberIdentity(request);

  // Requirement 3: If KV has no trip: keys, automatically seed sample data
  await seedTripsIfEmpty(env.TRIPS_KV);

  const allTrips = await getAllTrips(env.TRIPS_KV);

  if (isAdmin) {
    const summaries = allTrips.map(toTripSummary);
    return jsonResponse({
      success: true,
      role: 'admin',
      trips: summaries,
      allowedTripIds: allTrips.map((t) => t.tripId || t.id),
    });
  }

  if (memberIden && (memberIden.name || memberIden.email || memberIden.phone)) {
    // Lookup member's allowed trips in real time
    const result = lookupMemberTripsFromList(allTrips, memberIden.name || '', memberIden.memberId);
    if (result.found && !result.ambiguous) {
      return jsonResponse({
        success: true,
        role: 'member',
        memberQuery: memberIden,
        trips: result.trips,
        allowedTripIds: result.allowedTripIds,
      });
    }

    // Fallback filter
    const matchingTrips = allTrips.filter((trip) => {
      if (!trip.members || !Array.isArray(trip.members)) return false;
      return trip.members.some((m) => memberMatches(m, memberIden));
    });

    const summaries = matchingTrips.map(toTripSummary);
    return jsonResponse({
      success: true,
      role: 'member',
      memberQuery: memberIden,
      trips: summaries,
      allowedTripIds: matchingTrips.map((t) => t.tripId || t.id),
    });
  }

  // Guest / unauthenticated: return empty list to prompt name entry
  return jsonResponse({
    success: true,
    role: 'guest',
    trips: [],
    allowedTripIds: [],
    prompt: '請輸入姓名以查詢您所屬之團務',
  });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  if (!checkIsAdmin(request)) {
    return jsonResponse(
      { success: false, error: '權限不足：僅有管理者可建立團務' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { success: false, error: '請提供有效的團務資料與活動名稱' },
      { status: 400 }
    );
  }

  const { trip } = body || {};
  if (!trip || !trip.title) {
    return jsonResponse(
      { success: false, error: '請提供有效的團務資料與活動名稱' },
      { status: 400 }
    );
  }

  // Ensure unique tripId
  let tripId = trip.tripId || trip.id;
  if (!tripId || tripId.startsWith('exp_')) {
    const all = await getAllTrips(env.TRIPS_KV);
    tripId = `TRIP-${String(all.length + 1).padStart(3, '0')}`;
  }
  trip.tripId = tripId;
  trip.id = tripId;

  const success = await saveTrip(env.TRIPS_KV, trip);
  if (success) {
    return jsonResponse({
      success: true,
      tripId,
      message: `團務【${trip.title}】(${tripId}) 建立成功！`,
      trip,
    });
  } else {
    return jsonResponse(
      { success: false, error: '儲存新團務至 KV 失敗' },
      { status: 500 }
    );
  }
};
