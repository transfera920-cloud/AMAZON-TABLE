import React, { useState } from 'react';
import { Mountain, Plus, X, Calendar, Users, ArrowRight, Trash2, ShieldCheck, CheckCircle2, Sparkles, UploadCloud, Search } from 'lucide-react';
import { TripSummary } from '../types';

interface TripSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: TripSummary[];
  currentTripId: string;
  isAdmin: boolean;
  onSelectTrip: (tripId: string) => void;
  onOpenCreateModal: () => void;
  onOpenUploadModal: () => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripSelectorModal: React.FC<TripSelectorModalProps> = ({
  isOpen,
  onClose,
  trips,
  currentTripId,
  isAdmin,
  onSelectTrip,
  onOpenCreateModal,
  onOpenUploadModal,
  onDeleteTrip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTrips = trips.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (t.tripId && t.tripId.toLowerCase().includes(q)) ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.mountain && t.mountain.toLowerCase().includes(q)) ||
      (t.dates && t.dates.toLowerCase().includes(q))
    );
  });

  const handleDelete = (e: React.MouseEvent, trip: TripSummary) => {
    e.stopPropagation();
    if (window.confirm(`確定要刪除團務【${trip.title}】(${trip.tripId}) 嗎？此操作無法復原。`)) {
      onDeleteTrip(trip.tripId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl text-white shadow-xs">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isAdmin ? '登山團務管理中心 • 全團務列表' : '我的登山團務清單'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? '各團資料完全隔離，點擊即可切換目前編輯與檢視的團務'
                  : '系統依據您的身分僅列出您有報名的登山團務'}
              </p>
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

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋團務名稱、山岳或代號..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          {/* Admin Action Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUploadModal();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-semibold transition active:scale-95"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>匯入 Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateModal();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>建立新團務</span>
              </button>
            </div>
          )}
        </div>

        {/* Trips List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {filteredTrips.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <Mountain className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="font-bold text-slate-300">查無相符的登山團務</div>
              <p className="text-[11px]">可使用上方「建立新團務」或「匯入 Excel」新增團務。</p>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const isCurrent = trip.tripId === currentTripId;
              return (
                <div
                  key={trip.tripId}
                  onClick={() => {
                    onSelectTrip(trip.tripId);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                        {trip.tripId}
                      </span>
                      <h4 className="font-bold text-sm text-slate-100 truncate">
                        {trip.title}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>目前使用中</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-[11px]">
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

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isAdmin && trips.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, trip)}
                        title="刪除此團務"
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      className={`px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>{isCurrent ? '正在瀏覽' : '切換載入'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            共 {trips.length} 個獨立團務 • 切換團務只改變目前視圖，完全不互相影響
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium transition"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
};
