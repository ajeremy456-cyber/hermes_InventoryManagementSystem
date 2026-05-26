const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { createLog } = require('./logs');

// Get all customers
router.get('/', (req, res) => {
  try {
    const customers = db.getDb().prepare(`
      SELECT c.*, 
             (SELECT MAX(s.created_at) 
              FROM sales s 
              WHERE s.customer_id = c.id) as last_visit_date,
             (SELECT s.next_service_date 
              FROM sales s 
              WHERE s.customer_id = c.id AND s.next_service_date IS NOT NULL AND s.next_service_date != ''
              ORDER BY s.created_at DESC 
              LIMIT 1) as next_service_date
      FROM customers c 
      ORDER BY c.created_at DESC
    `).all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single customer
router.get('/:id', (req, res) => {
  try {
    const customer = db.getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: '客戶不存在' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', (req, res) => {
  try {
    const { name, phone, license_plate, car_model, manufacture_date, next_service_date } = req.body;
    if (!name) return res.status(400).json({ error: '姓名為必填欄位' });

    const id = uuidv4();
    db.getDb().prepare(`
      INSERT INTO customers (id, name, phone, license_plate, car_model, manufacture_date, next_service_date) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone || null, license_plate || null, car_model || null, manufacture_date || null, next_service_date || null);

    const customer = db.getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id);
    createLog(req.user?.id, '建立', 'customer', id, `建立客戶：${name}`);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const { name, phone, license_plate, car_model, manufacture_date, next_service_date } = req.body;
    const existing = db.getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '客戶不存在' });

    db.getDb().prepare(`
      UPDATE customers SET name = ?, phone = ?, license_plate = ?, car_model = ?, manufacture_date = ?, next_service_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name || existing.name, phone, license_plate, car_model, manufacture_date, next_service_date, req.params.id);

    const updated = db.getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    createLog(req.user?.id, '更新', 'customer', req.params.id, `更新客戶：${updated.name}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', (req, res) => {
  try {
    const existing = db.getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '客戶不存在' });

    const result = db.getDb().prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '客戶不存在' });

    createLog(req.user?.id, '刪除', 'customer', req.params.id, `刪除客戶：${existing.name}`);
    res.json({ message: '客戶已刪除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search customers
router.get('/search/:keyword', (req, res) => {
  try {
    const keyword = `%${req.params.keyword}%`;
    const customers = db.getDb().prepare(`
      SELECT c.*, 
             (SELECT MAX(s.created_at) 
              FROM sales s 
              WHERE s.customer_id = c.id) as last_visit_date
      FROM customers c 
      WHERE c.name LIKE ? OR c.phone LIKE ? OR c.license_plate LIKE ? 
      ORDER BY c.name
    `).all(keyword, keyword, keyword);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;