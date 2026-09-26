import React, { useState } from 'react';
import { Mountain, User, Edit3, Check, X } from 'lucide-react';
import { ExpeditionPlan, MemberIdentity } from '../types';

interface HeaderProps {
  plan: ExpeditionPlan;
  currentMember: MemberIdentity | null;
  isAdminMode: boolean;
  onOpenTripSelector?: () => void;
  onOpenMemberModal: () => void;
  onUpdatePlanTitle?: (title: string, subtitle?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  plan,
  currentMember,
  isAdminMode,
  onOpenMemberModal,
  onUpdatePlanTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(plan.title || '');
  const [editedSubtitle, setEditedSubtitle] = useState(plan.subtitle || plan.dates || '');

  const memberCount = plan.members?.length || 0;
  const subtitleText = plan.subtitle || plan.dates || plan.title || '團務進度總表';

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(plan.title || '');
    setEditedSubtitle(plan.subtitle || plan.dates || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePlanTitle && (editedSubtitle.trim() || editedTitle.trim())) {
      onUpdatePlanTitle(editedTitle.trim() || plan.title, editedSubtitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle(plan.title || '');
    setEditedSubtitle(plan.subtitle || plan.dates || '');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d131f]/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Brand Hyperlink */}
          <div className="flex items-center justify-between w-full md:w-auto shrink-0">
            <a
              href="https://amazon-hike.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 sm:gap-3 group transition py-0.5 shrink-0"
              title="前往 亞馬遜國家山岳協會 (https://amazon-hike.com/)"
            >
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl text-white shadow-md group-hover:scale-105 group-hover:shadow-emerald-500/25 transition-all shrink-0">
                <Mountain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-base sm:text-lg font-bold text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                亞馬遜國家山岳協會
              </span>
            </a>

            {/* Mobile Only: Member Login Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={onOpenMemberModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${
                  currentMember
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[100px] truncate">{currentMember ? currentMember.name : '隊員登入'}</span>
              </button>
            </div>
          </div>

          {/* Center (TITLE 正中間): 紅框內容拿掉，留下該行文字並自動排版 */}
          <div className="flex items-center justify-center text-center w-full md:max-w-2xl px-2">
            {isEditingTitle && isAdminMode ? (
              /* 後台編輯模式：直接修改此行說明文字 */
              <form onSubmit={handleSaveTitle} className="w-full max-w-lg bg-slate-900/95 border border-amber-500/60 rounded-2xl p-2.5 shadow-xl space-y-2">
                <div className="text-left text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>編輯頁首團務說明與日期</span>
                </div>
                <input
                  type="text"
                  value={editedSubtitle}
                  onChange={(e) => setEditedSubtitle(e.target.value)}
                  placeholder="請輸入日期與行程說明 (例如: 10/8(四)-10/11(日) 中央尖山 四日，D0 10/7(三) 團務進度總表)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-white focus:outline-hidden focus:border-amber-400"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>取消</span>
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>儲存變更</span>
                  </button>
                </div>
              </form>
            ) : (
              /* 標準排版：自動適應螢幕寬度、字體層次排版 */
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-center py-0.5 max-w-full">
                {/* 行程名稱與日期自動排版 */}
                <h1 className="text-sm sm:text-base md:text-[17px] font-bold text-slate-100 tracking-normal sm:tracking-wide leading-snug break-words">
                  {subtitleText}
                </h1>

                {/* 分隔點 */}
                <span className="text-slate-500 text-xs sm:text-sm font-normal select-none" aria-hidden="true">
                  •
                </span>

                {/* 隊員人數膠囊排版 */}
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>隊員: {memberCount} 人</span>
                </span>

                {/* 後台管理員專用編輯按鈕 */}
                {isAdminMode && onUpdatePlanTitle && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition text-xs shrink-0 cursor-pointer ml-0.5"
                    title="後台功能：編輯此行團務說明文字"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Desktop Member Login & My Trips */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              id="btn-member-login"
              type="button"
              onClick={onOpenMemberModal}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs active:scale-95 cursor-pointer ${
                currentMember
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70 hover:bg-emerald-900/60'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title="隊員登入辨識身分與查看我的團務"
            >
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentMember ? `隊員：${currentMember.name}` : '隊員登入 / 我的團務'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
