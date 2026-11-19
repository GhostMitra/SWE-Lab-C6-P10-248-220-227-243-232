const express = require('express');
const router = express.Router();
const Busboy = require('busboy');
const { DocumentModel, ApplicationModel, AuditModel } = require('../models/sql-models');
const { uploadToBucket } = require('../services/storage-bucket.service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Universal Multipart Parser Middleware
 * Supports both Google Cloud Functions (where req stream is pre-consumed into req.rawBody)
 * and standalone local Express runtime (where req is streamed via req.pipe(busboy)).
 */
function handleMultipartUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  try {
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 15 * 1024 * 1024 }
    });

    req.body = req.body || {};
    const filePromises = [];

    busboy.on('field', (name, val) => {
      req.body[name] = val;
    });

    busboy.on('file', (name, stream, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      const p = new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          req.file = {
            fieldname: name,
            originalname: filename,
            encoding,
            mimetype: mimeType,
            buffer,
            size: buffer.length
          };
          resolve();
        });
        stream.on('error', reject);
      });
      filePromises.push(p);
    });

    busboy.on('close', async () => {
      try {
        await Promise.all(filePromises);
        next();
      } catch (err) {
        next(err);
      }
    });

    busboy.on('error', err => {
      console.error('[Multipart Error]:', err.message);
      next(err);
    });

    if (req.rawBody) {
      // In Google Cloud Functions / Cloud Run: req stream is pre-consumed into req.rawBody
      busboy.end(req.rawBody);
    } else {
      // In standalone Express: pipe incoming stream directly
      req.pipe(busboy);
    }
  } catch (err) {
    console.error('[Busboy Init Error]:', err.message);
    next(err);
  }
}

// POST /api/documents/upload (FR-3, IR-3: Document Upload Interface into Storage Bucket & SQL record)
router.post('/upload', authenticateToken, handleMultipartUpload, async (req, res) => {
  try {
    const { applicationId, docType } = req.body;

    if (!applicationId || !docType) {
      return res.status(400).json({ success: false, message: 'applicationId and docType are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const app = await ApplicationModel.findById(applicationId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Role check
    if (req.user.role === 'APPLICANT' && app.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // 1. Upload file into the Storage Bucket
    const bucketFile = await uploadToBucket({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      docType,
      applicationId
    });

    // 2. Persist metadata into the Documents Store
    const docRecord = await DocumentModel.create({
      applicationId,
      docType,
      fileName: req.file.originalname,
      originalName: req.file.originalname,
      filePath: bucketFile.publicUrl,
      publicUrl: bucketFile.publicUrl,
      fileSize: req.file.size,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      storagePath: bucketFile.bucketPath
    });

    // 3. Audit Log
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'UPLOAD_DOCUMENT',
      targetEntity: 'DOCUMENTS',
      targetId: String(docRecord.docId || docRecord.documentId),
      details: `Uploaded ${docType} (${req.file.originalname}) to bucket ${bucketFile.subBucket}`
    });

    res.status(201).json({
      success: true,
      message: 'Document successfully stored in Storage Bucket and registered.',
      document: docRecord,
      bucketStorage: {
        bucketName: bucketFile.bucketName,
        subBucket: bucketFile.subBucket,
        bucketPath: bucketFile.bucketPath,
        downloadUrl: bucketFile.publicUrl
      }
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/documents/:applicationId
router.get('/:applicationId', authenticateToken, async (req, res) => {
  try {
    const docs = await DocumentModel.findByApplicationId(req.params.applicationId);
    res.json({ success: true, count: docs.length, documents: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/documents/:documentId/verify (FR-5: Officer verifies document)
router.put('/:documentId/verify', authenticateToken, authorizeRoles('ADMISSION_OFFICER', 'ADMINISTRATOR'), async (req, res) => {
  try {
    const { verificationStatus, verificationNotes } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED.' });
    }

    const doc = await DocumentModel.updateVerification(
      req.params.documentId,
      verificationStatus,
      verificationNotes
    );

    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: `VERIFY_DOCUMENT_${verificationStatus}`,
      targetEntity: 'DOCUMENTS',
      targetId: String(req.params.documentId),
      details: `Document verification status changed to ${verificationStatus}. Notes: ${verificationNotes || 'None'}`
    });

    res.json({
      success: true,
      message: `Document status updated to ${verificationStatus}.`,
      document: doc
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
