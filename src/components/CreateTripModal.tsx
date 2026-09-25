import React, { useState } from 'react';
import { Mountain, Plus, X, Calendar, MapPin, ShieldAlert, User, Phone, CheckCircle2 } from 'lucide-react';
import { initialExpeditionData } from '../data/defaultExpedition';
import { ExpeditionPlan } from '../types';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextTripNumber: number;
  onCreateTrip: (newPlan: ExpeditionPlan) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  nextTripNumber,
  onCreateTrip,
}) => {
  const defaultTripId = `TRIP-${String(nextTripNumber).padStart(3, '0')}`;

  const [tripId, setTripId] = useState(defaultTripId);
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState('');
  const [mountain, setMountain] = useState('');
  const [route, setRoute] = useState('');
  const [leaderName, setLeaderName] = useState('王小明');
  const [leaderPhone, setLeaderPhone] = useState('0910-111222');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = tripId.trim() || defaultTripId;
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setErrorMessage('請填寫團務活動名稱 (例如：武陵四秀 或 玉山群峰)');
      return;
    }

    // Clone template structure and set unique tripId
    const newPlan: ExpeditionPlan = {
      ...initialExpeditionData,
      id: cleanId,
      tripId: cleanId,
      title: cleanTitle,
      dates: dates.trim() || '2026/11/15 - 11/18',
      mountain: mountain.trim() || cleanTitle,
      route: route.trim() || mountain.trim(),
      trailhead: route.trim() || '',
      status: 'active',
      leader: {
        name: leaderName.trim() || '王小明',
        phone: leaderPhone.trim() || '0910-111222',
        emergencyContact: '留守中心',
        emergencyPhone: '0911-000111',
      },
      members: [
        {
          id: `M-${cleanId}-01`,
          role: '領隊',
          name: leaderName.trim() || '王小明',
          gender: '男',
          idNumber: 'A123456789',
          birthDate: '1988/06/15',
          phone: leaderPhone.trim() || '0910-111222',
          email: 'wang@example.com',
          emergencyContact: '緊急聯絡人',
          emergencyPhone: '0911-222333',
          diet: '葷食',
          medicalHistory: '無',
        },
      ],
      progressData: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateTrip(newPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">建立全新登山團務</h3>
              <p className="text-xs text-slate-400">獨立儲存空間，資料絕不互相影響覆蓋</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300 font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-slate-300 font-bold">
                團務唯一編號 (tripId)
              </label>
              <input
                type="text"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                placeholder="TRIP-004"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-slate-300 font-bold">
                團務名稱 (Title) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：武陵四秀 三日縱走 或 玉山主西峰"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                活動日期 (Dates)
              </label>
              <input
                type="text"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="例如：2026/11/15 - 11/18 (4天3夜)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                攀登山岳 (Mountain)
              </label>
              <input
                type="text"
                value={mountain}
                onChange={(e) => setMountain(e.target.value)}
                placeholder="例如：品田山、池有山、桃山、喀拉業山"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              路線 / 登山口 (Route)
            </label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="例如：武陵山莊起登，順走四秀"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                領隊姓名
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">
                領隊電話
              </label>
              <input
                type="text"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>建立並切換至新團務</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
