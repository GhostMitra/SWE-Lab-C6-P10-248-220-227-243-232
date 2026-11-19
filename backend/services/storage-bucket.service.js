/**
 * Storage Bucket Service (Object Storage Layer)
 * Implements Cloud Object Storage as specified in IEM Admission Portal HLD Layer 4:
 * - Academic Docs Bucket: 10th & 12th Marksheet PDFs
 * - Candidate Media Bucket: Passport Photos & Signatures
 * - Verification Certs Bucket: Identity Proofs & Categories
 * - Generated Letters Bucket: Official Admission Letters
 * 
 * Supports Firebase Cloud Storage (@google-cloud/storage / Firebase Admin) with local persistent bucket simulation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { isFirebaseLive, firebaseConfig, getLiveAccessToken } = require('../config/firebase');

const isServerless = !!(process.env.FUNCTION_NAME || process.env.K_SERVICE || process.env.FIREBASE_CONFIG || process.env.LAMBDA_TASK_ROOT);
const BUCKET_BASE_DIR = isServerless 
  ? path.join(os.tmpdir(), 'iem-storage-bucket') 
  : path.join(__dirname, '..', 'storage-bucket');

const BUCKET_NAME = firebaseConfig.storageBucket || 'iem-admission-404bn.firebasestorage.app';

const SUB_BUCKETS = {
  ACADEMIC_DOCS: 'academic-docs',
  CANDIDATE_MEDIA: 'candidate-media',
  VERIFICATION_CERTS: 'verification-certs',
  GENERATED_LETTERS: 'generated-letters'
};

// Ensure all bucket directories exist safely (never throw on read-only environments)
try {
  Object.values(SUB_BUCKETS).forEach(folder => {
    const dir = path.join(BUCKET_BASE_DIR, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (e) {
  console.warn('[Storage Bucket] Directory pre-creation notice:', e.message);
}

// Lazy-initialized Firebase Admin Storage Bucket reference
let adminStorageBucket = null;

function getStorageBucket() {
  if (adminStorageBucket) return adminStorageBucket;
  try {
    const admin = require('firebase-admin');
    const existingApps = admin.getApps ? admin.getApps() : (admin.apps || []);
    if (!existingApps.length) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: BUCKET_NAME
      });
    }
    const { getStorage } = require('firebase-admin/storage');
    adminStorageBucket = getStorage().bucket(BUCKET_NAME);
    return adminStorageBucket;
  } catch (err) {
    console.warn('[Storage Bucket] Firebase Admin Storage init notice:', err.message);
    return null;
  }
}

/**
 * Direct Live Cloud Storage Upload Helper
 * Uses Firebase Admin Storage (Application Default Credentials in Cloud Functions)
 * with REST API fallback for local development.
 */
async function uploadToLiveCloudBucket(objectPath, buffer, contentType) {
  // 1. Primary: Firebase Admin SDK (Cloud Functions native service account)
  try {
    const bucket = getStorageBucket();
    if (bucket) {
      const file = bucket.file(objectPath);
      await file.save(buffer, {
        contentType: contentType || 'application/octet-stream',
        resumable: false,
        metadata: {
          contentType: contentType || 'application/octet-stream'
        }
      });
      console.log(`[Storage Bucket] Synced ${objectPath} via Admin SDK to gs://${BUCKET_NAME}/${objectPath}`);
      return { bucket: BUCKET_NAME, object: objectPath };
    }
  } catch (adminErr) {
    console.warn(`[Storage Bucket] Admin SDK upload notice for ${objectPath}:`, adminErr.message);
  }

  // 2. Secondary: CLI Access Token via REST
  try {
    const token = getLiveAccessToken();
    if (token) {
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': contentType || 'application/octet-stream'
        },
        body: buffer
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Storage Bucket] Synced ${objectPath} via REST to gs://${BUCKET_NAME}/${objectPath}`);
        return data;
      }
    }
  } catch (err) {
    console.warn(`[Storage Bucket] REST upload notice for ${objectPath}:`, err.message);
  }

  return null;
}

/**
 * Determine destination bucket based on docType or category
 */
function resolveSubBucket(docType) {
  switch (docType) {
    case 'MARKSHEET_10':
    case 'MARKSHEET_12':
      return SUB_BUCKETS.ACADEMIC_DOCS;
    case 'PHOTO_SIGNATURE':
      return SUB_BUCKETS.CANDIDATE_MEDIA;
    case 'IDENTITY_PROOF':
      return SUB_BUCKETS.VERIFICATION_CERTS;
    case 'ADMISSION_LETTER':
      return SUB_BUCKETS.GENERATED_LETTERS;
    default:
      return SUB_BUCKETS.ACADEMIC_DOCS;
  }
}

/**
 * Upload a file into the storage bucket
 */
async function uploadToBucket({ buffer, originalname, mimetype, docType, applicationId }) {
  const subBucket = resolveSubBucket(docType);
  const ext = path.extname(originalname) || '.pdf';
  const cleanName = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${applicationId || 'general'}_${docType}_${Date.now()}${ext}`;
  const objectPath = `${subBucket}/${filename}`;
  const localDest = path.join(BUCKET_BASE_DIR, subBucket, filename);

  // Write to local / tmp bucket directory safely
  try {
    const dir = path.dirname(localDest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localDest, buffer);
  } catch (fsErr) {
    console.warn('[Storage Bucket] Local fs write notice:', fsErr.message);
  }

  // Upload to live Cloud Storage bucket
  await uploadToLiveCloudBucket(objectPath, buffer, mimetype);

  const bucketPath = `gs://${BUCKET_NAME}/${subBucket}/${filename}`;
  const publicUrl = `/api/storage/buckets/${subBucket}/${filename}`;

  return {
    bucketName: BUCKET_NAME,
    subBucket,
    filename,
    originalName: originalname,
    mimeType: mimetype,
    size: buffer.length,
    bucketPath,
    publicUrl,
    localPath: localDest,
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Generate official admission offer letter and save to generated-letters bucket
 */
function generateAdmissionLetter({ application, user, course, payment }) {
  const subBucket = SUB_BUCKETS.GENERATED_LETTERS;
  const filename = `Admit_Letter_${application.applicationId}.html`;
  const objectPath = `${subBucket}/${filename}`;
  const localDest = path.join(BUCKET_BASE_DIR, subBucket, filename);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IEM Kolkata - Official Admission Offer Letter</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 20px; }
    .logo-text { font-size: 26px; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; }
    .sub-text { font-size: 14px; color: #64748b; margin-top: 5px; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-top: 15px; }
    .details-box { margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; background: #f8fafc; }
    .row { display: flex; margin-bottom: 12px; }
    .label { width: 220px; font-weight: bold; color: #475569; }
    .val { color: #0f172a; flex: 1; }
    .remarks { margin-top: 25px; padding: 15px; background: #eff6ff; border-left: 4px solid #2563eb; font-style: italic; }
    .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sign-box { text-align: center; }
    .sign-line { width: 180px; border-top: 1px solid #000; margin-top: 40px; font-weight: bold; font-size: 13px; }
    .watermark { position: fixed; top: 40%; left: 25%; font-size: 80px; color: rgba(30, 58, 138, 0.04); transform: rotate(-30deg); font-weight: bold; pointer-events: none; }
  </style>
</head>
<body>
  <div class="watermark">IEM KOLKATA</div>
  <div class="header">
    <div class="logo-text">INSTITUTE OF ENGINEERING & MANAGEMENT (IEM)</div>
    <div class="sub-text">Sector V, Salt Lake Electronics Complex, Kolkata, West Bengal 700091</div>
    <div class="sub-text">Approved by AICTE | Affiliated to MAKAUT | Grade 'A' Accredited</div>
    <div class="badge">OFFICIAL PROVISIONAL ADMISSION LETTER — 2026-2027</div>
  </div>

  <div class="details-box">
    <div class="row"><div class="label">Application Reference ID:</div><div class="val"><strong>${application.applicationId}</strong></div></div>
    <div class="row"><div class="label">Applicant Full Name:</div><div class="val"><strong>${user.fullName}</strong></div></div>
    <div class="row"><div class="label">Registered Email:</div><div class="val">${user.email}</div></div>
    <div class="row"><div class="label">Contact Phone:</div><div class="val">${user.phone || 'N/A'}</div></div>
    <div class="row"><div class="label">Offered Program / Course:</div><div class="val"><strong>${course.courseName} (${course.courseCode})</strong></div></div>
    <div class="row"><div class="label">Academic Degree Level:</div><div class="val">${course.degree}</div></div>
    <div class="row"><div class="label">Application Fee Status:</div><div class="val" style="color:#059669; font-weight:bold;">PAID (Rs ${payment ? payment.amount : '1000.00'} — Ref: ${payment ? payment.transactionId : 'TXN-CONFIRMED'})</div></div>
    <div class="row"><div class="label">Admission Decision:</div><div class="val" style="color:#1e3a8a; font-weight:bold;">APPROVED BY CENTRAL ADMISSIONS COMMITTEE</div></div>
    <div class="row"><div class="label">Date of Issuance:</div><div class="val">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
  </div>

  <div class="remarks">
    <strong>Committee Remarks / Notes:</strong><br>
    ${application.reviewRemarks || 'The candidate has satisfied all academic eligibility criteria, document authentication, and fee requirements. Provisional admission stands confirmed subject to physical document verification during orientation.'}
  </div>

  <div class="footer">
    <div>
      <p style="font-size:12px; color:#64748b;">
        Digital Verification Token: <code>IEM-VERIF-${Buffer.from(application.applicationId).toString('hex')}</code><br>
        Stored in: <code>gs://${BUCKET_NAME}/${subBucket}/${filename}</code>
      </p>
    </div>
    <div class="sign-box">
      <div class="sign-line">Dean of Admissions<br>IEM Kolkata</div>
    </div>
  </div>
</body>
</html>`;

  try {
    const dir = path.dirname(localDest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localDest, htmlContent, 'utf8');
  } catch (fsErr) {
    console.warn('[Storage Bucket] Local letter cache write notice:', fsErr.message);
  }

  // Sync admit letter to live Google Cloud Storage bucket
  uploadToLiveCloudBucket(objectPath, Buffer.from(htmlContent, 'utf8'), 'text/html').catch(() => {});

  return {
    bucketName: BUCKET_NAME,
    subBucket,
    filename,
    bucketPath: `gs://${BUCKET_NAME}/${subBucket}/${filename}`,
    publicUrl: `/api/storage/buckets/${subBucket}/${filename}`
  };
}

/**
 * List files stored in a specific bucket (supports live Cloud Storage & local fallback)
 */
async function listBucketFiles(subBucket = null) {
  // 1. Try Cloud Storage listing
  try {
    const bucket = getStorageBucket();
    if (bucket) {
      const prefix = subBucket ? `${subBucket}/` : '';
      const [files] = await bucket.getFiles({ prefix });
      if (files && files.length > 0) {
        return files.map(file => {
          const parts = file.name.split('/');
          const b = parts[0];
          const f = parts.slice(1).join('/');
          return {
            bucket: b,
            filename: f,
            sizeBytes: Number(file.metadata.size || 0),
            lastModified: file.metadata.updated || file.metadata.timeCreated || new Date().toISOString(),
            bucketUri: `gs://${BUCKET_NAME}/${file.name}`,
            downloadUrl: `/api/storage/buckets/${b}/${f}`
          };
        });
      }
    }
  } catch (e) {
    console.warn('[Storage Bucket] Cloud Storage listFiles notice:', e.message);
  }

  // 2. Fallback to local / tmp cache
  const result = [];
  const bucketsToScan = subBucket ? [subBucket] : Object.values(SUB_BUCKETS);

  bucketsToScan.forEach(b => {
    const dir = path.join(BUCKET_BASE_DIR, b);
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
          const fullPath = path.join(dir, f);
          const stat = fs.statSync(fullPath);
          result.push({
            bucket: b,
            filename: f,
            sizeBytes: stat.size,
            lastModified: stat.mtime.toISOString(),
            bucketUri: `gs://${BUCKET_NAME}/${b}/${f}`,
            downloadUrl: `/api/storage/buckets/${b}/${f}`
          });
        });
      } catch (e) {}
    }
  });

  return result;
}

/**
 * Get bucket statistics
 */
function getBucketStats() {
  const stats = {
    bucketName: BUCKET_NAME,
    totalObjects: 0,
    totalSizeBytes: 0,
    subBuckets: {}
  };

  Object.values(SUB_BUCKETS).forEach(b => {
    const dir = path.join(BUCKET_BASE_DIR, b);
    let count = 0;
    let size = 0;
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        count = files.length;
        files.forEach(f => {
          try {
            size += fs.statSync(path.join(dir, f)).size;
          } catch (e) {}
        });
      } catch (e) {}
    }
    stats.subBuckets[b] = { count, sizeBytes: size };
    stats.totalObjects += count;
    stats.totalSizeBytes += size;
  });

  return stats;
}

module.exports = {
  BUCKET_NAME,
  SUB_BUCKETS,
  getStorageBucket,
  uploadToBucket,
  uploadToLiveCloudBucket,
  generateAdmissionLetter,
  listBucketFiles,
  getBucketStats,
  BUCKET_BASE_DIR
};
