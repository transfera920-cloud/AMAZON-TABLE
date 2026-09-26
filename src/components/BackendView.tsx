import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  Bus,
  Calendar,
  FileText,
  Backpack,
  Settings,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  CloudSun,
  Compass,
  HeartHandshake,
  Phone,
  UploadCloud
} from 'lucide-react';
import { ExpeditionPlan, MemberPII, ProgressTask, ShuttleRoute, ItineraryDay, NoticeSection, EquipmentItem, DynamicSheet } from '../types';
import { MemberEditModal } from './MemberEditModal';
import { ColumnManagerModal } from './ColumnManagerModal';
import { CustomSheetView } from './CustomSheetView';
import { SurveyView } from './SurveyView';
import { MutualAidView } from './MutualAidView';
import { exportExpeditionToExcel } from '../utils/excelParser';

interface BackendViewProps {
  plan: ExpeditionPlan;
  onUpdatePlan: (updatedPlan: ExpeditionPlan) => void;
  onOpenUploadModal?: () => void;
  onOpenTripSelector?: () => void;
  onToggleMode?: (isAdmin: boolean) => void;
}

export const BackendView: React.FC<BackendViewProps> = ({ 
  plan, 
  onUpdatePlan, 
  onOpenUploadModal,
  onOpenTripSelector,
  onToggleMode,
}) => {
  // Resolve all dynamic sheets from plan or fallback
  const allSheets: DynamicSheet[] = plan.sheets && plan.sheets.length > 0
    ? plan.sheets
    : [
        { id: 'sheet-pii', name: plan.customHeaders.piiTitle || '隊員名冊與申請個資', sheetType: 'pii' },
        { id: 'sheet-progress', name: plan.customHeaders.progressTitle || '團務進度與收款', sheetType: 'progress' },
        { id: 'sheet-shuttle', name: plan.customHeaders.shuttleTitle || '交通接駁車次編排', sheetType: 'shuttle' },
        { id: 'sheet-itinerary', name: plan.customHeaders.itineraryTitle || '登山計劃與每日行程', sheetType: 'itinerary' },
        { id: 'sheet-notices', name: plan.customHeaders.noticesTitle || '行程規章與注意事項', sheetType: 'notices' },
        { id: 'sheet-equipment', name: plan.customHeaders.equipmentTitle || '裝備清單設定', sheetType: 'equipment' },
        { id: 'sheet-safety', name: plan.customHeaders.safetyPlanTitle || '自主安全管理與應變撤退計畫', sheetType: 'safety' },
      ];

  const [activeSheetId, setActiveSheetId] = useState<string>(allSheets[0]?.id || 'sheet-pii');
  
  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberPII | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [onlyEmergencyView, setOnlyEmergencyView] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Inline header editing
  const [editingHeaderKey, setEditingHeaderKey] = useState<string | null>(null);
  const [headerInputVal, setHeaderInputVal] = useState('');

  const currentSheet = allSheets.find(s => s.id === activeSheetId) || allSheets[0];
  const activeTab = activeSheetId === 'settings-tab' ? 'settings' : (currentSheet ? currentSheet.sheetType : 'pii');

  const handleAddNewCustomSheet = () => {
    const sheetName = prompt('請輸入新工作表名稱 (例如: 第4車接駁名冊、公裝分配表、餐費分攤表)：', `新工作表 ${(plan.sheets || []).length + 1}`);
    if (!sheetName || !sheetName.trim()) return;

    const newSheet: DynamicSheet = {
      id: `sheet_custom_${Date.now()}`,
      name: sheetName.trim(),
      sheetType: 'customTable',
      rawHeaders: ['項目 / 隊員', '規格 / 內容', '負責人', '狀態 / 備註'],
      rawRows: [
        ['範例項目 1', '說明內容', '隊員A', '已完成'],
        ['範例項目 2', '說明內容', '隊員B', '進行中'],
      ],
    };

    const updatedSheets = [...(plan.sheets || allSheets), newSheet];
    onUpdatePlan({ ...plan, sheets: updatedSheets });
    setActiveSheetId(newSheet.id);
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (!window.confirm('確定要刪除此工作表嗎？')) return;
    const updatedSheets = (plan.sheets || allSheets).filter(s => s.id !== sheetId);
    onUpdatePlan({ ...plan, sheets: updatedSheets });
    if (activeSheetId === sheetId) {
      setActiveSheetId(updatedSheets[0]?.id || 'sheet-pii');
    }
  };

  const getTabIcon = (sheetType: DynamicSheet['sheetType']) => {
    switch (sheetType) {
      case 'pii': return <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'progress': return <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />;
      case 'shuttle': return <Bus className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'itinerary': return <Calendar className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'notices': return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'equipment': return <Backpack className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'safety': return <CloudSun className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'survey': return <Compass className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'mutualAid': return <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
  };

  // 1. Member Operations
  const handleSaveMember = (member: MemberPII) => {
    const existingIndex = plan.members.findIndex(m => m.id === member.id);
    let updatedMembers = [...plan.members];
    if (existingIndex >= 0) {
      updatedMembers[existingIndex] = member;
    } else {
      updatedMembers.push(member);
      // init progress data if new
      if (!plan.progressData[member.id]) {
        plan.progressData[member.id] = {
          memberId: member.id,
          tasks: {},
          paidStatus: '未付款',
        };
      }
    }

    onUpdatePlan({
      ...plan,
      members: updatedMembers,
    });
  };

  const handleDeleteMember = (memberId: string) => {
    if (!window.confirm('確定要刪除這位隊員的資料嗎？')) return;
    const updatedMembers = plan.members.filter(m => m.id !== memberId);
    const newProgress = { ...plan.progressData };
    delete newProgress[memberId];

    onUpdatePlan({
      ...plan,
      members: updatedMembers,
      progressData: newProgress,
    });
  };

  // 2. Progress Checklist Operations
  const handleToggleTask = (memberId: string, taskKey: string) => {
    const currentProg = plan.progressData[memberId] || { memberId, tasks: {} };
    const currentVal = currentProg.tasks[taskKey];
    const newVal = !currentVal;

    onUpdatePlan({
      ...plan,
      progressData: {
        ...plan.progressData,
        [memberId]: {
          ...currentProg,
          tasks: {
            ...currentProg.tasks,
            [taskKey]: newVal,
          },
        },
      },
    });
  };

  const handleUpdateTaskText = (memberId: string, taskKey: string, value: string) => {
    const currentProg = plan.progressData[memberId] || { memberId, tasks: {} };
    onUpdatePlan({
      ...plan,
      progressData: {
        ...plan.progressData,
        [memberId]: {
          ...currentProg,
          tasks: {
            ...currentProg.tasks,
            [taskKey]: value,
          },
        },
      },
    });
  };

  const handleUpdatePaymentStatus = (memberId: string, status: string, amount?: number) => {
    const currentProg = plan.progressData[memberId] || { memberId, tasks: {} };
    onUpdatePlan({
      ...plan,
      progressData: {
        ...plan.progressData,
        [memberId]: {
          ...currentProg,
          paidStatus: status,
          paidAmount: amount !== undefined ? amount : currentProg.paidAmount,
        },
      },
    });
  };

  // 3. Batch Check Actions
  const handleBatchCheckTask = (taskKey: string) => {
    const newProgress = { ...plan.progressData };
    plan.members.forEach(m => {
      if (!newProgress[m.id]) {
        newProgress[m.id] = { memberId: m.id, tasks: {} };
      }
      newProgress[m.id] = {
        ...newProgress[m.id],
        tasks: {
          ...newProgress[m.id].tasks,
          [taskKey]: true,
        },
      };
    });

    onUpdatePlan({
      ...plan,
      progressData: newProgress,
    });
  };

  // 4. Quick Copy for National Park / Insurance
  const copyNationalParkFormat = () => {
    const lines = plan.members.map((m, i) => 
      `${i + 1}\t${m.role}\t${m.name}\t${m.gender}\t${m.idNumber}\t${m.birthDate}\t${m.phone}\t${m.emergencyContact}\t${m.emergencyPhone}\t${m.email}\t${m.address || ''}`
    );
    const content = `序號\t角色\t姓名\t性別\t身分證字號\t出生年月日\t聯絡電話\t緊急聯絡人\t緊急聯絡人電話\tEmail\t地址\n${lines.join('\n')}`;
    navigator.clipboard.writeText(content);
    setCopiedType('park');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // 5. Section Header Rename
  const handleSaveHeader = (sectionKey: keyof ExpeditionPlan['customHeaders']) => {
    if (!headerInputVal.trim()) return;
    onUpdatePlan({
      ...plan,
      customHeaders: {
        ...plan.customHeaders,
        [sectionKey]: headerInputVal.trim(),
      },
    });
    setEditingHeaderKey(null);
  };

  const filteredMembers = plan.members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.idNumber.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch) ||
    m.role.includes(memberSearch)
  );

  const visiblePiiCols = useMemo(() => {
    const members = plan.members || [];
    return {
      role: members.some(m => m.role && m.role.trim() !== '' && m.role !== '隊員') || members.some(m => m.role && m.role.trim() !== ''),
      gender: members.some(m => m.gender && m.gender.trim() !== ''),
      idNumber: members.some(m => m.idNumber && m.idNumber.trim() !== ''),
      birthDate: members.some(m => m.birthDate && m.birthDate.trim() !== ''),
      phone: members.some(m => m.phone && m.phone.trim() !== ''),
      email: members.some(m => m.email && m.email.trim() !== ''),
      emergencyContact: members.some(m => m.emergencyContact && m.emergencyContact.trim() !== ''),
      emergencyPhone: members.some(m => m.emergencyPhone && m.emergencyPhone.trim() !== ''),
      diet: members.some(m => m.diet && m.diet.trim() !== ''),
      medicalHistory: members.some(m => m.medicalHistory && m.medicalHistory.trim() !== ''),
      address: members.some(m => m.address && m.address.trim() !== ''),
      customColumns: (plan.customColumns || []).filter(c => c.tableKey === 'pii' && (members.some(m => m.customFields?.[c.key]) || true)),
    };
  }, [plan.members, plan.customColumns]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Admin Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-amber-300">幹部管理後台 (全權編輯模式)</strong>
              <span className="font-mono text-[11px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-700/60 font-bold">
                目前管理團務: {plan.tripId || plan.id || 'TRIP-001'} - {plan.title}
              </span>
            </div>
            <div className="text-[11px] text-amber-200/90 mt-0.5">
              本處展示未遮蔽之完整個資。編輯儲存僅影響此團務，與其他登山團務完全獨立。
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenTripSelector && (
            <button
              type="button"
              onClick={onOpenTripSelector}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition text-xs shadow-xs"
              title="切換不同團務進行管理"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>切換團務</span>
            </button>
          )}

          {onOpenUploadModal && (
            <button
              id="btn-backend-upload-excel"
              type="button"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-xs active:scale-95 text-xs"
              title="載入 Excel 或多個 CSV 檔案覆蓋或更新總表"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>載入 Excel/CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition text-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>自訂/新增欄位標題</span>
          </button>

          <button
            onClick={copyNationalParkFormat}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition border border-slate-700 text-xs"
          >
            {copiedType === 'park' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'park' ? '已複製入園名冊' : '一鍵複製入園名冊'}</span>
          </button>

          {onToggleMode && (
            <button
              type="button"
              onClick={() => onToggleMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl font-semibold transition text-xs"
              title="退出後台編輯回到前台公開檢視"
            >
              <span>返回前台</span>
            </button>
          )}
        </div>
      </div>

      {/* Backend Navigation Tabs with Multi-Line Responsive Wrapping */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-[#131924] rounded-2xl border border-slate-800 shadow-md w-full max-w-full">
        {allSheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          return (
            <div key={sheet.id} className="flex items-center">
              <button
                onClick={() => setActiveSheetId(sheet.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
                    : 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {getTabIcon(sheet.sheetType)}
                <span className="break-words">{sheet.name}</span>
                {sheet.sheetType === 'pii' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {plan.members.length}人
                  </span>
                )}
              </button>
              {sheet.sheetType === 'customTable' && (
                <button
                  type="button"
                  onClick={() => handleDeleteSheet(sheet.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-md"
                  title="刪除此工作表"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Global Settings Tab */}
        <button
          onClick={() => setActiveSheetId('settings-tab')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeSheetId === 'settings-tab'
              ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-500'
              : 'text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>全域主標題與設定</span>
        </button>

        {/* Load Excel/CSV Button */}
        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
            title="載入 Excel 或多個 CSV 檔案解析覆蓋總表"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>載入 Excel/CSV</span>
          </button>
        )}

        {/* Add New Custom Sheet Button */}
        <button
          type="button"
          onClick={handleAddNewCustomSheet}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition shadow-xs"
          title="在總表中新增一個工作表"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>＋ 新增工作表</span>
        </button>
      </div>

      {/* Dynamic Custom Table Sheet Rendering */}
      {activeTab === 'customTable' && currentSheet && (
        <CustomSheetView
          sheet={currentSheet}
          isAdmin={true}
          plan={plan}
          onUpdatePlan={onUpdatePlan}
        />
      )}

      {/* TAB 1: PII & MEMBER ROSTER */}
      {activeTab === 'pii' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>新增隊員</span>
              </button>

              <button
                onClick={() => setOnlyEmergencyView(!onlyEmergencyView)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  onlyEmergencyView
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="切換欄位顯示模式"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{onlyEmergencyView ? '僅顯示緊急聯絡 4 欄' : '展開完整個資欄位'}</span>
              </button>

              {!onlyEmergencyView && (
                <button
                  onClick={() => setIsColumnModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增自訂欄位</span>
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="搜尋姓名、身分證、電話..."
                className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Member PII Table */}
          <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden w-fit max-w-full">
            <div className="overflow-x-auto">
              {onlyEmergencyView ? (
                /* 僅顯示緊急聯絡人：姓名、聯絡電話、緊急聯絡人、聯絡人電話 */
                <table className="w-auto text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                      <th className="py-2.5 px-3 whitespace-nowrap">姓名</th>
                      <th className="py-2.5 px-3 whitespace-nowrap font-mono">聯絡電話</th>
                      <th className="py-2.5 px-3 whitespace-nowrap text-emerald-400 font-bold">緊急聯絡人</th>
                      <th className="py-2.5 px-3 whitespace-nowrap font-mono text-emerald-400 font-bold">聯絡人電話</th>
                      <th className="py-2.5 px-3 w-16 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredMembers.map((member, idx) => {
                      const isLeader = member.role.includes('領隊');
                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-slate-800/50 transition ${
                            isLeader ? 'bg-emerald-950/20 font-medium' : idx % 2 === 1 ? 'bg-slate-900/30' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {isLeader && (
                                <span className="px-1 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded">
                                  領隊
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {member.phone || <span className="text-slate-500">-</span>}
                          </td>
                          <td className="py-2 px-3 font-bold text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                            {member.emergencyContact || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                            {member.emergencyPhone || '-'}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsMemberModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                                title="編輯此隊員"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                                title="刪除此隊員"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* 完整保險個資展開模式 */
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                      {visiblePiiCols.role && <th className="py-3 px-3 w-16 text-center">角色</th>}
                      <th className="py-3 px-3 sticky left-0 bg-slate-950 z-10 w-24">姓名</th>
                      {visiblePiiCols.gender && <th className="py-3 px-2 w-12 text-center">性別</th>}
                      {visiblePiiCols.idNumber && <th className="py-3 px-3 min-w-[110px] font-mono">身分證字號</th>}
                      {visiblePiiCols.birthDate && <th className="py-3 px-3 min-w-[95px]">出生年月日</th>}
                      {visiblePiiCols.phone && <th className="py-3 px-3 min-w-[110px] font-mono">聯絡電話</th>}
                      {visiblePiiCols.emergencyContact && (
                        <th className="py-3 px-3 min-w-[100px] text-emerald-400 font-bold">緊急聯絡人</th>
                      )}
                      {visiblePiiCols.emergencyPhone && (
                        <th className="py-3 px-3 min-w-[110px] font-mono text-emerald-400 font-bold">聯絡人電話</th>
                      )}
                      {visiblePiiCols.diet && <th className="py-3 px-3 min-w-[90px]">飲食習慣</th>}
                      {visiblePiiCols.medicalHistory && <th className="py-3 px-3 min-w-[120px]">用藥/病史</th>}
                      {visiblePiiCols.email && <th className="py-3 px-3 min-w-[130px]">Email</th>}
                      {visiblePiiCols.address && <th className="py-3 px-3 min-w-[120px]">住址</th>}
                      
                      {/* Custom columns */}
                      {visiblePiiCols.customColumns.map(col => (
                        <th key={col.key} className="py-3 px-3 min-w-[100px] text-amber-300">
                          {col.label}
                        </th>
                      ))}

                      <th className="py-3 px-3 w-20 text-center sticky right-0 bg-slate-950 z-10">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredMembers.map((member, idx) => {
                      const isLeader = member.role.includes('領隊');
                      return (
                        <tr
                          key={member.id}
                          className={`hover:bg-slate-800/50 transition ${
                            isLeader ? 'bg-emerald-950/20 font-medium' : idx % 2 === 1 ? 'bg-slate-900/30' : ''
                          }`}
                        >
                          {visiblePiiCols.role && (
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                  isLeader ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {member.role}
                              </span>
                            </td>
                          )}
                          <td className="py-2.5 px-3 font-semibold text-slate-100 sticky left-0 bg-inherit shadow-xs">
                            <div>{member.name}</div>
                            {member.nickname && (
                              <div className="text-[10px] text-slate-400 font-normal">({member.nickname})</div>
                            )}
                          </td>
                          {visiblePiiCols.gender && (
                            <td className="py-2.5 px-2 text-center text-slate-400">{member.gender || '-'}</td>
                          )}
                          {visiblePiiCols.idNumber && (
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                              {member.idNumber || <span className="text-slate-500">未填</span>}
                            </td>
                          )}
                          {visiblePiiCols.birthDate && (
                            <td className="py-2.5 px-3 text-slate-300">
                              {member.birthDate || <span className="text-slate-500">未填</span>}
                            </td>
                          )}
                          {visiblePiiCols.phone && (
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {member.phone || <span className="text-slate-500">未填</span>}
                            </td>
                          )}
                          {visiblePiiCols.emergencyContact && (
                            <td className="py-2.5 px-3 font-bold text-emerald-400 bg-emerald-950/20">
                              {member.emergencyContact || '-'}
                            </td>
                          )}
                          {visiblePiiCols.emergencyPhone && (
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 bg-emerald-950/20">
                              {member.emergencyPhone || '-'}
                            </td>
                          )}
                          {visiblePiiCols.diet && (
                            <td className="py-2.5 px-3 text-slate-300">{member.diet || '-'}</td>
                          )}
                          {visiblePiiCols.medicalHistory && (
                            <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]" title={member.medicalHistory}>
                              {member.medicalHistory || '-'}
                            </td>
                          )}
                          {visiblePiiCols.email && (
                            <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]" title={member.email}>
                              {member.email || <span className="text-slate-500">未填</span>}
                            </td>
                          )}
                          {visiblePiiCols.address && (
                            <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]" title={member.address}>
                              {member.address || '-'}
                            </td>
                          )}

                          {/* Custom fields */}
                          {visiblePiiCols.customColumns.map(col => (
                            <td key={col.key} className="py-2.5 px-3 text-slate-300">
                              {member.customFields?.[col.key] || '-'}
                            </td>
                          ))}

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-center sticky right-0 bg-inherit shadow-xs">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsMemberModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                                title="編輯此隊員"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                                title="刪除此隊員"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRESS MANAGEMENT */}
      {activeTab === 'progress' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsColumnModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>新增/修改進度欄位標題</span>
              </button>

              <button
                onClick={() => handleBatchCheckTask('dateConfirmed')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition border border-slate-700"
              >
                ✓ 全選「活動日期確認」
              </button>

              <button
                onClick={() => handleBatchCheckTask('parkDataSubmitted')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition border border-slate-700"
              >
                ✓ 全員「已繳入園資料」
              </button>
            </div>

            <div className="text-xs text-slate-400">
              提示：點擊核取方塊可直接切換進度狀態
            </div>
          </div>

          {/* Progress Table */}
          <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                    <th className="py-3 px-3 w-16 text-center">角色</th>
                    <th className="py-3 px-3 sticky left-0 bg-slate-950 z-10 w-24">姓名</th>
                    
                    {plan.progressTasks.map(task => (
                      <th key={task.id} className="py-3 px-2 text-center whitespace-nowrap min-w-[85px] group">
                        <div className="flex items-center justify-center gap-1">
                          <span>{task.label}</span>
                        </div>
                      </th>
                    ))}

                    <th className="py-3 px-3 min-w-[120px] text-center">收款狀態與金額</th>
                    <th className="py-3 px-3 min-w-[130px]">每週運動結算備註</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {plan.members.map((member, idx) => {
                    const progress = plan.progressData[member.id];
                    const isLeader = member.role.includes('領隊');

                    return (
                      <tr
                        key={member.id}
                        className={`hover:bg-slate-800/50 transition ${
                          isLeader ? 'bg-emerald-950/20 font-medium' : idx % 2 === 1 ? 'bg-slate-900/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isLeader ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-100 sticky left-0 bg-inherit shadow-xs">
                          <div>{member.name}</div>
                        </td>

                        {/* Interactive Task Checkboxes & Text values */}
                        {plan.progressTasks.map(task => {
                          const val = progress?.tasks[task.key];
                          const isChecked = val === true || val === 'O' || val === 'o' || val === 'V' || val === 'v' || val === '✓';
                          const isText = typeof val === 'string' && !isChecked && val.trim() !== '';

                          return (
                            <td key={task.id} className="py-2.5 px-2 text-center">
                              {isText ? (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleUpdateTaskText(member.id, task.key, e.target.value)}
                                  className="w-20 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-0.5 text-center text-xs text-slate-200 focus:bg-slate-850 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(member.id, task.key)}
                                  className={`w-6 h-6 rounded-md font-bold text-xs transition inline-flex items-center justify-center ${
                                    isChecked
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700 border border-slate-700'
                                  }`}
                                >
                                  {isChecked ? '✓' : ''}
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Payment Status Dropdown & Amount */}
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={progress?.paidStatus || '未付款'}
                            onChange={(e) => handleUpdatePaymentStatus(member.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          >
                            <option value="已結清">已結清</option>
                            <option value="已付訂金">已付訂金</option>
                            <option value="未付款">未付款</option>
                            <option value="退款">已退款</option>
                          </select>
                        </td>

                        {/* Weekly Workout Note */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={typeof progress?.tasks['weeklyWorkout'] === 'string' ? progress?.tasks['weeklyWorkout'] : ''}
                            onChange={(e) => handleUpdateTaskText(member.id, 'weeklyWorkout', e.target.value)}
                            placeholder="例如：每週慢跑20km..."
                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-slate-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHUTTLE MANAGEMENT */}
      {activeTab === 'shuttle' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">交通接駁路線與各站點乘客分配</h3>
              <p className="text-xs text-slate-400">可新增車次線路、調整集合時間與指派乘客</p>
            </div>
            <button
              onClick={() => {
                const newRoute: ShuttleRoute = {
                  id: `route_${Date.now()}`,
                  title: `新車次線路 (${plan.shuttleRoutes.length + 1})`,
                  departureDate: plan.d0Date || 'D0',
                  stops: [
                    { id: `stop_${Date.now()}`, time: '18:00', locationName: '新集合點', passengers: [] }
                  ],
                };
                onUpdatePlan({
                  ...plan,
                  shuttleRoutes: [...plan.shuttleRoutes, newRoute],
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新增接駁車次路線</span>
            </button>
          </div>

          <div className="space-y-6">
            {plan.shuttleRoutes.map((route, rIdx) => (
              <div key={route.id} className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
                
                {/* Route Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={route.title}
                      onChange={(e) => {
                        const updated = [...plan.shuttleRoutes];
                        updated[rIdx].title = e.target.value;
                        onUpdatePlan({ ...plan, shuttleRoutes: updated });
                      }}
                      className="font-bold text-slate-100 text-sm bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-500 w-full max-w-md"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = [...plan.shuttleRoutes];
                        updated[rIdx].stops.push({
                          id: `stop_${Date.now()}`,
                          time: '18:00',
                          locationName: '新站點',
                          passengers: [],
                        });
                        onUpdatePlan({ ...plan, shuttleRoutes: updated });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
                    >
                      ＋ 新增停靠站
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm('確定刪除此整條接駁路線嗎？')) return;
                        const updated = plan.shuttleRoutes.filter((_, i) => i !== rIdx);
                        onUpdatePlan({ ...plan, shuttleRoutes: updated });
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stops Table */}
                <div className="space-y-2">
                  {route.stops.map((stop, sIdx) => (
                    <div key={stop.id || sIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-900/60 rounded-2xl border border-slate-800 items-center text-xs">
                      
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">時間</label>
                        <input
                          type="text"
                          value={stop.time}
                          onChange={(e) => {
                            const updated = [...plan.shuttleRoutes];
                            updated[rIdx].stops[sIdx].time = e.target.value;
                            onUpdatePlan({ ...plan, shuttleRoutes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 font-mono font-bold"
                          placeholder="例如 16:00"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">上車集合地點</label>
                        <input
                          type="text"
                          value={stop.locationName}
                          onChange={(e) => {
                            const updated = [...plan.shuttleRoutes];
                            updated[rIdx].stops[sIdx].locationName = e.target.value;
                            onUpdatePlan({ ...plan, shuttleRoutes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 font-medium"
                          placeholder="例如：台電大樓捷聚站1號出口"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 font-medium mb-0.5">乘車隊員 (以逗號分隔)</label>
                        <input
                          type="text"
                          value={stop.passengers ? stop.passengers.join(', ') : ''}
                          onChange={(e) => {
                            const updated = [...plan.shuttleRoutes];
                            updated[rIdx].stops[sIdx].passengers = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            onUpdatePlan({ ...plan, shuttleRoutes: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 placeholder-slate-500"
                          placeholder="例如：Andy Liu, 王冠群"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          onClick={() => {
                            const updated = [...plan.shuttleRoutes];
                            updated[rIdx].stops.splice(sIdx, 1);
                            onUpdatePlan({ ...plan, shuttleRoutes: updated });
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                          title="刪除此站點"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ITINERARY PLAN */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">登山行程與各日時間節點設定</h3>
              <p className="text-xs text-slate-400">按表操課時間規劃、爬升指標與水源狀況</p>
            </div>
            <button
              onClick={() => {
                const newDay: ItineraryDay = {
                  id: `day_${Date.now()}`,
                  dayLabel: `DAY${plan.itinerary.length}`,
                  title: '新行程路線',
                  estimatedTime: '06:00',
                  milestones: [
                    { time: '07:00', location: '起登點', notes: '準時出發' }
                  ],
                };
                onUpdatePlan({
                  ...plan,
                  itinerary: [...plan.itinerary, newDay],
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新增日程</span>
            </button>
          </div>

          <div className="space-y-6">
            {plan.itinerary.map((day, dIdx) => (
              <div key={day.id} className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
                
                {/* Day Header Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">日程標籤</label>
                    <input
                      type="text"
                      value={day.dayLabel}
                      onChange={(e) => {
                        const updated = [...plan.itinerary];
                        updated[dIdx].dayLabel = e.target.value;
                        onUpdatePlan({ ...plan, itinerary: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">路線名稱與標題</label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => {
                        const updated = [...plan.itinerary];
                        updated[dIdx].title = e.target.value;
                        onUpdatePlan({ ...plan, itinerary: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">預估步行耗時</label>
                    <input
                      type="text"
                      value={day.estimatedTime || ''}
                      onChange={(e) => {
                        const updated = [...plan.itinerary];
                        updated[dIdx].estimatedTime = e.target.value;
                        onUpdatePlan({ ...plan, itinerary: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 placeholder-slate-500"
                      placeholder="例如 06:30"
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">時間節點列表：</span>
                    <button
                      onClick={() => {
                        const updated = [...plan.itinerary];
                        updated[dIdx].milestones.push({ time: '08:00', location: '中途地標', notes: '' });
                        onUpdatePlan({ ...plan, itinerary: updated });
                      }}
                      className="text-xs text-emerald-400 font-bold hover:underline"
                    >
                      ＋ 新增時間點
                    </button>
                  </div>

                  {day.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={m.time}
                          onChange={(e) => {
                            const updated = [...plan.itinerary];
                            updated[dIdx].milestones[mIdx].time = e.target.value;
                            onUpdatePlan({ ...plan, itinerary: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 font-mono font-bold"
                          placeholder="時間"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={m.location}
                          onChange={(e) => {
                            const updated = [...plan.itinerary];
                            updated[dIdx].milestones[mIdx].location = e.target.value;
                            onUpdatePlan({ ...plan, itinerary: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 font-medium"
                          placeholder="地點地標"
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={m.notes || ''}
                          onChange={(e) => {
                            const updated = [...plan.itinerary];
                            updated[dIdx].milestones[mIdx].notes = e.target.value;
                            onUpdatePlan({ ...plan, itinerary: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 placeholder-slate-500"
                          placeholder="備註說明（如拍照、午餐、過溪）"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          onClick={() => {
                            const updated = [...plan.itinerary];
                            updated[dIdx].milestones.splice(mIdx, 1);
                            onUpdatePlan({ ...plan, itinerary: updated });
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Water and camp note */}
                <div className="text-xs">
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">營地與水源補充說明</label>
                  <input
                    type="text"
                    value={day.waterAndCamp || ''}
                    onChange={(e) => {
                      const updated = [...plan.itinerary];
                      updated[dIdx].waterAndCamp = e.target.value;
                      onUpdatePlan({ ...plan, itinerary: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 placeholder-slate-500"
                    placeholder="例如：南湖溪活水充沛；山屋床位分配..."
                  />
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTICES MANAGEMENT */}
      {activeTab === 'notices' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">登山安全規章、用藥守則與退費規定</h3>
              <p className="text-xs text-slate-400">可自訂新增規章章節、修改標題與條款項目</p>
            </div>
            <button
              onClick={() => {
                const newSec: NoticeSection = {
                  id: `sec_${Date.now()}`,
                  title: '新守則章節標題',
                  content: ['第一條規定內容...'],
                };
                onUpdatePlan({
                  ...plan,
                  notices: [...plan.notices, newSec],
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新增規章章節</span>
            </button>
          </div>

          <div className="space-y-4">
            {plan.notices.map((sec, sIdx) => (
              <div key={sec.id} className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...plan.notices];
                      updated[sIdx].title = e.target.value;
                      onUpdatePlan({ ...plan, notices: updated });
                    }}
                    className="font-bold text-slate-100 text-sm bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-rose-500 w-full max-w-md"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = [...plan.notices];
                        updated[sIdx].content.push('');
                        onUpdatePlan({ ...plan, notices: updated });
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
                    >
                      ＋ 新增條款
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm('確定刪除此章節嗎？')) return;
                        const updated = plan.notices.filter((_, i) => i !== sIdx);
                        onUpdatePlan({ ...plan, notices: updated });
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {sec.content.map((c, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2 text-xs">
                      <span className="text-slate-500 font-mono mt-1.5 w-4">{cIdx + 1}.</span>
                      <textarea
                        rows={2}
                        value={c}
                        onChange={(e) => {
                          const updated = [...plan.notices];
                          updated[sIdx].content[cIdx] = e.target.value;
                          onUpdatePlan({ ...plan, notices: updated });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 focus:ring-1 focus:ring-rose-500 text-slate-200 placeholder-slate-500"
                      />
                      <button
                        onClick={() => {
                          const updated = [...plan.notices];
                          updated[sIdx].content.splice(cIdx, 1);
                          onUpdatePlan({ ...plan, notices: updated });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: EQUIPMENT */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center bg-[#131924] p-4 rounded-2xl border border-slate-800 shadow-md">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">裝備清單與行前自主檢查項目</h3>
              <p className="text-xs text-slate-400">可自訂必備/選備項目、分類與規格建議</p>
            </div>
            <button
              onClick={() => {
                const newItem: EquipmentItem = {
                  id: `eq_${Date.now()}`,
                  category: '個人裝備',
                  name: '新裝備物品',
                  required: true,
                  notes: '',
                };
                onUpdatePlan({
                  ...plan,
                  equipmentList: [...plan.equipmentList, newItem],
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新增裝備項目</span>
            </button>
          </div>

          <div className="bg-[#131924] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                  <th className="py-3 px-4 w-36">裝備分類</th>
                  <th className="py-3 px-4">物品名稱</th>
                  <th className="py-3 px-4 w-24 text-center">屬性</th>
                  <th className="py-3 px-4">注意事項與規格要求</th>
                  <th className="py-3 px-4 w-16 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {plan.equipmentList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => {
                          const updated = [...plan.equipmentList];
                          updated[idx].category = e.target.value;
                          onUpdatePlan({ ...plan, equipmentList: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...plan.equipmentList];
                          updated[idx].name = e.target.value;
                          onUpdatePlan({ ...plan, equipmentList: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...plan.equipmentList];
                          updated[idx].required = !updated[idx].required;
                          onUpdatePlan({ ...plan, equipmentList: updated });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition ${
                          item.required
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.required ? '必備' : '選備'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => {
                          const updated = [...plan.equipmentList];
                          updated[idx].notes = e.target.value;
                          onUpdatePlan({ ...plan, equipmentList: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs placeholder-slate-500"
                        placeholder="說明..."
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => {
                          const updated = plan.equipmentList.filter((_, i) => i !== idx);
                          onUpdatePlan({ ...plan, equipmentList: updated });
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SURVEY / 登山經歷調查問卷 */}
      {activeTab === 'survey' && (
        <SurveyView
          plan={plan}
          sheet={currentSheet}
          isAdmin={true}
        />
      )}

      {/* TAB: MUTUAL AID / 互助組分組名冊與通訊 */}
      {activeTab === 'mutualAid' && (
        <MutualAidView
          plan={plan}
          sheet={currentSheet}
          isAdmin={true}
        />
      )}

      {/* TAB 7: GLOBAL HEADERS & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#131924] rounded-3xl p-6 border border-slate-800 shadow-md space-y-5 text-slate-100">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>全域主標題與活動參數設定 (不要寫死，全數可改)</span>
            </h3>

            {/* Custom Section Titles */}
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-300">📌 總表各區塊主標題名稱自訂：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {Object.entries(plan.customHeaders).map(([key, title]) => (
                  <div key={key} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      {key === 'overviewTitle' && '活動概覽區塊'}
                      {key === 'progressTitle' && '團務進度總表區塊'}
                      {key === 'piiTitle' && '隊員名冊與個資區塊'}
                      {key === 'shuttleTitle' && '交通接駁區塊'}
                      {key === 'itineraryTitle' && '每日行程區塊'}
                      {key === 'equipmentTitle' && '裝備檢查區塊'}
                      {key === 'noticesTitle' && '行程守則須知區塊'}
                      {key === 'surveyTitle' && '問卷調查區塊'}
                      {key === 'safetyPlanTitle' && '安全撤退計畫區塊'}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        onUpdatePlan({
                          ...plan,
                          customHeaders: {
                            ...plan.customHeaders,
                            [key]: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* General Meta Inputs */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="font-bold text-xs text-slate-300">🏔️ 活動基本參數設定：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">活動完整名稱</label>
                  <input
                    type="text"
                    value={plan.title}
                    onChange={(e) => onUpdatePlan({ ...plan, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">活動日期與天數說明</label>
                  <input
                    type="text"
                    value={plan.dates}
                    onChange={(e) => onUpdatePlan({ ...plan, dates: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">攀登山岳 (山名/海拔)</label>
                  <input
                    type="text"
                    value={plan.mountain}
                    onChange={(e) => onUpdatePlan({ ...plan, mountain: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">起登與下山地點</label>
                  <input
                    type="text"
                    value={plan.trailhead}
                    onChange={(e) => onUpdatePlan({ ...plan, trailhead: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">無線電對講機頻率</label>
                  <input
                    type="text"
                    value={plan.radioFrequency}
                    onChange={(e) => onUpdatePlan({ ...plan, radioFrequency: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">衛星通訊設備</label>
                  <input
                    type="text"
                    value={plan.satelliteDevice}
                    onChange={(e) => onUpdatePlan({ ...plan, satelliteDevice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Member Edit Modal */}
      <MemberEditModal
        member={editingMember}
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        customColumns={plan.customColumns}
      />

      {/* Column Manager Modal */}
      <ColumnManagerModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        tasks={plan.progressTasks}
        onUpdateTasks={(updated) => onUpdatePlan({ ...plan, progressTasks: updated })}
        customColumns={plan.customColumns}
        onUpdateCustomColumns={(updatedCols) => onUpdatePlan({ ...plan, customColumns: updatedCols })}
      />

    </div>
  );
};
