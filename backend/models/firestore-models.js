/**
 * Pure Firebase Cloud Firestore - NoSQL Data Store Layer
 * 100% NoSQL Architecture (No SQL required)
 * 
 * Replaces all SQL databases with Cloud Firestore collections:
 * - users: Role-based user profiles (Applicant, Officer, Admin)
 * - applicants: Candidate academic records and bio
 * - courses: IEM academic program catalog
 * - applications: Admission submissions with dynamic merit scores
 * - documents: Uploaded student files & bucket metadata
 * - payments: Gateway fee transactions and revenue logs
 * - notifications: Real-time user alert dispatch
 * - audit_logs: System immutable audit trails
 * - application_drafts: Real-time autosave cache
 * - notification_queue: Asynchronous event queue
 * 
 * Synchronizes with live Cloud Firestore in Google Cloud (nam5)
 * and maintains persistent local state in firestore_collections.json for offline resilience.
 */

const fs = require('fs');
const path = require('path');
const { LiveFirestoreClient } = require('../config/firebase');

const COLLECTIONS_FILE = path.join(__dirname, '..', 'database', 'firestore_collections.json');

// Memory & file-backed store for immediate access and fallback
let collections = {
  users: {},
  applicants: {},
  courses: {},
  applications: {},
  documents: {},
  payments: {},
  notifications: {},
  audit_logs: [],
  application_drafts: {},
  notification_queue: []
};

// Load existing data from file
try {
  if (fs.existsSync(COLLECTIONS_FILE)) {
    const data = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf8'));
    collections = { ...collections, ...data };
    console.log('[Firestore Model] Loaded local Firestore collections store.');
  }
} catch (err) {
  console.warn('[Firestore Model] Notice loading collections file:', err.message);
}

function persistStore() {
  try {
    const dir = path.dirname(COLLECTIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 2), 'utf8');
  } catch (err) {
    console.error('[Firestore Model] Failed to persist local collections:', err.message);
  }
}

// -------------------------------------------------------------
// 1. User Model (Firestore Collection: "users")
// -------------------------------------------------------------
let nextUserId = 100;
Object.values(collections.users).forEach(u => {
  if (u.userId >= nextUserId) nextUserId = u.userId + 1;
});

const UserModel = {
  async create({ fullName, email, passwordHash, phone, role = 'APPLICANT' }) {
    const userId = nextUserId++;
    const userDoc = {
      userId,
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || '',
      role: role.toUpperCase(),
      createdAt: new Date().toISOString()
    };

    collections.users[String(userId)] = userDoc;
    persistStore();

    // Async sync to live Cloud Firestore
    LiveFirestoreClient.setDoc('users', String(userId), userDoc).catch(() => {});

    return userDoc;
  },

  async findById(userId) {
    const idStr = String(userId);
    return collections.users[idStr] || null;
  },

  async findByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    return Object.values(collections.users).find(u => u.email === clean) || null;
  },

  async getAll() {
    return Object.values(collections.users).map(u => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt
    }));
  },

  async getAllUsers() {
    return this.getAll();
  },

  async count() {
    return Object.keys(collections.users).length;
  }
};

// -------------------------------------------------------------
// 2. Applicant Model (Firestore Collection: "applicants")
// -------------------------------------------------------------
const ApplicantModel = {
  async upsert(userId, data) {
    const idStr = String(userId);
    const existing = collections.applicants[idStr] || {};
    const updated = {
      applicantId: Number(userId),
      userId: Number(userId),
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    collections.applicants[idStr] = updated;
    persistStore();

    LiveFirestoreClient.setDoc('applicants', idStr, updated).catch(() => {});
    return updated;
  },

  async findByUserId(userId) {
    const idStr = String(userId);
    return collections.applicants[idStr] || null;
  }
};

// -------------------------------------------------------------
// 3. Course Model (Firestore Collection: "courses")
// -------------------------------------------------------------
let nextCourseId = 10;
Object.values(collections.courses).forEach(c => {
  if (c.courseId >= nextCourseId) nextCourseId = c.courseId + 1;
});

const CourseModel = {
  async create({ courseCode, courseName, department, degreeLevel = 'UG', durationYears = 4, intakeCapacity = 120, applicationFee = 1200.00, min10thPercent = 60.00, min12thPercent = 60.00 }) {
    const courseId = nextCourseId++;
    const courseDoc = {
      courseId,
      courseCode,
      courseName,
      department: department || 'Engineering',
      degreeLevel,
      durationYears: Number(durationYears),
      intakeCapacity: Number(intakeCapacity),
      applicationFee: Number(applicationFee),
      min10thPercent: Number(min10thPercent),
      min12thPercent: Number(min12thPercent),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    collections.courses[String(courseId)] = courseDoc;
    persistStore();

    LiveFirestoreClient.setDoc('courses', courseCode, courseDoc).catch(() => {});
    return courseDoc;
  },

  async getAll() {
    return Object.values(collections.courses);
  },

  async findById(courseId) {
    const idStr = String(courseId);
    if (collections.courses[idStr]) return collections.courses[idStr];
    const match = Object.values(collections.courses).find(c => c.courseCode === courseId || c.courseId === Number(courseId));
    if (match) return match;
    const all = Object.values(collections.courses);
    return all.length > 0 ? all[0] : null;
  },

  async count() {
    return Object.keys(collections.courses).length;
  }
};

// -------------------------------------------------------------
// 4. Application Model (Firestore Collection: "applications")
// -------------------------------------------------------------
const ApplicationModel = {
  async create({ applicationId: customAppId, applicantId, userId, courseId, status = 'SUBMITTED', marks10th = 0, marks12th = 0, category = 'GENERAL', qualifyingExamRank = null, draftData = {} }) {
    const resolvedApplicantId = Number(applicantId || userId || 1);
    const applicationId = customAppId || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const applicantProfile = collections.applicants[String(resolvedApplicantId)] || {};
    const score10 = Number(marks10th || applicantProfile.tenthPercentage || applicantProfile.marks10th || 0);
    const score12 = Number(marks12th || applicantProfile.twelfthPercentage || applicantProfile.marks12th || 0);
    // Composite Merit Ranking Formula: 60% 12th + 40% 10th
    const meritScore = Number(((score12 * 0.60) + (score10 * 0.40)).toFixed(2));

    const course = await CourseModel.findById(courseId);

    const appDoc = {
      applicationId,
      applicantId: resolvedApplicantId,
      userId: resolvedApplicantId,
      courseId: course ? course.courseId : Number(courseId),
      courseCode: course ? course.courseCode : '',
      courseName: course ? course.courseName : '',
      marks10th: score10,
      marks12th: score12,
      meritScore,
      category: category || 'GENERAL',
      qualifyingExamRank: qualifyingExamRank ? Number(qualifyingExamRank) : null,
      status: status.toUpperCase(), // SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED
      paymentStatus: 'PENDING',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewRemarks: '',
      reviewedBy: null,
      admitLetterUrl: null,
      draftSnapshot: draftData
    };

    collections.applications[applicationId] = appDoc;
    persistStore();

    LiveFirestoreClient.setDoc('applications', applicationId, appDoc).catch(() => {});
    return appDoc;
  },

  async findById(applicationId) {
    const app = collections.applications[applicationId];
    if (!app) return null;

    // Attach student & course details
    const student = await UserModel.findById(app.applicantId);
    const course = await CourseModel.findById(app.courseId);
    const docs = await DocumentModel.findByApplicationId(applicationId);
    const payment = await PaymentModel.findByApplicationId(applicationId);

    return {
      ...app,
      userId: app.applicantId,
      applicantId: app.applicantId,
      applicantName: student ? student.fullName : 'Applicant',
      applicantEmail: student ? student.email : '',
      applicantPhone: student ? student.phone : '',
      courseName: course ? course.courseName : app.courseName,
      courseCode: course ? course.courseCode : app.courseCode,
      documents: docs,
      payment
    };
  },

  async findByApplicantId(applicantId) {
    const idNum = Number(applicantId);
    const list = Object.values(collections.applications)
      .filter(a => a.applicantId === idNum || a.userId === idNum)
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    return Promise.all(list.map(a => this.findById(a.applicationId)));
  },

  async findByUserId(userId) {
    return this.findByApplicantId(userId);
  },

  async getAll(filter = null) {
    let list = Object.values(collections.applications);
    if (typeof filter === 'string' && filter) {
      list = list.filter(a => a.status === filter.toUpperCase());
    } else if (filter && typeof filter === 'object') {
      if (filter.status) {
        list = list.filter(a => a.status === filter.status.toUpperCase());
      }
      if (filter.courseId) {
        list = list.filter(a => String(a.courseId) === String(filter.courseId));
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        list = list.filter(a => a.applicationId.toLowerCase().includes(s) || (a.courseName && a.courseName.toLowerCase().includes(s)));
      }
    }
    list.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    return Promise.all(list.map(a => this.findById(a.applicationId)));
  },

  async updateStatus(applicationId, status, remarks = '', reviewerId = null, admitLetterUrl = null) {
    const app = collections.applications[applicationId];
    if (!app) throw new Error(`Application ${applicationId} not found`);

    app.status = status.toUpperCase();
    if (remarks) app.reviewRemarks = remarks;
    if (reviewerId) app.reviewedBy = Number(reviewerId);
    if (admitLetterUrl) app.admitLetterUrl = admitLetterUrl;
    app.updatedAt = new Date().toISOString();

    collections.applications[applicationId] = app;
    persistStore();

    LiveFirestoreClient.setDoc('applications', applicationId, app).catch(() => {});
    return app;
  },

  async count() {
    return Object.keys(collections.applications).length;
  },

  async getMeritRankings() {
    const list = Object.values(collections.applications)
      .filter(a => a.meritScore !== undefined)
      .sort((a, b) => b.meritScore - a.meritScore);

    return Promise.all(list.map(async (a, index) => {
      const full = await this.findById(a.applicationId);
      return {
        rank: index + 1,
        ...full
      };
    }));
  }
};

// -------------------------------------------------------------
// 5. Document Model (Firestore Collection: "documents")
// -------------------------------------------------------------
let nextDocId = 50;
Object.values(collections.documents).forEach(d => {
  if (d.docId >= nextDocId) nextDocId = d.docId + 1;
});

const DocumentModel = {
  async create({ applicationId, docType, originalName, mimeType, sizeBytes, storagePath, publicUrl }) {
    const docId = nextDocId++;
    const docItem = {
      docId,
      applicationId,
      docType,
      originalName,
      mimeType,
      sizeBytes: Number(sizeBytes) || 0,
      storagePath,
      publicUrl,
      verificationStatus: 'PENDING', // PENDING | VERIFIED | REJECTED
      verificationRemarks: '',
      uploadedAt: new Date().toISOString()
    };

    collections.documents[String(docId)] = docItem;
    persistStore();

    LiveFirestoreClient.setDoc('documents', String(docId), docItem).catch(() => {});
    return docItem;
  },

  async findByApplicationId(applicationId) {
    return Object.values(collections.documents)
      .filter(d => d.applicationId === applicationId);
  },

  async updateVerification(docId, status, remarks = '') {
    const doc = collections.documents[String(docId)];
    if (!doc) throw new Error(`Document ${docId} not found`);

    doc.verificationStatus = status.toUpperCase();
    doc.verificationRemarks = remarks;
    doc.verifiedAt = new Date().toISOString();

    collections.documents[String(docId)] = doc;
    persistStore();

    LiveFirestoreClient.setDoc('documents', String(docId), doc).catch(() => {});
    return doc;
  }
};

// -------------------------------------------------------------
// 6. Payment Model (Firestore Collection: "payments")
// -------------------------------------------------------------
let nextPaymentId = 20;
Object.values(collections.payments).forEach(p => {
  if (p.paymentId >= nextPaymentId) nextPaymentId = p.paymentId + 1;
});

const PaymentModel = {
  async create({ paymentId: customId, applicationId, applicantId, amount, paymentMethod = 'GATEWAY', gatewayReference, transactionReference, invoiceNumber }) {
    const paymentId = customId || String(nextPaymentId++);
    const app = collections.applications[applicationId];
    const resolvedApplicantId = applicantId ? Number(applicantId) : (app ? Number(app.applicantId) : 1);

    const payDoc = {
      paymentId,
      applicationId,
      applicantId: resolvedApplicantId,
      amount: Number(amount),
      currency: 'INR',
      status: 'INITIATED',
      paymentMethod,
      gatewayReference: gatewayReference || '',
      transactionReference: transactionReference || `TXN-IEM-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNumber: invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      initiatedAt: new Date().toISOString(),
      completedAt: null
    };

    collections.payments[String(paymentId)] = payDoc;
    persistStore();

    LiveFirestoreClient.setDoc('payments', String(paymentId), payDoc).catch(() => {});
    return payDoc;
  },

  async findById(paymentId) {
    const idStr = String(paymentId);
    return collections.payments[idStr] || Object.values(collections.payments).find(p => String(p.paymentId) === idStr) || null;
  },

  async updateStatus(paymentId, status, transactionId = null) {
    const pay = await this.findById(paymentId);
    if (!pay) throw new Error(`Payment ${paymentId} not found`);

    pay.status = status.toUpperCase();
    if (transactionId) {
      pay.transactionId = transactionId;
      pay.gatewayTransactionId = transactionId;
    }
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      pay.completedAt = new Date().toISOString();
      if (collections.applications[pay.applicationId]) {
        collections.applications[pay.applicationId].paymentStatus = 'PAID';
        LiveFirestoreClient.setDoc('applications', pay.applicationId, collections.applications[pay.applicationId]).catch(() => {});
      }
    }

    collections.payments[String(pay.paymentId)] = pay;
    persistStore();

    LiveFirestoreClient.setDoc('payments', String(pay.paymentId), pay).catch(() => {});
    return pay;
  },

  async verify(paymentId, gatewayTxnId, status = 'COMPLETED') {
    return this.updateStatus(paymentId, status === 'COMPLETED' ? 'SUCCESS' : status, gatewayTxnId);
  },

  async findByApplicationId(applicationId) {
    return Object.values(collections.payments).find(p => p.applicationId === applicationId) || null;
  },

  async getRevenueSummary() {
    const list = Object.values(collections.payments);
    const completed = list.filter(p => p.status === 'COMPLETED');
    const totalAmount = completed.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      totalCollected: totalAmount,
      completedTransactions: completed.length,
      allTransactionsCount: list.length
    };
  }
};

// -------------------------------------------------------------
// 7. Notification Model (Firestore Collection: "notifications")
// -------------------------------------------------------------
let nextNotifId = 80;
const NotificationModel = {
  async create({ userId, title, message, type = 'SYSTEM' }) {
    const notifId = nextNotifId++;
    const doc = {
      notificationId: notifId,
      userId: Number(userId),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    collections.notifications[String(notifId)] = doc;
    persistStore();

    LiveFirestoreClient.setDoc('notifications', String(notifId), doc).catch(() => {});
    return doc;
  },

  async findByUserId(userId) {
    return Object.values(collections.notifications)
      .filter(n => n.userId === Number(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markAsRead(notificationId) {
    const n = collections.notifications[String(notificationId)];
    if (n) {
      n.isRead = true;
      persistStore();
      LiveFirestoreClient.setDoc('notifications', String(notificationId), n).catch(() => {});
    }
    return true;
  }
};

// -------------------------------------------------------------
// 8. Audit Logs Model (Firestore Collection: "audit_logs")
// -------------------------------------------------------------
const AuditModel = {
  async log(entry) {
    const id = 'FS-AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const logDoc = {
      id,
      timestamp: new Date().toISOString(),
      ...entry
    };

    collections.audit_logs.unshift(logDoc);
    if (collections.audit_logs.length > 500) collections.audit_logs.pop();
    persistStore();

    LiveFirestoreClient.setDoc('audit_logs', id, logDoc).catch(() => {});
    return logDoc;
  },

  async getRecent(limit = 50) {
    return collections.audit_logs.slice(0, limit);
  }
};

const FirestoreAuditModel = AuditModel;

// -------------------------------------------------------------
// 9. Draft Model (Firestore Collection: "application_drafts")
// -------------------------------------------------------------
const FirestoreDraftModel = {
  async saveDraft(userId, data) {
    const draft = {
      userId: Number(userId),
      ...data,
      updatedAt: new Date().toISOString()
    };

    collections.application_drafts[String(userId)] = draft;
    persistStore();

    LiveFirestoreClient.setDoc('application_drafts', String(userId), draft).catch(() => {});
    return draft;
  },

  async getDraft(userId) {
    return collections.application_drafts[String(userId)] || null;
  },

  async deleteDraft(userId) {
    delete collections.application_drafts[String(userId)];
    persistStore();
    LiveFirestoreClient.deleteDoc('application_drafts', String(userId)).catch(() => {});
    return true;
  }
};

// -------------------------------------------------------------
// 10. Notification Queue Model (Firestore Collection: "notification_queue")
// -------------------------------------------------------------
const FirestoreQueueModel = {
  async enqueue(notification) {
    const item = {
      queueId: 'FS-QUEUE-' + Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...notification
    };

    collections.notification_queue.push(item);
    persistStore();

    LiveFirestoreClient.setDoc('notification_queue', item.queueId, item).catch(() => {});
    return item;
  },

  async getAll() {
    return collections.notification_queue;
  }
};

module.exports = {
  UserModel,
  ApplicantModel,
  CourseModel,
  ApplicationModel,
  DocumentModel,
  PaymentModel,
  NotificationModel,
  AuditModel,
  FirestoreAuditModel,
  FirestoreDraftModel,
  FirestoreQueueModel,
  getCollectionsStore: () => collections
};
