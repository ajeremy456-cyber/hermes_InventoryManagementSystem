const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

// Get all purchases
router.get('/', (req, res) => {
  try {
    const purchases = db.getDb().prepare('SELECT * FROM purchases ORDER BY created_at DESC').all();
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
      SELECT pi.*, p.name as product_name, p.sku
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

    db.getDb().prepare(`
      INSERT INTO purchases (id, supplier, total_amount, payment_status, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(purchaseId, supplier || null, totalAmount, payment_status, note || null);

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
    res.json(db.getDb().prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id));
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

    res.json({ message: '進貨記錄已刪除（庫存已還原）' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;