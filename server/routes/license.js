const express = require('express');
const router = express.Router();
const db = require('../utils/database');

// 驗證授權碼
router.post('/verify', (req, res) => {
  try {
    const { license_key } = req.body;
    
    if (!license_key) {
      return res.status(400).json({ error: '請輸入授權碼' });
    }

    // 獲取正確的授權碼
    const correctKey = db.getDb().prepare("SELECT value FROM settings WHERE `key` = 'license_key'").get();
    
    if (!correctKey) {
      return res.status(500).json({ error: '系統錯誤：找不到授權碼設定' });
    }

    // 驗證授權碼是否正確（不區分大小寫）
    if (license_key.toUpperCase() === correctKey.value.toUpperCase()) {
      return res.json({ valid: true, message: '授權碼驗證成功' });
    } else {
      return res.json({ valid: false, message: '授權碼錯誤' });
    }
  } catch (error) {
    console.error('授權碼驗證錯誤:', error);
    res.status(500).json({ error: '驗證失敗' });
  }
});

// 激活授權
router.post('/activate', (req, res) => {
  try {
    const { license_key } = req.body;
    
    // 驗證授權碼
    const correctKey = db.getDb().prepare("SELECT value FROM settings WHERE `key` = 'license_key'").get();
    
    if (!correctKey || license_key.toUpperCase() !== correctKey.value.toUpperCase()) {
      return res.status(400).json({ error: '授權碼錯誤' });
    }

    // 更新授權狀態
    const activatedAt = new Date().toISOString();
    
    db.getDb().prepare("UPDATE settings SET value = 'true', updated_at = CURRENT_TIMESTAMP WHERE `key` = 'license_activated'").run();
    db.getDb().prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE `key` = 'license_activated_at'").run(activatedAt);

    res.json({ 
      success: true, 
      message: '授權激活成功',
      activated_at: activatedAt
    });
  } catch (error) {
    console.error('授權激活錯誤:', error);
    res.status(500).json({ error: '激活失敗' });
  }
});

// 檢查授權狀態
router.get('/status', (req, res) => {
  try {
    const activated = db.getDb().prepare("SELECT value FROM settings WHERE `key` = 'license_activated'").get();
    const activatedAt = db.getDb().prepare("SELECT value FROM settings WHERE `key` = 'license_activated_at'").get();
    const licenseKey = db.getDb().prepare("SELECT value FROM settings WHERE `key` = 'license_key'").get();

    res.json({
      activated: activated ? activated.value === 'true' : false,
      activated_at: activatedAt ? activatedAt.value : null,
      license_key: licenseKey ? licenseKey.value : null
    });
  } catch (error) {
    console.error('檢查授權狀態錯誤:', error);
    res.status(500).json({ error: '檢查失敗' });
  }
});

module.exports = router;