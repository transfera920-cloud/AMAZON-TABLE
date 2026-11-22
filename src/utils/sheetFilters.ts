import { DynamicSheet } from '../types';

/**
 * 「時間戳記」是 Google 表單回覆自動產生的欄位，不屬於團務資料：
 * 一律不顯示，也不列入任何統計。
 */
export const isTimestampHeader = (header: unknown): boolean => {
  const h = String(header ?? '').trim().toLowerCase();
  return h.includes('時間戳記') || h === 'timestamp';
};

/** 從表頭與資料列移除所有「時間戳記」欄位（欄位順序與其餘內容不變） */
export const stripTimestampColumns = (
  headers: string[] = [],
  rows: any[][] = []
): { headers: string[]; rows: any[][] } => {
  const keep: number[] = [];
  headers.forEach((h, i) => {
    if (!isTimestampHeader(h)) keep.push(i);
  });
  if (keep.length === headers.length) return { headers, rows };
  return {
    headers: keep.map(i => headers[i]),
    rows: rows.map(r => keep.map(i => (r ? r[i] : undefined))),
  };
};

/** 回傳已移除「時間戳記」欄位的工作表（沒有該欄位時原樣回傳同一物件） */
export const stripTimestampFromSheet = <T extends DynamicSheet | undefined>(sheet: T): T => {
  if (!sheet || !sheet.rawHeaders || !sheet.rawHeaders.some(isTimestampHeader)) return sheet;
  const { headers, rows } = stripTimestampColumns(sheet.rawHeaders, sheet.rawRows || []);
  return { ...sheet, rawHeaders: headers, rawRows: rows } as T;
};

/** 過濾問答物件中的「時間戳記」項目 */
export const stripTimestampFromAnswers = (answers: Record<string, string> = {}): Record<string, string> => {
  const out: Record<string, string> = {};
  Object.entries(answers).forEach(([k, v]) => {
    if (!isTimestampHeader(k)) out[k] = v;
  });
  return out;
};
