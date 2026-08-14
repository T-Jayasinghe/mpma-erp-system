import { Router } from 'express';
import {
  createPendingPayment,
  initiateGovPayPayment,
  handleGovPayCallback,
  verifyPayment,
  getStudentPayments,
  getPaymentById,
  sendPaymentReminder,
} from '../controllers/studentPaymentController';

const router = Router();

// POST   /api/student-payments/create            — Create a pending payment record
router.post('/create', createPendingPayment);

// POST   /api/student-payments/send-reminder     — Send installment payment reminder
router.post('/send-reminder', sendPaymentReminder);

// POST   /api/student-payments/govpay/initiate   — Initiate GovPay payment session
router.post('/govpay/initiate', initiateGovPayPayment);

// POST   /api/student-payments/govpay/callback   — GovPay webhook/callback handler
// NOTE: In production, this endpoint should be whitelisted to GovPay's IP range only.
router.post('/govpay/callback', handleGovPayCallback);

// GET    /api/student-payments/verify/:reference  — Verify payment status by reference
router.get('/verify/:payment_reference', verifyPayment);

// GET    /api/student-payments                    — Get all student payments
router.get('/', getStudentPayments);

// GET    /api/student-payments/:id                — Get single payment by ID
router.get('/:id', getPaymentById);

export default router;
