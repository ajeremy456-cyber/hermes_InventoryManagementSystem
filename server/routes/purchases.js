const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { createLog } = require('./logs');

const getCurrentTimestamp = () => {
  const now = new Date();
  now.setHours(now.getHours() + 8);
  return now.toISOString().slice(0, 19).replace('T', ' ');
};

// Get all purchases with product details
router.get('/', (req, res) => {
  try {
    const purchases = db.getDb().prepare('SELECT * FROM purchases ORDER BY created_at DESC').all();
    
    for (const purchase of purchases) {
      const items = db.getDb().prepare(`
        SELECT pi.quantity, p.name as product_name
        FROM purchase_items pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE pi.purchase_id = ?
      `).all(purchase.id);
      
      purchase.product_names = items.map(i => i.product_name).filter(Boolean).join(', ');
      purchase.item_count = items.length;
      purchase.total_quantity = items.reduce((sum, i) => sum + i.quantity, 0);
    }
    
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single purchase with items
router.get('/:id', (req, res) => {
  try {
    const purchase = db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
    if (!purchase) return res.status(404).json({ error: '進貨記錄不存在' });

    const items = db.getDb().prepare(`
      SELECT pi.*, p.name as product_name
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
    `).all(req.params.id);

    res.json({ ...purchase, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create purchase
router.post('/', (req, res) => {
  try {
    const { supplier, items, payment_status = 'pending', note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '請選擇至少一個產品' });
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_cost;
    }

    const purchaseId = uuidv4();
    const now = getCurrentTimestamp();

    db.getDb().prepare(`
      INSERT INTO purchases (id, supplier, total_amount, payment_status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(purchaseId, supplier || null, totalAmount, payment_status, note || null, now);

    const insertItem = db.getDb().prepare(`
      INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_cost, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.getDb().prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?');

    for (const item of items) {
      const itemId = uuidv4();
      const subtotal = item.quantity * item.unit_cost;
      insertItem.run(itemId, purchaseId, item.product_id, item.quantity, item.unit_cost, subtotal);
      updateStock.run(item.quantity, item.product_id);
    }

    const purchase = db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    createLog(req.user?.id, '建立', 'purchase', purchaseId, `建立進貨：供應商 ${supplier || '未知'}，金額：${totalAmount}`);
    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase status
router.patch('/:id/status', (req, res) => {
  try {
    const { payment_status } = req.body;
    const purchase = db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
    if (!purchase) return res.status(404).json({ error: '進貨記錄不存在' });

    db.getDb().prepare('UPDATE purchases SET payment_status = ? WHERE id = ?').run(payment_status, req.params.id);
    const updated = db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
    createLog(req.user?.id, '更新', 'purchase', req.params.id, `更新付款狀態：${payment_status}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete purchase
router.delete('/:id', (req, res) => {
  try {
    const purchase = db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
    if (!purchase) return res.status(404).json({ error: '進貨記錄不存在' });

    const items = db.getDb().prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(req.params.id);
    const updateStock = db.getDb().prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');

    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    db.getDb().prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(req.params.id);
    db.getDb().prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id);

    createLog(req.user?.id, '刪除', 'purchase', req.params.id, `刪除進貨：供應商 ${purchase.supplier}`);
    res.json({ message: '進貨記錄已刪除（庫存已還原）' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;