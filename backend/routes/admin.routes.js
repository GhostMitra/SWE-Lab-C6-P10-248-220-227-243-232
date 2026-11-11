const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { UserModel, CourseModel, ApplicationModel, AuditModel, PaymentModel } = require('../models/sql-models');
const { FirestoreAuditModel } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getBucketStats } = require('../services/storage-bucket.service');

// GET /api/admin/stats (IR-5: Executive Control & Admission Analytics)
router.get('/stats', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const totalAppsRow = await query('SELECT COUNT(*) as total FROM applications');
    const statusCounts = await query(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `);
    const totalPayments = await query(`
      SELECT COUNT(*) as count, SUM(amount) as totalRevenue 
      FROM payments 
      WHERE status = 'SUCCESS'
    `);
    const courseDistribution = await query(`
      SELECT c.courseCode, c.courseName, COUNT(a.applicationId) as appCount
      FROM courses c
      LEFT JOIN applications a ON c.courseId = a.courseId
      GROUP BY c.courseId
    `);
    const totalUsers = await query('SELECT role, COUNT(*) as count FROM users GROUP BY role');

    const bucketStats = getBucketStats();

    res.json({
      success: true,
      stats: {
        totalApplications: totalAppsRow[0] ? totalAppsRow[0].total : 0,
        statusBreakdown: statusCounts,
        revenue: {
          successfulPaymentsCount: totalPayments[0]?.count || 0,
          totalRevenueInr: totalPayments[0]?.totalRevenue || 0
        },
        courseDistribution,
        userRoles: totalUsers,
        storageBucket: bucketStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/audit-trail (View SQL & Firebase Firestore NoSQL combined audit logs)
router.get('/audit-trail', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const sqlLogs = await AuditModel.getRecent(50);
    const firestoreLogs = await FirestoreAuditModel.getRecent(20);
    res.json({
      success: true,
      sqlAuditTrail: sqlLogs,
      firestoreAuditLogs: firestoreLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/merit-list (Ranked merit list)
router.get('/merit-list', authenticateToken, authorizeRoles('ADMINISTRATOR', 'ADMISSION_OFFICER'), async (req, res) => {
  try {
    const { courseId } = req.query;
    let sql = `
      SELECT a.applicationId, a.status, a.applicationDate,
             u.fullName, u.email, u.phone,
             c.courseCode, c.courseName,
             ap.tenthPercentage, ap.twelfthPercentage, ap.twelfthStream,
             p.status AS paymentStatus,
             ROUND((COALESCE(ap.twelfthPercentage, 0) * 0.6 + COALESCE(ap.tenthPercentage, 0) * 0.4), 2) AS meritScore
      FROM applications a
      JOIN users u ON a.userId = u.userId
      JOIN courses c ON a.courseId = c.courseId
      LEFT JOIN applicants ap ON u.userId = ap.userId
      LEFT JOIN payments p ON a.applicationId = p.applicationId
      WHERE 1=1
    `;
    const params = [];
    if (courseId) {
      sql += ` AND a.courseId = ?`;
      params.push(courseId);
    }
    sql += ` ORDER BY meritScore DESC, a.applicationDate ASC`;

    const rawList = await query(sql, params);
    const rankedList = rawList.map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    res.json({ success: true, count: rankedList.length, meritList: rankedList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
