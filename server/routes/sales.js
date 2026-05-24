const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

const generateOrderNumber = () => {
  const result = db.getDb().prepare("SELECT COUNT(*) as count FROM sales").get();
  return `S${result.count + 1}`;
};

// Get all sales
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    let query = `
      SELECT s.*, c.name as customer_name, c.license_plate as vehicle_plate 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND s.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND s.created_at <= ?';
      params.push(endDate);
    }
    if (customerId) {
      query += ' AND s.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY s.created_at DESC';
    const sales = db.getDb().prepare(query).all(...params);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single sale with items
router.get('/:id', (req, res) => {
  try {
    const sale = db.getDb().prepare(`
      SELECT s.*, c.name as customer_name, c.license_plate as vehicle_plate 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!sale) return res.status(404).json({ error: '銷售記錄不存在' });
    
    const items = db.getDb().prepare(`
      SELECT si.*, p.name as product_name 
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `).all(req.params.id);
    
    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sale
router.post('/', (req, res) => {
  try {
    const { customer_id, items, discount = 0, payment_method = 'cash', note, invoice_number, next_service_date } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '請選擇至少一個產品' });
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_price;
    }
    const finalAmount = totalAmount - discount;

    const saleId = uuidv4();
    const orderNumber = generateOrderNumber();
    
    db.getDb().prepare(`
      INSERT INTO sales (id, order_number, customer_id, invoice_number, total_amount, discount, final_amount, payment_method, note, next_service_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(saleId, orderNumber, customer_id || null, invoice_number || null, totalAmount, discount, finalAmount, payment_method, note || null, next_service_date || null);

    // Insert items and update stock
    const insertItem = db.getDb().prepare(`
      INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const updateStock = db.getDb().prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');

    for (const item of items) {
      const itemId = uuidv4();
      const subtotal = item.quantity * item.unit_price;
      insertItem.run(itemId, saleId, item.product_id, item.quantity, item.unit_price, subtotal);
      updateStock.run(item.quantity, item.product_id);
    }

    const sale = db.getDb().prepare(`
      SELECT s.*, c.name as customer_name, c.license_plate as vehicle_plate 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `).get(saleId);

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete sale (void)
router.delete('/:id', (req, res) => {
  try {
    const sale = db.getDb().prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    if (!sale) return res.status(404).json({ error: '銷售記錄不存在' });

    // Restore stock
    const items = db.getDb().prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(req.params.id);
    const updateStock = db.getDb().prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?');
    
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // Delete items then sale
    db.getDb().prepare('DELETE FROM sale_items WHERE sale_id = ?').run(req.params.id);
    db.getDb().prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    
    res.json({ message: '銷售記錄已刪除（庫存已還原）' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales report
router.get('/report/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    const summary = db.getDb().prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(SUM(final_amount), 0) as net_revenue
      FROM sales WHERE ${whereClause}
    `).get(...params);

    const byPayment = db.getDb().prepare(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(final_amount), 0) as amount
      FROM sales WHERE ${whereClause}
      GROUP BY payment_method
    `).all(...params);

    const topProducts = db.getDb().prepare(`
      SELECT p.name, SUM(si.quantity) as total_qty, SUM(si.subtotal) as total_amount
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 10
    `).all(...params);

    res.json({ summary, byPayment, topProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;