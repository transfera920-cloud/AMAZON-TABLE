import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, SlidersHorizontal } from 'lucide-react';
import { ProgressTask, ExpeditionPlan } from '../types';

interface ColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ProgressTask[];
  onUpdateTasks: (updatedTasks: ProgressTask[]) => void;
  customColumns: ExpeditionPlan['customColumns'];
  onUpdateCustomColumns: (cols: ExpeditionPlan['customColumns']) => void;
}

export const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onUpdateTasks,
  customColumns,
  onUpdateCustomColumns,
}) => {
  if (!isOpen) return null;

  const [taskList, setTaskList] = useState<ProgressTask[]>([...tasks]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newTaskLabel, setNewTaskLabel] = useState('');

  // Custom column state
  const [customColList, setCustomColList] = useState([...customColumns]);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColTable, setNewColTable] = useState<'pii' | 'progress'>('pii');
  const [newColIsPII, setNewColIsPII] = useState(false);

  const handleAddTask = () => {
    if (!newTaskLabel.trim()) return;
    const newTask: ProgressTask = {
      id: `task_${Date.now()}`,
      key: `custom_task_${Date.now()}`,
      label: newTaskLabel.trim(),
    };
    const updated = [...taskList, newTask];
    setTaskList(updated);
    onUpdateTasks(updated);
    setNewTaskLabel('');
  };

  const handleDeleteTask = (id: string) => {
    const updated = taskList.filter(t => t.id !== id);
    setTaskList(updated);
    onUpdateTasks(updated);
  };

  const handleStartEditTask = (task: ProgressTask) => {
    setEditingTaskId(task.id);
    setEditingLabel(task.label);
  };

  const handleSaveEditTask = (id: string) => {
    if (!editingLabel.trim()) return;
    const updated = taskList.map(t => t.id === id ? { ...t, label: editingLabel.trim() } : t);
    setTaskList(updated);
    onUpdateTasks(updated);
    setEditingTaskId(null);
  };

  const handleAddCustomColumn = () => {
    if (!newColLabel.trim()) return;
    const key = `custom_${Date.now()}`;
    const newCol = {
      tableKey: newColTable,
      key,
      label: newColLabel.trim(),
      isPII: newColIsPII,
      type: 'text' as const,
    };
    const updated = [...customColList, newCol];
    setCustomColList(updated);
    onUpdateCustomColumns(updated);
    setNewColLabel('');
  };

  const handleDeleteCustomColumn = (key: string) => {
    const updated = customColList.filter(c => c.key !== key);
    setCustomColList(updated);
    onUpdateCustomColumns(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] text-slate-100 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-900">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">自訂與管理總表欄位標題</h3>
              <p className="text-xs text-slate-400">
                可隨時修改所有欄位名稱、新增自訂檢核項目與隊員自訂屬性
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: Progress Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-sm">
                📋 團務進度總表 — 檢核欄位項目 ({taskList.length} 項)
              </h4>
            </div>

            {/* Add new task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                placeholder="輸入新進度欄位名稱 (例如：冰爪檢核、投保同意書...)"
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>新增欄位</span>
              </button>
            </div>

            {/* List of Tasks */}
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60 max-h-56 overflow-y-auto">
              {taskList.map((task, idx) => (
                <div key={task.id} className="p-2.5 flex items-center justify-between hover:bg-slate-800/50 transition">
                  {editingTaskId === task.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="flex-1 bg-slate-900 border border-amber-500 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditTask(task.id)}
                        className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="text-slate-500 font-mono w-5">{idx + 1}.</span>
                      <span className="font-medium">{task.label}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {editingTaskId !== task.id && (
                      <button
                        onClick={() => handleStartEditTask(task)}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded transition"
                        title="重新命名標題"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="刪除此欄位"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Custom PII / Member Table Columns */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="font-bold text-slate-200 text-sm">
              🏷️ 隊員名冊自訂欄位 (例如：帳篷號、公裝分揹、裝備借用)
            </h4>

            {/* Add custom column */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                placeholder="自訂欄位標題 (例如：公裝分揹重量)"
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleAddCustomColumn}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition shrink-0 border border-slate-700"
              >
                <Plus className="w-4 h-4" />
                <span>新增隊員自訂欄位</span>
              </button>
            </div>

            {/* List of custom columns */}
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/60">
              {customColList.length === 0 ? (
                <div className="p-3 text-center text-slate-500">目前尚無自訂欄位</div>
              ) : (
                customColList.map((col) => (
                  <div key={col.key} className="p-2.5 flex items-center justify-between hover:bg-slate-800/50">
                    <div>
                      <span className="font-medium text-slate-200">{col.label}</span>
                      <span className="ml-2 text-[10px] text-slate-500">
                        {col.isPII ? '🔒 包含個資' : '公開欄位'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCustomColumn(col.key)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="刪除自訂欄位"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition border border-slate-700"
          >
            完成並返回
          </button>
        </div>

      </div>
    </div>
  );
};
