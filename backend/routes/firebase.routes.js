const express = require('express');
const router = express.Router();
const { firebaseConfig, updateFirebaseConfig, getFirebaseStatus, verifyFirebaseToken } = require('../config/firebase');

// GET /api/firebase/status (Live diagnostic check)
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ...getFirebaseStatus()
  });
});

// GET /api/firebase/config (Public Firebase client configuration)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId
    }
  });
});

// POST /api/firebase/config (Admin / Developer update config)
router.post('/config', (req, res) => {
  try {
    const updated = updateFirebaseConfig(req.body);
    res.json({
      success: true,
      message: 'Firebase configuration updated successfully.',
      config: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/firebase/verify-token
router.post('/verify-token', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required.' });
    }
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
