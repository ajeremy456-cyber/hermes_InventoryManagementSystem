const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供認證令牌' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '無效的認證格式' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '認證失敗或權杖已過期' });
  }
}

module.exports = authMiddleware;