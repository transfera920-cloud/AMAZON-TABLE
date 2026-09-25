import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, FileText, Download, Plus, FolderPlus } from 'lucide-react';
import { parseExcelFile, exportExpeditionToExcel } from '../utils/excelParser';
import { ExpeditionPlan, TripSummary } from '../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: ExpeditionPlan;
  trips?: TripSummary[];
  onApplyPlan: (newPlan: ExpeditionPlan, isNewTrip?: boolean) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  trips = [],
  onApplyPlan,
}) => {
  if (!isOpen) return null;

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<{ plan: ExpeditionPlan; summary: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target trip mode: 'current' | 'new'
  const [targetMode, setTargetMode] = useState<'current' | 'new'>('current');
  const [newTripId, setNewTripId] = useState(() => `TRIP-${String(trips.length + 1).padStart(3, '0')}`);
  const [newTripTitle, setNewTripTitle] = useState('');

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setParseResult(null);

    try {
      const { updatedPlan, summaryMsg } = await parseExcelFile(file, currentPlan);
      setParseResult({ plan: updatedPlan, summary: summaryMsg });
      if (!newTripTitle && updatedPlan.title) {
        setNewTripTitle(updatedPlan.title);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '無法解析此檔案，請確認是否為標準 Excel (.xlsx/.xls) 或 CSV 格式。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleConfirmApply = () => {
    if (parseResult) {
      const planToApply = { ...parseResult.plan };
      const isNew = targetMode === 'new';

      if (isNew) {
        const cleanId = newTripId.trim() || `TRIP-${String(trips.length + 1).padStart(3, '0')}`;
        planToApply.tripId = cleanId;
        planToApply.id = cleanId;
        if (newTripTitle.trim()) {
          planToApply.title = newTripTitle.trim();
        }
      } else {
        const curId = currentPlan.tripId || currentPlan.id || 'TRIP-001';
        planToApply.tripId = curId;
        planToApply.id = curId;
      }

      onApplyPlan(planToApply, isNew);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] text-slate-100 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 rounded-xl text-slate-900">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">載入 Excel / CSV 生成總表</h3>
              <p className="text-xs text-slate-400">
                自動解析多工作表（進度總表、接駁、個資名冊、行程、注意事項等）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Target Trip Selection Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">匯入目標團務：</span>
              <span className="text-[11px] text-emerald-400">各團資料獨立儲存不互相覆蓋</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => setTargetMode('current')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  targetMode === 'current'
                    ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'current'}
                  onChange={() => setTargetMode('current')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">更新至目前團務</div>
                  <div className="text-[11px] text-emerald-300 truncate">
                    【{currentPlan.title}】({currentPlan.tripId || 'TRIP-001'})
                  </div>
                </div>
              </label>

              <label
                onClick={() => setTargetMode('new')}
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  targetMode === 'new'
                    ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetMode"
                  checked={targetMode === 'new'}
                  onChange={() => setTargetMode('new')}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">建立為全新團務</div>
                  <div className="text-[11px] text-slate-400">
                    獨立產生新團務代號與儲存檔
                  </div>
                </div>
              </label>
            </div>

            {targetMode === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">新團務編號</label>
                  <input
                    type="text"
                    value={newTripId}
                    onChange={(e) => setNewTripId(e.target.value)}
                    placeholder="例如 TRIP-004"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">新團務自訂名稱 (選填，預設自 Excel 讀取)</label>
                  <input
                    type="text"
                    value={newTripTitle}
                    onChange={(e) => setNewTripTitle(e.target.value)}
                    placeholder="例如：雪山主東峰 3天2夜"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/30 scale-[0.99]'
                : 'border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="p-4 bg-slate-800 rounded-2xl shadow-xs border border-slate-700 text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <div className="font-bold text-sm text-slate-100">
                點擊選擇檔案 或 拖曳至此處
              </div>
              <p className="text-slate-400 mt-1">
                支援 .xlsx、.xls、.csv 格式，可一次解析多工作表
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">團務進度總表</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">交通接駁</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">個資保險表</span>
              <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">登山計劃書</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center gap-2 text-slate-300">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>正在智能解析 Excel 工作表與欄位中...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-850 rounded-2xl flex items-start gap-2.5 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">匯入失敗</div>
                <div className="text-[11px] mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Success Parse Preview */}
          {parseResult && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>解析成功！確認匯入總表</span>
              </div>

              <div className="text-emerald-200 whitespace-pre-line leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-emerald-900/60 text-[11px]">
                {parseResult.summary}
              </div>

              <div className="flex justify-between items-center text-[11px] text-emerald-300 pt-1 font-medium">
                <span>更新後隊員名冊：{parseResult.plan.members.length} 人</span>
                <span>接駁路線：{parseResult.plan.shuttleRoutes.length} 條</span>
              </div>
            </div>
          )}

          {/* Template Download Option */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
            <span>還沒有格式嗎？可先下載標準範例檔：</span>
            <button
              type="button"
              onClick={() => exportExpeditionToExcel(currentPlan, true)}
              className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下載 Excel 空白範本</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium rounded-xl text-xs transition"
          >
            取消
          </button>

          <button
            type="button"
            disabled={!parseResult}
            onClick={handleConfirmApply}
            className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
              parseResult
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>套用並生成總表</span>
          </button>
        </div>

      </div>
    </div>
  );
};
