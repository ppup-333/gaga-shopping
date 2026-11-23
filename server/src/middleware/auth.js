const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'gaga_render_super_secret_jwt_key_2026';

// 驗證 Token 中間件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, fullName: true, role: true }
    });
    if (!user) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// 嚴格登入要求
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '請先登入後再進行此操作' });
  }
  next();
};

// 角色權限檢查中間件
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授權，請先登入' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '權限不足，無法執行此操作' });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAuth,
  requireRole
};
