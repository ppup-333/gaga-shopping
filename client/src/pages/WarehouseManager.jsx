import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';
import { 
  Package, 
  Warehouse, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  BarChart3, 
  CheckCircle, 
  AlertCircle,
  Boxes,
  Layers
} from 'lucide-react';

export default function WarehouseManager() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);

  // 新增/編輯 Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    warehouseId: '',
    isPublic: true
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 載入統計與資料
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. 取得統計指標
      const statsRes = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. 取得倉庫清單
      const whRes = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehouses(whData);
        if (whData.length > 0 && !formData.warehouseId) {
          setFormData((prev) => ({ ...prev, warehouseId: whData[0].id }));
        }
      }

      // 3. 取得所有物品 (包含非公開)
      const itemsRes = await fetch(`/api/items${selectedWarehouseId ? `?warehouseId=${selectedWarehouseId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWarehouseId]);

  // 開啟新增視窗
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      warehouseId: warehouses[0]?.id || '',
      isPublic: true
    });
    setSelectedImageFile(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 開啟編輯視窗
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      quantity: item.quantity,
      warehouseId: item.warehouseId,
      isPublic: item.isPublic
    });
    setSelectedImageFile(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 儲存物品 (新增或更新)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('sku', formData.sku);
      data.append('description', formData.description);
      data.append('quantity', formData.quantity);
      data.append('warehouseId', formData.warehouseId);
      data.append('isPublic', formData.isPublic);

      if (selectedImageFile) {
        data.append('image', selectedImageFile);
      }

      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '儲存失敗');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 切換公開狀態
  const toggleVisibility = async (item) => {
    try {
      const res = await fetch(`/api/items/${item.id}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: !item.isPublic })
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isPublic: !item.isPublic } : i))
        );
      }
    } catch (err) {
      console.error('Toggle visibility error:', err);
    }
  };

  // 刪除物品
  const handleDeleteItem = async (id) => {
    if (!window.confirm('確定要刪除這筆物品嗎？')) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 標題與統計指標卡片 */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Warehouse className="w-7 h-7 text-blue-600" />
              倉庫庫存統計與物品管理
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              管理各倉庫物品資料、手機拍照登記、調整庫存與公開瀏覽權限
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>登記新物品 (拍照/入庫)</span>
          </button>
        </div>

        {/* 庫存量統計卡片 */}
        {stats?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">總倉庫數</span>
                <Warehouse className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.summary.totalWarehouses} 間</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">物品總品項</span>
                <Boxes className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.summary.totalItems} 款</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">全倉總庫存量</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.summary.totalStock} 件</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">待處理訂單</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{stats.summary.pendingOrders} 筆</div>
            </div>
          </div>
        )}
      </div>

      {/* 倉庫分組庫存量詳細列表 */}
      {stats?.warehouseStats && (
        <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
            各倉庫物品庫存細項統計
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.warehouseStats.map((wh) => (
              <div key={wh.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="font-bold text-sm text-slate-900">{wh.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{wh.location || '未設地點'}</div>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-600">物品：{wh.itemCount} 款 (公開 {wh.publicItemCount})</span>
                  <span className="font-bold text-blue-600">總量：{wh.totalStock} 件</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 物品清單表格與篩選 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">倉庫篩選：</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有倉庫</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>重新整理</span>
          </button>
        </div>

        {/* 物品列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">物品照片</th>
                <th className="py-3 px-4">物品名稱 / 編號</th>
                <th className="py-3 px-4">所屬倉庫</th>
                <th className="py-3 px-4">庫存數量</th>
                <th className="py-3 px-4">開放給登記者</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    此倉庫目前暫無登記物品，點擊上方按鈕立即新增。
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            無相片
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.sku && <div className="text-xs text-slate-400 font-mono">SKU: {item.sku}</div>}
                      {item.description && <div className="text-xs text-slate-500 line-clamp-1">{item.description}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {item.warehouse?.name || '未指定'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${item.quantity <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.quantity} 件
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleVisibility(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition active:scale-95 ${
                          item.isPublic
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{item.isPublic ? '公開中' : '未公開'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="編輯物品"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="刪除物品"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增 / 編輯物品 Modal (支援相機拍照) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingItem ? '編輯物品資料' : '登記新物品入庫'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* 手機拍照上傳元件 */}
              <CameraCapture
                onImageSelected={(file) => setSelectedImageFile(file)}
                currentImageUrl={editingItem?.imageUrl}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    物品名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：人體工學滑鼠"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    物品編號 / SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="可選填"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    登記所屬倉庫 *
                  </label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    庫存數量 *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-700">開放給訂單登記者看</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  物品備註描述
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="可備註規格、材質或存放貨架位置..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {saving ? '處理中...' : '確認登記'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
