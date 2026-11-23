@echo off
chcp 65001 >nul

echo 📦 加入變更檔案...
git add -A
if "%~1"=="" (
    git commit -m "feat: 導入同 gagagaga 之 PostgreSQL 30天防刪除資料刷新機制"
) else (
    git commit -m "%*"
)
echo 🚀 推送到遠端...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo 🎉 成功推送至 GitHub！
) else (
    echo.
    echo ❌ 推送失敗，請確認 Git 憑證或連線狀態。
)
