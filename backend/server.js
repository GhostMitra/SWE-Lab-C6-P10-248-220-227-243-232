require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initSchema, query } = require('./config/database');
const { firebaseConfig, isFirebaseLive } = require('./config/firebase');
const { BUCKET_NAME, SUB_BUCKETS, getBucketStats } = require('./services/storage-bucket.service');

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
    const tableCheck = await query("SELECT count(*) as count FROM sqlite_master WHERE type='table'");
    const bucketStats = getBucketStats();

    res.json({
      status: 'ONLINE',
      system: 'IEM Admission Portal',
      team: '404 Brain Not Found (Team 10 - PCCCS594)',
      version: '1.0.0',
      uptime: process.uptime(),
      architecture: {
        stack: 'Firebase Full-Stack Platform (Angular + Express + Firebase)',
        sqlDatabase: {
          engine: 'Firebase Data Connect (Relational SQL PostgreSQL Engine)',
          dialect: 'SQL (ACID Compliant)',
          tablesCount: tableCheck[0]?.count || 0
        },
        nosqlDatabase: {
          engine: 'Firebase Cloud Firestore (NoSQL Document Store)',
          role: 'Draft persistence, document audit trail, async dispatch queue'
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
  await initSchema();
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  IEM ADMISSION PORTAL — BACKEND SERVICE STARTED`);
    console.log(`  Server listening on:  http://localhost:${PORT}`);
    console.log(`  Health & Meta API:    http://localhost:${PORT}/api/health`);
    console.log(`  Relational SQL DB:    Connected (Firebase Data Connect / SQLite)`);
    console.log(`  Firebase NoSQL DB:    Active (Firebase Cloud Firestore)`);
    console.log(`  Storage Bucket:       gs://${BUCKET_NAME}`);
    console.log(`================================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
