const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { BUCKET_BASE_DIR, BUCKET_NAME, SUB_BUCKETS, listBucketFiles, getBucketStats } = require('../services/storage-bucket.service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/storage/stats (Public / Admin: Storage Bucket Overview)
router.get('/stats', async (req, res) => {
  try {
    const stats = getBucketStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/storage/files (List all objects in Storage Bucket)
router.get('/files', authenticateToken, authorizeRoles('ADMISSION_OFFICER', 'ADMINISTRATOR'), async (req, res) => {
  try {
    const { subBucket } = req.query;
    const files = listBucketFiles(subBucket);
    res.json({ success: true, count: files.length, bucketName: BUCKET_NAME, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/storage/buckets/:subBucket/:filename (Stream / View / Download file from Storage Bucket)
router.get('/buckets/:subBucket/:filename', (req, res) => {
  try {
    const { subBucket, filename } = req.params;

    // Validate subBucket safety
    if (!Object.values(SUB_BUCKETS).includes(subBucket)) {
      return res.status(400).json({ success: false, message: 'Invalid storage bucket requested.' });
    }

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(BUCKET_BASE_DIR, subBucket, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found in storage bucket.' });
    }

    // Set proper Content-Type
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('Storage bucket read error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
