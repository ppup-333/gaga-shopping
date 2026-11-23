const prisma = require('../db');

// 記憶體備用元資訊
let memorySystemMeta = {
  lastRefreshTime: null,
  lastRefreshedCount: 0
};

// 確保 SystemMeta 資料表存在 (相容性與防呆機制)
async function ensureSystemMetaTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemMeta" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    // 若尚未連線或未設定 DATABASE_URL 則記錄警告
    console.warn('[資料刷新機制] 提示：無法直接建立 SystemMeta 資料表（可能處於離線或無連線模式）:', err.message);
  }
}

/**
 * 資料刷新機制 (同 gagagaga 架構)：
 * 在 Render 30 天保留期限中，若資料年齡 >= 20 天（即 10 天內會被刪除），
 * 重建/刷新一筆完全相同資料取代原資料 (更新 createdAt 與 updatedAt 為當前時間)，
 * 重新計算 30 天週期以達成永久保留防刪效果。
 *
 * @param {boolean} forceAll 是否強制刷新所有資料（供手動全面重設使用）
 */
async function checkAndRefreshExpiringData(forceAll = false) {
  const now = new Date();
  const nowStr = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const EXPIRY_THRESHOLD_DAYS = 20; // 30天保留期，>=20天表示會在 10 天內被刪除
  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(now.getTime() - EXPIRY_THRESHOLD_DAYS * MS_IN_DAY);

  let refreshedCount = 0;

  try {
    await ensureSystemMetaTable();

    const dateFilter = forceAll ? {} : { createdAt: { lte: cutoffDate } };

    // 1. 刷新物品 (Item)
    const itemResult = await prisma.item.updateMany({
      where: dateFilter,
      data: { createdAt: now, updatedAt: now }
    });
    refreshedCount += itemResult.count;

    // 2. 刷新訂單 (Order)
    const orderResult = await prisma.order.updateMany({
      where: dateFilter,
      data: { createdAt: now, updatedAt: now }
    });
    refreshedCount += orderResult.count;

    // 3. 刷新訂單明細 (OrderItem)
    const orderItemResult = await prisma.orderItem.updateMany({
      where: forceAll ? {} : { createdAt: { lte: cutoffDate } },
      data: { createdAt: now }
    });
    refreshedCount += orderItemResult.count;

    // 4. 刷新倉庫據點 (Warehouse)
    const warehouseResult = await prisma.warehouse.updateMany({
      where: dateFilter,
      data: { createdAt: now, updatedAt: now }
    });
    refreshedCount += warehouseResult.count;

    // 5. 刷新使用者 (User)
    const userResult = await prisma.user.updateMany({
      where: dateFilter,
      data: { createdAt: now, updatedAt: now }
    });
    refreshedCount += userResult.count;

    // 記錄刷新時間與筆數至 SystemMeta 資料表
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "SystemMeta" ("key", "value", "updatedAt")
        VALUES ('last_refresh_time', $1, NOW())
        ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
      `, nowStr);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "SystemMeta" ("key", "value", "updatedAt")
        VALUES ('last_refreshed_count', $1, NOW())
        ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
      `, refreshedCount.toString());
    } catch (metaErr) {
      console.warn('[資料刷新機制] 更新 SystemMeta 失敗，改用記憶體快取記錄：', metaErr.message);
    }

    memorySystemMeta.lastRefreshTime = nowStr;
    memorySystemMeta.lastRefreshedCount = refreshedCount;

    console.log(`[PostgreSQL] 資料刷新檢查完成，共重建取代 ${refreshedCount} 筆在 10 天內即將過期的資料。`);
    return { refreshedCount, lastRefreshTime: nowStr };
  } catch (err) {
    console.error('執行資料刷新機制失敗：', err);
    memorySystemMeta.lastRefreshTime = nowStr;
    memorySystemMeta.lastRefreshedCount = refreshedCount;
    return { refreshedCount, lastRefreshTime: nowStr };
  }
}

/**
 * 取得上一次刷新狀態
 */
async function getLastRefreshStatus() {
  try {
    await ensureSystemMetaTable();
    const rows = await prisma.$queryRawUnsafe(`
      SELECT "key", "value" FROM "SystemMeta" WHERE "key" IN ('last_refresh_time', 'last_refreshed_count')
    `);

    let timeVal = memorySystemMeta.lastRefreshTime;
    let countVal = memorySystemMeta.lastRefreshedCount;

    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row.key === 'last_refresh_time') timeVal = row.value;
        if (row.key === 'last_refreshed_count') countVal = parseInt(row.value, 10);
      }
    }

    return {
      lastRefreshTime: timeVal || '尚未記錄',
      lastRefreshedCount: countVal || 0
    };
  } catch (err) {
    console.error('讀取刷新狀態失敗：', err.message);
    return {
      lastRefreshTime: memorySystemMeta.lastRefreshTime || '尚未記錄',
      lastRefreshedCount: memorySystemMeta.lastRefreshedCount || 0
    };
  }
}

module.exports = {
  checkAndRefreshExpiringData,
  getLastRefreshStatus
};
