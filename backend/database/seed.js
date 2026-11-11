const bcrypt = require('bcryptjs');
const {
  UserModel,
  ApplicantModel,
  CourseModel,
  ApplicationModel,
  DocumentModel,
  PaymentModel,
  NotificationModel,
  AuditModel
} = require('../models/firestore-models');

async function seed() {
  console.log('--- [SEED] Starting Pure Firebase Cloud Firestore Seeding ---');

  // Check if users exist in Firestore
  const existingCount = await UserModel.count();
  if (existingCount > 0) {
    console.log(`[SEED] Firestore already contains ${existingCount} users. Seeding verified.`);
    return;
  }

  // 1. Seed Courses
  console.log('[SEED] Inserting academic courses into Firestore collection: "courses"...');
  const coursesData = [
    {
      courseCode: 'BTECH-CSE',
      courseName: 'B.Tech in Computer Science and Engineering',
      degreeLevel: 'UG',
      durationYears: 4,
      department: 'Computer Science & Engineering',
      intakeCapacity: 180,
      applicationFee: 1200.0,
      min10thPercent: 60.0,
      min12thPercent: 60.0
    },
    {
      courseCode: 'BTECH-IT',
      courseName: 'B.Tech in Information Technology',
      degreeLevel: 'UG',
      durationYears: 4,
      department: 'Information Technology',
      intakeCapacity: 120,
      applicationFee: 1200.0,
      min10thPercent: 60.0,
      min12thPercent: 60.0
    },
    {
      courseCode: 'BTECH-ECE',
      courseName: 'B.Tech in Electronics and Communication Engineering',
      degreeLevel: 'UG',
      durationYears: 4,
      department: 'Electronics & Communication',
      intakeCapacity: 120,
      applicationFee: 1200.0,
      min10thPercent: 55.0,
      min12thPercent: 55.0
    },
    {
      courseCode: 'BCA',
      courseName: 'Bachelor of Computer Applications (BCA)',
      degreeLevel: 'UG',
      durationYears: 3,
      department: 'Computer Applications',
      intakeCapacity: 120,
      applicationFee: 1000.0,
      min10thPercent: 50.0,
      min12thPercent: 50.0
    },
    {
      courseCode: 'MCA',
      courseName: 'Master of Computer Applications (MCA)',
      degreeLevel: 'PG',
      durationYears: 2,
      department: 'Computer Applications',
      intakeCapacity: 60,
      applicationFee: 1200.0,
      min10thPercent: 50.0,
      min12thPercent: 50.0
    }
  ];

  for (const c of coursesData) {
    await CourseModel.create(c);
  }

  // 2. Seed Users
  console.log('[SEED] Creating default users in Firestore collection: "users"...');
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
    role: 'ADMINISTRATOR'
  });

  // Admission Officer User
  const officer = await UserModel.create({
    fullName: 'Prof. Anirban Mukherjee',
    email: 'officer@iem.edu.in',
    passwordHash: officerPwd,
    phone: '9830000002',
    role: 'OFFICER'
  });

  // Student Applicant User
  const student = await UserModel.create({
    fullName: 'Debarghya Mitra',
    email: 'student@iem.edu.in',
    passwordHash: studentPwd,
    phone: '9830000003',
    role: 'APPLICANT'
  });

  // Applicant Profile
  await ApplicantModel.upsert(student.userId, {
    dateOfBirth: '2004-06-15',
    gender: 'MALE',
    address: 'Kolkata, West Bengal, India'
  });

  // 3. Seed Demo Application
  console.log('[SEED] Creating demo application in Firestore collection: "applications"...');
  const demoApp = await ApplicationModel.create({
    applicantId: student.userId,
    courseId: 10,
    marks10th: 92.5,
    marks12th: 94.0,
    category: 'GENERAL',
    qualifyingExamRank: 1240
  });

  // 4. Seed Demo Payment
  console.log('[SEED] Registering fee payment in Firestore collection: "payments"...');
  const payment = await PaymentModel.create({
    applicationId: demoApp.applicationId,
    applicantId: student.userId,
    amount: 1200.0,
    paymentMethod: 'ONLINE_UPI'
  });
  await PaymentModel.verify(payment.paymentId, 'GATEWAY-TXN-SUCCESS-SEED');

  // 5. Seed Audit Log & Notification
  await AuditModel.log({
    actorEmail: 'system@iem.edu.in',
    action: 'SYSTEM_INITIALIZED',
    details: 'Pure Firebase Cloud Firestore initialized with seed data'
  });

  await NotificationModel.create({
    userId: student.userId,
    title: 'Welcome to IEM Admission Portal',
    message: 'Your applicant account is verified and ready for admission applications.'
  });

  console.log('--- [SEED] Firestore Database Seeding Completed Successfully! ---');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Error during seeding:', err);
      process.exit(1);
    });
}

module.exports = { seed };
