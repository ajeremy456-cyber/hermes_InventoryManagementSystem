const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const getDb = () => require('../utils/database').getDb();

const initTable = () => {
  try {
    getDb().exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Failed to initialize categories table:', error);
  }
};

router.use((req, res, next) => {
  initTable();
  next();
});

router.get('/', (req, res) => {
  try {
    const categories = getDb().prepare('SELECT * FROM categories ORDER BY parent_id, sort_order, name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, parent_id, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: '類別名稱為必填欄位' });

    const id = uuidv4();
    getDb().prepare(`
      INSERT INTO categories (id, name, parent_id, sort_order) VALUES (?, ?, ?, ?)
    `).run(id, name, parent_id || null, sort_order || 0);

    const category = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, parent_id, sort_order } = req.body;
    const existing = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '類別不存在' });

    getDb().prepare(`
      UPDATE categories SET name = ?, parent_id = ?, sort_order = ? WHERE id = ?
    `).run(name || existing.name, parent_id !== undefined ? parent_id : existing.parent_id, sort_order !== undefined ? sort_order : existing.sort_order, req.params.id);

    const category = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const category = getDb().prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) return res.status(404).json({ error: '類別不存在' });

    getDb().prepare('UPDATE categories SET parent_id = ? WHERE parent_id = ?').run(null, req.params.id);

    getDb().prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    
    res.json({ message: '類別已刪除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;