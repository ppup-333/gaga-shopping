import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  Warehouse, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'warehouses' | 'backup'

  // 使用者管理狀態
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'REGISTRANT'
  });

  // 倉庫管理狀態
  const [warehouses, setWarehouses] = useState([]);
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState(null);
  const [whForm, setWhForm] = useState({
    name: '',
    location: '',
    description: ''
  });

  // 備份還原狀態
  const [backupStatus, setBackupStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  // 載入使用者
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // 載入倉庫
  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWarehouses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchWarehouses()]).finally(() => setLoading(false));
  }, [token]);

  // 使用者 CRUD 操作
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '儲存失敗');
        return;
      }

      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('確定要刪除此帳號嗎？')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
      else {
        const err = await res.json();
        alert(err.error || '刪除失敗');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 倉庫 CRUD 操作
  const handleSaveWh = async (e) => {
    e.preventDefault();
    try {
      const url = editingWh ? `/api/warehouses/${editingWh.id}` : '/api/warehouses';
      const method = editingWh ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(whForm)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '儲存失敗');
        return;
      }

      setIsWhModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteWh = async (id) => {
    if (!window.confirm('確定要刪除此倉庫嗎？倉庫內不能有物品。')) return;
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchWarehouses();
      else {
        const err = await res.json();
        alert(err.error || '刪除失敗');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 備份匯出 JSON 下載
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('匯出失敗');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gaga_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setBackupStatus('✅ 資料庫已成功完整匯出並下載！');
    } catch (err) {
      setBackupStatus('❌ 匯出失敗: ' + err.message);
    }
  };

  // 備份匯入還原
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('警告：匯入備份將會整併與寫入資料庫，確定要繼續嗎？')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    setBackupStatus('正在讀取並還原備份資料中...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(json)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '還原失敗');

        setBackupStatus('🎉 ' + data.message);
        fetchUsers();
        fetchWarehouses();
      } catch (err) {
        setBackupStatus('❌ 還原失敗: ' + err.message);
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
          系統總管理控制台
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          管理所有權限帳號、倉庫站點，以及 Render 30 天資料庫防清除與一鍵災難還原工具
        </p>
      </div>

      {/* Tab 切換 */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>帳號與權限管理</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'warehouses'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>倉庫資料管理</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'backup'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Render 30天備份與還原</span>
        </button>
      </div>

      {/* Tab 1: 帳號管理 */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">全系統使用者帳號列表</h3>
            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({ username: '', fullName: '', password: '', role: 'REGISTRANT' });
                setIsUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立新帳號</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">帳號</th>
                  <th className="py-2.5 px-3">姓名 / 稱謂</th>
                  <th className="py-2.5 px-3">角色權限</th>
                  <th className="py-2.5 px-3">建立日期</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{u.username}</td>
                    <td className="py-3 px-3 text-slate-700">{u.fullName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'WAREHOUSE_MGR' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role === 'ADMIN' ? '系統管理員' : u.role === 'WAREHOUSE_MGR' ? '倉庫管理員' : '訂單登記者'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setUserForm({ username: u.username, fullName: u.fullName, password: '', role: u.role });
                          setIsUserModalOpen(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="編輯帳號"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="刪除帳號"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 倉庫管理 */}
      {activeTab === 'warehouses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">倉庫據點管理列表</h3>
            <button
              onClick={() => {
                setEditingWh(null);
                setWhForm({ name: '', location: '', description: '' });
                setIsWhModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立新倉庫</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((w) => (
              <div key={w.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base">{w.name}</h4>
                    <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                      {w._count?.items || 0} 種物品
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{w.location || '尚未設定地址'}</p>
                  {w.description && <p className="text-xs text-slate-400 mt-2">{w.description}</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingWh(w);
                      setWhForm({ name: w.name, location: w.location || '', description: w.description || '' });
                      setIsWhModalOpen(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="編輯倉庫"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWh(w.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="刪除倉庫"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Render 30 天資料庫備份與還原 */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <div className="font-bold text-sm">Render 免費 PostgreSQL 30 天清除防範說明</div>
              <p>Render 的免費 PostgreSQL 於建立滿 30 天時會自動被系統回收刪除。本系統為您建立了兩道防護線：</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1">
                <li><strong>自動化管道：</strong>專案中已內建 GitHub Actions (`.github/workflows/render-db-backup.yml`)，每 25 天自動定時 dump 備份。</li>
                <li><strong>手動一鍵備份與還原：</strong>此處提供隨時將全庫資料打包下載 JSON，日後若在 Render 建立新的資料庫，只需將檔案上傳即可 10 秒瞬間復原所有帳號、倉庫、物品與訂單！</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 匯出備份 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">一鍵匯出全資料庫 JSON</h3>
              </div>
              <p className="text-xs text-slate-500">
                將包含使用者、各倉庫、庫存物品資料與所有訂單，完整匯出成標準結構的 JSON 備份檔案儲存於您的本機。
              </p>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>立即下載資料庫備份檔 (.json)</span>
              </button>
            </div>

            {/* 匯入還原 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-sm">一鍵匯入還原資料庫</h3>
              </div>
              <p className="text-xs text-slate-500">
                當更換新的 Render 免費資料庫時，上傳先前的備份檔案，系統將自動寫入所有關聯資料。
              </p>
              <label className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{importing ? '還原中...' : '選取備份檔案並開始還原'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {backupStatus && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs font-mono">
              {backupStatus}
            </div>
          )}
        </div>
      )}

      {/* 使用者 Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {editingUser ? '編輯使用者帳號' : '建立新使用者'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">帳號名稱</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">姓名 / 稱謂</label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUser ? '變更密碼 (若不修改請留空)' : '登入密碼'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">權限角色</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="ADMIN">系統管理員 (ADMIN)</option>
                  <option value="WAREHOUSE_MGR">倉庫管理員 (WAREHOUSE_MGR)</option>
                  <option value="REGISTRANT">訂單登記者 (REGISTRANT)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 倉庫 Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {editingWh ? '編輯倉庫' : '新增倉庫'}
            </h3>
            <form onSubmit={handleSaveWh} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">倉庫名稱 *</label>
                <input
                  type="text"
                  required
                  value={whForm.name}
                  onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                  placeholder="例如：高雄轉運倉"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">倉庫地址 / 地點</label>
                <input
                  type="text"
                  value={whForm.location}
                  onChange={(e) => setWhForm({ ...whForm, location: e.target.value })}
                  placeholder="例如：高雄市前鎮區物流園區"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">倉庫說明 / 特色</label>
                <textarea
                  rows="2"
                  value={whForm.description}
                  onChange={(e) => setWhForm({ ...whForm, description: e.target.value })}
                  placeholder="例如：冷藏存放區、快銷品專用"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold"
                >
                  確認儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
