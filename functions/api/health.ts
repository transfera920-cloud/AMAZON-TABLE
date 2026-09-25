import { PagesFunction, jsonResponse } from '../lib/tripsStore';

export const onRequestGet: PagesFunction = async () => {
  return jsonResponse({ status: 'ok', time: new Date().toISOString() });
};
