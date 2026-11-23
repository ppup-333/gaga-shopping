import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Warehouse, 
  Users, 
  ClipboardList, 
  LogIn, 
  LogOut, 
  ShieldCheck,
  Building2,
  ShoppingCart
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, openLoginModal, cartCount, openCartModal }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">系統管理員</span>;
      case 'WAREHOUSE_MGR':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">倉庫管理員</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">訂單登記者</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & 品牌名稱 */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Gaga 倉庫庫存</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Render Free</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">多倉庫庫存統計與訂單登記系統</p>
            </div>
          </div>

          {/* 導航分頁 (電腦與平板) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* 1. 訪客/公開目錄 (所有人皆可見) */}
            <button
              onClick={() => setCurrentTab('catalog')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                currentTab === 'catalog' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>開放物品清單</span>
            </button>

            {/* 2. 倉庫管理 (倉庫管理員 & 系統管理員) */}
            {user && ['ADMIN', 'WAREHOUSE_MGR'].includes(user.role) && (
              <button
                onClick={() => setCurrentTab('warehouse')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  currentTab === 'warehouse' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Warehouse className="w-4 h-4" />
                <span>倉庫管理與庫存統計</span>
              </button>
            )}

            {/* 3. 訂單查詢 (所有人皆有各自權限) */}
            <button
              onClick={() => setCurrentTab('orders')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                currentTab === 'orders' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{user && ['ADMIN', 'WAREHOUSE_MGR'].includes(user.role) ? '所有訂單查詢' : '訂單登記紀錄'}</span>
            </button>

            {/* 4. 系統後台 (僅系統管理員) */}
            {user && user.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  currentTab === 'admin' 
                    ? 'bg-purple-50 text-purple-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>系統管理與備份</span>
              </button>
            )}
          </nav>

          {/* 右側操作區：購物登記車與登入狀態 */}
          <div className="flex items-center gap-3">
            {/* 購物車/登記清單按鈕 */}
            <button
              onClick={openCartModal}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="查看登記清單"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">{user.fullName || user.username}</span>
                  {getRoleBadge(user.role)}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="登出帳號"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>登入帳號</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
