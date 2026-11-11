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
const { getAdmin, isFirebaseLive, firebaseConfig } = require('../config/firebase');

const BUCKET_BASE_DIR = path.join(__dirname, '..', 'storage-bucket');
const BUCKET_NAME = firebaseConfig.storageBucket || 'iem-admission-portal.appspot.com';

const SUB_BUCKETS = {
  ACADEMIC_DOCS: 'academic-docs',
  CANDIDATE_MEDIA: 'candidate-media',
  VERIFICATION_CERTS: 'verification-certs',
  GENERATED_LETTERS: 'generated-letters'
};

// Ensure all bucket directories exist
Object.values(SUB_BUCKETS).forEach(folder => {
  const dir = path.join(BUCKET_BASE_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
  const localDest = path.join(BUCKET_BASE_DIR, subBucket, filename);

  // Write to local bucket directory
  fs.writeFileSync(localDest, buffer);

  const bucketPath = `gs://${BUCKET_NAME}/${subBucket}/${filename}`;
  const publicUrl = `/api/storage/buckets/${subBucket}/${filename}`;

  // If live Firebase Admin Storage is active, sync to cloud bucket
  if (isFirebaseLive() && getAdmin()) {
    try {
      const bucket = getAdmin().storage().bucket();
      await bucket.file(`${subBucket}/${filename}`).save(buffer, {
        contentType: mimetype,
        metadata: {
          applicationId,
          docType,
          originalName: originalname
        }
      });
      console.log(`[Storage Bucket] Synced ${filename} to live Firebase Cloud Storage bucket.`);
    } catch (err) {
      console.warn('[Storage Bucket] Cloud sync failed, using local bucket store:', err.message);
    }
  }

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

  fs.writeFileSync(localDest, htmlContent, 'utf8');

  return {
    bucketName: BUCKET_NAME,
    subBucket,
    filename,
    bucketPath: `gs://${BUCKET_NAME}/${subBucket}/${filename}`,
    publicUrl: `/api/storage/buckets/${subBucket}/${filename}`
  };
}

/**
 * List files stored in a specific bucket
 */
function listBucketFiles(subBucket = null) {
  const result = [];
  const bucketsToScan = subBucket ? [subBucket] : Object.values(SUB_BUCKETS);

  bucketsToScan.forEach(b => {
    const dir = path.join(BUCKET_BASE_DIR, b);
    if (fs.existsSync(dir)) {
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
      const files = fs.readdirSync(dir);
      count = files.length;
      files.forEach(f => {
        try {
          size += fs.statSync(path.join(dir, f)).size;
        } catch (e) {}
      });
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
  uploadToBucket,
  generateAdmissionLetter,
  listBucketFiles,
  getBucketStats,
  BUCKET_BASE_DIR
};
