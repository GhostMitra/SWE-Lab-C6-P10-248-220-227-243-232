const express = require('express');
const router = express.Router();
const { PaymentModel, ApplicationModel, CourseModel, NotificationModel, AuditModel, UserModel } = require('../models/sql-models');
const { FirestoreAuditModel } = require('../models/firestore-models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/payments/initiate (IR-4, TC-S05)
router.post('/initiate', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const { applicationId, paymentMethod = 'UPI / CARD' } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'applicationId is required.' });
    }

    const app = await ApplicationModel.findById(applicationId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (app.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Check if already paid
    const existingPayment = await PaymentModel.findByApplicationId(applicationId);
    if (existingPayment && existingPayment.status === 'SUCCESS') {
      return res.status(400).json({
        success: false,
        message: 'Application fee has already been paid for this application.',
        payment: existingPayment
      });
    }

    const course = await CourseModel.findById(app.courseId);
    const amount = course ? course.applicationFee : 1000.0;

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const gatewayRef = `GW-ORDER-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await PaymentModel.create({
      paymentId,
      applicationId,
      amount,
      status: 'INITIATED',
      paymentMethod,
      gatewayReference: gatewayRef
    });

    res.json({
      success: true,
      message: 'Payment order initiated.',
      payment,
      gatewayOrder: {
        gatewayId: 'IEM_PAYMENT_GATEWAY_V1',
        gatewayName: 'IEM Multi-Rail Checkout (Razorpay / Stripe / UPI)',
        orderId: gatewayRef,
        amount,
        currency: 'INR',
        applicantName: req.user.fullName,
        applicantEmail: req.user.email
      }
    });
  } catch (err) {
    console.error('Initiate payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/verify (Process Charge & Authorize Transaction)
router.post('/verify', authenticateToken, authorizeRoles('APPLICANT'), async (req, res) => {
  try {
    const { paymentId, gatewayOrderId, paymentMethod = 'UPI / CARD', simulateFailure = false } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required.' });
    }

    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (simulateFailure) {
      await PaymentModel.updateStatus(paymentId, 'FAILED', null);
      return res.status(402).json({
        success: false,
        message: 'Payment declined by external bank or authorization timeout.',
        paymentStatus: 'FAILED'
      });
    }

    // Generate unique transaction ID & Invoice
    const transactionId = `TXN-IEM-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedPayment = await PaymentModel.updateStatus(paymentId, 'SUCCESS', transactionId);

    // Update invoice and method if needed
    const app = await ApplicationModel.findById(payment.applicationId);

    // Audit Log (SQL)
    await AuditModel.log({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'PAYMENT_SUCCESS',
      targetEntity: 'PAYMENTS',
      targetId: paymentId,
      details: `Fee payment of Rs ${payment.amount} successful. Txn ID: ${transactionId}`
    });

    // Audit Log (Firebase Firestore NoSQL)
    await FirestoreAuditModel.log({
      action: 'PAYMENT_SETTLED',
      paymentId,
      transactionId,
      amount: payment.amount,
      applicationId: payment.applicationId
    });

    // Dispatch confirmation notification
    await NotificationModel.create({
      userId: req.user.userId,
      channel: 'EMAIL',
      recipient: req.user.email,
      subject: `IEM Admission Fee Receipt — ${transactionId}`,
      message: `Dear ${req.user.fullName}, payment of Rs ${payment.amount} for application ${payment.applicationId} was successful (Transaction ID: ${transactionId}). Your application is now queued for evaluation.`
    });

    res.json({
      success: true,
      message: 'Payment authorized and confirmed successfully.',
      payment: {
        ...updatedPayment,
        transactionId,
        invoiceNumber,
        status: 'SUCCESS'
      },
      receipt: {
        receiptNo: invoiceNumber,
        transactionId,
        applicationId: payment.applicationId,
        applicantName: req.user.fullName,
        applicantEmail: req.user.email,
        amount: payment.amount,
        currency: 'INR',
        paymentDate: new Date().toISOString(),
        paymentMethod,
        status: 'PAID'
      }
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/:applicationId/receipt
router.get('/:applicationId/receipt', authenticateToken, async (req, res) => {
  try {
    const payment = await PaymentModel.findByApplicationId(req.params.applicationId);
    if (!payment || payment.status !== 'SUCCESS') {
      return res.status(404).json({ success: false, message: 'No successful payment record found for this application.' });
    }

    const app = await ApplicationModel.findById(payment.applicationId);
    res.json({
      success: true,
      receipt: {
        paymentId: payment.paymentId,
        applicationId: payment.applicationId,
        amount: payment.amount,
        transactionId: payment.transactionId,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        invoiceNumber: payment.invoiceNumber || `INV-${payment.paymentId}`,
        status: payment.status,
        applicantName: app.fullName,
        applicantEmail: app.email,
        courseName: app.courseName
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
