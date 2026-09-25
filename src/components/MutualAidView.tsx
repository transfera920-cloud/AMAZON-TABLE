import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  Search,
  ExternalLink,
  MessageCircle,
  Shield,
  Phone,
  CheckCircle2,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { ExpeditionPlan, DynamicSheet } from '../types';

interface MutualAidViewProps {
  plan: ExpeditionPlan;
  sheet?: DynamicSheet;
  isAdmin?: boolean;
}

// Helper to ensure valid clickable URL with https://
const getSafeUrl = (urlStr?: string): string => {
  if (!urlStr) return '';
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('line.me') || trimmed.includes('line.naver.jp')) {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
  return `https://${trimmed}`;
};

// Check if a cell or row contains safety rules/instructions
const isSafetyRuleText = (text: string): boolean => {
  const t = text.trim();
  if (!t) return false;
  return (
    t.includes('照應') ||
    t.includes('掌握') ||
    t.includes('節奏') ||
    t.includes('視線') ||
    t.includes('原則') ||
    t.includes('通報') ||
    t.includes('守則') ||
    t.includes('超前') ||
    t.includes('落後') ||
    t.includes('異常') ||
    t.includes('安全') ||
    t.includes('注意事項') ||
    t.startsWith('1.') ||
    t.startsWith('2.') ||
    t.startsWith('3.') ||
    (t.length >= 10 && (t.includes('：') || t.includes(':')))
  );
};

export const MutualAidView: React.FC<MutualAidViewProps> = ({ plan, sheet }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const headers = sheet?.rawHeaders || [];
  const rawRows = sheet?.rawRows || [];

  // Parse raw sheet: filter out safety rules from table to prevent duplicate display
  const { columns, displayRows, safetyRules, totalMembersCount } = useMemo(() => {
    const rules: string[] = [];
    const validRows: any[][] = [];

    // Fallback if sheet has no data
    if (!headers.length || !rawRows.length) {
      const fallbackHeaders = ['領隊組', '中繼組', '壓後組'];
      const fallbackRows = [
        ['林裕彥', '清貫', '界錫'],
        ['阿豪', '惠真', '劉沛妤'],
        ['李佳欣', '醬菜', '薛億宇'],
        ['沈宗源', '林靜宜', ''],
        ['Shawn', '泊', ''],
        ['吳劍武', '阿帆', ''],
        ['莊士澤', '', ''],
      ];
      return {
        columns: fallbackHeaders,
        displayRows: fallbackRows,
        safetyRules: [
          '組內互相照應：每人都要觀察自己小組成員的狀況（體力、裝備、精神、意外等）',
          '各組隨時掌握小組人數',
          '遵守隊伍整體節奏：不可超前領隊組、亦不可落後壓後組。',
          '組內必須全員於視線範圍之內',
          '拆隊原則，最小單位為互助組。',
          '若有發現異常隨時通報組長及領隊。',
        ],
        totalMembersCount: 16,
      };
    }

    rawRows.forEach((row) => {
      const nonNullCells = row.map((c: any) => String(c ?? '').trim());
      // Skip completely empty rows
      if (nonNullCells.every((c) => c === '')) return;

      const firstCell = nonNullCells[0] || '';
      const otherCellsEmpty = nonNullCells.slice(1).every((c) => c === '' || c === '-');

      // Rule row check: if row contains safety rules, extract to rules and exclude from table
      const isRuleRow = isSafetyRuleText(firstCell) || (firstCell.length > 8 && otherCellsEmpty);

      if (isRuleRow) {
        if (!rules.includes(firstCell)) {
          rules.push(firstCell);
        }
        // Do NOT push to validRows -> solves "資料重覆，紅框內容不重覆顯示"
        return;
      }

      // Check if any single cell in a row with empty others is a rule
      const ruleCell = nonNullCells.find((c) => isSafetyRuleText(c));
      if (ruleCell && otherCellsEmpty) {
        if (!rules.includes(ruleCell)) {
          rules.push(ruleCell);
        }
        return;
      }

      validRows.push(row);
    });

    const finalRules = rules.length > 0 ? rules : [
      '組內互相照應：每人都要觀察自己小組成員的狀況（體力、裝備、精神、意外等）',
      '各組隨時掌握小組人數',
      '遵守隊伍整體節奏：不可超前領隊組、亦不可落後壓後組。',
      '組內必須全員於視線範圍之內',
      '拆隊原則，最小單位為互助組。',
      '若有發現異常隨時通報組長及領隊。',
    ];

    // Count non-empty member names
    let memberCount = 0;
    validRows.forEach((r) => {
      r.forEach((cell) => {
        const str = String(cell ?? '').trim();
        if (str && str !== '-' && !str.includes('line.me') && !str.startsWith('http')) {
          memberCount++;
        }
      });
    });

    return {
      columns: headers,
      displayRows: validRows,
      safetyRules: finalRules,
      totalMembersCount: memberCount,
    };
  }, [headers, rawRows]);

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return displayRows;
    const q = searchQuery.toLowerCase().trim();
    return displayRows.filter((row) =>
      row.some((cell) => String(cell ?? '').toLowerCase().includes(q))
    );
  }, [displayRows, searchQuery]);

  // Global LINE url
  const globalLineUrl = getSafeUrl(plan.lineGroupUrl || 'https://line.me/R/ti/g/yb4st9QZhA');

  // Format cell content
  const renderCellContent = (val: any) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return <span className="text-slate-300">-</span>;
    }

    const strVal = String(val).trim();

    // LINE link
    if (strVal.includes('line.me') || strVal.includes('line.naver.jp') || (strVal.startsWith('http') && strVal.includes('line'))) {
      return (
        <a
          href={getSafeUrl(strVal)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded text-[11px] font-bold transition shadow-xs"
          title="加入小組 LINE 群組"
        >
          <MessageCircle className="w-3 h-3 fill-current" />
          <span>LINE 群</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-80" />
        </a>
      );
    }

    // Phone number
    if (/^09\d{8}$/.test(strVal.replace(/[-\s]/g, ''))) {
      return (
        <a
          href={`tel:${strVal.replace(/[-\s]/g, '')}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded font-mono text-xs font-bold transition border border-emerald-500/30"
          title="撥打電話"
        >
          <Phone className="w-3 h-3 text-emerald-400" />
          <span>{strVal}</span>
        </a>
      );
    }

    // Generic URL
    if (strVal.startsWith('http://') || strVal.startsWith('https://')) {
      return (
        <a
          href={strVal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline text-xs font-medium"
        >
          <span>開啟連結</span>
          <ExternalLink className="w-3 h-3 text-emerald-400" />
        </a>
      );
    }

    // Check if name has phone in plan.members
    const matchedMember = plan.members.find((m) => m.name === strVal);

    return (
      <div className="inline-flex items-center justify-center gap-1.5">
        <span className="font-bold text-slate-200 text-xs">{strVal}</span>
        {matchedMember?.phone && (
          <a
            href={`tel:${matchedMember.phone.replace(/[-\s]/g, '')}`}
            className="p-0.5 text-slate-400 hover:text-emerald-400 rounded transition"
            title={`撥打電話給 ${strVal}`}
          >
            <Phone className="w-3 h-3 text-emerald-400" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 animate-fadeIn w-fit max-w-full">
      
      {/* Top Banner & Control Card (緊湊設計，消除無用留白，深色質感) */}
      <div className="bg-[#131924] rounded-xl p-3 sm:p-3.5 border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-lg shrink-0 border border-emerald-500/30">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-100">
                互助組編列
              </h2>
              <span className="bg-emerald-500/15 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {columns.length} 組 ‧ {totalMembersCount} 人
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              登山隊伍互助組編組名冊與行進安全守則（原始對照‧無跳頁）
            </p>
          </div>
        </div>

        {/* Right Actions: Direct Hyperlinked LINE Button + Search */}
        <div className="flex flex-wrap items-center gap-2">
          {globalLineUrl && (
            <a
              href={globalLineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
              title="點擊直接超連結開啟 LINE 群組"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0 fill-current" />
              <span>加入登山 LINE 群組</span>
              <ExternalLink className="w-3 h-3 opacity-90 shrink-0" />
            </a>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋組員姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44 transition"
            />
          </div>
        </div>
      </div>

      {/* Table: 互助組編列 (原始工作表，無跳頁，緊湊排列無無效留白，紅框內容不重複顯示) */}
      <div className="bg-[#131924] rounded-xl border border-slate-800 shadow-md overflow-hidden w-fit max-w-full">
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-100 text-xs sm:text-sm">互助組編列名冊</span>
            <span className="text-[10px] text-emerald-300 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
              無跳頁
            </span>
          </div>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
            {filteredRows.length} 列 ‧ {columns.length} 欄
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-auto text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                {columns.map((colName, cIdx) => (
                  <th
                    key={cIdx}
                    className="py-2.5 px-4 border-r border-slate-800 last:border-r-0 whitespace-nowrap text-center min-w-[100px]"
                  >
                    <span>{colName || `組別 ${cIdx + 1}`}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-5 text-center text-slate-500">
                    {searchQuery ? '沒有符合搜尋條件的組員' : '暫無編列資料'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`hover:bg-slate-800/60 transition font-sans ${
                      rIdx % 2 === 1 ? 'bg-slate-900/40' : ''
                    }`}
                  >
                    {columns.map((_, cIdx) => {
                      const cell = row[cIdx];
                      return (
                        <td
                          key={cIdx}
                          className="py-2 px-4 border-r border-slate-800/80 last:border-r-0 whitespace-nowrap text-center"
                        >
                          {renderCellContent(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Rules & Principles Card (互助組登山安全守則與原則，僅在下方守則區塊單一呈現，不重複顯示於表格內) */}
      {safetyRules.length > 0 && (
        <div className="bg-[#131924] rounded-xl p-3 sm:p-3.5 border border-slate-800 shadow-md space-y-2.5 w-full">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 border border-rose-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs sm:text-sm">
                互助組登山安全守則與原則
              </h3>
              <p className="text-[11px] text-slate-400">
                出隊行進間全員嚴格遵行，確保隊伍安全無死角
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {safetyRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-900/80 hover:bg-emerald-950/30 rounded-lg border border-slate-800/80 flex items-start gap-2.5 transition"
              >
                <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-md shrink-0 mt-0.5 border border-emerald-500/30 shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <p className="text-xs font-medium text-slate-200 leading-normal">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
