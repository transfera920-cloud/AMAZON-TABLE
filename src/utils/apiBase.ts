/**
 * Resolves API endpoint path.
 * When the app is deployed under a sub-path like /tool01/,
 * ensures API requests route correctly.
 */
export const API_BASE = (((import.meta as any).env?.BASE_URL as string) || '/tool01/').replace(/\/+$/, '');

export function apiPath(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE && API_BASE !== '/' && cleanPath.startsWith(API_BASE)) {
    return cleanPath;
  }
  return API_BASE && API_BASE !== '/' ? `${API_BASE}${cleanPath}` : cleanPath;
}

export default apiPath;
