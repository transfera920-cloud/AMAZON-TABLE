import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Edit3, 
  UploadCloud, 
  Download, 
  RotateCcw, 
  Copy, 
  Check, 
  Layers, 
  Mountain,
  Lock,
  Unlock,
  Printer,
  LogOut,
  Share2,
  Cloud,
  CloudCheck,
  ChevronDown,
  User,
  Plus
} from 'lucide-react';
import { ExpeditionPlan, TripSummary, MemberIdentity } from '../types';
import { exportExpeditionToExcel } from '../utils/excelParser';

interface HeaderProps {
  plan: ExpeditionPlan;
  trips: TripSummary[];
  currentMember: MemberIdentity | null;
  isAdminMode: boolean;
  isAdminAuthenticated: boolean;
  isCloudSynced?: boolean;
  onToggleMode: (isAdmin: boolean) => void;
  onRequestAdminLogin: () => void;
  onAdminLogout: () => void;
  onOpenUploadModal: () => void;
  onResetToSample: () => void;
  onUpdatePlanTitle: (title: string, subtitle: string) => void;
  onCopyShareLink?: () => void;
  onOpenTripSelector: () => void;
  onOpenMemberModal: () => void;
  onOpenCreateTripModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  plan,
  trips,
  currentMember,
  isAdminMode,
  isAdminAuthenticated,
  isCloudSynced = true,
  onToggleMode,
  onRequestAdminLogin,
  onAdminLogout,
  onOpenUploadModal,
  onResetToSample,
  onUpdatePlanTitle,
  onCopyShareLink,
  onOpenTripSelector,
  onOpenMemberModal,
  onOpenCreateTripModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(plan.title);
  const [tempSubtitle, setTempSubtitle] = useState(plan.subtitle || '');
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [copiedLinkStatus, setCopiedLinkStatus] = useState(false);

  const handleSaveTitle = () => {
    onUpdatePlanTitle(tempTitle, tempSubtitle);
    setIsEditingTitle(false);
  };

  const handleCopyParkEntryFormat = () => {
    // Generate standard national park entry format text
    const text = plan.members.map((m, idx) => {
      return `${idx + 1}\t${m.role}\t${m.name}\t${m.gender}\t${m.idNumber}\t${m.birthDate}\t${m.phone}\t${m.emergencyContact}\t${m.emergencyPhone}\t${m.email}`;
    }).join('\n');

    const fullCopy = `【${plan.title}】 入園與保險申請名冊\n序號\t角色\t姓名\t性別\t身分證字號\t出生年月日\t電話\t緊急聯絡人\t緊急聯絡人電話\tEmail\n${text}`;
    navigator.clipboard.writeText(fullCopy);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (onCopyShareLink) {
      onCopyShareLink();
    } else {
      const url = window.location.origin + window.location.pathname;
      navigator.clipboard.writeText(url);
    }
    setCopiedLinkStatus(true);
    setTimeout(() => setCopiedLinkStatus(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackendClick = () => {
    if (!isAdminAuthenticated) {
      onRequestAdminLogin();
    } else {
      onToggleMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Title & Expedition Meta with Trip Switcher */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl text-white shadow-inner shrink-0">
              <Mountain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            <div className="min-w-0 flex-1">
              {isEditingTitle && isAdminMode ? (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="bg-slate-800 border border-emerald-500 rounded px-2.5 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="活動標題"
                  />
                  <input
                    type="text"
                    value={tempSubtitle}
                    onChange={(e) => setTempSubtitle(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="副標題/日期說明"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleSaveTitle}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded text-white transition"
                    >
                      儲存
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded text-slate-300 transition"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Trip Switcher Button */}
                    <button
                      type="button"
                      onClick={onOpenTripSelector}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 hover:border-emerald-500/60 transition text-xs font-bold shadow-xs active:scale-95"
                      title="點擊切換不同登山團務"
                    >
                      <span className="font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 text-[10px]">
                        {plan.tripId || plan.id || 'TRIP-001'}
                      </span>
                      <span className="truncate max-w-[160px] sm:max-w-[200px] text-slate-100">
                        {plan.title}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isAdminMode && (
                      <button
                        onClick={() => {
                          setTempTitle(plan.title);
                          setTempSubtitle(plan.subtitle || '');
                          setIsEditingTitle(true);
                        }}
                        title="點擊修改總表標題"
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    {plan.dates && <span className="text-emerald-400 font-medium">{plan.dates}</span>}
                    {plan.dates && plan.mountain && <span className="hidden sm:inline">•</span>}
                    {plan.mountain && <span>{plan.mountain}</span>}
                    {(plan.dates || plan.mountain) && plan.members.length > 0 && <span className="hidden sm:inline">•</span>}
                    {plan.members.length > 0 && <span>隊員: {plan.members.length} 人</span>}
                    {isAdminAuthenticated && (
                      <span className="text-[10px] bg-rose-900/60 text-rose-300 px-1.5 py-0.2 rounded border border-rose-700/50">
                        幹部管理員已登入
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Member Identity / My Trips Button */}
            <button
              type="button"
              onClick={onOpenMemberModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                currentMember
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/70 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="隊員登入辨識身分與查看我的團務"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentMember ? `隊員：${currentMember.name}` : '隊員登入 / 我的團務'}</span>
            </button>
            
            {/* Front-End / Back-End Switcher */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 shadow-inner">
              <button
                id="btn-switch-frontend"
                onClick={() => onToggleMode(false)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isAdminMode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>前台 (團員公開)</span>
                <span className="text-[10px] px-1 py-0.2 bg-emerald-700/60 rounded text-emerald-100 hidden sm:inline">個資已遮蔽</span>
              </button>
              
              <button
                id="btn-switch-backend"
                onClick={handleBackendClick}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isAdminMode
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAdminAuthenticated && isAdminMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>後台 (幹部編輯)</span>
                <span className="text-[10px] px-1 py-0.2 bg-amber-700/60 rounded text-amber-100 hidden sm:inline">全欄位可改</span>
              </button>
            </div>

            {/* Logout button for Admin */}
            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={onAdminLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition"
                title="登出幹部後台並鎖定權限"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>登出後台</span>
              </button>
            )}

            {/* Upload Excel Button (Only in Backend/Admin Mode) */}
            {isAdminMode && (
              <button
                id="btn-upload-excel"
                onClick={onOpenUploadModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-medium transition active:scale-95"
                title="載入 Excel 或多個 CSV 檔案"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>載入 Excel/CSV</span>
              </button>
            )}

            {/* Copy Shareable URL Button */}
            <button
              id="btn-copy-share-url"
              onClick={handleCopyShareLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 border ${
                copiedLinkStatus
                  ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
              }`}
              title="複製總表連結，可在其他瀏覽器、手機或傳至 LINE 群組瀏覽"
            >
              {copiedLinkStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedLinkStatus ? '已複製分享連結' : '複製分享連結'}</span>
            </button>

            {/* Export Excel Button */}
            <div className="relative group">
              <button
                id="btn-export-excel"
                onClick={() => exportExpeditionToExcel(plan, isAdminMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm active:scale-95"
                title="下載多工作表 Excel 總表"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出 Excel</span>
              </button>
            </div>

            {/* Quick Copy Park Format for Admin */}
            {isAdminMode && (
              <button
                onClick={handleCopyParkEntryFormat}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition"
                title="複製入園申請/投保名冊格式"
              >
                {copiedStatus ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStatus ? '已複製入園名冊' : '複製入園名冊'}</span>
              </button>
            )}

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition"
              title="列印或另存 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Reset to Sample Button */}
            <button
              onClick={onResetToSample}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-lg text-xs transition"
              title="重設所有團務為標準三團測試範例 (馬博、中央尖、奇萊東稜)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};


