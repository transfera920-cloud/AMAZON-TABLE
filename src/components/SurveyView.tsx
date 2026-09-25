import React, { useState, useMemo } from 'react';
import {
  Compass,
  Award,
  HeartPulse,
  Map,
  CloudRain,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  UserCheck,
  Activity,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Zap,
  Phone
} from 'lucide-react';
import { ExpeditionPlan, DynamicSheet, MemberSurvey } from '../types';

interface SurveyViewProps {
  plan: ExpeditionPlan;
  sheet?: DynamicSheet;
  isAdmin?: boolean;
}

interface ParsedSurveyItem {
  id: string;
  name: string;
  timestamp?: string;
  mutualCare: string;
  longHikeExp: string;
  routeKnowledge: string;
  offlineMap: string;
  rainHiking: string;
  paceAgreement: string;
  heavyPack: string;
  medicalHistory: string;
  spareDay: string;
  weeklyExercise: string;
  firstAidCert: string;
  peaksCount: number | string;
  peaksCountNum: number;
  rawAnswers: Record<string, string>;
}

export const SurveyView: React.FC<SurveyViewProps> = ({ plan, sheet, isAdmin }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'firstAid' | 'medicalAttention' | 'highPeaks'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'peaksDesc' | 'peaksAsc'>('default');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Parse Survey Data from sheet raw data or plan.surveyData
  const surveyItems: ParsedSurveyItem[] = useMemo(() => {
    // 1. If DynamicSheet has rawHeaders and rawRows
    if (sheet && sheet.rawHeaders && sheet.rawHeaders.length > 0 && sheet.rawRows && sheet.rawRows.length > 0) {
      const headers = sheet.rawHeaders;
      const nameIdx = headers.findIndex(h => h.includes('稱呼') || h.includes('姓名') || h.includes('暱稱'));
      const timeIdx = headers.findIndex(h => h.includes('時間戳記') || h.includes('時間'));
      const careIdx = headers.findIndex(h => h.includes('互相照顧') || h.includes('共同決定'));
      const hikeIdx = headers.findIndex(h => h.includes('縱走') || h.includes('行程及是否自理') || h.includes('長程'));
      const routeIdx = headers.findIndex(h => h.includes('路線') || h.includes('難度等級') || h.includes('基本資料'));
      const mapIdx = headers.findIndex(h => h.includes('離線地圖') || h.includes('座標') || h.includes('GPX'));
      const rainIdx = headers.findIndex(h => h.includes('雨中') || h.includes('下雨'));
      const paceIdx = headers.findIndex(h => h.includes('休息') || h.includes('節奏') || h.includes('一小時'));
      const packIdx = headers.findIndex(h => h.includes('重裝') || h.includes('10小時') || h.includes('體能'));
      const medIdx = headers.findIndex(h => h.includes('高山反應') || h.includes('病史') || h.includes('過敏') || h.includes('高反'));
      const spareIdx = headers.findIndex(h => h.includes('預備日'));
      const workoutIdx = headers.findIndex(h => h.includes('運動狀況') || h.includes('結算') || h.includes('每週日'));
      const aidIdx = headers.findIndex(h => h.includes('證照') || h.includes('救護') || h.includes('急救') || h.includes('BLS') || h.includes('WAFA'));
      const peakIdx = headers.findIndex(h => h.includes('百岳數') || h.includes('百岳'));

      return sheet.rawRows.map((row, rIdx) => {
        const getVal = (idx: number) => (idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '');
        const name = getVal(nameIdx) || `隊員 ${rIdx + 1}`;
        const peaksRaw = getVal(peakIdx);
        const peaksNum = parseInt(peaksRaw.replace(/[^0-9]/g, ''), 10) || 0;

        const rawAnswers: Record<string, string> = {};
        headers.forEach((h, cIdx) => {
          rawAnswers[h] = getVal(cIdx);
        });

        return {
          id: `survey_row_${rIdx}`,
          name,
          timestamp: getVal(timeIdx),
          mutualCare: getVal(careIdx) || '是',
          longHikeExp: getVal(hikeIdx) || '無',
          routeKnowledge: getVal(routeIdx) || '知道',
          offlineMap: getVal(mapIdx) || '會',
          rainHiking: getVal(rainIdx) || '可接受',
          paceAgreement: getVal(paceIdx) || '可配合',
          heavyPack: getVal(packIdx) || '具備',
          medicalHistory: getVal(medIdx) || '無',
          spareDay: getVal(spareIdx) || '可配合',
          weeklyExercise: getVal(workoutIdx) || '可以',
          firstAidCert: getVal(aidIdx) || '無',
          peaksCount: peaksRaw || (peaksNum > 0 ? peaksNum : '-'),
          peaksCountNum: peaksNum,
          rawAnswers,
        };
      });
    }

    // 2. Otherwise use plan.surveyData
    const surveys: MemberSurvey[] = Object.values(plan.surveyData || {});
    if (surveys.length > 0) {
      return surveys.map((s, idx) => {
        const peaksNum = typeof s.peaksCount === 'number'
          ? s.peaksCount
          : parseInt(String(s.peaksCount || '').replace(/[^0-9]/g, ''), 10) || 0;

        return {
          id: s.memberId || `survey_${idx}`,
          name: s.name,
          timestamp: s.timestamp || '',
          mutualCare: s.mutualCareAgreement || '是',
          longHikeExp: s.longHikeExp || '無',
          routeKnowledge: s.routeKnowledgeConfirmed || '確認知道',
          offlineMap: s.offlineMapSkill || '會判讀',
          rainHiking: s.rainHikingAcceptable || '可接受',
          paceAgreement: s.paceAgreement || '可配合',
          heavyPack: s.heavyPackStamina || '已具備',
          medicalHistory: s.medicalAndAltitudeHistory || '無',
          spareDay: s.spareDayAgreement || '可以',
          weeklyExercise: s.weeklyExerciseReport || '是',
          firstAidCert: s.firstAidCert || '無',
          peaksCount: s.peaksCount || (peaksNum > 0 ? peaksNum : '-'),
          peaksCountNum: peaksNum,
          rawAnswers: s.rawAnswers || {},
        };
      });
    }

    return [];
  }, [sheet, plan.surveyData]);

  // Insights Calculations
  const stats = useMemo(() => {
    if (surveyItems.length === 0) {
      return { total: 0, avgPeaks: 0, maxPeaks: 0, aidHolders: 0, specialMedCount: 0 };
    }
    const total = surveyItems.length;
    const peakValues = surveyItems.map(i => i.peaksCountNum).filter(n => n > 0);
    const avgPeaks = peakValues.length > 0 ? Math.round(peakValues.reduce((a, b) => a + b, 0) / peakValues.length) : 0;
    const maxPeaks = peakValues.length > 0 ? Math.max(...peakValues) : 0;
    const aidHolders = surveyItems.filter(i => {
      const v = (i.firstAidCert || '').toLowerCase();
      return v && v !== '無' && v !== '否' && v !== '-' && v !== 'none';
    }).length;
    const paceAgreeCount = surveyItems.filter(i => {
      const v = (i.paceAgreement || '').trim().toLowerCase();
      return v && v !== '否' && v !== '不' && v !== '不行' && v !== '無法' && v !== '不配合' && v !== '無' && v !== '-' && v !== 'no';
    }).length;
    const specialMedCount = surveyItems.filter(i => {
      const v = (i.medicalHistory || '').trim();
      return v && v !== '無' && v !== '否' && v !== '正常' && v !== '無過敏' && v !== '-';
    }).length;

    return { total, avgPeaks, maxPeaks, aidHolders, paceAgreeCount, specialMedCount };
  }, [surveyItems]);

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    let result = surveyItems.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.longHikeExp.toLowerCase().includes(q) ||
        item.firstAidCert.toLowerCase().includes(q) ||
        item.paceAgreement.toLowerCase().includes(q) ||
        item.medicalHistory.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterType === 'firstAid') {
        const v = item.firstAidCert.toLowerCase();
        return v && v !== '無' && v !== '否' && v !== '-';
      }
      if (filterType === 'medicalAttention') {
        const v = item.medicalHistory.trim();
        return v && v !== '無' && v !== '否' && v !== '正常' && v !== '無過敏' && v !== '-';
      }
      if (filterType === 'highPeaks') {
        const v = item.paceAgreement.trim().toLowerCase();
        return v && v !== '否' && v !== '不' && v !== '不行' && v !== '無法' && v !== '不配合' && v !== '無' && v !== '-' && v !== 'no';
      }
      return true;
    });

    if (sortBy === 'peaksDesc') {
      result = [...result].sort((a, b) => b.peaksCountNum - a.peaksCountNum);
    } else if (sortBy === 'peaksAsc') {
      result = [...result].sort((a, b) => a.peaksCountNum - b.peaksCountNum);
    }

    return result;
  }, [surveyItems, searchQuery, filterType, sortBy]);

  const hasSpecialMed = (val: string) => {
    const v = val.trim();
    return v && v !== '無' && v !== '否' && v !== '正常' && v !== '無過敏' && v !== '-';
  };

  const hasCert = (val: string) => {
    const v = val.toLowerCase().trim();
    return v && v !== '無' && v !== '否' && v !== '-';
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full overflow-x-hidden">
      
      {/* Header & Controls Card */}
      <div className="bg-[#131924] rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100">
                  {sheet?.name || plan.customHeaders.surveyTitle || '登山經歷與互助能力調查問卷'}
                </h2>
                <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  共 {surveyItems.length} 份回覆
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                登山經歷、百岳累積、長程縱走自理能力、高山反應病史與急救救護證照審查
              </p>
            </div>
          </div>

          {/* View Switcher Buttons */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl self-start sm:self-auto shrink-0 border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>能力卡片</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>總表對照</span>
            </button>
          </div>
        </div>

        {/* Team Capability Insights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-2xl">
            <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>高山反應與病史備註</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-200">{stats.specialMedCount}</span>
              <span className="text-xs text-amber-400/80">位隊員有備註</span>
            </div>
          </div>

          <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-2xl">
            <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>急救救護證照</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-rose-200">{stats.aidHolders}</span>
              <span className="text-xs text-rose-400/80">位隊員持有</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl">
            <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span>長程縱走自理</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-200">100%</span>
              <span className="text-xs text-emerald-400/80">全隊具縱走經驗</span>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl">
            <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>離線地圖判讀</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-200">100%</span>
              <span className="text-xs text-indigo-400/80">會使用並回報座標</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋隊員稱呼、縱走經歷（如：馬博、南三段、南二段、大小劍）、急救證照..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-slate-850 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              全部 ({surveyItems.length})
            </button>
            <button
              onClick={() => setFilterType('firstAid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                filterType === 'firstAid'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 border-rose-800/40'
              }`}
            >
              <HeartPulse className="w-3 h-3" />
              <span>救護證照 ({stats.aidHolders})</span>
            </button>
            <button
              onClick={() => setFilterType('highPeaks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                filterType === 'highPeaks'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border-amber-800/40'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>節奏可配合 ({stats.paceAgreeCount}人)</span>
            </button>
            {stats.specialMedCount > 0 && (
              <button
                onClick={() => setFilterType('medicalAttention')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                  filterType === 'medicalAttention'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border-amber-800/40'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>病史/高反備註 ({stats.specialMedCount})</span>
              </button>
            )}

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="default">預設排序</option>
              <option value="peaksDesc">百岳數：多 → 少</option>
              <option value="peaksAsc">百岳數：少 → 多</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const certActive = hasCert(item.firstAidCert);
            const medAlert = hasSpecialMed(item.medicalHistory);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-[#131924] rounded-3xl p-5 border border-slate-800 shadow-md hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Card Header: Name + Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {item.name.slice(0, 1)}
                      </div>
                      <div className="font-black text-slate-100 text-base leading-tight">
                        {item.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* First Aid Cert Badge */}
                      {certActive && (
                        <div className="inline-flex items-center gap-1 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-300">
                          <HeartPulse className="w-3 h-3 text-rose-400" />
                          <span>{item.firstAidCert}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Long Hike & Self-Sufficiency Experience Box */}
                  <div className="mt-3.5 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                    <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                      <Compass className="w-3 h-3 text-teal-400" />
                      <span>長程縱走經歷與自理能力</span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-200 leading-snug break-words">
                      {item.longHikeExp || '無'}
                    </div>
                  </div>

                  {/* Medical / Altitude Sickness Note */}
                  <div className={`mt-2.5 p-2.5 rounded-2xl text-xs border ${
                    medAlert
                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                      : 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      {medAlert ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span>高山反應與病史備註：</span>
                    </div>
                    <div className="mt-0.5 pl-5 text-xs font-medium break-words text-slate-300">
                      {item.medicalHistory || '無病史與高反紀錄'}
                    </div>
                  </div>

                  {/* 8-Point Capability & Commitment Checklist */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                      行前能力確認與承諾
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="互相照顧隊員">互相照顧：{item.mutualCare}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="路線等級難度確認">路線難度：{item.routeKnowledge}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="離線地圖與座標發報">離線地圖：{item.offlineMap}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="雨中行進接受度">雨中行走：{item.rainHiking}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="一小時休息節奏">休息節奏：{item.paceAgreement}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="重裝10小時體能">重裝10h：{item.heavyPack}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="預留一日預備日">預留預備日：{item.spareDay}</span>
                      </div>
                      <div className="p-1.5 bg-slate-900/60 rounded-xl text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate" title="每週日運動狀況回報">每週回報：{item.weeklyExercise}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Expand details button if any extra answers */}
                {Object.keys(item.rawAnswers).length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full py-1.5 text-slate-400 hover:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <span>{isExpanded ? '收合完整回覆' : '查看完整問卷問答'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-slate-950/60 rounded-xl space-y-2 text-[11px] text-slate-300 border border-slate-800">
                        {Object.entries(item.rawAnswers).map(([question, ans], qIdx) => (
                          <div key={qIdx} className="border-b border-slate-800 pb-1.5 last:border-b-0 last:pb-0">
                            <div className="font-bold text-slate-500 text-[10px]">{question}</div>
                            <div className="text-slate-200 font-medium mt-0.5 break-words">{ans || '-'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#131924] rounded-3xl border border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-950 text-slate-200 font-bold text-[11px] tracking-wide border-b border-slate-800">
                  <th className="py-3 px-3.5 sticky left-0 z-10 bg-slate-950 shadow-xs">稱呼 / 姓名</th>
                  <th className="py-3 px-2.5 text-center">休息節奏(1h)</th>
                  <th className="py-3 px-3">長程縱走經歷 (自理)</th>
                  <th className="py-3 px-2.5 text-center">救護證照</th>
                  <th className="py-3 px-2.5 text-center">互相照顧</th>
                  <th className="py-3 px-2.5 text-center">路線難度</th>
                  <th className="py-3 px-2.5 text-center">離線地圖</th>
                  <th className="py-3 px-2.5 text-center">雨中行走</th>
                  <th className="py-3 px-2.5 text-center">重裝10h</th>
                  <th className="py-3 px-3">高山反應 / 病史備註</th>
                  <th className="py-3 px-2.5 text-center">預備日</th>
                  <th className="py-3 px-2.5 text-center">週運動回報</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredItems.map((item, idx) => {
                  const certActive = hasCert(item.firstAidCert);
                  const medAlert = hasSpecialMed(item.medicalHistory);

                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? 'hover:bg-slate-800/40 transition' : 'bg-slate-900/30 hover:bg-slate-800/50 transition'}>
                      <td className="py-3 px-3.5 font-bold text-slate-100 sticky left-0 z-10 bg-inherit shadow-xs whitespace-nowrap">
                        <span>{item.name}</span>
                      </td>

                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/40 text-[11px]">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{item.paceAgreement}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-200 max-w-[240px]">
                        <span className="bg-slate-900 px-2 py-0.5 rounded-md text-xs inline-block border border-slate-800">
                          {item.longHikeExp || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {certActive ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-800/40">
                            <HeartPulse className="w-3 h-3 text-rose-400" />
                            <span>{item.firstAidCert}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">無</span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center font-medium">{item.mutualCare}</td>
                      <td className="py-3 px-2.5 text-center font-medium">{item.routeKnowledge}</td>
                      <td className="py-3 px-2.5 text-center font-medium">{item.offlineMap}</td>
                      <td className="py-3 px-2.5 text-center font-medium">{item.rainHiking}</td>
                      <td className="py-3 px-2.5 text-center font-medium">{item.heavyPack}</td>

                      <td className="py-3 px-3 max-w-[200px]">
                        {medAlert ? (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{item.medicalHistory}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">{item.medicalHistory || '無'}</span>
                        )}
                      </td>

                      <td className="py-3 px-2.5 text-center font-medium">{item.spareDay}</td>
                      <td className="py-3 px-2.5 text-center font-medium">{item.weeklyExercise}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="p-12 text-center bg-[#131924] rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <Search className="w-8 h-8 mx-auto text-slate-600" />
          <div className="font-bold text-slate-200">查無符合條件的問卷回覆</div>
          <div className="text-xs">請嘗試調整搜尋關鍵字或篩選標籤</div>
        </div>
      )}

    </div>
  );
};
