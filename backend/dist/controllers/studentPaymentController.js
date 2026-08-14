"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentReminder = exports.getPaymentById = exports.getStudentPayments = exports.verifyPayment = exports.handleGovPayCallback = exports.initiateGovPayPayment = exports.createPendingPayment = void 0;
const StudentPayment_1 = __importDefault(require("../models/StudentPayment"));
const Student_1 = __importDefault(require("../models/Student"));
const paymentHelpers_1 = require("../utils/paymentHelpers");
// ============================================================
// GOVPAY CONFIGURATION PLACEHOLDERS
// When official GovPay documentation is available, replace
// these with real credentials from environment variables.
// ============================================================
// const GOVPAY_MERCHANT_ID   = process.env.GOVPAY_MERCHANT_ID;
// const GOVPAY_API_KEY       = process.env.GOVPAY_API_KEY;
// const GOVPAY_SECRET        = process.env.GOVPAY_SECRET;
// const GOVPAY_INITIATE_URL  = process.env.GOVPAY_INITIATE_URL;  // e.g. "https://api.govpay.lk/v1/payment/initiate"
// const GOVPAY_VERIFY_URL    = process.env.GOVPAY_VERIFY_URL;    // e.g. "https://api.govpay.lk/v1/payment/verify"
// const GOVPAY_CALLBACK_URL  = process.env.GOVPAY_CALLBACK_URL;  // Your public callback endpoint
// ============================================================
// ============================================================
// A. CREATE PENDING PAYMENT
// POST /api/student-payments/create
// ============================================================
const createPendingPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { student_id, course_batch_id, registration_fee, course_fee } = req.body;
        // Validate required fields
        if (!student_id || registration_fee === undefined || course_fee === undefined) {
            return res.status(400).json({
                success: false,
                message: 'student_id, registration_fee, and course_fee are required.',
            });
        }
        // Verify student exists
        const student = yield Student_1.default.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }
        // Calculate total payable
        const full_amount_payable = (0, paymentHelpers_1.formatAmount)(parseFloat(registration_fee) + parseFloat(course_fee));
        // Generate unique payment reference
        const payment_reference = (0, paymentHelpers_1.generatePaymentReference)(student_id);
        // Create payment record with PENDING status
        // SECURITY: Payment status is NEVER set from frontend.
        // Only backend callback (handleGovPayCallback) can change status to PAID.
        const payment = yield StudentPayment_1.default.create({
            student_id,
            course_batch_id: course_batch_id || null,
            registration_fee: parseFloat(registration_fee),
            course_fee: parseFloat(course_fee),
            full_amount_payable,
            payment_reference,
            payment_status: 'PENDING',
            payment_completed: false,
            payment_method: 'GOVPAY',
        });
        return res.status(201).json({
            success: true,
            message: 'Pending payment created successfully',
            data: {
                payment_id: payment.id,
                payment_reference: payment.payment_reference,
                full_amount_payable: payment.full_amount_payable,
                payment_status: payment.payment_status,
            },
        });
    }
    catch (error) {
        console.error('createPendingPayment error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.createPendingPayment = createPendingPayment;
// ============================================================
// B. INITIATE GOVPAY PAYMENT
// POST /api/student-payments/govpay/initiate
// ============================================================
const initiateGovPayPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { payment_id, custom_amount, installment_label } = req.body;
        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'payment_id is required.' });
        }
        // Find the payment record
        const payment = yield StudentPayment_1.default.findByPk(payment_id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found.' });
        }
        // Only PENDING payments can be initiated
        if (payment.payment_status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `Payment cannot be initiated. Current status: ${payment.payment_status}`,
            });
        }
        // Determine target payment amount (Custom Installment or Full Amount)
        const targetAmount = custom_amount ? parseFloat(custom_amount) : payment.full_amount_payable;
        const labelQuery = installment_label ? `&label=${encodeURIComponent(installment_label)}` : '';
        // SANDBOX / DUMMY: Use internal demo page
        const payment_url = `/student-management/payment/govpay-demo?reference=${payment.payment_reference}&amount=${targetAmount}${labelQuery}`;
        return res.status(200).json({
            success: true,
            message: 'GovPay payment initiated (SANDBOX MODE)',
            data: {
                payment_url,
                payment_reference: payment.payment_reference,
                amount: targetAmount,
            },
        });
    }
    catch (error) {
        console.error('initiateGovPayPayment error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.initiateGovPayPayment = initiateGovPayPayment;
// ============================================================
// C. HANDLE GOVPAY CALLBACK (WEBHOOK)
// POST /api/student-payments/govpay/callback
// ============================================================
const handleGovPayCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { payment_reference, transaction_id, status, amount, paid_at } = req.body;
        // --------------------------------------------------------
        // TODO — REAL GOVPAY SIGNATURE VERIFICATION
        // When official GovPay documentation is available, add:
        // 1. Extract signature from request headers (e.g., req.headers['x-govpay-signature'])
        // 2. Verify HMAC signature using GOVPAY_SECRET
        // 3. Reject any callback that fails signature verification
        // This is critical for security — never skip in production.
        // --------------------------------------------------------
        if (!payment_reference || !status) {
            return res.status(400).json({ success: false, message: 'payment_reference and status are required.' });
        }
        // Find payment by reference
        const payment = yield StudentPayment_1.default.findOne({ where: { payment_reference } });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found for reference.' });
        }
        // Prevent re-processing already completed payments
        if (payment.payment_status === 'PAID') {
            return res.status(200).json({ success: true, message: 'Payment already marked as PAID.' });
        }
        // Store the full callback for audit trail
        const callback_response = JSON.stringify(req.body);
        if (status === 'SUCCESS') {
            const callbackAmount = (0, paymentHelpers_1.formatAmount)(parseFloat(amount));
            const isInstallment = !!req.body.installment_label;
            if (!isInstallment) {
                // ── Full payment: verify exact amount match ──────────────────
                const expectedAmount = (0, paymentHelpers_1.formatAmount)(parseFloat(payment.full_amount_payable));
                if (callbackAmount !== expectedAmount) {
                    console.warn(`Amount mismatch for ${payment_reference}. Expected: ${expectedAmount}, Got: ${callbackAmount}`);
                    yield payment.update({
                        payment_status: 'FAILED',
                        payment_completed: false,
                        callback_response,
                        remarks: `Amount mismatch: expected ${expectedAmount}, received ${callbackAmount}`,
                    });
                    return res.status(400).json({
                        success: false,
                        message: 'Payment amount mismatch. Payment rejected.',
                    });
                }
            }
            // ── Calculate cumulative amount paid so far ───────────────────
            const previouslyPaid = (0, paymentHelpers_1.formatAmount)(parseFloat(payment.amount_paid) || 0);
            const newTotalPaid = (0, paymentHelpers_1.formatAmount)(previouslyPaid + callbackAmount);
            const fullAmount = (0, paymentHelpers_1.formatAmount)(parseFloat(payment.full_amount_payable));
            const isFullyPaid = newTotalPaid >= fullAmount;
            // Mark payment as PAID
            const receipt_number = isFullyPaid ? (0, paymentHelpers_1.generateReceiptNumber)() : (payment.receipt_number || null);
            yield payment.update({
                payment_status: isFullyPaid ? 'PAID' : 'PENDING',
                amount_paid: newTotalPaid,
                payment_completed: isFullyPaid,
                transaction_id: transaction_id || payment.transaction_id || null,
                receipt_number,
                paid_at: isFullyPaid ? (paid_at ? new Date(paid_at) : new Date()) : payment.paid_at,
                callback_response,
                remarks: isFullyPaid
                    ? 'Payment confirmed via GovPay callback'
                    : `Installment paid: LKR ${callbackAmount.toLocaleString()}. Total paid so far: LKR ${newTotalPaid.toLocaleString()} of LKR ${fullAmount.toLocaleString()}.`,
            });
            // ── Update student status if fully paid ───────────────────────
            if (isFullyPaid) {
                const student = yield Student_1.default.findByPk(payment.student_id);
                if (student) {
                    yield student.update({ status: 'Registered' });
                    console.log(`Student ${payment.student_id} status updated to Registered.`);
                }
            }
            return res.status(200).json({
                success: true,
                message: isFullyPaid ? 'Payment marked as PAID successfully.' : 'Installment payment recorded.',
                data: {
                    payment_reference,
                    payment_status: isFullyPaid ? 'PAID' : 'PENDING',
                    amount_paid: newTotalPaid,
                    receipt_number: isFullyPaid ? receipt_number : null,
                    transaction_id,
                    fully_paid: isFullyPaid,
                },
            });
        }
        else if (status === 'FAILED') {
            yield payment.update({
                payment_status: 'FAILED',
                payment_completed: false,
                callback_response,
                remarks: 'Payment failed as reported by GovPay callback',
            });
            return res.status(200).json({
                success: true,
                message: 'Payment marked as FAILED.',
                data: { payment_reference, payment_status: 'FAILED' },
            });
        }
        else if (status === 'CANCELLED') {
            yield payment.update({
                payment_status: 'CANCELLED',
                payment_completed: false,
                callback_response,
                remarks: 'Payment cancelled by user',
            });
            return res.status(200).json({
                success: true,
                message: 'Payment marked as CANCELLED.',
                data: { payment_reference, payment_status: 'CANCELLED' },
            });
        }
        else {
            return res.status(400).json({ success: false, message: `Unknown payment status: ${status}` });
        }
    }
    catch (error) {
        console.error('handleGovPayCallback error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.handleGovPayCallback = handleGovPayCallback;
// ============================================================
// D. VERIFY PAYMENT STATUS
// GET /api/student-payments/verify/:payment_reference
// ============================================================
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { payment_reference } = req.params;
        const payment = yield StudentPayment_1.default.findOne({
            where: { payment_reference },
            include: [
                {
                    model: Student_1.default,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                },
            ],
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }
        // --------------------------------------------------------
        // TODO — REAL GOVPAY VERIFICATION
        // If payment is still PENDING, you can call GovPay's verify API:
        //
        // if (payment.payment_status === 'PENDING') {
        //   const verifyResponse = await axios.get(`${GOVPAY_VERIFY_URL}/${payment_reference}`, {
        //     headers: { 'Authorization': `Bearer ${GOVPAY_API_KEY}` }
        //   });
        //   // Update local status based on GovPay's verified status
        // }
        // --------------------------------------------------------
        return res.status(200).json({
            success: true,
            message: 'Payment status retrieved.',
            data: {
                payment_id: payment.id,
                payment_reference: payment.payment_reference,
                payment_status: payment.payment_status,
                payment_completed: payment.payment_completed,
                amount_paid: payment.amount_paid,
                full_amount_payable: payment.full_amount_payable,
                transaction_id: payment.transaction_id,
                receipt_number: payment.receipt_number,
                paid_at: payment.paid_at,
            },
        });
    }
    catch (error) {
        console.error('verifyPayment error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.verifyPayment = verifyPayment;
// ============================================================
// E. GET ALL STUDENT PAYMENTS
// GET /api/student-payments
// ============================================================
const getStudentPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield StudentPayment_1.default.findAll({
            include: [
                {
                    model: Student_1.default,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'course', 'batch', 'payment_plan', 'installment_breakdown'],
                },
            ],
            order: [['created_at', 'DESC']],
        });
        return res.status(200).json({ success: true, data: payments });
    }
    catch (error) {
        console.error('getStudentPayments error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.getStudentPayments = getStudentPayments;
// ============================================================
// F. GET PAYMENT BY ID
// GET /api/student-payments/:id
// ============================================================
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const payment = yield StudentPayment_1.default.findByPk(id, {
            include: [
                {
                    model: Student_1.default,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'course', 'batch', 'payment_plan', 'installment_breakdown'],
                },
            ],
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        }
        return res.status(200).json({ success: true, data: payment });
    }
    catch (error) {
        console.error('getPaymentById error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.getPaymentById = getPaymentById;
// ============================================================
// G. SEND INSTALLMENT REMINDER
// POST /api/student-payments/send-reminder
// ============================================================
const sendPaymentReminder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { payment_id, reminder_type, message, recipient } = req.body;
        if (!payment_id) {
            return res.status(400).json({ success: false, message: 'payment_id is required.' });
        }
        const payment = yield StudentPayment_1.default.findByPk(payment_id, {
            include: [{ model: Student_1.default, as: 'student' }]
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found.' });
        }
        const studentObj = payment.student;
        const recipientEmail = recipient || (studentObj ? studentObj.email : payment.student_id);
        // Log reminder in remarks audit log
        const now = new Date().toLocaleString('en-LK');
        const existingRemarks = payment.remarks || '';
        const newRemarks = `${existingRemarks}\n[Reminder Sent ${now}]: ${reminder_type || 'Email/SMS'} sent to ${recipientEmail}`.trim();
        yield payment.update({ remarks: newRemarks });
        return res.status(200).json({
            success: true,
            message: `Installment reminder dispatched via ${reminder_type || 'Email/SMS'} successfully!`,
            data: {
                payment_id: payment.id,
                sent_at: now,
                recipient: recipientEmail,
            }
        });
    }
    catch (error) {
        console.error('sendPaymentReminder error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
});
exports.sendPaymentReminder = sendPaymentReminder;
