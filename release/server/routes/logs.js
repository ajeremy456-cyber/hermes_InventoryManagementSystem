const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');

// Get all logs (admin only in production)
router.get('/', (req, res) => {
  try {
    const { entityType, userId, startDate, endDate, limit = 100 } = req.query;
    
    let query = `
      SELECT l.*, u.name as user_name 
      FROM logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (entityType) {
      query += ' AND l.entity_type = ?';
      params.push(entityType);
    }
    if (userId) {
      query += ' AND l.user_id = ?';
      params.push(userId);
    }
    if (startDate) {
      query += ' AND l.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND l.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const logs = db.getDb().prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create log entry (internal use)
function createLog(userId, action, entityType, entityId, details, ipAddress) {
  try {
    const id = uuidv4();
    db.getDb().prepare(`
      INSERT INTO logs (id, user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, action, entityType, entityId, details || null, ipAddress || null);
  } catch (error) {
    console.error('Failed to create log:', error);
  }
}

// Export for use in other routes
module.exports = router;
module.exports.createLog = createLog;