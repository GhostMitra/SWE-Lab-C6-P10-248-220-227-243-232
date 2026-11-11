const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');
const { UserModel } = require('../models/sql-models');

const JWT_SECRET = process.env.JWT_SECRET || 'iem-admission-portal-secret-key-2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Authentication token required.' });
  }

  try {
    // 1. Check if token is a Firebase ID Token
    if (token.startsWith('firebase-') || token.length > 500) {
      const fbDecoded = await verifyFirebaseToken(token);
      if (fbDecoded) {
        const user = await UserModel.findByEmail(fbDecoded.email);
        if (user) {
          req.user = user;
          return next();
        }
      }
    }

    // 2. Verify standard JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
