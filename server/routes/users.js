const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../utils/database');

// Get all users
router.get('/', (req, res) => {
  try {
    const users = db.getDb().prepare('SELECT id, username, name, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/:id', (req, res) => {
  try {
    const user = db.getDb().prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: '使用者不存在' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', (req, res) => {
  try {
    const { username, password, name, role = 'user' } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    const existing = db.getDb().prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(username);
    if (existing.count > 0) {
      return res.status(400).json({ error: '帳號已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    db.getDb().prepare(`
      INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, name, role);

    const user = db.getDb().prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', (req, res) => {
  try {
    const { name, role, password } = req.body;
    const existing = db.getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: '使用者不存在' });

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.getDb().prepare('UPDATE users SET name = ?, role = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(name || existing.name, role || existing.role, hashedPassword, req.params.id);
    } else {
      db.getDb().prepare('UPDATE users SET name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(name || existing.name, role || existing.role, req.params.id);
    }

    res.json(db.getDb().prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: '無法刪除自己' });
    }
    const result = db.getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: '使用者不存在' });
    res.json({ message: '使用者已刪除' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change own password
router.patch('/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = db.getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ error: '現有密碼錯誤' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.getDb().prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.user.id);

    res.json({ message: '密碼已更改' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;