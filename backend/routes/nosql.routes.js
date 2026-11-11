const express = require('express');
const router = express.Router();
const { FirestoreAuditModel, FirestoreDraftModel, FirestoreQueueModel } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getFirebaseStatus } = require('../config/firebase');

// GET /api/nosql/overview (Admin inspection of Firebase Cloud Firestore NoSQL collections)
router.get('/overview', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const recentAuditLogs = await FirestoreAuditModel.getRecent(20);
    const queuedNotifications = await FirestoreQueueModel.getAll();
    const fbStatus = getFirebaseStatus();

    res.json({
      success: true,
      nosqlEngine: 'Firebase Cloud Firestore (NoSQL Document Store)',
      architectureRole: 'High-speed draft caching, unformatted audit trail, async dispatch queue',
      firebaseStatus: fbStatus.services.cloudFirestore,
      collections: {
        application_drafts: {
          description: 'Document per user for in-progress admission form auto-saving'
        },
        audit_logs: {
          count: recentAuditLogs.length,
          sample: recentAuditLogs
        },
        notification_queue: {
          count: queuedNotifications.length,
          sample: queuedNotifications
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
