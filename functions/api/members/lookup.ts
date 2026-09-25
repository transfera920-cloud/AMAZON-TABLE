import {
  PagesFunction,
  jsonResponse,
  lookupMemberTrips,
} from '../../lib/tripsStore';

const handleLookup: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  let name = url.searchParams.get('name') || undefined;
  let disambiguateKey = url.searchParams.get('disambiguateKey') || undefined;

  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      if (body?.name) name = body.name;
      if (body?.disambiguateKey) disambiguateKey = body.disambiguateKey;
    } catch {
      // ignore json parse error, fall back to query params
    }
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return jsonResponse(
      {
        success: false,
        error: '請輸入您的姓名',
        allowedTripIds: [],
        trips: [],
      },
      { status: 400 }
    );
  }

  const result = await lookupMemberTrips(env.TRIPS_KV, name, disambiguateKey);

  if (!result.found) {
    return jsonResponse(
      {
        success: false,
        error: result.error || '找不到您的團務資料，請確認姓名是否正確',
        allowedTripIds: [],
        trips: [],
      },
      { status: 404 }
    );
  }

  return jsonResponse({
    success: true,
    ...result,
  });
};

export const onRequest = handleLookup;
export const onRequestGet = handleLookup;
export const onRequestPost = handleLookup;
