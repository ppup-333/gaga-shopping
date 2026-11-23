/**
 * 獨立 Node.js 還原腳本 (可搭配 npm run db:restore 執行)
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
const backupFile = process.argv[2];

if (!dbUrl) {
  console.error('❌ 請在 .env 中設定 DATABASE_URL');
  process.exit(1);
}

if (!backupFile || !fs.existsSync(backupFile)) {
  console.error('❌ 請指定有效的備份檔案路徑，例如：node scripts/restore.js backups/backup_xxx.sql');
  process.exit(1);
}

console.log(`🔄 正在還原資料庫自: ${backupFile}...`);

try {
  execSync(`psql "${dbUrl}" -f "${backupFile}"`, { stdio: 'inherit' });
  console.log(`✅ 資料庫還原成功！`);
} catch (err) {
  console.error('❌ 還原失敗:', err.message);
}
