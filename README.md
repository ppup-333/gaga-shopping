# Gaga 倉庫庫存與訂單登記系統 (Render 免費方案架構)

專為 **Render.com 免費雲端平台** 規劃與最佳化的多倉庫庫存統計與訪客訂單登記系統。  
整合 **PostgreSQL 資料庫**、**手機相機拍照上傳**、**RBAC 三級權限** 與 **Render 30 天資料庫防清除機制**。

---

## 🌟 核心功能特色與權限架構

| 角色 | 權限範圍與操作功能 |
| :--- | :--- |
| **系統管理員 (ADMIN)** | • 管理全系統所有帳號資料 (CRUD、角色指定、修改密碼)<br/>• 管理全系統倉庫據點 (CRUD、地址與描述)<br/>• 擁有全站庫存與訂單最高檢視與管理權限<br/>• **Render 30 天資料庫災難防護**：一鍵 JSON 匯出與即時匯入還原 |
| **倉庫管理員 (WAREHOUSE_MGR)** | • 物品資料庫存管理 (CRUD、分配登記至不同倉庫據點)<br/>• **手機拍照上傳**：在手機瀏覽器開啟鏡頭即拍即傳 (或從相簿/電腦選取)<br/>• **公開設定開關**：隨時切換是否開放給訂單登記者查看 (`isPublic`)<br/>• 查詢所有訪客訂單，變更訂單備貨與出庫狀態 |
| **訂單登記者 / 訪客 (REGISTRANT)** | • 瀏覽倉庫管理員開放的物品清單 (品名、照片、目前庫存數量)<br/>• 物品登記清單 (購物車) 調節數量<br/>• **送出登記訂單**：必填登記者姓名與備註用途說明，存入資料庫<br/>• 登入後可查詢自己歷史登記訂單與備貨進度 |

---

## 🛡️ Render 免費 PostgreSQL 30 天防清除機制 (同 gagagaga 刷新防呆架構)

Render 官方政策規定：免費版 PostgreSQL 資料庫於建立後第 30 天會清除過期資料。  
本系統已全面對齊 **gagagaga** 專案的資料刷新防護機制，並提供完整的自動化與手動管理：

```
                    ┌── 1. 資料刷新機制 (主要核心，同 gagagaga) ── 年齡 >= 20天自動重建更新 createdAt，重設 30天週期
                    │
Render 30天防刪機制 ┼── 2. 後台一鍵手動刷新與狀態監控 ────── 隨時手動觸發刷新，即時查看上一次刷新時間與筆數
                    │
                    └── 3. 次要災難防護 (JSON 匯出/還原) ──────── 隨時手動打包下載 JSON，移機或換 DB 10 秒瞬間復原
```

### 1. 資料自動刷新機制 (同 gagagaga)
* **判定條件**：在 30 天保留期限中，若資料年齡 >= 20 天（即 10 天內會被清除），自動以原資料內容與 ID 重新更新時間戳記 (`createdAt = NOW()`)。
* **開機自動執行**：Node.js Express 伺服器每次啟動時，立即自動觸發 `checkAndRefreshExpiringData()` 檢查全庫並刷新。
* **紀錄追蹤**：刷新完成後自動將 `last_refresh_time` 與 `last_refreshed_count` 記錄於 `SystemMeta` 表格中。

### 2. 管理員後台控制與 API
* **後台介面**：系統管理員進入「系統管理與資料防護」➜「Render 30天資料刷新與備份」，可即時檢視上一次刷新時間與筆數，並點擊「⚡ 立即手動刷新資料」。
* **API 端點**：
  * `GET /api/admin/refresh-status`：取得上次刷新時間與數量（支援 JWT ADMIN 權限或 `?adminPassword=iamadmin`）。
  * `POST /api/admin/refresh`：手動觸發資料庫刷新檢測與重建取代。

### 3. 次要災難備援 (一鍵匯出與還原 JSON)
* 系統管理員可在同頁面點擊「立即下載資料庫備份檔 (.json)」，亦支援上傳備份 JSON 一鍵還原全庫資料。

---

## 🚀 Render 部署教學 (完全免費)

### 步驟 1：推送到您的 GitHub Repository
本專案已在根目錄配置好 `render.yaml`（Render Blueprint 基礎設施即代碼）。

### 步驟 2：在 Render.com 建立 Blueprint
1. 登入 [Render.com](https://render.com)。
2. 點擊右上角 **New +** ➜ 選擇 **Blueprint**。
3. 連接您的 `gaga-shopping` GitHub 儲存庫。
4. Render 會自動讀取 `render.yaml`，並建立：
   - **Web Service** (`gaga-shopping-service`，免費方案，512MB RAM)
   - **PostgreSQL Database** (`gaga-inventory-db`，免費方案)
5. 點擊 **Apply**，Render 就會自動建置前端 Vite、安裝依賴，並啟動 Node.js 服務！

### 步驟 3：設定圖片永久儲存 (Cloudinary 免費圖床)
> **重要說明**：Render 免費版伺服器的磁碟為暫時性（Ephemeral），重新開機時本地檔案會消失。為保證照片永久不丟失：
1. 前往 [Cloudinary](https://cloudinary.com) 免費註冊帳號（每月有 25GB 免費額度，免信用卡）。
2. 在 Render 專案的 **Environment Variables** 填入：
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
*(未設定時系統會自動使用本地檔案暫存模式作為回退)*

### 步驟 4：初始化資料庫
第一次部署後，可以在 Render Web Service 頁面的 **Shell** 標籤中執行：
```bash
npm run prisma:push && npm run prisma:seed
```
將會自動在資料庫建立預設帳號與示範倉庫商品！

---

## 🔑 預設測試帳號

系統內建一鍵登入測試按鈕，或使用以下帳號密碼登入：

| 角色 | 帳號 | 密碼 | 說明 |
| :--- | :--- | :--- | :--- |
| **系統管理員** | `admin` | `admin123` | 最高管理者，可管理帳號、倉庫與備份 |
| **倉庫管理員** | `manager` | `manager123` | 物品管理、拍照上傳、庫存統計、訂單管理 |
| **一般訂單登記者** | `user` | `user123` | 一般訪客，登記開放物品與送出訂單 |

---

## 💻 本地端開發與測試 (Local Development)

### 1. 安裝套件
```bash
# 根目錄安裝依賴
npm.cmd install

# 前端客戶端安裝依賴
cd client && npm.cmd install && cd ..
```

### 2. 設定環境變數
複製 `.env.example` 為 `.env`，並設定本機或遠端 PostgreSQL 資料庫連線：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gaga_shopping?schema=public"
JWT_SECRET="your_custom_super_secure_jwt_secret_key"
```

### 3. 同步資料庫結構與示範資料
```bash
npm.cmd run prisma:push
npm.cmd run prisma:seed
```

### 4. 啟動前後端同步開發伺服器
```bash
npm.cmd run dev
```
- 前端首頁：`http://localhost:3000`
- 後端 API 與健康檢查：`http://localhost:10000/api/health`
