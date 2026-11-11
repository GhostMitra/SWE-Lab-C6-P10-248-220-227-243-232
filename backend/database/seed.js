const bcrypt = require('bcryptjs');
const { initSchema, query, run } = require('../config/database');
const { UserModel, ApplicantModel, CourseModel, ApplicationModel, DocumentModel, PaymentModel, NotificationModel, AuditModel } = require('../models/sql-models');
const { FirestoreAuditModel } = require('../models/firestore-models');

async function seed() {
  console.log('--- [SEED] Starting Database Seeding ---');
  await initSchema();

  // Check if already seeded
  const existingUsers = await UserModel.getAllUsers();
  if (existingUsers && existingUsers.length > 0) {
    console.log('[SEED] Database already contains users. Skipping initial seed.');
    return;
  }

  // 1. Seed Courses
  console.log('[SEED] Inserting courses...');
  const coursesData = [
    {
      courseCode: 'BTECH-CSE',
      courseName: 'B.Tech in Computer Science and Engineering',
      degree: 'Undergraduate (B.Tech)',
      durationYears: 4,
      eligibilityCriteria: '10+2 with Physics, Mathematics & Chemistry/CompSc with minimum 60% aggregate and valid WBJEE / JEE Main rank.',
      minTenthPercentage: 60.0,
      minTwelfthPercentage: 60.0,
      seats: 180,
      applicationFee: 1000.0,
      isOpen: 1
    },
    {
      courseCode: 'BTECH-IT',
      courseName: 'B.Tech in Information Technology',
      degree: 'Undergraduate (B.Tech)',
      durationYears: 4,
      eligibilityCriteria: '10+2 with Physics, Mathematics & Chemistry with minimum 60% aggregate and valid WBJEE / JEE Main score.',
      minTenthPercentage: 60.0,
      minTwelfthPercentage: 60.0,
      seats: 120,
      applicationFee: 1000.0,
      isOpen: 1
    },
    {
      courseCode: 'BTECH-ECE',
      courseName: 'B.Tech in Electronics and Communication Engineering',
      degree: 'Undergraduate (B.Tech)',
      durationYears: 4,
      eligibilityCriteria: '10+2 with Physics and Mathematics with minimum 55% aggregate marks.',
      minTenthPercentage: 55.0,
      minTwelfthPercentage: 55.0,
      seats: 120,
      applicationFee: 1000.0,
      isOpen: 1
    },
    {
      courseCode: 'BCA',
      courseName: 'Bachelor of Computer Applications (BCA)',
      degree: 'Undergraduate (BCA)',
      durationYears: 3,
      eligibilityCriteria: '10+2 in any stream with Mathematics / Computer Application / Statistics with at least 50% marks.',
      minTenthPercentage: 50.0,
      minTwelfthPercentage: 50.0,
      seats: 120,
      applicationFee: 1000.0,
      isOpen: 1
    },
    {
      courseCode: 'MCA',
      courseName: 'Master of Computer Applications (MCA)',
      degree: 'Postgraduate (MCA)',
      durationYears: 2,
      eligibilityCriteria: 'BCA / B.Sc in CS or IT with minimum 55% aggregate and valid JECA / IEMJEE score.',
      minTenthPercentage: 50.0,
      minTwelfthPercentage: 50.0,
      seats: 60,
      applicationFee: 1000.0,
      isOpen: 1
    }
  ];

  for (const c of coursesData) {
    await CourseModel.create(c);
  }

  // 2. Seed Users
  console.log('[SEED] Creating default users...');
  const salt = await bcrypt.genSalt(10);
  const studentPwd = await bcrypt.hash('Student@123', salt);
  const officerPwd = await bcrypt.hash('Officer@123', salt);
  const adminPwd = await bcrypt.hash('Admin@123', salt);

  // Admin User
  const admin = await UserModel.create({
    fullName: 'Dr. Sangeeta Sarkar',
    email: 'admin@iem.edu.in',
    passwordHash: adminPwd,
    phone: '9830000001',
    role: 'ADMINISTRATOR',
    firebaseUid: 'fb-admin-01'
  });
  await run(`INSERT INTO administrators (userId, department) VALUES (?, ?)`, [admin.userId, 'Central Admissions Directorate']);

  // Officer User
  const officer = await UserModel.create({
    fullName: 'Prof. Sadhu Prasad Kar',
    email: 'officer@iem.edu.in',
    passwordHash: officerPwd,
    phone: '9830000002',
    role: 'ADMISSION_OFFICER',
    firebaseUid: 'fb-officer-01'
  });
  await run(`INSERT INTO admission_officers (userId, department, designation) VALUES (?, ?, ?)`, [
    officer.userId,
    'CSE Admissions Evaluation Cell',
    'Senior Admission Officer'
  ]);

  // Applicant 1 (Debarghya Mitra - Submitted & Paid)
  const appUser1 = await UserModel.create({
    fullName: 'Debarghya Mitra',
    email: 'applicant@iem.edu.in',
    passwordHash: studentPwd,
    phone: '9876543210',
    role: 'APPLICANT',
    firebaseUid: 'fb-applicant-01'
  });
  await ApplicantModel.upsert(appUser1.userId, {
    dateOfBirth: '2004-05-14',
    gender: 'Male',
    address: 'Salt Lake Sector V, Kolkata - 700091, West Bengal',
    guardianName: 'Subhas Mitra',
    guardianPhone: '9831122334',
    tenthPercentage: 92.4,
    tenthBoard: 'CBSE',
    tenthYear: 2020,
    twelfthPercentage: 94.0,
    twelfthBoard: 'CBSE',
    twelfthYear: 2022,
    twelfthStream: 'Science (PCM)'
  });

  // Applicant 2 (Arka Ghosh Dastider - Under Review)
  const appUser2 = await UserModel.create({
    fullName: 'Arka Ghosh Dastider',
    email: 'arka@iem.edu.in',
    passwordHash: studentPwd,
    phone: '9876543211',
    role: 'APPLICANT',
    firebaseUid: 'fb-applicant-02'
  });
  await ApplicantModel.upsert(appUser2.userId, {
    dateOfBirth: '2004-08-20',
    gender: 'Male',
    address: 'New Town Action Area 1, Kolkata - 700156',
    guardianName: 'Anindya Ghosh Dastider',
    guardianPhone: '9831122335',
    tenthPercentage: 88.0,
    tenthBoard: 'ICSE',
    tenthYear: 2020,
    twelfthPercentage: 89.5,
    twelfthBoard: 'ISC',
    twelfthYear: 2022,
    twelfthStream: 'Science (PCM)'
  });

  // Applicant 3 (Diptomoy Das - Approved)
  const appUser3 = await UserModel.create({
    fullName: 'Diptomoy Das',
    email: 'diptomoy@iem.edu.in',
    passwordHash: studentPwd,
    phone: '9876543212',
    role: 'APPLICANT',
    firebaseUid: 'fb-applicant-03'
  });
  await ApplicantModel.upsert(appUser3.userId, {
    dateOfBirth: '2004-11-03',
    gender: 'Male',
    address: 'Behala Chowrasta, Kolkata - 700034',
    guardianName: 'Pradip Das',
    guardianPhone: '9831122336',
    tenthPercentage: 90.5,
    tenthBoard: 'WBBSE',
    tenthYear: 2020,
    twelfthPercentage: 91.2,
    twelfthBoard: 'WBCHSE',
    twelfthYear: 2022,
    twelfthStream: 'Pure Science'
  });

  // 3. Seed Applications & Workflow Data
  console.log('[SEED] Seeding applications and payments...');
  const cseCourse = (await CourseModel.getAll())[0];
  const itCourse = (await CourseModel.getAll())[1];
  const eceCourse = (await CourseModel.getAll())[2];

  // App 1: Debarghya -> SUBMITTED & Paid
  const app1 = await ApplicationModel.create({
    applicationId: 'APP-2026-1001',
    userId: appUser1.userId,
    courseId: cseCourse.courseId,
    status: 'SUBMITTED'
  });
  await PaymentModel.create({
    paymentId: 'PAY-1001',
    applicationId: app1.applicationId,
    amount: 1000.0,
    status: 'SUCCESS',
    transactionId: 'TXN-IEM-99201',
    paymentMethod: 'UPI (iem-admission@okhdfcbank)',
    invoiceNumber: 'INV-2026-001'
  });
  await DocumentModel.create({
    applicationId: app1.applicationId,
    docType: 'MARKSHEET_10',
    fileName: 'debarghya_10th_marksheet.pdf',
    filePath: '/uploads/sample_10th_marksheet.pdf',
    fileSize: 245000,
    mimeType: 'application/pdf'
  });
  await DocumentModel.create({
    applicationId: app1.applicationId,
    docType: 'MARKSHEET_12',
    fileName: 'debarghya_12th_marksheet.pdf',
    filePath: '/uploads/sample_12th_marksheet.pdf',
    fileSize: 260000,
    mimeType: 'application/pdf'
  });
  await DocumentModel.create({
    applicationId: app1.applicationId,
    docType: 'IDENTITY_PROOF',
    fileName: 'aadhaar_card.pdf',
    filePath: '/uploads/sample_aadhaar.pdf',
    fileSize: 180000,
    mimeType: 'application/pdf'
  });

  // App 2: Arka -> UNDER_REVIEW
  const app2 = await ApplicationModel.create({
    applicationId: 'APP-2026-1002',
    userId: appUser2.userId,
    courseId: itCourse.courseId,
    status: 'UNDER_REVIEW'
  });
  await PaymentModel.create({
    paymentId: 'PAY-1002',
    applicationId: app2.applicationId,
    amount: 1000.0,
    status: 'SUCCESS',
    transactionId: 'TXN-IEM-99202',
    paymentMethod: 'Credit Card (Visa **4242)',
    invoiceNumber: 'INV-2026-002'
  });
  const doc2 = await DocumentModel.create({
    applicationId: app2.applicationId,
    docType: 'MARKSHEET_12',
    fileName: 'arka_12th_marksheet.pdf',
    filePath: '/uploads/sample_12th_marksheet.pdf',
    fileSize: 210000,
    mimeType: 'application/pdf'
  });
  await DocumentModel.updateVerification(doc2.documentId, 'VERIFIED', 'Grade sheet verified against WBJEE database.');

  // App 3: Diptomoy -> APPROVED
  const app3 = await ApplicationModel.create({
    applicationId: 'APP-2026-1003',
    userId: appUser3.userId,
    courseId: eceCourse.courseId,
    status: 'APPROVED'
  });
  await ApplicationModel.updateStatus(
    app3.applicationId,
    'APPROVED',
    'Candidate meets all admission criteria. Marksheets verified. Offer of admission granted.',
    officer.userId
  );
  await PaymentModel.create({
    paymentId: 'PAY-1003',
    applicationId: app3.applicationId,
    amount: 1000.0,
    status: 'SUCCESS',
    transactionId: 'TXN-IEM-99203',
    paymentMethod: 'NetBanking (SBI)',
    invoiceNumber: 'INV-2026-003'
  });

  // Seed Notifications
  await NotificationModel.create({
    userId: appUser1.userId,
    channel: 'EMAIL',
    recipient: appUser1.email,
    subject: 'Application APP-2026-1001 Successfully Submitted & Fee Paid',
    message: 'Dear Debarghya, your application for B.Tech CSE has been received with fee payment of Rs 1,000 (Txn: TXN-IEM-99201).'
  });
  await NotificationModel.create({
    userId: appUser3.userId,
    channel: 'EMAIL',
    recipient: appUser3.email,
    subject: 'Congratulations! Admission Approved for IEM Kolkata',
    message: 'Dear Diptomoy, your application APP-2026-1003 has been APPROVED by the Admission Committee. You can now download your official Admission Letter from the portal.'
  });

  // Seed Audit Logs
  await AuditModel.log({
    actorId: admin.userId,
    actorEmail: admin.email,
    actorRole: 'ADMINISTRATOR',
    action: 'INITIALIZE_SYSTEM',
    targetEntity: 'COURSES',
    details: 'Initial system boot and setup of 5 academic courses.'
  });
  await AuditModel.log({
    actorId: officer.userId,
    actorEmail: officer.email,
    actorRole: 'ADMISSION_OFFICER',
    action: 'APPROVE_APPLICATION',
    targetEntity: 'APPLICATIONS',
    targetId: 'APP-2026-1003',
    details: 'Application for B.Tech ECE approved with full marksheet verification.'
  });
  await FirestoreAuditModel.log({
    action: 'SEED_DATABASE',
    details: 'System successfully seeded with initial admission batches, courses, and accounts.'
  });

  console.log('--- [SEED] Completed Successfully! Default credentials: ---');
  console.log('Admin:     admin@iem.edu.in    / Admin@123');
  console.log('Officer:   officer@iem.edu.in  / Officer@123');
  console.log('Student:   applicant@iem.edu.in / Student@123');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('[SEED] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seed };
