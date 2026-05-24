const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

// Get all products
router.get('/', (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let products;
    
    if (lowStock === 'true') {
      products = db.getDb().prepare('SELECT * FROM products WHERE quantity <= min_stock ORDER BY quantity ASC').all();
    } else if (category) {
      products = db.getDb().prepare('SELECT * FROM products WHERE category = ? ORDER BY created_at DESC').all(category);
    } else {
      products = db.getDb().prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: '產品不存在' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
router.post('/', (req, res) => {
  try {
    const { name, sku, category, price, cost, quantity, min_stock, unit, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: '名稱和價格為必填欄位' });
    }

    const id = uuidv4();
    db.getDb().prepare(`
      INSERT INTO products (id, name, sku, category, price, cost, quantity, min_stock, unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, sku || null, category || null, price, cost || 0, quantity || 0, min_stock || 10, unit || null, description || null);

    const product = db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', (req, res) => {
  try {
    const { name, sku, category, price, cost, quantity, min_stock, unit, description } = req.body;
    const existing = db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '產品不存在' });

    db.getDb().prepare(`
      UPDATE products SET name = ?, sku = ?, category = ?, price = ?, cost = ?, quantity = ?, min_stock = ?, unit = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(
      name || existing.name, sku, category, price ?? existing.price, cost ?? existing.cost,
      quantity ?? existing.quantity, min_stock ?? existing.min_stock, unit, description,
      req.params.id
    );

    res.json(db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const result = db.getDb().prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '產品不存在' });
    res.json({ message: '產品已刪除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.patch('/:id/stock', (req, res) => {
  try {
    const { quantity, type } = req.body; // type: 'set', 'add', 'subtract'
    const product = db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ error: '產品不存在' });

    let newQuantity = product.quantity;
    if (type === 'add') newQuantity += quantity;
    else if (type === 'subtract') newQuantity -= quantity;
    else newQuantity = quantity;

    db.getDb().prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQuantity, req.params.id);
    res.json(db.getDb().prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.getDb().prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL').all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;