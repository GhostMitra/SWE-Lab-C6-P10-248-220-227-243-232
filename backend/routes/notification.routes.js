const express = require('express');
const router = express.Router();
const { NotificationModel } = require('../models/sql-models');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const list = await NotificationModel.findByUserId(req.user.userId);
    res.json({ success: true, count: list.length, notifications: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
