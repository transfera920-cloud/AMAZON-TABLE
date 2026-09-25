import React, { useState } from 'react';
import { DynamicSheet, ExpeditionPlan } from '../types';
import { Table, Search, Plus, Trash2, Edit3, Check, FileSpreadsheet, Eye, MessageCircle, ExternalLink, CloudSun } from 'lucide-react';
import { formatExcelTimeToHHMM, isExcelSerialTime } from '../utils/excelParser';

interface CustomSheetViewProps {
  sheet: DynamicSheet;
  isAdmin: boolean;
  plan: ExpeditionPlan;
  onUpdatePlan: (updatedPlan: ExpeditionPlan) => void;
}

export const CustomSheetView: React.FC<CustomSheetViewProps> = ({
  sheet,
  isAdmin,
  plan,
  onUpdatePlan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingSheetName, setIsEditingSheetName] = useState(false);
  const [sheetNameVal, setSheetNameVal] = useState(sheet.name);

  const headers = sheet.rawHeaders || [];
  const rows = sheet.rawRows || [];

  const handleUpdateSheet = (newSheet: DynamicSheet) => {
    const updatedSheets = (plan.sheets || []).map(s => (s.id === sheet.id ? newSheet : s));
    onUpdatePlan({ ...plan, sheets: updatedSheets });
  };

  const handleSaveSheetName = () => {
    if (!sheetNameVal.trim()) return;
    handleUpdateSheet({ ...sheet, name: sheetNameVal.trim() });
    setIsEditingSheetName(false);
  };

  const handleAddRow = () => {
    const newRow = new Array(headers.length).fill('');
    handleUpdateSheet({
      ...sheet,
      rawRows: [...rows, newRow],
    });
  };

  const handleAddColumn = () => {
    const colName = prompt('請輸入新欄位名稱：', `欄位 ${headers.length + 1}`);
    if (!colName) return;
    const newHeaders = [...headers, colName];
    const newRows = rows.map(r => [...r, '']);
    handleUpdateSheet({
      ...sheet,
      rawHeaders: newHeaders,
      rawRows: newRows,
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    handleUpdateSheet({ ...sheet, rawRows: newRows });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = rows.map((r, rIdx) => {
      if (rIdx === rowIndex) {
        const nextRow = [...r];
        nextRow[colIndex] = value;
        return nextRow;
      }
      return r;
    });
    handleUpdateSheet({ ...sheet, rawRows: newRows });
  };

  const handleHeaderChange = (colIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = value;
    handleUpdateSheet({ ...sheet, rawHeaders: newHeaders });
  };

  // Masking and formatting helper for public frontend & sheet view
  const formatCellForView = (header: string, val: any): React.ReactNode => {
    if (val === undefined || val === null || val === '') return '-';
    const strVal = String(val).trim();

    const h = (header || '').toLowerCase();

    // Check if cell is a LINE link or URL (User mandate: LINE 連結SHEET 不用呈現網址，按鈕直接超連結)
    if (strVal.includes('line.me') || strVal.includes('line.naver.jp') || (h.includes('line') && (strVal.startsWith('http://') || strVal.startsWith('https://') || strVal.includes('.')))) {
      const safeLineUrl = strVal.startsWith('http://') || strVal.startsWith('https://')
        ? strVal
        : `https://${strVal.replace(/^\/+/, '')}`;
      return (
        <a
          href={safeLineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-bold transition shadow-xs hover:shadow"
          title="點擊直接超連結開啟 LINE 群組"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>加入 LINE 群組</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      );
    }

    // Weather forecast URLs or cells in weather sheets/columns (User mandate: 氣象預報超聯結名稱使用原文字)
    const urlMatch = strVal.match(/(https?:\/\/[^\s]+)/i);
    const isUrl = !!urlMatch || strVal.startsWith('http://') || strVal.startsWith('https://');
    const targetUrl = urlMatch ? urlMatch[0] : strVal;

    if (isUrl && (h.includes('氣象') || h.includes('天氣') || h.includes('預報') || h.includes('觀測') || sheet.name.includes('氣象') || strVal.includes('cwa.gov.tw') || strVal.includes('windy') || strVal.includes('weather'))) {
      const displayText = urlMatch && strVal !== targetUrl ? strVal.replace(targetUrl, '').trim() || strVal : strVal;
      return (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium break-all transition hover:bg-sky-950/40 px-1 py-0.5 rounded group"
          title={`點擊前往：${targetUrl}`}
        >
          <CloudSun className="w-3.5 h-3.5 text-sky-400 shrink-0 inline-block align-middle mr-0.5 group-hover:scale-110 transition" />
          <span>{displayText}</span>
          <ExternalLink className="w-3 h-3 text-sky-400 shrink-0 inline-block align-middle ml-0.5 opacity-70 group-hover:opacity-100" />
        </a>
      );
    }

    // Generic URLs (non-LINE, non-weather) rendered with original text hyperlink without breaking
    if (isUrl) {
      const displayText = urlMatch && strVal !== targetUrl ? strVal.replace(targetUrl, '').trim() || strVal : strVal;
      return (
        <a
          href={targetUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium break-all transition hover:bg-sky-950/40 px-1 py-0.5 rounded"
          title={`點擊開啟：${targetUrl}`}
        >
          <span>{displayText}</span>
          <ExternalLink className="w-3 h-3 text-sky-400 shrink-0 inline-block align-middle ml-0.5" />
        </a>
      );
    }

    // Time columns or Excel serial time floats MUST be formatted to HH:MM
    if (
      h.includes('時間') ||
      h.includes('時刻') ||
      h.includes('起訖') ||
      isExcelSerialTime(val)
    ) {
      const formattedTime = formatExcelTimeToHHMM(val);
      if (formattedTime) return formattedTime;
    }

    if (isAdmin) return strVal;

    // Emergency contacts, stay-behind, leader phone, member phone and safety details MUST NOT BE MASKED
    if (
      h.includes('緊急') ||
      h.includes('留守') ||
      h.includes('關係') ||
      h.includes('救援') ||
      h.includes('通報') ||
      h.includes('聯絡') ||
      h.includes('電話') ||
      h.includes('手機') ||
      /^09\d{8}$/.test(strVal.replace(/[-\s]/g, ''))
    ) {
      return strVal;
    }

    // Mask ID numbers
    if (h.includes('身分證') || h.includes('身份字號') || h.includes('證號') || /^[A-Z][1289]\d{8}$/i.test(strVal)) {
      return strVal.length >= 6 ? `${strVal.slice(0, 2)}****${strVal.slice(-3)}` : '******';
    }
    // Mask birth dates
    if (h.includes('生日') || h.includes('出生') || /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(strVal)) {
      return '****-**-**';
    }
    if (h.includes('住址') || h.includes('地址')) {
      return strVal.length > 6 ? `${strVal.slice(0, 6)}******` : '******';
    }
    if (h.includes('信箱') || h.includes('email') || (strVal.includes('@') && !strVal.includes(' '))) {
      return '***@***';
    }
    return strVal;
  };

  // Filter rows
  const filteredRows = rows.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.some(c => String(c || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 animate-fadeIn w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-[#131924] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            {isEditingSheetName && isAdmin ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={sheetNameVal}
                  onChange={(e) => setSheetNameVal(e.target.value)}
                  className="px-2.5 py-1 text-sm font-bold bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveSheetName}
                  className="p-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 rounded-lg border border-emerald-800/60"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">{sheet.name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setSheetNameVal(sheet.name);
                      setIsEditingSheetName(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200"
                    title="編輯工作表名稱"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋工作表內容..."
              className="pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48 transition"
            />
          </div>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleAddColumn}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增欄位</span>
              </button>

              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增資料行</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden w-full max-w-full">
        {headers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            此工作表尚無欄位資料，可由上方「新增欄位」或「新增資料行」開始編輯。
          </div>
        ) : (
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="py-2.5 px-3 border-r border-slate-800 last:border-r-0 min-w-[90px] whitespace-normal break-words">
                      {isAdmin ? (
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => handleHeaderChange(hIdx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white font-bold focus:ring-1 focus:ring-emerald-400"
                        />
                      ) : (
                        <span>{h}</span>
                      )}
                    </th>
                  ))}
                  {isAdmin && (
                    <th className="py-2.5 px-3 w-14 text-center">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length + (isAdmin ? 1 : 0)} className="py-8 text-center text-slate-500">
                      {searchQuery ? '沒有符合搜尋條件的資料' : '暫無資料'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/60 transition-colors">
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 border-r border-slate-800/80 last:border-r-0 break-words whitespace-normal">
                          {isAdmin ? (
                            <input
                              type="text"
                              value={row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                              onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                              className="w-full bg-slate-900/60 border border-transparent hover:border-slate-700 focus:border-emerald-500 focus:bg-slate-900 rounded-lg px-2 py-1 text-xs text-slate-100 transition"
                            />
                          ) : (
                            <span className="text-slate-200">{formatCellForView(h, row[cIdx])}</span>
                          )}
                        </td>
                      ))}
                      {isAdmin && (
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rIdx)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition"
                            title="刪除此行"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
