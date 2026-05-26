const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret-key-change-in-production';

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '請輸入帳號和密碼' });
    }

    const user = db.getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register (admin only in production)
router.post('/register', (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    
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
      INSERT INTO users (id, username, password, name, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run(id, username, hashedPassword, name, role || 'user');

    res.json({ message: '註冊成功', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: '未認證' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getDb().prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) return res.status(404).json({ error: '使用者不存在' });
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: '認證失敗' });
  }
});

module.exports = router;