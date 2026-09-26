import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Backpack,
  Shield,
  FileText,
  Users,
  Search,
  CloudSun,
  Utensils,
  Shirt,
  Tent,
  Compass,
  Pill,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  HeartHandshake,
  FileSpreadsheet,
  Table,
  Phone,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { ExpeditionPlan, ItineraryDay, NoticeSection, EquipmentItem, DynamicSheet, MemberPII } from '../types';
import { CustomSheetView } from './CustomSheetView';
import { SurveyView } from './SurveyView';
import { MutualAidView } from './MutualAidView';

interface FrontendViewProps {
  plan: ExpeditionPlan;
}

export const FrontendView: React.FC<FrontendViewProps> = ({ plan }) => {
  // Resolve sheets from plan (1:1 strictly matching imported Excel)
  const allSheets: DynamicSheet[] = plan.sheets && plan.sheets.length > 0
    ? plan.sheets
    : [
        { id: 'sheet-progress', name: plan.customHeaders.progressTitle || '團務籌備進度總表', sheetType: 'progress' },
        { id: 'sheet-pii', name: plan.customHeaders.piiTitle || '緊急聯絡人名冊', sheetType: 'pii' },
        { id: 'sheet-shuttle', name: plan.customHeaders.shuttleTitle || '交通接駁與上車集合點', sheetType: 'shuttle' },
        { id: 'sheet-itinerary', name: plan.customHeaders.itineraryTitle || '每日詳細行程與時間節點', sheetType: 'itinerary' },
        { id: 'sheet-equipment', name: plan.customHeaders.equipmentTitle || '登山裝備清單與自主檢查表', sheetType: 'equipment' },
        { id: 'sheet-notices', name: plan.customHeaders.noticesTitle || '登山行程安全守則與各項須知', sheetType: 'notices' },
        { id: 'sheet-safety', name: plan.customHeaders.safetyPlanTitle || '氣象預報與自主安全管理', sheetType: 'safety' },
      ];

  // Hide standalone LINE link sheets and confidential "入園資料" sheets from public front-end tabs
  const isHiddenFrontendSheet = (s: DynamicSheet) => {
    const name = (s.name || '').toLowerCase().replace(/\s+/g, '');
    
    // Hide standalone LINE link sheets from navigation tabs (top button is already present)
    if (
      name === 'line' ||
      name === 'line連結' ||
      name === 'line群組' ||
      name === 'line群組連結' ||
      name.includes('line連結') ||
      name.includes('line群組')
    ) {
      return true;
    }

    // Hide "入園資料" / "入園名冊" / "入園申請" sheets from front-end tabs (後台專屬機密，前台不顯示按鈕)
    if (
      name === '入園資料' ||
      name.includes('入園資料') ||
      name === '入園申請' ||
      name.includes('入園申請') ||
      name === '入園名冊' ||
      name.includes('入園名冊') ||
      name === '入園'
    ) {
      return true;
    }

    return false;
  };

  const visibleSheets = useMemo(() => allSheets.filter(s => !isHiddenFrontendSheet(s)), [allSheets]);

  const [activeSheetId, setActiveSheetId] = useState<string>(visibleSheets[0]?.id || 'sheet-progress');
  const [selectedDayId, setSelectedDayId] = useState<string>(plan.itinerary[0]?.id || '');
  const [progressSearch, setProgressSearch] = useState('');
  const [piiSearch, setPiiSearch] = useState('');
  const [checkedEquipments, setCheckedEquipments] = useState<Record<string, boolean>>({});
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(plan.notices[0]?.id || null);

  // When visible sheets change, ensure activeSheetId points to a valid visible sheet
  React.useEffect(() => {
    if (!visibleSheets.some(s => s.id === activeSheetId) && visibleSheets.length > 0) {
      setActiveSheetId(visibleSheets[0].id);
    }
  }, [visibleSheets, activeSheetId]);

  const currentSheet = visibleSheets.find(s => s.id === activeSheetId) || visibleSheets[0] || allSheets[0];
  const activeTab = currentSheet ? currentSheet.sheetType : 'customTable';
  const safetySheet = visibleSheets.find(s => s.sheetType === 'safety');

  const safeGlobalLineUrl = plan.lineGroupUrl
    ? (plan.lineGroupUrl.startsWith('http://') || plan.lineGroupUrl.startsWith('https://')
        ? plan.lineGroupUrl
        : `https://${plan.lineGroupUrl.replace(/^\/+/, '')}`)
    : 'https://line.me/R/ti/g/yb4st9QZhA';

  const toggleEquipmentCheck = (id: string) => {
    setCheckedEquipments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProgressMembers = plan.members.filter(m => 
    m.name.toLowerCase().includes(progressSearch.toLowerCase()) ||
    (m.nickname && m.nickname.toLowerCase().includes(progressSearch.toLowerCase())) ||
    m.role.toLowerCase().includes(progressSearch.toLowerCase())
  );

  // Emergency contact list filtered specifically for the 4 fields
  const filteredPiiMembers = plan.members.filter(m => {
    const q = piiSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      (m.emergencyContact && m.emergencyContact.toLowerCase().includes(q)) ||
      (m.emergencyPhone && m.emergencyPhone.toLowerCase().includes(q))
    );
  });

  const selectedDay = plan.itinerary.find(d => d.id === selectedDayId) || plan.itinerary[0];

  const getTabIcon = (sheetType: DynamicSheet['sheetType']) => {
    switch (sheetType) {
      case 'overview': return <Compass className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'progress': return <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />;
      case 'pii': return <Shield className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'shuttle': return <Bus className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'itinerary': return <Calendar className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'equipment': return <Backpack className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'notices': return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'safety': return <CloudSun className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'survey': return <Compass className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'mutualAid': return <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
  };

  // Masking helpers for public safety
  const maskIdNumber = (idStr?: string) => {
    if (!idStr) return '-';
    if (idStr.length >= 6) return `${idStr.slice(0, 2)}****${idStr.slice(-3)}`;
    return '******';
  };

  const maskPhone = (phoneStr?: string) => {
    if (!phoneStr) return '-';
    const clean = phoneStr.replace(/\s+/g, '');
    if (clean.length >= 7) return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
    return '***';
  };

  return (
    <div className="space-y-6 pb-16 w-full max-w-full overflow-x-hidden">
      
      {/* Dynamic Navigation Tabs with Responsive Wrapping (鎖定銀幕，一行放不下就自動折行，隱藏 LINE 連結工作表標籤) */}
      <div className="flex flex-wrap gap-2 p-2 bg-[#131924] rounded-2xl border border-slate-800 shadow-md w-full max-w-full">
        {visibleSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          return (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                  : 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              {getTabIcon(sheet.sheetType)}
              <span className="break-words">{sheet.name}</span>
              {sheet.sheetType === 'progress' && plan.members.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-300'}`}>
                  {plan.members.length}人
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Custom Table Sheet or Fallback */}
      {activeTab === 'customTable' && currentSheet && (
        <CustomSheetView
          sheet={currentSheet}
          isAdmin={false}
          plan={plan}
          onUpdatePlan={() => {}}
        />
      )}

      {/* TAB: PROGRESS CHECKLIST */}
      {activeTab === 'progress' && (
        plan.members.length > 0 && plan.progressTasks.length > 0 ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  {currentSheet.name || plan.customHeaders.progressTitle || '團務籌備進度總表'}
                </h3>
                <p className="text-xs text-slate-400">
                  請各位隊員確認各項出團準備進度與款項狀況（僅顯示公開進度，個資已隱藏）
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                  placeholder="搜尋隊員姓名/暱稱..."
                  className="pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Progress Table */}
            <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                      <th className="py-3 px-3 w-16 text-center">角色</th>
                      <th className="py-3 px-3 sticky left-0 bg-slate-950 z-10 w-24">姓名</th>
                      {plan.progressTasks.map(task => (
                        <th key={task.id} className="py-3 px-2 text-center whitespace-nowrap min-w-[80px]">
                          {task.label}
                        </th>
                      ))}
                      <th className="py-3 px-3 min-w-[100px] text-center">付款狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredProgressMembers.map((member, idx) => {
                      const progress = plan.progressData[member.id];
                      const isLeader = member.role.includes('領隊');
                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-slate-800/60 transition ${
                            isLeader ? 'bg-emerald-950/30' : idx % 2 === 1 ? 'bg-slate-900/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                isLeader
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-100 sticky left-0 bg-[#131924] shadow-xs">
                            <div>{member.name}</div>
                            {member.nickname && (
                              <div className="text-[10px] text-slate-400 font-normal">({member.nickname})</div>
                            )}
                          </td>

                          {/* Task Checks */}
                          {plan.progressTasks.map(task => {
                            const val = progress?.tasks[task.key];
                            const isChecked = val === true || val === 'O' || val === 'o' || val === 'V' || val === 'v';
                            const isText = typeof val === 'string' && !isChecked && val.trim() !== '';

                            return (
                              <td key={task.id} className="py-2.5 px-2 text-center">
                                {isChecked ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-xs">
                                    ✓
                                  </span>
                                ) : isText ? (
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] max-w-[120px] truncate" title={val}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-light text-sm">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Payment Status (Safe view) */}
                          <td className="py-2.5 px-3 text-center">
                            {progress?.paidStatus === '已結清' || isLeader ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-medium text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>已完成</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px]">
                                {progress?.paidStatus || '處理中'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <CustomSheetView
            sheet={currentSheet}
            isAdmin={false}
            plan={plan}
            onUpdatePlan={() => {}}
          />
        )
      )}

      {/* TAB: EMERGENCY CONTACTS / 緊急聯絡人 (緊湊排列，消除無用留白，僅顯示 姓名 隊員電話 緊急聯絡人 緊急聯絡人電話) */}
      {activeTab === 'pii' && (
        <div className="space-y-2.5 animate-fadeIn w-fit max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#131924] p-3 rounded-xl border border-slate-800 shadow-md w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                <h3 className="font-bold text-slate-100 text-sm">
                  {currentSheet.name || plan.customHeaders.piiTitle || '緊急聯絡人'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                登山緊急應變通訊名錄，僅顯示姓名、聯絡電話、緊急聯絡人與聯絡人電話
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={piiSearch}
                onChange={(e) => setPiiSearch(e.target.value)}
                placeholder="搜尋姓名、電話、聯絡人..."
                className="pl-8 pr-3 py-1 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-48"
              />
            </div>
          </div>

          <div className="bg-[#131924] rounded-xl border border-slate-800 shadow-md overflow-hidden w-fit max-w-full">
            <div className="overflow-x-auto">
              <table className="w-auto text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                    <th className="py-2 px-3 whitespace-nowrap">姓名</th>
                    <th className="py-2 px-3 whitespace-nowrap">聯絡電話</th>
                    <th className="py-2 px-3 whitespace-nowrap text-emerald-300">緊急聯絡人</th>
                    <th className="py-2 px-3 whitespace-nowrap text-emerald-300">聯絡人電話</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredPiiMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-slate-500">
                        {piiSearch ? '查無符合條件之名冊資料' : '暫無名冊資料'}
                      </td>
                    </tr>
                  ) : (
                    filteredPiiMembers.map((member, idx) => {
                      const isLeader = member.role.includes('領隊');
                      const cleanMemberPhone = (member.phone || '').replace(/\s+/g, '');
                      const cleanEmergencyPhone = (member.emergencyPhone || '').replace(/\s+/g, '');

                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-slate-800/60 transition ${
                            isLeader ? 'bg-emerald-950/30 font-medium' : idx % 2 === 1 ? 'bg-slate-900/40' : ''
                          }`}
                        >
                          <td className="py-1.5 px-3 font-bold text-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isLeader && (
                                <span className="px-1 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded">
                                  領隊
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {member.phone ? (
                              <a
                                href={`tel:${cleanMemberPhone}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800/80 hover:bg-emerald-950/50 text-slate-200 hover:text-emerald-300 rounded font-mono text-xs font-medium transition border border-slate-700/80"
                                title="點擊直接撥打隊員電話"
                              >
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{member.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                            {member.emergencyContact || <span className="text-slate-600">-</span>}
                          </td>
                          <td className="py-1.5 px-3 whitespace-nowrap">
                            {member.emergencyPhone ? (
                              <a
                                href={`tel:${cleanEmergencyPhone}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 rounded font-mono text-xs font-bold transition border border-emerald-500/30"
                                title="點擊直接撥打緊急聯絡電話"
                              >
                                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{member.emergencyPhone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SHUTTLE */}
      {activeTab === 'shuttle' && (
        plan.shuttleRoutes.length > 0 ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#131924] p-6 rounded-3xl border border-slate-800 shadow-md">
              <div className="flex items-center gap-2.5 mb-2">
                <Bus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  {currentSheet.name || plan.customHeaders.shuttleTitle || '交通接駁與上車集合點'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                活動當天請務必提早 10 分鐘抵達指定接駁點，抵達時請主動在 LINE 群組回報！
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plan.shuttleRoutes.map((route) => (
                <div key={route.id} className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      {route.title}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">共 {route.stops.length} 個站點</span>
                  </div>

                  <div className="space-y-3">
                    {route.stops.map((stop, sIdx) => (
                      <div key={stop.id || sIdx} className="p-3.5 bg-slate-900/60 hover:bg-slate-850 rounded-2xl border border-slate-850 transition space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md font-mono">
                              {stop.time}
                            </span>
                            <span>{stop.locationName}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                          <span className="text-slate-500">上車隊員：</span>
                          {stop.passengers && stop.passengers.length > 0 ? (
                            stop.passengers.map((p, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-medium text-slate-200 text-[11px]">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">待定</span>
                          )}
                        </div>

                        {stop.notes && (
                          <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-md">
                            備註：{stop.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CustomSheetView
            sheet={currentSheet}
            isAdmin={false}
            plan={plan}
            onUpdatePlan={() => {}}
          />
        )
      )}

      {/* TAB: ITINERARY */}
      {activeTab === 'itinerary' && (
        plan.itinerary.length > 0 ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Day Selector Pills - 緊湊無多餘空白，標題僅保留 DAY1 DAY2 DAY3 ... */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-[#131924] rounded-xl border border-slate-800 max-w-full overflow-x-auto no-scrollbar">
              {plan.itinerary.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
                    selectedDay?.id === day.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {day.dayLabel}
                </button>
              ))}
            </div>

            {/* Active Day Detail Card */}
            {selectedDay && (
              <div className="bg-[#131924] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-full text-xs">
                      {selectedDay.dayLabel}
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-2">
                      {selectedDay.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedDay.estimatedTime && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-slate-300 rounded-xl font-medium border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>預估時間：{selectedDay.estimatedTime}</span>
                      </span>
                    )}
                    {selectedDay.distance && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-slate-300 rounded-xl font-medium border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>距離：{selectedDay.distance}</span>
                      </span>
                    )}
                    {selectedDay.altitudeGain && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 text-emerald-300 rounded-xl font-medium border border-emerald-500/30">
                        <span>爬升：{selectedDay.altitudeGain}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Milestones */}
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {selectedDay.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative pl-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-950 shadow-xs shrink-0 mt-1 z-10" />
                      <div className="bg-slate-900/60 hover:bg-slate-850 p-4 rounded-2xl border border-slate-800 flex-1 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="font-bold text-slate-100 text-sm">
                            <span className="text-emerald-400 mr-2 font-mono">{m.time}</span>
                            {m.location}
                          </div>
                        </div>
                        {m.notes && (
                          <p className="text-xs text-slate-300 mt-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Water & Camp info */}
                {selectedDay.waterAndCamp && (
                  <div className="p-4 bg-teal-950/40 border border-teal-800/40 rounded-2xl text-xs text-teal-200 flex items-start gap-2.5">
                    <Tent className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-teal-100">營地與水源狀況：</div>
                      <div>{selectedDay.waterAndCamp}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <CustomSheetView
            sheet={currentSheet}
            isAdmin={false}
            plan={plan}
            onUpdatePlan={() => {}}
          />
        )
      )}

      {/* TAB: EQUIPMENT / 裝備檢查表 (確實對應 SHEET 內容，不跳頁) */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="bg-[#131924] p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Backpack className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-100 text-base">
                  {currentSheet.name || plan.customHeaders.equipmentTitle || '登山裝備清單與自主檢查表'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                登山裝備自主檢查與打包核對。保暖與防水裝備滴水不漏是高山安全之本！
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 px-3.5 py-1.5 rounded-xl self-start sm:self-auto border border-emerald-500/30">
              已勾選 {Object.values(checkedEquipments).filter(Boolean).length} 項
            </div>
          </div>

          {/* 1:1 Sheet Rows Table */}
          {currentSheet?.rawRows && currentSheet.rawRows.length > 0 ? (
            <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3 w-12 text-center">核對</th>
                      {currentSheet.rawHeaders && currentSheet.rawHeaders.length > 0 ? (
                        currentSheet.rawHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="py-2.5 px-3">分類</th>
                          <th className="py-2.5 px-3">裝備品名</th>
                          <th className="py-2.5 px-3">必備/選配</th>
                          <th className="py-2.5 px-3">備註與檢查重點</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {currentSheet.rawRows.map((row, rIdx) => {
                      const rowKey = `eq_row_${rIdx}`;
                      const isChecked = !!checkedEquipments[rowKey];
                      return (
                        <tr
                          key={rIdx}
                          onClick={() => toggleEquipmentCheck(rowKey)}
                          className={`cursor-pointer transition ${
                            isChecked ? 'bg-emerald-950/40' : rIdx % 2 === 1 ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer focus:ring-emerald-500 bg-slate-900 border-slate-700"
                            />
                          </td>
                          {row.map((cell, cIdx) => {
                            const strCell = String(cell ?? '');
                            const isReq = strCell === '必備';
                            const isOptional = strCell === '選配';
                            return (
                              <td key={cIdx} className={`py-2 px-3 ${isChecked && cIdx === 1 ? 'line-through text-slate-500' : ''}`}>
                                {isReq ? (
                                  <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[11px] font-bold">
                                    必備
                                  </span>
                                ) : isOptional ? (
                                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[11px] font-medium">
                                    選配
                                  </span>
                                ) : (
                                  <span className={cIdx === 1 ? 'font-bold text-slate-100 text-xs' : 'text-slate-300'}>
                                    {strCell || '-'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : plan.equipmentList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.equipmentList.map((item) => {
                const isChecked = !!checkedEquipments[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleEquipmentCheck(item.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer select-none flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-[#131924] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-emerald-600 rounded mt-0.5 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isChecked ? 'text-emerald-300 line-through' : 'text-slate-100'}`}>
                          {item.name}
                        </span>
                        {item.required && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-semibold">
                            必備
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">{item.category}</span>
                        {item.notes && <span className="text-slate-500">{item.notes}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <CustomSheetView
              sheet={currentSheet}
              isAdmin={false}
              plan={plan}
              onUpdatePlan={() => {}}
            />
          )}
        </div>
      )}

      {/* TAB: NOTICES / 注意事項 (內容已有編號，不要另外編號，排版完全參照內容，不跳頁) */}
      {activeTab === 'notices' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#131924] p-6 rounded-3xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                <FileText className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-100 text-base">
                {currentSheet.name || plan.customHeaders.noticesTitle || '登山行程安全守則與各項須知'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              入群參團亦表詳閱各注意事項並同意相關細項規定。條文內容如實完整呈現。
            </p>
          </div>

          {currentSheet?.rawRows && currentSheet.rawRows.length > 0 ? (
            <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  {currentSheet.rawHeaders && currentSheet.rawHeaders.length > 0 && (
                    <thead>
                      <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                        {currentSheet.rawHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {currentSheet.rawRows.map((row, rIdx) => (
                      <tr key={rIdx} className={`hover:bg-slate-800/40 transition ${rIdx % 2 === 1 ? 'bg-slate-900/40' : ''}`}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className={`py-2 px-3 leading-relaxed whitespace-pre-wrap align-top ${cIdx === 0 ? 'font-bold text-slate-100 min-w-[120px]' : 'text-slate-300'}`}>
                            {cell !== undefined && cell !== null && String(cell).trim() !== '' ? String(cell) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : plan.notices.length > 0 ? (
            <div className="space-y-3">
              {plan.notices.map((sec) => {
                const isExpanded = expandedNoticeId === sec.id;
                return (
                  <div key={sec.id} className="bg-[#131924] rounded-2xl border border-slate-800 overflow-hidden transition">
                    <button
                      onClick={() => setExpandedNoticeId(isExpanded ? null : sec.id)}
                      className="w-full p-4 text-left font-bold text-slate-100 text-sm flex items-center justify-between hover:bg-slate-850 transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>{sec.title}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-800 bg-slate-950/40">
                        {/* 條文內容已有編號，排版完全參照內容，不另行加上額外編號 */}
                        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed pl-1">
                          {sec.content.map((c, idx) => (
                            <div key={idx} className="whitespace-pre-wrap">
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <CustomSheetView
              sheet={currentSheet}
              isAdmin={false}
              plan={plan}
              onUpdatePlan={() => {}}
            />
          )}
        </div>
      )}

      {/* TAB: SAFETY & WEATHER / 氣象預報與安全管理 (確實對應 SHEET 內容，不跳頁) */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="bg-[#131924] p-6 rounded-3xl border border-slate-800 shadow-md flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {currentSheet.name || plan.customHeaders.safetyPlanTitle || '氣象預報與自主安全管理'}
              </h3>
              <p className="text-xs text-slate-400">
                出發前氣象觀測指標與高山應變撤退標準守則
              </p>
            </div>
          </div>

          {/* 1:1 Weather Sheet Table */}
          {currentSheet?.rawRows && currentSheet.rawRows.length > 0 ? (
            <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  {currentSheet.rawHeaders && currentSheet.rawHeaders.length > 0 && (
                    <thead>
                      <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                        {currentSheet.rawHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {currentSheet.rawRows.map((row, rIdx) => (
                      <tr key={rIdx} className={`hover:bg-slate-800/40 transition ${rIdx % 2 === 1 ? 'bg-slate-900/40' : ''}`}>
                        {row.map((cell, cIdx) => {
                          const strCell = String(cell ?? '').trim();
                          const urlMatch = strCell.match(/(https?:\/\/[^\s]+)/i);
                          const isUrl = !!urlMatch;
                          const targetUrl = urlMatch ? urlMatch[0] : strCell;

                          return (
                            <td key={cIdx} className={`py-2 px-3 align-middle ${cIdx === 0 ? 'font-bold text-slate-100' : 'text-slate-300'}`}>
                              {isUrl ? (
                                <a
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium break-all transition hover:bg-sky-950/40 px-1 py-0.5 rounded group"
                                  title={`點擊前往：${targetUrl}`}
                                >
                                  <CloudSun className="w-3.5 h-3.5 text-sky-400 shrink-0 inline-block align-middle mr-0.5 group-hover:scale-110 transition" />
                                  <span>{urlMatch && strCell !== targetUrl ? strCell.replace(targetUrl, '').trim() || strCell : strCell}</span>
                                  <ExternalLink className="w-3 h-3 text-sky-400 shrink-0 inline-block align-middle ml-0.5 opacity-70 group-hover:opacity-100" />
                                </a>
                              ) : (
                                <span className="whitespace-pre-wrap">{strCell || '-'}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {plan.weatherCheckLinks && plan.weatherCheckLinks.length > 0 && (
                <div className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
                      <CloudSun className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">行前氣象即時預報確認</h3>
                      <p className="text-xs text-slate-400">領隊與全體隊員出發前 72-24 小時逐一核對氣象圖資</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plan.weatherCheckLinks.map((wl, idx) => (
                      <a
                        key={idx}
                        href={wl.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 bg-slate-900/60 hover:bg-slate-850 rounded-2xl border border-slate-800 transition flex flex-col justify-between gap-2 group"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-200 group-hover:text-sky-300 flex items-center justify-between">
                            <span>{wl.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
                          </div>
                          {wl.description && (
                            <p className="text-[11px] text-slate-400 mt-1">{wl.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-sky-400 font-medium">點擊查看即時數據 →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {plan.safetyAndRetreatPlan.criteria.length > 0 && (
                <div className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">
                        {plan.safetyAndRetreatPlan.title || '自主安全管理與應變撤退計畫'}
                      </h3>
                      <p className="text-xs text-slate-400">凡於行進途中，領隊基於安全理由決定撤退時，所有隊員應遵從撤退不得異議</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-800/40 space-y-2">
                      <h4 className="font-bold text-rose-300 text-sm">🚨 啟動撤退機制時機：</h4>
                      <ul className="space-y-1.5 text-rose-200 list-disc list-inside">
                        {plan.safetyAndRetreatPlan.criteria.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                      <h4 className="font-bold text-slate-200 text-sm">🚶‍♂️ 撤退程序與行動準則：</h4>
                      <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                        {plan.safetyAndRetreatPlan.procedures.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB: SURVEY / 登山經歷調查問卷 */}
      {activeTab === 'survey' && (
        <SurveyView
          plan={plan}
          sheet={currentSheet}
          isAdmin={false}
        />
      )}

      {/* TAB: MUTUAL AID / 互助組分組名冊與通訊 */}
      {activeTab === 'mutualAid' && (
        <MutualAidView
          plan={plan}
          sheet={currentSheet}
          isAdmin={false}
        />
      )}

      {/* TAB: OVERVIEW (Only if overview sheet exists and has non-empty fields) */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.leader?.name && (
              <div className="p-5 bg-[#131924] rounded-3xl border border-slate-800 shadow-md flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">主辦人 / 領隊</div>
                  <div className="font-bold text-slate-100 text-sm">{plan.leader.name}</div>
                  {plan.leader.phone && (
                    <a
                      href={`tel:${plan.leader.phone.replace(/\s+/g, '')}`}
                      className="text-xs text-emerald-400 hover:underline font-mono flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{plan.leader.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {plan.stayBehindPerson?.name && (
              <div className="p-5 bg-[#131924] rounded-3xl border border-rose-500/30 shadow-md flex items-center gap-3.5 bg-rose-950/20">
                <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-rose-400 font-bold">緊急留守聯絡人</div>
                  <div className="font-bold text-slate-100 text-sm">{plan.stayBehindPerson.name}</div>
                  {plan.stayBehindPerson.phone && (
                    <a
                      href={`tel:${plan.stayBehindPerson.phone.replace(/\s+/g, '')}`}
                      className="text-xs text-rose-400 font-bold hover:underline font-mono flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-rose-400" />
                      <span>{plan.stayBehindPerson.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {plan.trailhead && (
              <div className="p-5 bg-[#131924] rounded-3xl border border-slate-800 shadow-md flex items-center gap-3.5">
                <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">起登與下山地點</div>
                  <div className="font-bold text-slate-100 text-xs">{plan.trailhead}</div>
                </div>
              </div>
            )}

            {plan.radioFrequency && (
              <div className="p-5 bg-[#131924] rounded-3xl border border-slate-800 shadow-md flex items-center gap-3.5">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">高山無線電頻率</div>
                  <div className="font-bold text-slate-100 text-xs font-mono">{plan.radioFrequency}</div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Addons if non-empty */}
          {(plan.pricing.generalPrice || (plan.pricing.regionalPricing && plan.pricing.regionalPricing.length > 0)) && (
            <div className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">行程費用說明</h3>
                </div>
              </div>

              <div className="space-y-2">
                {plan.pricing.regionalPricing && plan.pricing.regionalPricing.length > 0 ? (
                  plan.pricing.regionalPricing.map((rp, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/80 rounded-xl text-xs border border-slate-800">
                      <span className="font-medium text-slate-300">{rp.region}</span>
                      <span className="font-bold text-emerald-400 text-sm">{rp.price}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-900/80 rounded-xl text-xs font-bold text-emerald-400 border border-slate-800">
                    {plan.pricing.generalPrice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
