const express = require('express');
const router = express.Router();
const multer = require('multer');
const { DocumentModel, ApplicationModel, AuditModel } = require('../models/sql-models');
const { uploadToBucket } = require('../services/storage-bucket.service');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer in-memory storage so we can stream/save directly into our Storage Bucket
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed formats: PDF, JPEG, PNG.'));
    }
  }
});

// POST /api/documents/upload (FR-3, IR-3: Document Upload Interface into Storage Bucket & SQL record)
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
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

    // 2. Persist metadata into the Relational SQL Documents Table
    const docRecord = await DocumentModel.create({
      applicationId,
      docType,
      fileName: req.file.originalname,
      filePath: bucketFile.publicUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // 3. Audit Log
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'UPLOAD_DOCUMENT',
      targetEntity: 'DOCUMENTS',
      targetId: String(docRecord.documentId),
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
      details: `Document ${req.params.documentId} set to ${verificationStatus}. Notes: ${verificationNotes || 'None'}`
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
