import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initialExpeditionData } from './data/defaultExpedition';
import { ExpeditionPlan, TripSummary, MemberIdentity } from './types';
import { Header } from './components/Header';
import { FrontendView } from './components/FrontendView';
import { BackendView } from './components/BackendView';
import { FileUploadModal } from './components/FileUploadModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TripSelectorModal } from './components/TripSelectorModal';
import { MemberLoginModal } from './components/MemberLoginModal';
import { CreateTripModal } from './components/CreateTripModal';
import { apiPath } from './utils/apiBase';
import { 
  ShieldCheck, 
  Mountain, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Unlock, 
  LogOut, 
  Cloud, 
  Share2, 
  UploadCloud, 
  ShieldAlert, 
  AlertTriangle,
  Users,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function App() {
  // Read initial trip ID from URL or sessionStorage
  const getInitialTripId = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('tripId') || urlParams.get('id');
    if (paramId) return paramId;

    const savedId = sessionStorage.getItem('expedition_current_trip_id');
    if (savedId) return savedId;

    return 'TRIP-001';
  };

  const [currentTripId, setCurrentTripId] = useState<string>(getInitialTripId);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  
  // Current plan for the active trip
  const [plan, setPlan] = useState<ExpeditionPlan>(() => {
    const saved = localStorage.getItem(`mountaineering_plan_${currentTripId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached plan', e);
      }
    }
    return {
      ...initialExpeditionData,
      tripId: currentTripId,
      id: currentTripId,
    };
  });

  // Authentication & Identity
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('expedition_admin_auth') === 'true';
  });

  const [currentMember, setCurrentMember] = useState<MemberIdentity | null>(() => {
    const saved = sessionStorage.getItem('expedition_member_identity');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved member identity', e);
      }
    }
    return null;
  });

  // UI state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isTripSelectorOpen, setIsTripSelectorOpen] = useState<boolean>(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [isLoadingTrip, setIsLoadingTrip] = useState<boolean>(false);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to construct auth headers
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (isAdminAuthenticated) {
      headers['x-admin-auth'] = 'true';
    }
    if (currentMember) {
      if (currentMember.email) headers['x-member-email'] = encodeURIComponent(currentMember.email);
      if (currentMember.phone) headers['x-member-phone'] = encodeURIComponent(currentMember.phone);
      if (currentMember.name) headers['x-member-name'] = encodeURIComponent(currentMember.name);
      if (currentMember.memberId) headers['x-member-id'] = encodeURIComponent(currentMember.memberId);
    }
    return headers;
  }, [isAdminAuthenticated, currentMember]);

  // 1. Fetch available trips list
  const fetchTripsList = useCallback(async () => {
    try {
      const res = await fetch(apiPath('/api/trips'), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.trips)) {
          setTrips(data.trips);
        }
      }
    } catch (e) {
      console.error('Failed to fetch trips list:', e);
    }
  }, [getAuthHeaders]);

  // 2. Load a specific trip from backend
  const loadTripData = useCallback(async (tripIdToLoad: string) => {
    setIsLoadingTrip(true);
    setAccessDeniedError(null);

    try {
      const res = await fetch(apiPath(`/api/trips/${tripIdToLoad}`), {
        headers: getAuthHeaders(),
      });

      if (res.status === 403) {
        const errData = await res.json();
        setAccessDeniedError(errData.error || '您沒有權限查看此團務進度表。');
        setIsLoadingTrip(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.trip) {
          setPlan(data.trip);
          setCurrentTripId(tripIdToLoad);
          sessionStorage.setItem('expedition_current_trip_id', tripIdToLoad);
          localStorage.setItem(`mountaineering_plan_${tripIdToLoad}`, JSON.stringify(data.trip));
          setIsCloudSynced(true);

          // Update browser URL query param without full reload
          const url = new URL(window.location.href);
          url.searchParams.set('tripId', tripIdToLoad);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        // Fallback to /api/plan
        const fallbackRes = await fetch(apiPath(`/api/plan?id=${tripIdToLoad}`));
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (data.success && data.plan) {
            setPlan(data.plan);
            setCurrentTripId(tripIdToLoad);
            sessionStorage.setItem('expedition_current_trip_id', tripIdToLoad);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to load trip ${tripIdToLoad}:`, e);
    } finally {
      setIsLoadingTrip(false);
    }
  }, [getAuthHeaders]);

  // Initial load
  useEffect(() => {
    fetchTripsList();
    loadTripData(currentTripId);
  }, []);

  // When auth or member identity changes, refresh trips list and reload current trip
  useEffect(() => {
    fetchTripsList();
  }, [isAdminAuthenticated, currentMember, fetchTripsList]);

  // Helper to save current trip to backend
  const saveTripToServer = async (planToSave: ExpeditionPlan, customMsg?: string) => {
    try {
      setIsCloudSynced(false);
      const targetId = planToSave.tripId || planToSave.id || currentTripId;
      const res = await fetch(apiPath(`/api/trips/${targetId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ trip: planToSave }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCloudSynced(true);
        fetchTripsList();
        if (customMsg) {
          showToast(customMsg);
        }
      } else {
        // Fallback for legacy
        const legacyRes = await fetch(apiPath('/api/plan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planToSave, planId: targetId }),
        });
        if (legacyRes.ok) {
          setIsCloudSynced(true);
        }
      }
    } catch (e) {
      console.error('Failed to sync trip to server:', e);
      setIsCloudSynced(false);
    }
  };

  // Persist plan changes to local cache and debounce server save
  useEffect(() => {
    localStorage.setItem(`mountaineering_plan_${currentTripId}`, JSON.stringify(plan));

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (isAdminAuthenticated || isAdminMode) {
        saveTripToServer(plan);
      }
    }, 600);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [plan, currentTripId, isAdminAuthenticated, isAdminMode]);

  const handleUpdatePlan = (newPlan: ExpeditionPlan) => {
    setPlan(newPlan);
    saveTripToServer(newPlan, '已即時儲存此團務資料（各團完全獨立）');
  };

  // Switching Trips
  const handleSelectTrip = (tripId: string) => {
    loadTripData(tripId);
    showToast(`已切換至團務：${tripId}`);
  };

  // Creating a new Trip
  const handleCreateTrip = async (newPlan: ExpeditionPlan) => {
    try {
      const res = await fetch(apiPath('/api/trips'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ trip: newPlan }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '全新團務建立成功！');
        await fetchTripsList();
        const createdId = data.tripId || newPlan.tripId;
        await loadTripData(createdId);
      } else {
        showToast(`建立失敗: ${data.error || '請確認是否具備管理者權限'}`);
      }
    } catch (e) {
      console.error('Create trip error:', e);
      showToast('建立失敗，請稍後再試');
    }
  };

  // Deleting a Trip
  const handleDeleteTrip = async (tripIdToDelete: string) => {
    try {
      const res = await fetch(apiPath(`/api/trips/${tripIdToDelete}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`團務 ${tripIdToDelete} 已刪除`);
        await fetchTripsList();
        // If current was deleted, switch to another
        if (currentTripId === tripIdToDelete) {
          const remaining = trips.filter(t => t.tripId !== tripIdToDelete);
          if (remaining.length > 0) {
            loadTripData(remaining[0].tripId);
          }
        }
      } else {
        showToast(`刪除失敗: ${data.error}`);
      }
    } catch (e) {
      console.error('Delete trip error:', e);
      showToast('刪除失敗，請檢查權限');
    }
  };

  // Reset to default sample trips
  const handleResetToSample = async () => {
    if (window.confirm('確定要將系統重設為「馬博橫斷、中央尖山、奇萊東稜」標準三團範例資料嗎？')) {
      try {
        await fetch(apiPath('/api/trips/reset'), {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      } catch (e) {
        console.error('Failed to reset on server', e);
      }
      showToast('已重設為標準三團測試範例');
      await fetchTripsList();
      loadTripData('TRIP-001');
    }
  };

  const handleUpdatePlanTitle = (title: string, subtitle: string) => {
    const updated = {
      ...plan,
      title,
      subtitle,
    };
    setPlan(updated);
    saveTripToServer(updated, '已更新團務標題並即時儲存');
  };

  // Admin Auth Handlers
  const handleRequestAdminLogin = () => {
    if (isAdminAuthenticated) {
      setIsAdminMode(true);
      showToast('已進入【幹部管理後台】(可全權編輯與管理所有團務)');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminMode(true);
    sessionStorage.setItem('expedition_admin_auth', 'true');
    showToast('幹部身份驗證成功，已開啟全功能管理後台！');
    fetchTripsList();
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('expedition_admin_auth');
    setIsAdminAuthenticated(false);
    setIsAdminMode(false);
    showToast('已安全登出幹部後台，回到公開前台模式');
    fetchTripsList();
  };

  // Member Identity Handlers
  const handleMemberLogin = (identity: MemberIdentity, memberTrips: TripSummary[], autoSelectTripId?: string) => {
    setCurrentMember(identity);
    sessionStorage.setItem('expedition_member_identity', JSON.stringify(identity));
    setTrips(memberTrips);
    showToast(`歡迎回來，${identity.name}！已依您的身分列出所有參與之團務。`);

    // If current trip is not in member's trips, switch to their first available trip
    const hasCurrent = memberTrips.some(t => t.tripId === currentTripId);
    if (!hasCurrent && memberTrips.length > 0) {
      const target = autoSelectTripId || memberTrips[0].tripId;
      loadTripData(target);
    }
  };

  const handleMemberLogout = () => {
    setCurrentMember(null);
    sessionStorage.removeItem('expedition_member_identity');
    showToast('已清除隊員登入身分');
    fetchTripsList();
  };

  const handleToggleMode = (targetAdmin: boolean) => {
    if (targetAdmin) {
      if (!isAdminAuthenticated) {
        setIsLoginModalOpen(true);
      } else {
        setIsAdminMode(true);
        showToast('已切換至【幹部管理後台】');
      }
    } else {
      setIsAdminMode(false);
      showToast('已切換至【前台團員檢視】(個資保護中)');
    }
  };

  const handleCopyShareLink = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('tripId', currentTripId);
    navigator.clipboard.writeText(url.toString());
    showToast(`已複製【${plan.title}】的專屬連結！傳送至 LINE 開啟即可直接查閱此團。`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white w-full max-w-full overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <Header
        plan={plan}
        trips={trips}
        currentMember={currentMember}
        isAdminMode={isAdminMode}
        isAdminAuthenticated={isAdminAuthenticated}
        isCloudSynced={isCloudSynced}
        onToggleMode={handleToggleMode}
        onRequestAdminLogin={handleRequestAdminLogin}
        onAdminLogout={handleAdminLogout}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onResetToSample={handleResetToSample}
        onUpdatePlanTitle={handleUpdatePlanTitle}
        onCopyShareLink={handleCopyShareLink}
        onOpenTripSelector={() => setIsTripSelectorOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        onOpenCreateTripModal={() => setIsCreateTripModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Dynamic Mode & Trip Switcher Visual Indicator */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#131924] rounded-2xl sm:rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl shrink-0 ${isAdminMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {isAdminMode ? <Sparkles className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-slate-100">
                  {isAdminMode ? '幹部全權管理後台' : '前台公開檢視模式'}
                </span>

                {/* Current Trip Pill */}
                <button
                  type="button"
                  onClick={() => setIsTripSelectorOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:border-emerald-400 transition"
                  title="點擊切換團務"
                >
                  <span>團務: {plan.tripId || plan.id || currentTripId}</span>
                  <span className="text-slate-400 font-sans font-normal truncate max-w-[140px] sm:max-w-[200px]">
                    {plan.title}
                  </span>
                </button>

                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAdminMode
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isAdminMode ? '全欄位可自訂 • 各團完全獨立' : '隊員友善排版 • 敏感個資已遮蔽'}
                </span>

                {isAdminAuthenticated && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/40">
                    幹部已驗證
                  </span>
                )}

                {currentMember && (
                  <span className="text-[10px] bg-sky-950/80 text-sky-300 font-semibold px-2.5 py-0.5 rounded-full border border-sky-700/60">
                    已辨識隊員: {currentMember.name}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1">
                {isAdminMode
                  ? '多團務架構運行中：修改與匯入僅針對當前選擇之團務，絕不會覆蓋其他縱走或登山隊伍資料。'
                  : '系統依據您的身分自動識別顯示該員所屬的團務進度，點擊「隊員登入 / 我的團務」可切換查看您報名的其他行程。'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Quick Trip Switcher Button */}
            <button
              onClick={() => setIsTripSelectorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition active:scale-95 shrink-0"
              title="切換不同團務"
            >
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              <span>切換團務 ({trips.length})</span>
            </button>

            {isAdminMode && (
              <button
                onClick={() => setIsCreateTripModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition active:scale-95 shrink-0"
                title="建立全新獨立團務"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增團務</span>
              </button>
            )}

            {isAdminMode && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition active:scale-95 shrink-0"
                title="載入 Excel 或多個 CSV 檔案"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>載入 Excel/CSV</span>
              </button>
            )}

            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition shrink-0"
              title="複製此團務網址分享給隊員"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>複製本團連結</span>
            </button>

            <button
              onClick={() => handleToggleMode(!isAdminMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                isAdminMode
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
                  : 'bg-amber-600 text-white hover:bg-amber-500 shadow-sm'
              }`}
            >
              <span>{isAdminMode ? '返回前台' : '幹部後台'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Access Denied Card (Role-Based Access Control) */}
        {accessDeniedError ? (
          <div className="bg-[#131924] border border-rose-800/80 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100">存取受限 • 無此團務權限</h3>
              <p className="text-xs text-rose-300 leading-relaxed">
                {accessDeniedError}
              </p>
            </div>
            <p className="text-xs text-slate-400">
              各登山團務之名冊與個資皆受到獨立權限隔離。隊員僅可查閱本人報名之團務；管理員登入後可查閱所有團務。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                查看我的所有團務
              </button>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                幹部管理員登入
              </button>
            </div>
          </div>
        ) : (
          /* Normal View Mode Switching */
          isAdminMode ? (
            <BackendView
              plan={plan}
              onUpdatePlan={handleUpdatePlan}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          ) : (
            <FrontendView
              plan={plan}
            />
          )
        )}

      </main>

      {/* Admin Login Modal (yy661003 / yy661003) */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Member Identity & My Trips Modal */}
      <MemberLoginModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        currentMember={currentMember}
        currentTripId={currentTripId}
        onLoginMember={handleMemberLogin}
        onLogoutMember={handleMemberLogout}
        onSelectTrip={handleSelectTrip}
      />

      {/* Trip Selector & Manager Modal */}
      <TripSelectorModal
        isOpen={isTripSelectorOpen}
        onClose={() => setIsTripSelectorOpen(false)}
        trips={trips}
        currentTripId={currentTripId}
        isAdmin={isAdminAuthenticated}
        onSelectTrip={handleSelectTrip}
        onOpenCreateModal={() => setIsCreateTripModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onDeleteTrip={handleDeleteTrip}
      />

      {/* Create New Trip Modal (Admin) */}
      <CreateTripModal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        nextTripNumber={trips.length + 1}
        onCreateTrip={handleCreateTrip}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentPlan={plan}
        trips={trips}
        onApplyPlan={async (newPlan, isNewTrip) => {
          if (isNewTrip) {
            await handleCreateTrip(newPlan);
          } else {
            handleUpdatePlan(newPlan);
            showToast('已成功將 Excel 總表資料匯入並儲存至此團務！');
          }
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Mountain className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">登山團務總表生成與管理系統</span>
            <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              多團務獨立架構
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            支援同系統多團務並存 • 團員身分自動辨識 • 權限隔離控制 • Excel 各團獨立匯入 • 伺服器即時同步
          </div>
        </div>
      </footer>
    </div>
  );
}
