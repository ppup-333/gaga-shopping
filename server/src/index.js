require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 10000;

// 中間件設定
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 全域 JWT 身份識別
app.use(authenticateToken);

// 靜態本地上傳檔案目錄（若使用本地暫存圖床時提供存取）
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 健康檢查與防休眠端點 (UptimeRobot / Render Keep-Alive)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gaga-shopping-inventory',
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

// API 路由註冊
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/admin', require('./routes/admin'));

// 託管前端編譯後的靜態 SPA (Render 部署模式)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Gaga Shopping Inventory</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>🚀 Gaga 倉庫庫存與訂單管理系統 API 服務已就緒</h1>
            <p>前端靜態資源正在建置中，或請存取 <a href="/api/health">/api/health</a> 測試連線。</p>
          </body>
        </html>
      `);
    }
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`📦 Gaga Shopping API & Web Service running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);

  // 伺服器啟動時執行資料庫初始化與刷新檢查 (同 gagagaga 30天防刪除刷新機制)
  const { checkAndRefreshExpiringData } = require('./services/refreshService');
  (async () => {
    console.log("正在執行伺服器啟動時的資料刷新檢查...");
    try {
      const res = await checkAndRefreshExpiringData();
      console.log(`伺服器啟動刷新檢查完成：上一次刷新時間為 ${res.lastRefreshTime}，共刷新 ${res.refreshedCount} 筆。`);
    } catch (err) {
      console.error("伺服器啟動時資料刷新失敗：", err);
    }
  })();
});
