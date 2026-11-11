const express = require('express');
const router = express.Router();
const { CourseModel, AuditModel } = require('../models/sql-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/courses (Public)
router.get('/', async (req, res) => {
  try {
    const courses = await CourseModel.getAll();
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/courses (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const newCourse = await CourseModel.create(req.body);
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'CREATE_COURSE',
      targetEntity: 'COURSES',
      targetId: String(newCourse.courseId),
      details: `Created new course ${newCourse.courseName} (${newCourse.courseCode})`
    });
    res.status(201).json({ success: true, course: newCourse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/courses/:id (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const updated = await CourseModel.update(req.params.id, req.body);
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'UPDATE_COURSE',
      targetEntity: 'COURSES',
      targetId: String(req.params.id),
      details: `Updated course parameters for course ID ${req.params.id}`
    });
    res.json({ success: true, course: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
