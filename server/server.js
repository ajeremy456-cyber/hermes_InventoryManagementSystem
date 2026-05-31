
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./utils/database');
const authMiddleware = require('./middleware/auth');
const licenseRoutes = require('./routes/license');

// 💡 關鍵安全修正：測試環境下不預先加載 Electron，防止 Node.js 崩潰
let electronApp = null;
let BrowserWindow = null;
try {
  // 只有當透過 Electron 啟動時，這行才不會出錯
  if (process.versions.electron) {
    const electron = require('electron');
    electronApp = electron.app;
    BrowserWindow = electron.BrowserWindow;
  }
} catch (e) {
  // 測試環境下找不到 electron 屬正常現象，靜態跳過
}

// Routes
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchases');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const settingRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.initialize();

// 💡 關鍵路徑相容：確保測試環境與打包環境都能精準抓到前端網頁
const finalDistPath = (electronApp && electronApp.isPackaged)
  ? path.join(__dirname, '../client/dist') 
  : path.join(__dirname, '../client/dist'); 

app.use(express.static(finalDistPath));

// Routes - Public
app.use('/api/auth', authRoutes);
app.use('/api/license', licenseRoutes);

// Routes - Protected
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/settings', authMiddleware, settingRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// Dashboard stats
app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  try {
    const getCurrentTimestamp = () => {
      const now = new Date();
      now.setHours(now.getHours() + 8);
      return now.toISOString().slice(0, 10);
    };
    
    const today = getCurrentTimestamp();
    const monthStart = today.slice(0, 7) + '-01';
    
    const stats = {
      totalCustomers: db.getDb().prepare('SELECT COUNT(*) as count FROM customers').get().count,
      totalProducts: db.getDb().prepare('SELECT COUNT(*) as count FROM products').get().count,
      totalSales: db.getDb().prepare('SELECT COUNT(*) as count FROM sales').get().count,
      totalRevenue: db.getDb().prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales').get().total,
      totalPurchases: db.getDb().prepare('SELECT COUNT(*) as count FROM purchases').get().count,
      totalExpenses: db.getDb().prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases').get().total,
      lowStockProducts: db.getDb().prepare("SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock").get().count,
      monthlyRevenue: db.getDb().prepare('SELECT COALESCE(SUM(final_amount), 0) as total FROM sales WHERE created_at >= ?').get(monthStart + ' 00:00:00').total,
      monthlySalesCount: db.getDb().prepare('SELECT COUNT(*) as count FROM sales WHERE created_at >= ?').get(monthStart + ' 00:00:00').count,
      monthlyExpenses: db.getDb().prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases WHERE created_at >= ?').get(monthStart + ' 00:00:00').total,
      monthlyProfit: 0
    };
    
    stats.monthlyProfit = stats.monthlyRevenue - stats.monthlyExpenses;
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recent sales for dashboard
app.get('/api/dashboard/recent-sales', authMiddleware, (req, res) => {
  try {
    const sales = db.getDb().prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.created_at DESC 
      LIMIT 10
    `).all();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(finalDistPath, 'index.html'));
});

// 💡 建立 Electron 視窗的核心邏輯
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadURL(`http://localhost:${PORT}`);
}

// 💡 關鍵啟動邏輯：自動判定環境！
const startExpressServer = () => {
  app.listen(PORT, async () => {
    console.log('\n========================================');
    console.log('🚗 庫存管理系統啟動成功...');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('========================================\n');
    
    // 如果是在 Electron 環境內啟動，伺服器好之後就打開視窗
    if (electronApp && BrowserWindow) {
      createWindow();
    }
  });
};

if (electronApp) {
  // A環境：在 Electron 桌面端生命週期內啟動
  electronApp.whenReady().then(() => {
    startExpressServer();
    electronApp.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') electronApp.quit();
  });
} else {
  // B環境：你原本的普通測試環境 (Node.js/Nodemon)，直接啟動 Express
  startExpressServer();
}

module.exports = app;