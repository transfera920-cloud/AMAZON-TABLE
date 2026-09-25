import React, { useState } from 'react';
import { X, Save, UserPlus, ShieldAlert, Check } from 'lucide-react';
import { MemberPII, ExpeditionPlan } from '../types';

interface MemberEditModalProps {
  member: MemberPII | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMember: MemberPII) => void;
  customColumns: ExpeditionPlan['customColumns'];
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
  customColumns,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<MemberPII>(
    member || {
      id: `m_${Date.now()}`,
      role: '隊員',
      name: '',
      nickname: '',
      gender: '男',
      idNumber: '',
      birthDate: '',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      address: '',
      bloodType: 'O',
      medicalHistory: '',
      diet: '葷食',
      customFields: {},
    }
  );

  const handleChange = (field: keyof MemberPII, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('請填寫隊員姓名');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] text-slate-100 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-slate-900">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {member ? `編輯隊員個資資料：${member.name}` : '新增隊員'}
              </h3>
              <p className="text-xs text-slate-400">
                後台機密資料，將用於國家公園入園申請與登山綜合險投保
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          <div className="p-3 bg-amber-950/40 rounded-2xl border border-amber-800/60 flex items-center gap-2 text-amber-300 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>個資保護提醒：此處資料僅在管理後台顯示，前台將自動隱藏或脫敏遮蔽。</span>
          </div>

          {/* Row 1: Role, Name, Nickname, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">團務角色</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="領隊">領隊</option>
                <option value="副領隊">副領隊</option>
                <option value="嚮導">嚮導</option>
                <option value="隊員">隊員</option>
                <option value="留守人">留守人</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">姓名 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：林裕彥"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">稱呼/暱稱</label>
              <input
                type="text"
                value={formData.nickname || ''}
                onChange={(e) => handleChange('nickname', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：林大"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">性別</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          {/* Row 2: ID Number, Birth Date, Phone, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">身分證字號 / 居留證號</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => handleChange('idNumber', e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                placeholder="例如：A123456789"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">出生年月日 (西元/民國均可)</label>
              <input
                type="text"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：1985-05-12 或 740512"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">聯絡電話 (手機)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                placeholder="例如：0972-573495"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">電子信箱 (Email)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：user@gmail.com"
              />
            </div>
          </div>

          {/* Row 3: Emergency Contact & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <label className="block font-bold text-slate-300 mb-1">緊急聯絡人 (家屬)</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：林裕崧 (哥哥)"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">緊急聯絡人手機電話</label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                placeholder="例如：0911-989786"
              />
            </div>
          </div>

          {/* Row 4: Address, Blood, Diet, Medical */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">戶籍/住址 (保險用)</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：台北市大安區新生南路二段"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">飲食習慣/禁忌</label>
              <input
                type="text"
                value={formData.diet || ''}
                onChange={(e) => handleChange('diet', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="例如：葷食/素食/不吃牛"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">用藥備註/病史/高山症經歷</label>
            <textarea
              rows={2}
              value={formData.medicalHistory || ''}
              onChange={(e) => handleChange('medicalHistory', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="例如：有備丹木斯、膝蓋舊傷需護膝、無藥物過敏"
            />
          </div>

          {/* Custom Columns Fields */}
          {customColumns.filter(c => c.tableKey === 'pii').length > 0 && (
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-slate-200">自訂欄位設定：</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customColumns
                  .filter(c => c.tableKey === 'pii')
                  .map(col => (
                    <div key={col.key}>
                      <label className="block font-medium text-slate-400 mb-1">{col.label}</label>
                      <input
                        type="text"
                        value={formData.customFields?.[col.key] || ''}
                        onChange={(e) => handleCustomFieldChange(col.key, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder={`填寫 ${col.label}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition border border-slate-700"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>儲存隊員資料</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
