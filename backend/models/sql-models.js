const { query, get, run } = require('../config/database');

const UserModel = {
  async findById(userId) {
    return await get('SELECT * FROM users WHERE userId = ?', [userId]);
  },

  async findByEmail(email) {
    return await get('SELECT * FROM users WHERE email = ?', [email]);
  },

  async create({ fullName, email, passwordHash, phone, role, firebaseUid = null }) {
    const res = await run(
      `INSERT INTO users (fullName, email, passwordHash, phone, role, firebaseUid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, phone, role, firebaseUid]
    );
    return await this.findById(res.lastID);
  },

  async updateProfile(userId, { fullName, phone }) {
    await run(
      `UPDATE users SET fullName = COALESCE(?, fullName), phone = COALESCE(?, phone), updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
      [fullName, phone, userId]
    );
    return await this.findById(userId);
  },

  async getAllUsers() {
    return await query(`SELECT userId, fullName, email, phone, role, createdAt FROM users ORDER BY userId DESC`);
  }
};

const ApplicantModel = {
  async findByUserId(userId) {
    return await get('SELECT * FROM applicants WHERE userId = ?', [userId]);
  },

  async upsert(userId, data) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await run(
        `UPDATE applicants SET 
           dateOfBirth = COALESCE(?, dateOfBirth),
           gender = COALESCE(?, gender),
           address = COALESCE(?, address),
           guardianName = COALESCE(?, guardianName),
           guardianPhone = COALESCE(?, guardianPhone),
           tenthPercentage = COALESCE(?, tenthPercentage),
           tenthBoard = COALESCE(?, tenthBoard),
           tenthYear = COALESCE(?, tenthYear),
           twelfthPercentage = COALESCE(?, twelfthPercentage),
           twelfthBoard = COALESCE(?, twelfthBoard),
           twelfthYear = COALESCE(?, twelfthYear),
           twelfthStream = COALESCE(?, twelfthStream)
         WHERE userId = ?`,
        [
          data.dateOfBirth, data.gender, data.address,
          data.guardianName, data.guardianPhone,
          data.tenthPercentage, data.tenthBoard, data.tenthYear,
          data.twelfthPercentage, data.twelfthBoard, data.twelfthYear,
          data.twelfthStream, userId
        ]
      );
      return await this.findByUserId(userId);
    } else {
      await run(
        `INSERT INTO applicants (
           userId, dateOfBirth, gender, address, guardianName, guardianPhone,
           tenthPercentage, tenthBoard, tenthYear, twelfthPercentage,
           twelfthBoard, twelfthYear, twelfthStream
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, data.dateOfBirth, data.gender, data.address,
          data.guardianName, data.guardianPhone,
          data.tenthPercentage, data.tenthBoard, data.tenthYear,
          data.twelfthPercentage, data.twelfthBoard, data.twelfthYear,
          data.twelfthStream
        ]
      );
      return await this.findByUserId(userId);
    }
  }
};

const CourseModel = {
  async getAll() {
    return await query('SELECT * FROM courses WHERE isOpen = 1 ORDER BY courseName ASC');
  },

  async getAllIncludingClosed() {
    return await query('SELECT * FROM courses ORDER BY courseId ASC');
  },

  async findById(courseId) {
    return await get('SELECT * FROM courses WHERE courseId = ?', [courseId]);
  },

  async create(data) {
    const res = await run(
      `INSERT INTO courses (courseCode, courseName, degree, durationYears, eligibilityCriteria, minTenthPercentage, minTwelfthPercentage, seats, applicationFee, isOpen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.courseCode, data.courseName, data.degree, data.durationYears || 4,
        data.eligibilityCriteria, data.minTenthPercentage || 50, data.minTwelfthPercentage || 60,
        data.seats || 120, data.applicationFee || 1000, data.isOpen ?? 1
      ]
    );
    return await this.findById(res.lastID);
  },

  async update(courseId, data) {
    await run(
      `UPDATE courses SET
         courseName = COALESCE(?, courseName),
         eligibilityCriteria = COALESCE(?, eligibilityCriteria),
         minTenthPercentage = COALESCE(?, minTenthPercentage),
         minTwelfthPercentage = COALESCE(?, minTwelfthPercentage),
         seats = COALESCE(?, seats),
         applicationFee = COALESCE(?, applicationFee),
         isOpen = COALESCE(?, isOpen)
       WHERE courseId = ?`,
      [
        data.courseName, data.eligibilityCriteria, data.minTenthPercentage,
        data.minTwelfthPercentage, data.seats, data.applicationFee, data.isOpen, courseId
      ]
    );
    return await this.findById(courseId);
  }
};

const ApplicationModel = {
  async findById(applicationId) {
    return await get(
      `SELECT a.*, u.fullName, u.email, u.phone, c.courseCode, c.courseName, c.degree, c.applicationFee,
              ap.dateOfBirth, ap.gender, ap.address, ap.guardianName, ap.tenthPercentage, ap.tenthBoard,
              ap.twelfthPercentage, ap.twelfthBoard, ap.twelfthStream
       FROM applications a
       JOIN users u ON a.userId = u.userId
       JOIN courses c ON a.courseId = c.courseId
       LEFT JOIN applicants ap ON u.userId = ap.userId
       WHERE a.applicationId = ?`,
      [applicationId]
    );
  },

  async findByUserId(userId) {
    return await query(
      `SELECT a.*, c.courseCode, c.courseName, c.degree, c.applicationFee
       FROM applications a
       JOIN courses c ON a.courseId = c.courseId
       WHERE a.userId = ?
       ORDER BY a.applicationDate DESC`,
      [userId]
    );
  },

  async getAll(filters = {}) {
    let sql = `
      SELECT a.*, u.fullName, u.email, u.phone, c.courseCode, c.courseName, c.degree,
             ap.tenthPercentage, ap.twelfthPercentage,
             p.status AS paymentStatus, p.transactionId
      FROM applications a
      JOIN users u ON a.userId = u.userId
      JOIN courses c ON a.courseId = c.courseId
      LEFT JOIN applicants ap ON u.userId = ap.userId
      LEFT JOIN payments p ON a.applicationId = p.applicationId
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      sql += ` AND a.status = ?`;
      params.push(filters.status);
    }
    if (filters.courseId) {
      sql += ` AND a.courseId = ?`;
      params.push(filters.courseId);
    }
    if (filters.search) {
      sql += ` AND (u.fullName LIKE ? OR u.email LIKE ? OR a.applicationId LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ` ORDER BY a.applicationDate DESC`;
    return await query(sql, params);
  },

  async create({ applicationId, userId, courseId, status = 'SUBMITTED' }) {
    await run(
      `INSERT INTO applications (applicationId, userId, courseId, status)
       VALUES (?, ?, ?, ?)`,
      [applicationId, userId, courseId, status]
    );
    return await this.findById(applicationId);
  },

  async updateStatus(applicationId, status, reviewRemarks = null, reviewedBy = null) {
    await run(
      `UPDATE applications SET
         status = ?,
         reviewRemarks = COALESCE(?, reviewRemarks),
         reviewedBy = COALESCE(?, reviewedBy),
         reviewedAt = CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE reviewedAt END,
         updatedAt = CURRENT_TIMESTAMP
       WHERE applicationId = ?`,
      [status, reviewRemarks, reviewedBy, reviewedBy, applicationId]
    );
    return await this.findById(applicationId);
  }
};

const DocumentModel = {
  async create({ applicationId, docType, fileName, filePath, fileSize, mimeType }) {
    // Delete previous version of this docType for this application if exists
    await run('DELETE FROM documents WHERE applicationId = ? AND docType = ?', [applicationId, docType]);
    
    const res = await run(
      `INSERT INTO documents (applicationId, docType, fileName, filePath, fileSize, mimeType, verificationStatus)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [applicationId, docType, fileName, filePath, fileSize, mimeType]
    );
    return await get('SELECT * FROM documents WHERE documentId = ?', [res.lastID]);
  },

  async findByApplicationId(applicationId) {
    return await query('SELECT * FROM documents WHERE applicationId = ? ORDER BY documentId ASC', [applicationId]);
  },

  async updateVerification(documentId, verificationStatus, verificationNotes = null) {
    await run(
      `UPDATE documents SET verificationStatus = ?, verificationNotes = ? WHERE documentId = ?`,
      [verificationStatus, verificationNotes, documentId]
    );
    return await get('SELECT * FROM documents WHERE documentId = ?', [documentId]);
  }
};

const PaymentModel = {
  async create({ paymentId, applicationId, amount = 1000.0, status = 'INITIATED', transactionId, paymentMethod = 'UPI / CARD', gatewayReference = null, invoiceNumber = null }) {
    await run(
      `INSERT INTO payments (paymentId, applicationId, amount, status, transactionId, paymentMethod, gatewayReference, invoiceNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, applicationId, amount, status, transactionId, paymentMethod, gatewayReference, invoiceNumber]
    );
    return await this.findById(paymentId);
  },

  async findById(paymentId) {
    return await get('SELECT * FROM payments WHERE paymentId = ?', [paymentId]);
  },

  async findByApplicationId(applicationId) {
    return await get('SELECT * FROM payments WHERE applicationId = ? ORDER BY paymentDate DESC LIMIT 1', [applicationId]);
  },

  async updateStatus(paymentId, status, transactionId = null) {
    await run(
      `UPDATE payments SET status = ?, transactionId = COALESCE(?, transactionId) WHERE paymentId = ?`,
      [status, transactionId, paymentId]
    );
    return await this.findById(paymentId);
  }
};

const NotificationModel = {
  async create({ userId, channel = 'EMAIL', recipient, subject, message }) {
    const res = await run(
      `INSERT INTO notifications (userId, channel, recipient, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, channel, recipient, subject, message]
    );
    return await get('SELECT * FROM notifications WHERE notificationId = ?', [res.lastID]);
  },

  async findByUserId(userId) {
    return await query('SELECT * FROM notifications WHERE userId = ? ORDER BY sentAt DESC', [userId]);
  }
};

const AuditModel = {
  async log({ actorId, actorEmail, actorRole, action, targetEntity, targetId = null, details = null, ipAddress = '127.0.0.1' }) {
    await run(
      `INSERT INTO audit_trail (actorId, actorEmail, actorRole, action, targetEntity, targetId, details, ipAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actorId, actorEmail, actorRole, action, targetEntity, targetId, details, ipAddress]
    );
  },

  async getRecent(limit = 100) {
    return await query('SELECT * FROM audit_trail ORDER BY createdAt DESC LIMIT ?', [limit]);
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
  AuditModel
};
