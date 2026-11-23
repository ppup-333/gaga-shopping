/**
 * 獨立 Node.js 備份腳本 (可搭配 npm run db:backup 執行)
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ 請在 .env 中設定 DATABASE_URL');
  process.exit(1);
}

const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
const outputPath = path.join(backupDir, filename);

console.log(`📦 正在備份資料庫至: ${outputPath}...`);

try {
  execSync(`pg_dump "${dbUrl}" --no-owner --no-acl -f "${outputPath}"`, { stdio: 'inherit' });
  console.log(`✅ 備份成功！檔案儲存於 ${outputPath}`);
} catch (err) {
  console.error('❌ 備份失敗，請確認本地是否已安裝 pg_dump 工具，或使用後台 API 一鍵匯出 JSON。');
}
