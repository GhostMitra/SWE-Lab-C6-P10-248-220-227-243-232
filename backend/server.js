require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { firebaseConfig, isFirebaseLive } = require('./config/firebase');
const { getBucketStats, BUCKET_NAME, SUB_BUCKETS } = require('./services/storage-bucket.service');
const { getCollectionsStore } = require('./models/firestore-models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/storage', require('./routes/storage.routes'));
app.use('/api/nosql', require('./routes/nosql.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/firebase', require('./routes/firebase.routes'));

// System Architecture & Health Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const bucketStats = getBucketStats();
    const store = getCollectionsStore();

    res.json({
      status: 'ONLINE',
      system: 'IEM Admission Portal',
      team: '404 Brain Not Found (Team 10 - PCCCS594)',
      version: '1.0.0',
      uptime: process.uptime(),
      architecture: {
        stack: 'Pure Firebase Platform (Angular + Express + Firebase Cloud Firestore + Storage Bucket)',
        database: {
          engine: 'Firebase Cloud Firestore (Pure NoSQL Architecture - No SQL Required)',
          cloudLocation: 'nam5 (us-central multi-region)',
          liveDatabase: `projects/${firebaseConfig.projectId}/databases/(default)`,
          totalCollections: Object.keys(store).length,
          collections: Object.keys(store)
        },
        storageBucket: {
          provider: 'Firebase Cloud Storage / Cloud Object Storage',
          bucketUri: `gs://${BUCKET_NAME}`,
          totalObjects: bucketStats.totalObjects,
          totalSizeBytes: bucketStats.totalSizeBytes,
          subBuckets: Object.values(SUB_BUCKETS)
        },
        firebase: {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
          isLiveCloudSdk: isFirebaseLive()
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Serve frontend build if exists
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
const legacyDistPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend');
const distToServe = fs.existsSync(frontendDistPath) ? frontendDistPath : (fs.existsSync(legacyDistPath) ? legacyDistPath : null);

if (distToServe) {
  console.log(`[Frontend] Serving Angular static assets from: ${distToServe}`);
  app.use(express.static(distToServe));
  app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(distToServe, 'index.html'));
    }
  });
}

// Start Server
async function startServer() {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  IEM ADMISSION PORTAL — BACKEND SERVICE STARTED`);
    console.log(`  Server listening on:  http://localhost:${PORT}`);
    console.log(`  Health & Meta API:    http://localhost:${PORT}/api/health`);
    console.log(`  Database Engine:      Firebase Cloud Firestore (Pure NoSQL)`);
    console.log(`  Storage Bucket:       gs://${BUCKET_NAME}`);
    console.log(`================================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
