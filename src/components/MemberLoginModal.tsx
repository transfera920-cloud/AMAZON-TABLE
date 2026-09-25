import React, { useState } from 'react';
import { User, Mail, Phone, Search, CheckCircle2, ShieldCheck, ArrowRight, X, AlertCircle, Mountain, Calendar, Users, LogOut } from 'lucide-react';
import { TripSummary, MemberIdentity } from '../types';
import { apiPath } from '../utils/apiBase';

interface MemberLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: MemberIdentity | null;
  onLoginMember: (identity: MemberIdentity, trips: TripSummary[], autoSelectTripId?: string) => void;
  onLogoutMember: () => void;
  onSelectTrip: (tripId: string) => void;
  currentTripId: string;
}

export const MemberLoginModal: React.FC<MemberLoginModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  onLoginMember,
  onLogoutMember,
  onSelectTrip,
  currentTripId,
}) => {
  const [keyword, setKeyword] = useState(currentMember?.email || currentMember?.phone || currentMember?.name || '');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foundTrips, setFoundTrips] = useState<TripSummary[] | null>(null);
  const [detectedMember, setDetectedMember] = useState<MemberIdentity | null>(currentMember);

  if (!isOpen) return null;

  // Query trips for a given identity
  const executeQuery = async (queryVal: string) => {
    const clean = queryVal.trim();
    if (!clean) {
      setErrorMessage('請輸入您的姓名、Email 或手機號碼');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setFoundTrips(null);

    try {
      const isEmail = clean.includes('@');
      const isPhone = /^[\d-]+$/.test(clean);

      const params = new URLSearchParams();
      if (isEmail) {
        params.append('email', clean);
      } else if (isPhone) {
        params.append('phone', clean);
      } else {
        params.append('name', clean);
      }

      const res = await fetch(apiPath(`/api/trips?${params.toString()}`));
      const data = await res.json();

      if (data.success && Array.isArray(data.trips)) {
        if (data.trips.length === 0) {
          setErrorMessage(`查無【${clean}】參與之團務。請確認姓名、Email 或電話是否與報名表完全一致。`);
          setFoundTrips([]);
        } else {
          setFoundTrips(data.trips);
          const identity: MemberIdentity = {
            name: clean,
            email: isEmail ? clean : undefined,
            phone: isPhone ? clean : undefined,
          };
          setDetectedMember(identity);
          onLoginMember(identity, data.trips);
        }
      } else {
        setErrorMessage(data.error || '查詢失敗，請稍後再試。');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('連線至伺服器失敗，請檢查網路連線。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickTestSelect = (name: string, email: string, phone: string) => {
    setKeyword(name);
    executeQuery(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] rounded-3xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">隊員登入 • 自動辨識我的團務</h3>
              <p className="text-xs text-slate-400">依身份自動篩選並僅載入您參加的登山團務</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Quick Preset Test Buttons for Easy Verification */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">快速驗證身分（點擊立即切換測試）：</span>
              <span className="text-[10px] text-emerald-400 font-medium">支援姓名/Email/電話</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickTestSelect('王小明', 'wang@example.com', '0910-111222')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/60 text-slate-200 border border-slate-700 rounded-xl transition text-left active:scale-95"
              >
                <div className="font-bold text-emerald-300">王小明</div>
                <div className="text-[10px] text-slate-400 mt-0.5">參加全部 3 團</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTestSelect('林小華', 'lin@example.com', '0920-222333')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/60 text-slate-200 border border-slate-700 rounded-xl transition text-left active:scale-95"
              >
                <div className="font-bold text-sky-300">林小華</div>
                <div className="text-[10px] text-slate-400 mt-0.5">僅參加馬博縱走</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTestSelect('陳大山', 'chen@example.com', '0930-333444')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/60 text-slate-200 border border-slate-700 rounded-xl transition text-left active:scale-95"
              >
                <div className="font-bold text-amber-300">陳大山</div>
                <div className="text-[10px] text-slate-400 mt-0.5">僅參加中央尖山</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTestSelect('張小美', 'chang@example.com', '0950-555666')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500/60 text-slate-200 border border-slate-700 rounded-xl transition text-left active:scale-95"
              >
                <div className="font-bold text-pink-300">張小美</div>
                <div className="text-[10px] text-slate-400 mt-0.5">僅參加奇萊東稜</div>
              </button>
            </div>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeQuery(keyword);
            }}
            className="space-y-2"
          >
            <label className="block text-slate-300 font-bold">
              輸入姓名、Email 或手機號碼：
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="例如：王小明 或 wang@example.com 或 0910-111222"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>查詢團務</span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Current Logged-In Badge */}
          {currentMember && (
            <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-emerald-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>目前已辨識身分：<strong className="text-white font-bold">{currentMember.name}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogoutMember();
                  setDetectedMember(null);
                  setFoundTrips(null);
                  setKeyword('');
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] transition"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>清除登入</span>
              </button>
            </div>
          )}

          {/* List of Found Trips */}
          {foundTrips && foundTrips.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-emerald-400" />
                  <span>我的團務清單 (共 {foundTrips.length} 團)</span>
                </span>
                <span className="text-[11px] text-slate-400">點擊即可載入該團進度表</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {foundTrips.map((trip) => {
                  const isCurrent = trip.tripId === currentTripId;
                  return (
                    <div
                      key={trip.tripId}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                            {trip.tripId}
                          </span>
                          <h4 className="font-bold text-sm text-slate-100 truncate">
                            {trip.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              目前正在查看
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-[11px] pt-0.5">
                          {trip.dates && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-emerald-400" />
                              <span>{trip.dates}</span>
                            </span>
                          )}
                          {trip.mountain && (
                            <span className="flex items-center gap-1">
                              <Mountain className="w-3 h-3 text-slate-400" />
                              <span>{trip.mountain}</span>
                            </span>
                          )}
                          {trip.memberCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>隊員 {trip.memberCount} 人</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTrip(trip.tripId);
                          onClose();
                        }}
                        className={`px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                      >
                        <span>{isCurrent ? '已載入此團' : '查看此團務'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            僅本人有登記之團務進度表方可載入，個資全面受到隔離保護。
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium transition"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
};
