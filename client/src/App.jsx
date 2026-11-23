import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import CartModal from './components/CartModal';
import PublicCatalog from './pages/PublicCatalog';
import WarehouseManager from './pages/WarehouseManager';
import OrdersManagePage from './pages/OrdersManagePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('catalog'); // 'catalog' | 'warehouse' | 'orders' | 'admin'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cart, setCart] = useState([]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 導航列 */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openLoginModal={() => setIsLoginModalOpen(true)}
        cartCount={totalCartCount}
        openCartModal={() => setIsCartModalOpen(true)}
      />

      {/* 主體畫面 */}
      <main className="flex-1 pb-16">
        {currentTab === 'catalog' && (
          <PublicCatalog
            cart={cart}
            setCart={setCart}
            openCartModal={() => setIsCartModalOpen(true)}
          />
        )}

        {currentTab === 'warehouse' && (
          user && ['ADMIN', 'WAREHOUSE_MGR'].includes(user.role) ? (
            <WarehouseManager />
          ) : (
            <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-2">權限不足</h3>
              <p className="text-xs text-slate-500 mb-4">此頁面僅限倉庫管理員與系統管理員存取，請先登入相應權限之帳號。</p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                切換或登入帳號
              </button>
            </div>
          )
        )}

        {currentTab === 'orders' && <OrdersManagePage />}

        {currentTab === 'admin' && (
          user && user.role === 'ADMIN' ? (
            <AdminDashboardPage />
          ) : (
            <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-2">僅限系統管理員存取</h3>
              <p className="text-xs text-slate-500 mb-4">請以系統管理員帳號登入後再進行此操作。</p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
              >
                以管理員登入
              </button>
            </div>
          )
        )}
      </main>

      {/* 頁尾 */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Gaga 倉庫庫存與訂單登記系統 · 專為 Render 免費雲端平台量身打造</p>
      </footer>

      {/* 登入彈窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* 登記清單/購物車彈窗 */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        setCart={setCart}
      />
    </div>
  );
}
