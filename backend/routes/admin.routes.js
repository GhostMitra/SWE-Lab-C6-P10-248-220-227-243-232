const express = require('express');
const router = express.Router();
const { UserModel, CourseModel, ApplicationModel, AuditModel, PaymentModel, getCollectionsStore } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getBucketStats } = require('../services/storage-bucket.service');

// GET /api/admin/stats (IR-5: Executive Control & Admission Analytics from Firestore)
router.get('/stats', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const store = getCollectionsStore();
    const apps = Object.values(store.applications || {});
    const courses = Object.values(store.courses || {});
    const users = Object.values(store.users || {});
    const payments = Object.values(store.payments || {});

    // Status breakdown
    const statusMap = {};
    apps.forEach(a => {
      const s = a.status || 'UNKNOWN';
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Revenue
    const completedPayments = payments.filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Course distribution
    const courseDistribution = courses.map(c => {
      const appCount = apps.filter(a => String(a.courseId) === String(c.courseId) || a.courseCode === c.courseCode).length;
      return {
        courseCode: c.courseCode,
        courseName: c.courseName,
        appCount
      };
    });

    // User roles
    const roleMap = {};
    users.forEach(u => {
      const r = u.role || 'APPLICANT';
      roleMap[r] = (roleMap[r] || 0) + 1;
    });
    const userRoles = Object.entries(roleMap).map(([role, count]) => ({ role, count }));

    const bucketStats = getBucketStats();

    res.json({
      success: true,
      stats: {
        totalApplications: apps.length,
        statusBreakdown,
        revenue: {
          successfulPaymentsCount: completedPayments.length,
          totalRevenueInr: totalRevenue
        },
        courseDistribution,
        userRoles,
        storageBucket: bucketStats,
        database: {
          engine: 'Firebase Cloud Firestore (Pure NoSQL)',
          collectionsCount: Object.keys(store).length
        }
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

// GET /api/admin/audit-trail (View Firebase Firestore audit logs)
router.get('/audit-trail', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const auditLogs = await AuditModel.getRecent(50);
    res.json({
      success: true,
      firestoreAuditLogs: auditLogs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/merit-list (Ranked merit list from Firestore)
router.get('/merit-list', authenticateToken, authorizeRoles('ADMINISTRATOR', 'ADMISSION_OFFICER'), async (req, res) => {
  try {
    const { courseId } = req.query;
    let list = await ApplicationModel.getMeritRankings();

    if (courseId) {
      list = list.filter(a => String(a.courseId) === String(courseId) || a.courseCode === courseId);
      list = list.map((item, idx) => ({ ...item, rank: idx + 1 }));
    }

    res.json({ success: true, count: list.length, meritList: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
