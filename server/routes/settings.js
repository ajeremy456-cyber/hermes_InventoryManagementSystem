const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const { createLog } = require('./logs');

// Get all settings
router.get('/', (req, res) => {
  try {
    const settings = db.getDb().prepare('SELECT * FROM settings ORDER BY key').all();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings (bulk)
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.getDb().prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = db.getDb().transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        updateStmt.run(key, value);
      }
    });

    transaction();
    createLog(req.user?.id, '更新', 'settings', null, `更新系統設定：${Object.keys(updates).join(', ')}`);
    res.json({ message: '設定已更新' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single setting
router.get('/:key', (req, res) => {
  try {
    const setting = db.getDb().prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    if (!setting) return res.status(404).json({ error: '設定不存在' });
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update single setting
router.put('/:key', (req, res) => {
  try {
    const { value } = req.body;
    db.getDb().prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(req.params.key, value);
    createLog(req.user?.id, '更新', 'settings', null, `更新設定：${req.params.key}`);
    res.json({ message: '設定已更新' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;