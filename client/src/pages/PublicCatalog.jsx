import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Plus, Minus, Send, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicCatalog({ cart, setCart, openCartModal }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchPublicItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Fetch items error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicItems();
  }, [search]);

  // 加入登記購物車
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, cartQuantity: Math.min(item.quantity, i.cartQuantity + 1) } : i
        );
      } else {
        return [...prev, { ...item, cartQuantity: 1 }];
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 頁面頂部橫幅 */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            <Package className="w-3.5 h-3.5" /> 訪客與訂單登記專區
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            開放物品庫存清單
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">
            倉庫管理員已開放登記之現有物品，您可以即時瀏覽物品名稱、實體照片與目前庫存量，並送出登記訂單。
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none">
          <Package className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* 搜尋列與即時重新整理 */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋物品名稱..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <button
          onClick={fetchPublicItems}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium shadow-sm transition active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>重新整理庫存</span>
        </button>
      </div>

      {/* 物品清單網格 (RWD: 手機單欄、平板雙欄、電腦三/四欄) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="w-full aspect-video bg-slate-200 rounded-xl" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-9 bg-slate-200 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">目前暫無開放登記的物品</h3>
          <p className="text-xs text-slate-500 mt-1">
            倉庫管理員尚未將任何物品設定為「開放查看」，或搜尋無符合結果。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const inCart = cart.find((c) => c.id === item.id);
            const isOutOfStock = item.quantity <= 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* 物品照片 (自適應高畫質展示) */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-10 h-10 mb-1" />
                      <span className="text-[11px]">無照片</span>
                    </div>
                  )}

                  {/* 庫存量標籤 */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                        isOutOfStock
                          ? 'bg-red-500/90 text-white'
                          : item.quantity < 10
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {isOutOfStock ? '已無庫存' : `現有庫存：${item.quantity}`}
                    </span>
                  </div>
                </div>

                {/* 物品資訊 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* 登記加入按鈕 */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      所屬倉庫：{item.warehouseName || '總倉'}
                    </span>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : inCart
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? `已選 ${inCart.cartQuantity}` : '加入登記'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部浮動購物車按鈕 (手機特別友善) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={openCartModal}
            className="flex items-center gap-3 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition transform hover:-translate-y-1 active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>查看登記清單 ({cart.reduce((s, i) => s + i.cartQuantity, 0)} 件)</span>
          </button>
        </div>
      )}
    </div>
  );
}
