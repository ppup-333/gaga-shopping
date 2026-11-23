import React, { useState } from 'react';
import { X, Trash2, Send, ShoppingBag, CheckCircle2, User, FileText, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CartModal({ isOpen, onClose, cart, setCart }) {
  const { user } = useAuth();
  const [registrantName, setRegistrantName] = useState(user?.fullName || '');
  const [registrantPhone, setRegistrantPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!isOpen) return null;

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.cartQuantity + delta;
            return newQty > 0 ? { ...item, cartQuantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registrantName.trim()) {
      setErrorMsg('請填寫訂單登記者姓名');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('請填寫訂單備註說明');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('登記清單中無物品');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        registrantName: registrantName.trim(),
        registrantPhone: registrantPhone.trim() || null,
        notes: notes.trim(),
        items: cart.map((i) => ({
          itemId: i.id,
          quantity: i.cartQuantity
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('gaga_token')
            ? { 'Authorization': `Bearer ${localStorage.getItem('gaga_token')}` }
            : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '送出訂單失敗');
      }

      setSuccessOrder(data.order);
      setCart([]); // 清空購物車
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">物品登記清單</h3>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 訂單送出成功視窗 */}
        {successOrder ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">訂單已成功送出！</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              您的登記資料已存入資料庫，倉庫管理員將會盡速為您安排物品準備。
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-1.5 border border-slate-200">
              <div><span className="font-bold text-slate-700">登記者：</span>{successOrder.registrantName}</div>
              <div><span className="font-bold text-slate-700">備註：</span>{successOrder.notes}</div>
              <div><span className="font-bold text-slate-700">項目數量：</span>共 {successOrder.orderItems?.length || 0} 款物品</div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm shadow hover:bg-blue-700 transition"
            >
              完成並返回
            </button>
          </div>
        ) : (
          /* 購物車明細與登記表單 */
          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* 清單項目列表 */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">已選物品</h4>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  目前登記清單是空的，請先在開放列表中加入物品。
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</div>
                          <div className="text-[11px] text-slate-400">目前庫存：{item.quantity}</div>
                        </div>
                      </div>

                      {/* 數量微調按鈕 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-700">{item.cartQuantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 登記表單 (必填姓名與備註) */}
            {cart.length > 0 && (
              <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">登記者資料 (必填)</h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    您的名字 / 稱謂 *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={registrantName}
                      onChange={(e) => setRegistrantName(e.target.value)}
                      placeholder="請填寫姓名 (例如：林小姐、工程部小張)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    聯絡電話 / 分機 (選填)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={registrantPhone}
                      onChange={(e) => setRegistrantPhone(e.target.value)}
                      placeholder="方便倉庫管理員聯絡發貨"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    訂單備註 / 用途說明 *
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows="2"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="請填寫用途或預計領取時間（必填）"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? '送出中...' : '確認送出訂單登記'}</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
