import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, User, Eye, EyeOff, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onLoginSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check credentials (yy661003 or admin)
    const isUserValid = cleanUser === 'yy661003' || cleanUser === 'admin';
    const isPassValid = cleanPass === 'yy661003' || cleanPass.toLowerCase() === 'yy661003' || cleanPass === 'admin';

    if (isUserValid && isPassValid) {
      sessionStorage.setItem('expedition_admin_auth', 'true');
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } else {
      setIsSubmitting(false);
      setErrorMessage('帳號或密碼錯誤！請確認後重新輸入。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#131924] rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">幹部管理後台驗證</h3>
              <p className="text-xs text-slate-400">機密個資與團務編輯權限</p>
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
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-3.5 flex items-start gap-2.5 text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">安全提醒：</span>
              後台包含所有隊員之身分證字號、聯絡電話、生日及病史等敏感個資，僅供領隊與幹部登入查閱及修改。
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-3 text-rose-300 font-semibold flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              後台帳號 (Account)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="請輸入後台帳號"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 font-mono text-xs focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              後台密碼 (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="請輸入後台密碼"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-slate-100 placeholder-slate-500 font-mono text-xs focus:bg-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Session info */}
          <div className="flex items-center justify-end pt-1">
            <span className="text-[11px] text-slate-400">登入後將保持本次連線管理權限</span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>驗證並進入後台</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
