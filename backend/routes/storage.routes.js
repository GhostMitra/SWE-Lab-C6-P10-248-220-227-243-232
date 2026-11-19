const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { BUCKET_BASE_DIR, BUCKET_NAME, SUB_BUCKETS, listBucketFiles, getBucketStats, getStorageBucket } = require('../services/storage-bucket.service');
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
    const files = await listBucketFiles(subBucket);
    res.json({ success: true, count: files.length, bucketName: BUCKET_NAME, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/storage/buckets/:subBucket/:filename (Stream / View / Download file from Storage Bucket)
router.get('/buckets/:subBucket/:filename', async (req, res) => {
  try {
    const { subBucket, filename } = req.params;

    // Validate subBucket safety
    if (!Object.values(SUB_BUCKETS).includes(subBucket)) {
      return res.status(400).json({ success: false, message: 'Invalid storage bucket requested.' });
    }

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(BUCKET_BASE_DIR, subBucket, safeFilename);

    const setMimeHeaders = () => {
      const ext = path.extname(safeFilename).toLowerCase();
      if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      } else if (ext === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (['.png'].includes(ext)) {
        res.setHeader('Content-Type', 'image/png');
      }
    };

    // 1. If cached on local / tmp filesystem, stream immediately
    if (fs.existsSync(filePath)) {
      setMimeHeaders();
      return fs.createReadStream(filePath).pipe(res);
    }

    // 2. In serverless / multi-instance: stream directly from Firebase Cloud Storage bucket
    const bucket = getStorageBucket();
    if (bucket) {
      const cloudFile = bucket.file(`${subBucket}/${safeFilename}`);
      const [exists] = await cloudFile.exists().catch(() => [false]);
      if (exists) {
        setMimeHeaders();
        return cloudFile.createReadStream().on('error', (err) => {
          console.error('[Storage Stream Error]:', err.message);
          if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
        }).pipe(res);
      }
    }

    // 3. Fallback: redirect to public Firebase Storage URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(subBucket + '/' + safeFilename)}?alt=media`;
    return res.redirect(publicUrl);
  } catch (err) {
    console.error('Storage bucket read error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
