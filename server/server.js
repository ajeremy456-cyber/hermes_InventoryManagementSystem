const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./utils/database');
const authMiddleware = require('./middleware/auth');
const License = require('./utils/License');

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

// Routes - Public
app.use('/api/auth', authRoutes);

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
    const stats = {
      totalCustomers: db.getDb().prepare('SELECT COUNT(*) as count FROM customers').get().count,
      totalProducts: db.getDb().prepare('SELECT COUNT(*) as count FROM products').get().count,
      totalSales: db.getDb().prepare('SELECT COUNT(*) as count FROM sales').get().count,
      totalRevenue: db.getDb().prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales').get().total,
      totalPurchases: db.getDb().prepare('SELECT COUNT(*) as count FROM purchases').get().count,
      totalExpenses: db.getDb().prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases').get().total,
      lowStockProducts: db.getDb().prepare("SELECT COUNT(*) as count FROM products WHERE quantity <= min_stock").get().count
    };
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

app.listen(PORT, async () => {
  console.log('\n========================================');
  console.log('🚗 系統啟動中...');
  
  const licenseResult = await License.verify();
  
  if (!licenseResult.valid) {
    console.error('\n❌ 授權驗證失敗！');
    console.error('📋 錯誤原因：' + licenseResult.error);
    console.error('\n請聯絡系統管理員處理。');
    console.error('========================================\n');
    process.exit(1);
  }
  
  if (licenseResult.isNew) {
    console.log('✅ ' + licenseResult.message);
  } else {
    console.log('✅ ' + licenseResult.message);
  }
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('========================================\n');
});

module.exports = app;