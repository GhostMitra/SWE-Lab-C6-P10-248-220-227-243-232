const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserModel, ApplicantModel, AuditModel } = require('../models/sql-models');
const { FirestoreAuditModel } = require('../models/firestore-models');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { verifyFirebaseToken } = require('../config/firebase');

// POST /api/auth/register (FR-1)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, role = 'APPLICANT', dateOfBirth, gender, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      fullName,
      email,
      passwordHash,
      phone,
      role: role.toUpperCase()
    });

    // If applicant, initialize applicant profile row
    if (user.role === 'APPLICANT') {
      await ApplicantModel.upsert(user.userId, {
        dateOfBirth,
        gender,
        address
      });
    }

    // Audit logs (both SQL and Firebase Firestore NoSQL)
    await AuditModel.log({
      actorId: user.userId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetEntity: 'USERS',
      targetId: String(user.userId),
      details: `New account registered for ${fullName} with role ${user.role}`
    });
    await FirestoreAuditModel.log({
      action: 'USER_REGISTERED',
      userId: user.userId,
      email: user.email,
      role: user.role
    });

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await AuditModel.log({
      actorId: user.userId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetEntity: 'AUTH',
      details: 'User logged in via credentials'
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/firebase-login (Firebase authentication token exchange)
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase idToken is required.' });
    }

    const fbUser = await verifyFirebaseToken(idToken);
    if (!fbUser) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase ID token.' });
    }

    let user = await UserModel.findByEmail(fbUser.email);
    if (!user) {
      // Auto-register via Firebase
      const salt = await bcrypt.genSalt(10);
      const randomPwd = await bcrypt.hash('FirebaseDefault@123', salt);
      user = await UserModel.create({
        fullName: fbUser.name || fbUser.email.split('@')[0],
        email: fbUser.email,
        passwordHash: randomPwd,
        role: 'APPLICANT',
        firebaseUid: fbUser.uid
      });
      await ApplicantModel.upsert(user.userId, {});
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role, fullName: user.fullName, isFirebase: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Firebase authentication successful.',
      token,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isFirebase: true
      }
    });
  } catch (err) {
    console.error('Firebase login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let applicantProfile = null;
    if (req.user.role === 'APPLICANT') {
      applicantProfile = await ApplicantModel.findByUserId(req.user.userId);
    }
    res.json({
      success: true,
      user: {
        userId: req.user.userId,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt,
        applicant: applicantProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
