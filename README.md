# 庫存管理系統 (Inventory Management System)

一個基於 Node.js + Express + React 的庫存管理系統。

## 功能

- **客戶管理** - 新增、編輯、刪除客戶資料
- **庫存管理** - 產品 CRUD、低庫存警示
- **銷售管理** - 建立銷售訂單、庫存自動扣減
- **進貨管理** - 建立進貨記錄、庫存自動增加
- **銷售報表** - 營收統計、暢銷商品分析
- **使用者管理** - 多使用者系統、角色權限
- **操作紀錄** - 所有操作留有紀錄
- **系統設定** - 公司名稱、幣別、稅率等

## 技術棧

- **後端**: Node.js + Express + SQLite
- **前端**: React + Vite + React Router
- **認證**: JWT

## 快速開始

### 安裝

```bash
# 安裝後端依賴
cd server
npm install

# 安裝前端依賴
cd ../client
npm install
```

### 啟動

```bash
# 終端機 1 - 啟動後端 (port 3001)
cd server
node server.js

# 終端機 2 - 啟動前端 (port 5173)
cd client
npm run dev
```

### 預設帳號

- 帳號: `admin`
- 密碼: `admin123`

## API 端點

### 認證
- `POST /api/auth/login` - 登入
- `POST /api/auth/register` - 註冊

### 客戶
- `GET /api/customers` - 取得所有客戶
- `POST /api/customers` - 新增客戶
- `PUT /api/customers/:id` - 更新客戶
- `DELETE /api/customers/:id` - 刪除客戶

### 產品
- `GET /api/products` - 取得所有產品
- `POST /api/products` - 新增產品
- `PUT /api/products/:id` - 更新產品
- `DELETE /api/products/:id` - 刪除產品
- `PATCH /api/products/:id/stock` - 更新庫存

### 銷售
- `GET /api/sales` - 取得所有銷售記錄
- `POST /api/sales` - 新增銷售
- `DELETE /api/sales/:id` - 刪除銷售（並還原庫存）
- `GET /api/sales/report/summary` - 銷售報表

### 進貨
- `GET /api/purchases` - 取得所有進貨記錄
- `POST /api/purchases` - 新增進貨
- `DELETE /api/purchases/:id` - 刪除進貨（並還原庫存）

### 使用者
- `GET /api/users` - 取得所有使用者
- `POST /api/users` - 新增使用者
- `PUT /api/users/:id` - 更新使用者
- `DELETE /api/users/:id` - 刪除使用者

### 設定
- `GET /api/settings` - 取得所有設定
- `PUT /api/settings` - 批次更新設定

### 日誌
- `GET /api/logs` - 取得操作日誌

## 資料庫結構

- `customers` - 客戶資料
- `products` - 產品資料
- `sales` - 銷售主檔
- `sale_items` - 銷售明細
- `purchases` - 進貨主檔
- `purchase_items` - 進貨明細
- `users` - 使用者
- `logs` - 操作日誌
- `settings` - 系統設定

## License

MIT