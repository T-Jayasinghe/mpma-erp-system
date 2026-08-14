"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentPaymentController_1 = require("../controllers/studentPaymentController");
const router = (0, express_1.Router)();
// POST   /api/student-payments/create            — Create a pending payment record
router.post('/create', studentPaymentController_1.createPendingPayment);
// POST   /api/student-payments/send-reminder     — Send installment payment reminder
router.post('/send-reminder', studentPaymentController_1.sendPaymentReminder);
// POST   /api/student-payments/govpay/initiate   — Initiate GovPay payment session
router.post('/govpay/initiate', studentPaymentController_1.initiateGovPayPayment);
// POST   /api/student-payments/govpay/callback   — GovPay webhook/callback handler
// NOTE: In production, this endpoint should be whitelisted to GovPay's IP range only.
router.post('/govpay/callback', studentPaymentController_1.handleGovPayCallback);
// GET    /api/student-payments/verify/:reference  — Verify payment status by reference
router.get('/verify/:payment_reference', studentPaymentController_1.verifyPayment);
// GET    /api/student-payments                    — Get all student payments
router.get('/', studentPaymentController_1.getStudentPayments);
// GET    /api/student-payments/:id                — Get single payment by ID
router.get('/:id', studentPaymentController_1.getPaymentById);
exports.default = router;
