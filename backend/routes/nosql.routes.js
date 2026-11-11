const express = require('express');
const router = express.Router();
const { getCollectionsStore } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getFirebaseStatus } = require('../config/firebase');

// GET /api/nosql/overview (Admin inspection of Firebase Cloud Firestore collections)
router.get('/overview', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const store = getCollectionsStore();
    const fbStatus = getFirebaseStatus();

    const collectionSummaries = {};
    Object.keys(store).forEach(name => {
      const data = store[name];
      const isArray = Array.isArray(data);
      const count = isArray ? data.length : Object.keys(data).length;
      collectionSummaries[name] = {
        count,
        sample: isArray ? data.slice(0, 3) : Object.values(data).slice(0, 3)
      };
    });

    res.json({
      success: true,
      nosqlEngine: 'Firebase Cloud Firestore (Pure NoSQL Architecture)',
      database: `projects/iem-admission-404bn/databases/(default)`,
      location: 'nam5',
      firebaseStatus: fbStatus.services.cloudFirestore,
      totalCollections: Object.keys(store).length,
      collections: collectionSummaries
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
