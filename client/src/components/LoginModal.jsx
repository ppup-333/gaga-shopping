import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User, UserCheck, Shield, KeyRound, Sparkles } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register(username, password, fullName);
      } else {
        await login(username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  // 方便測試的一鍵帶入帳號
  const fillTestAccount = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (userType === 'manager') {
      setUsername('manager');
      setPassword('manager123');
    } else {
      setUsername('user');
      setPassword('user123');
    }
    setIsRegisterMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {isRegisterMode ? '註冊新帳號' : '登入系統'}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              {isRegisterMode ? '建立訂單登記者身分以記錄歷史訂單' : '請輸入您的帳號與密碼以取得相應權限'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷測試帳號按鈕 (方便評測與操作) */}
        {!isRegisterMode && (
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>快速一鍵填入測試帳號：</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillTestAccount('admin')}
                className="px-2 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition"
              >
                系統管理員
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('manager')}
                className="px-2 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition"
              >
                倉庫管理員
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('user')}
                className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition"
              >
                訂單登記者
              </button>
            </div>
          </div>
        )}

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                姓名 / 稱謂
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="例如：王小明"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              帳號名稱
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              密碼
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition active:scale-98 disabled:opacity-50"
          >
            {loading ? '處理中...' : (isRegisterMode ? '立即註冊' : '登入')}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              {isRegisterMode ? '已有帳號？點此切換登入' : '還沒有帳號？點此註冊訂單登記者帳號'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
