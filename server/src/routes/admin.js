const express = require('express');
const router = express.Router();
const {
  checkAndRefreshExpiringData,
  getLastRefreshStatus
} = require('../services/refreshService');

// 管理員驗證中間件：支援 Authorization JWT (ADMIN) 或 query / header / body 中的管理員密碼
function verifyAdmin(req, res, next) {
  const adminPassword =
    req.query.adminPassword ||
    req.headers['x-admin-password'] ||
    req.body?.adminPassword;

  // 1. 若 JWT 使用者具備 ADMIN 權限，放行
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }

  // 2. 若傳遞了 gagagaga 風格的管理員密碼 (iamadmin 或 admin123)，放行
  if (adminPassword === 'iamadmin' || adminPassword === 'admin123') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '權限不足：只有管理員才能操作資料刷新機制！'
  });
}

// 取得上一次刷新狀態 API
router.get('/refresh-status', verifyAdmin, async (req, res) => {
  try {
    const status = await getLastRefreshStatus();
    res.json({
      success: true,
      lastRefreshTime: status.lastRefreshTime,
      lastRefreshedCount: status.lastRefreshedCount
    });
  } catch (err) {
    console.error('讀取刷新狀態失敗：', err);
    res.status(500).json({ success: false, message: '讀取刷新狀態失敗' });
  }
});

// 手動觸發資料刷新 API
router.post('/refresh', verifyAdmin, async (req, res) => {
  try {
    const force = Boolean(req.body?.force || req.query?.force);
    const result = await checkAndRefreshExpiringData(force);
    res.json({
      success: true,
      lastRefreshTime: result.lastRefreshTime,
      refreshedCount: result.refreshedCount,
      message: `刷新機制執行成功！共檢測並重建取代 ${result.refreshedCount} 筆在 10 天內即將過期的資料。`
    });
  } catch (err) {
    console.error('手動觸發資料刷新失敗：', err);
    res.status(500).json({ success: false, message: '手動觸發資料刷新失敗' });
  }
});

module.exports = router;
