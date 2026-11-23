import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PackageCheck, 
  Search, 
  RefreshCw, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function OrdersManagePage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const isManagerOrAdmin = user && ['ADMIN', 'WAREHOUSE_MGR'].includes(user.role);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/orders${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token, statusFilter]);

  // 更新訂單狀態 (倉庫管理者與系統管理員)
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> 待處理
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle className="w-3.5 h-3.5" /> 已確認備貨
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <PackageCheck className="w-3.5 h-3.5" /> 已完成出庫
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
            <XCircle className="w-3.5 h-3.5" /> 已取消
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            {isManagerOrAdmin ? '所有訂單查詢與出庫管理' : '我的歷史訂單紀錄'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isManagerOrAdmin
              ? '倉庫管理員可查看所有訪客送出的登記訂單、備註，並進行備貨與狀態更新'
              : '查看您所登記的物品清單與目前處理進度'}
          </p>
        </div>

        {/* 篩選與更新 */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="">所有狀態</option>
            <option value="PENDING">待處理</option>
            <option value="CONFIRMED">已確認備貨</option>
            <option value="COMPLETED">已完成出庫</option>
            <option value="CANCELLED">已取消</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition active:scale-95"
            title="重新整理"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!token ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">請先登入後查詢</h3>
          <p className="text-xs text-slate-500 mt-1">
            訪客如需追蹤歷史訂單，請先登入帳號；倉庫管理員登入後可查看全系統所有訂單。
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">查無訂單資料</h3>
          <p className="text-xs text-slate-500 mt-1">目前尚無符合篩選條件的登記訂單。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{order.registrantName}</span>
                      {order.registrantPhone && (
                        <span className="text-xs text-slate-500 font-mono">({order.registrantPhone})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.createdAt).toLocaleString('zh-TW')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}

                  {/* 倉庫管理者可切換訂單狀態 */}
                  {isManagerOrAdmin && (
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="PENDING">設為 待處理</option>
                      <option value="CONFIRMED">設為 已確認備貨</option>
                      <option value="COMPLETED">設為 已完成出庫</option>
                      <option value="CANCELLED">設為 已取消</option>
                    </select>
                  )}
                </div>
              </div>

              {/* 訂單備註 (需求重點) */}
              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700">登記者備註：</span>
                <span className="text-slate-600 ml-1">{order.notes}</span>
              </div>

              {/* 訂購細項 */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {order.orderItems?.map((oi) => (
                  <div key={oi.id} className="flex items-center gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                      {oi.item?.imageUrl && <img src={oi.item.imageUrl} alt={oi.item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{oi.item?.name}</div>
                      <div className="text-[10px] text-slate-400">倉庫：{oi.item?.warehouse?.name || '主倉'}</div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      x{oi.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
