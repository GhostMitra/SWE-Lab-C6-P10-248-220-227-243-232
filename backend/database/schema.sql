-- =====================================================================
-- IEM ADMISSION PORTAL — RELATIONAL SQL DATABASE SCHEMA
-- Compatible with SQLite, PostgreSQL, and Firebase Data Connect
-- Institute of Engineering & Management (IEM), Kolkata | Team 404 Brain Not Found
-- =====================================================================

-- 1. Users Table (Base User Entity for all roles)
CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('APPLICANT', 'ADMISSION_OFFICER', 'ADMINISTRATOR')),
    firebaseUid TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Applicants Table (Inheritance / Extension of User)
CREATE TABLE IF NOT EXISTS applicants (
    applicantId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES users(userId) ON DELETE CASCADE,
    dateOfBirth DATE,
    gender TEXT,
    address TEXT,
    guardianName TEXT,
    guardianPhone TEXT,
    tenthPercentage REAL,
    tenthBoard TEXT,
    tenthYear INTEGER,
    twelfthPercentage REAL,
    twelfthBoard TEXT,
    twelfthYear INTEGER,
    twelfthStream TEXT
);

-- 3. Admission Officers Table (Inheritance / Extension of User)
CREATE TABLE IF NOT EXISTS admission_officers (
    officerId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES users(userId) ON DELETE CASCADE,
    department TEXT NOT NULL,
    designation TEXT DEFAULT 'Admission Officer'
);

-- 4. Administrators Table (Inheritance / Extension of User)
CREATE TABLE IF NOT EXISTS administrators (
    adminId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE REFERENCES users(userId) ON DELETE CASCADE,
    department TEXT DEFAULT 'Central Admissions Directorate'
);

-- 5. Courses / Programs Catalog
CREATE TABLE IF NOT EXISTS courses (
    courseId INTEGER PRIMARY KEY AUTOINCREMENT,
    courseCode TEXT UNIQUE NOT NULL,
    courseName TEXT NOT NULL,
    degree TEXT NOT NULL,
    durationYears INTEGER NOT NULL DEFAULT 4,
    eligibilityCriteria TEXT NOT NULL,
    minTenthPercentage REAL DEFAULT 50.0,
    minTwelfthPercentage REAL DEFAULT 60.0,
    seats INTEGER NOT NULL DEFAULT 120,
    applicationFee REAL DEFAULT 1000.0,
    isOpen INTEGER DEFAULT 1
);

-- 6. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    applicationId TEXT PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
    courseId INTEGER NOT NULL REFERENCES courses(courseId),
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED')),
    applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewRemarks TEXT,
    reviewedBy INTEGER REFERENCES users(userId),
    reviewedAt DATETIME,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    documentId INTEGER PRIMARY KEY AUTOINCREMENT,
    applicationId TEXT NOT NULL REFERENCES applications(applicationId) ON DELETE CASCADE,
    docType TEXT NOT NULL CHECK(docType IN ('MARKSHEET_10', 'MARKSHEET_12', 'IDENTITY_PROOF', 'PHOTO_SIGNATURE')),
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileSize INTEGER,
    mimeType TEXT,
    verificationStatus TEXT DEFAULT 'PENDING' CHECK(verificationStatus IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verificationNotes TEXT,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    paymentId TEXT PRIMARY KEY,
    applicationId TEXT NOT NULL REFERENCES applications(applicationId) ON DELETE CASCADE,
    amount REAL NOT NULL DEFAULT 1000.0,
    paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'INITIATED' CHECK(status IN ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
    transactionId TEXT UNIQUE,
    paymentMethod TEXT DEFAULT 'UPI / CARD',
    gatewayReference TEXT,
    invoiceNumber TEXT
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notificationId INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER REFERENCES users(userId) ON DELETE CASCADE,
    channel TEXT DEFAULT 'EMAIL' CHECK(channel IN ('EMAIL', 'SMS', 'IN_APP')),
    recipient TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'SENT'
);

-- 10. Audit Trail Table (Record of decisions, status updates, logins)
CREATE TABLE IF NOT EXISTS audit_trail (
    auditId INTEGER PRIMARY KEY AUTOINCREMENT,
    actorId INTEGER REFERENCES users(userId),
    actorEmail TEXT NOT NULL,
    actorRole TEXT NOT NULL,
    action TEXT NOT NULL,
    targetEntity TEXT NOT NULL,
    targetId TEXT,
    details TEXT,
    ipAddress TEXT DEFAULT '127.0.0.1',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_apps_userId ON applications(userId);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_docs_appId ON documents(applicationId);
CREATE INDEX IF NOT EXISTS idx_payments_appId ON payments(applicationId);
