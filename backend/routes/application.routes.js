const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { ApplicationModel, ApplicantModel, CourseModel, DocumentModel, PaymentModel, NotificationModel, AuditModel, UserModel } = require('../models/sql-models');
const { FirestoreDraftModel, FirestoreAuditModel } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { checkApplicationReadiness } = require('../services/readiness.service');
const { generateAdmissionLetter, SUB_BUCKETS, BUCKET_NAME } = require('../services/storage-bucket.service');

// 1. POST /api/applications/draft (Firebase Firestore NoSQL Auto-Save draft)
router.post('/draft', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const draft = await FirestoreDraftModel.saveDraft(req.user.userId, req.body);
    res.json({ success: true, message: 'Application draft auto-saved to Firebase Firestore.', draft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/applications/draft (Retrieve Firebase Firestore draft)
router.get('/draft', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const draft = await FirestoreDraftModel.getDraft(req.user.userId);
    res.json({ success: true, draft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/applications (FR-2: Submit Application into Relational SQL Database)
router.post('/', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const {
      courseId,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      tenthPercentage,
      tenthBoard,
      tenthYear,
      twelfthPercentage,
      twelfthBoard,
      twelfthYear,
      twelfthStream
    } = req.body;

    const requiredFields = [
      { key: 'courseId', label: 'Target Course / Program' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'guardianName', label: 'Guardian / Father Name' },
      { key: 'guardianPhone', label: 'Guardian Mobile' },
      { key: 'address', label: 'Residential Address' },
      { key: 'tenthBoard', label: 'Class 10 Board' },
      { key: 'tenthYear', label: 'Class 10 Year' },
      { key: 'tenthPercentage', label: 'Class 10 Percentage' },
      { key: 'twelfthBoard', label: 'Class 12 Board' },
      { key: 'twelfthYear', label: 'Class 12 Year' },
      { key: 'twelfthPercentage', label: 'Class 12 Percentage' },
      { key: 'twelfthStream', label: 'Class 12 Stream' }
    ];

    const missing = requiredFields.filter(f => {
      const val = req.body[f.key];
      return val === undefined || val === null || String(val).trim() === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `All application form fields are required. Please fill in: ${missing.map(m => m.label).join(', ')}.`,
        missingFields: missing.map(m => m.key)
      });
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Upsert applicant details into relational SQL DB
    await ApplicantModel.upsert(req.user.userId, {
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      tenthPercentage: parseFloat(tenthPercentage) || null,
      tenthBoard,
      tenthYear: parseInt(tenthYear, 10) || null,
      twelfthPercentage: parseFloat(twelfthPercentage) || null,
      twelfthBoard,
      twelfthYear: parseInt(twelfthYear, 10) || null,
      twelfthStream
    });

    // Generate unique Application ID: APP-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationId = `APP-2026-${randomSuffix}`;

    // Create application record
    const application = await ApplicationModel.create({
      applicationId,
      userId: req.user.userId,
      courseId,
      status: 'SUBMITTED',
      marks10th: parseFloat(tenthPercentage) || 0,
      marks12th: parseFloat(twelfthPercentage) || 0,
      tenthPercentage: parseFloat(tenthPercentage) || 0,
      twelfthPercentage: parseFloat(twelfthPercentage) || 0,
      tenthBoard,
      tenthYear: parseInt(tenthYear, 10) || null,
      twelfthBoard,
      twelfthYear: parseInt(twelfthYear, 10) || null,
      twelfthStream,
      guardianName,
      guardianPhone,
      address,
      gender,
      dateOfBirth
    });

    // Clean up draft in Firebase Firestore
    await FirestoreDraftModel.deleteDraft(req.user.userId);

    // SQL Audit Log
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'SUBMIT_APPLICATION',
      targetEntity: 'APPLICATIONS',
      targetId: applicationId,
      details: `Submitted application for ${course.courseName}`
    });

    // Firebase Firestore Document Audit
    await FirestoreAuditModel.log({
      action: 'APPLICATION_CREATED',
      applicationId,
      userId: req.user.userId,
      courseCode: course.courseCode
    });

    // Send confirmation notification
    await NotificationModel.create({
      userId: req.user.userId,
      channel: 'EMAIL',
      recipient: req.user.email,
      subject: `IEM Admission Portal — Application ${applicationId} Received`,
      message: `Dear ${req.user.fullName}, your admission application for ${course.courseName} has been received. Please proceed to upload required documents and pay the application fee of Rs ${course.applicationFee}.`
    });

    res.status(201).json({
      success: true,
      message: 'Application created successfully.',
      applicationId,
      application
    });
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/applications/my (FR-4: Track status of current user's applications)
router.get('/my', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const list = await ApplicationModel.findByUserId(req.user.userId);
    // Enrich with readiness and documents
    const enriched = await Promise.all(
      list.map(async (app) => {
        const readiness = await checkApplicationReadiness(app);
        const docs = await DocumentModel.findByApplicationId(app.applicationId);
        const payment = await PaymentModel.findByApplicationId(app.applicationId);
        return {
          ...app,
          readiness,
          documents: docs,
          payment
        };
      })
    );
    res.json({ success: true, count: enriched.length, applications: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. GET /api/applications (FR-5: List all applications for Officer and Admin)
router.get('/', authenticateToken, authorizeRoles('ADMISSION_OFFICER', 'ADMINISTRATOR'), async (req, res) => {
  try {
    const { status, courseId, search } = req.query;
    const list = await ApplicationModel.getAll({ status, courseId, search });
    res.json({ success: true, count: list.length, applications: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. GET /api/applications/:id (Get Application Dossier)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Role security check
    if (req.user.role === 'APPLICANT' && app.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this application.' });
    }

    const docs = await DocumentModel.findByApplicationId(app.applicationId);
    const payment = await PaymentModel.findByApplicationId(app.applicationId);
    const readiness = await checkApplicationReadiness(app);

    res.json({
      success: true,
      application: app,
      documents: docs,
      payment,
      readiness
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6b. PUT /api/applications/:id (Update Application details by Applicant)
router.put('/:id', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    if (app.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this application.' });
    }

    const {
      courseId,
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      tenthPercentage,
      tenthBoard,
      tenthYear,
      twelfthPercentage,
      twelfthBoard,
      twelfthYear,
      twelfthStream
    } = req.body;

    // Update applicant profile
    await ApplicantModel.upsert(req.user.userId, {
      dateOfBirth,
      gender,
      address,
      guardianName,
      guardianPhone,
      tenthPercentage: parseFloat(tenthPercentage) || null,
      tenthBoard,
      tenthYear: parseInt(tenthYear, 10) || null,
      twelfthPercentage: parseFloat(twelfthPercentage) || null,
      twelfthBoard,
      twelfthYear: parseInt(twelfthYear, 10) || null,
      twelfthStream
    });

    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (course) {
        app.courseId = course.courseId;
        app.courseCode = course.courseCode;
        app.courseName = course.courseName;
      }
    }

    const score10 = parseFloat(tenthPercentage) || app.marks10th || 0;
    const score12 = parseFloat(twelfthPercentage) || app.marks12th || 0;
    app.marks10th = score10;
    app.marks12th = score12;
    app.meritScore = Number(((score12 * 0.60) + (score10 * 0.40)).toFixed(2));
    app.updatedAt = new Date().toISOString();

    const { persistStore, collections, LiveFirestoreClient } = require('../models/firestore-models');
    if (collections && collections.applications && collections.applications[req.params.id]) {
      collections.applications[req.params.id] = {
        ...collections.applications[req.params.id],
        ...app
      };
      persistStore();
      LiveFirestoreClient.setDoc('applications', req.params.id, collections.applications[req.params.id]).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Application details updated successfully.',
      application: app
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. PUT /api/applications/:id/status (FR-5: Officer / Admin Review Decision)
router.put('/:id/status', authenticateToken, authorizeRoles('ADMISSION_OFFICER', 'ADMINISTRATOR'), async (req, res) => {
  try {
    const { status, reviewRemarks } = req.body;
    const allowed = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const updated = await ApplicationModel.updateStatus(
      req.params.id,
      status,
      reviewRemarks,
      req.user.userId
    );

    // If APPROVED, automatically generate official Admit Letter in the Storage Bucket!
    let admitLetterInfo = null;
    if (status === 'APPROVED') {
      const user = await UserModel.findById(app.userId);
      const course = await CourseModel.findById(app.courseId);
      const payment = await PaymentModel.findByApplicationId(app.applicationId);
      admitLetterInfo = generateAdmissionLetter({
        application: updated,
        user,
        course,
        payment
      });
    }

    // Audit Log
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: `UPDATE_APPLICATION_STATUS_${status}`,
      targetEntity: 'APPLICATIONS',
      targetId: app.applicationId,
      details: `Status set to ${status}. Remarks: ${reviewRemarks || 'None'}`
    });

    // Notify Applicant
    await NotificationModel.create({
      userId: app.userId,
      channel: 'EMAIL',
      recipient: app.email,
      subject: `IEM Admission Update: Application ${app.applicationId} is now ${status}`,
      message: `Dear ${app.fullName}, the status of your application ${app.applicationId} has been updated to "${status}". Remarks: ${reviewRemarks || 'No additional remarks.'}`
    });

    res.json({
      success: true,
      message: `Application status updated to ${status}.`,
      application: updated,
      admitLetter: admitLetterInfo
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. GET /api/applications/:id/admit-letter (Download / View Admission Letter)
router.get('/:id/admit-letter', authenticateToken, async (req, res) => {
  try {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role === 'APPLICANT' && app.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (app.status !== 'APPROVED' && app.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Admission letter is only available after application approval.'
      });
    }

    const user = await UserModel.findById(app.userId);
    const course = await CourseModel.findById(app.courseId);
    const payment = await PaymentModel.findByApplicationId(app.applicationId);

    const letter = generateAdmissionLetter({
      application: app,
      user,
      course,
      payment
    });

    res.json({
      success: true,
      letter
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
