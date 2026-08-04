import { Request, Response } from 'express';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import Student, { StudentAttributes, ApplicationStatus } from '../models/Student';
import StudentPayment from '../models/StudentPayment';
import ApplicationDocument from '../models/ApplicationDocument';
import { ApplicationValidationError, createStudentApplication } from '../services/studentApplicationService';
import { sequelize } from '../config/db';
import { generatePaymentReference, formatAmount } from '../utils/paymentHelpers';
import {
  sendEnrollmentPaymentEmail,
  sendCorrectionRequestEmail,
  sendApplicationRejectionEmail,
} from '../services/emailService';

const DEFAULT_REGISTRATION_FEE = 2500;
const DEFAULT_COURSE_FEE = 25000;

const getEmailDeliveryFailureMessage = (error: any): string => {
  if (error?.responseCode === 550 && /sending limit exceeded/i.test(error?.message || '')) {
    return 'Gmail rejected the email because the sender account reached its daily sending limit. Retry after the quota resets or configure another SMTP sender.';
  }
  if (['EAUTH', 'EENVELOPE'].includes(error?.code)) {
    return 'The email provider rejected the message. Check the SMTP account and recipient address, then retry.';
  }
  if (['ETIMEDOUT', 'ECONNECTION'].includes(error?.code)) {
    return 'The email provider could not be reached. Check the network connection and retry.';
  }
  return 'Application approved and payment record created, but the email provider could not deliver the message.';
};

type StudentWithLatestPayment = StudentAttributes & {
  createdAt?: Date;
  updatedAt?: Date;
  latestPayment: StudentPayment | null;
  registrationStatus: 'Pending Payment' | 'Registered' | 'Cancelled';
};

const getRegistrationStatus = (
  student: Student,
  payment?: StudentPayment | null
): StudentWithLatestPayment['registrationStatus'] => {
  if (student.status === 'Dropout' || payment?.payment_status === 'CANCELLED') {
    return 'Cancelled';
  }
  if (student.status === 'Registered') {
    return 'Registered';
  }
  return 'Pending Payment';
};

const attachLatestPayments = async (students: Student[]): Promise<StudentWithLatestPayment[]> => {
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const payments = await StudentPayment.findAll({
    where: { student_id: { [Op.in]: studentIds } },
    order: [['created_at', 'DESC']],
  });

  const latestByStudent = new Map<string, StudentPayment>();
  for (const payment of payments) {
    if (!latestByStudent.has(payment.student_id)) {
      latestByStudent.set(payment.student_id, payment);
    }
  }

  return students.map((student) => ({
    ...student.toJSON(),
    latestPayment: latestByStudent.get(student.id) || null,
    registrationStatus: getRegistrationStatus(student, latestByStudent.get(student.id)),
  }));
};

const normalizeQueryValue = (value: unknown) => String(value || '').trim();

const formatReportDate = (value?: string | Date | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-LK');
};

const buildStudentFilters = (query: Request['query']) => {
  const {
    search,
    category,
    course_id,
    batch_id,
    payment_status,
    registration_status,
    from_date,
    to_date,
    status,
  } = query;
  const where: Record<string, unknown> = {};

  const statusValue = normalizeQueryValue(status);
  if (statusValue) {
    const statuses = statusValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length > 0) {
      where.status = { [Op.in]: statuses };
    }
  }

  const categoryValue = normalizeQueryValue(category);
  if (categoryValue && categoryValue !== 'All') {
    where.studentCategory = categoryValue;
  }

  const courseValue = normalizeQueryValue(course_id);
  if (courseValue) {
    where.course = courseValue;
  }

  const batchValue = normalizeQueryValue(batch_id);
  if (batchValue) {
    where.batch = batchValue;
  }

  const fromDate = normalizeQueryValue(from_date);
  const toDate = normalizeQueryValue(to_date);
  if (fromDate || toDate) {
    const dateFilter: Record<symbol, string> = {};
    if (fromDate) dateFilter[Op.gte] = fromDate;
    if (toDate) dateFilter[Op.lte] = toDate;
    where.enrollmentDate = dateFilter;
  }

  return {
    where,
    search: normalizeQueryValue(search).toLowerCase(),
    paymentStatus: normalizeQueryValue(payment_status).toUpperCase(),
    registrationStatus: normalizeQueryValue(registration_status),
    appliedFilters: {
      search: normalizeQueryValue(search) || 'All',
      category: categoryValue || 'All',
      course: courseValue || 'All',
      batch: batchValue || 'All',
      paymentStatus: normalizeQueryValue(payment_status) || 'All',
      registrationStatus: normalizeQueryValue(registration_status) || 'All',
      fromDate: fromDate || 'All',
      toDate: toDate || 'All',
    },
  };
};

const getFilteredStudents = async (query: Request['query']) => {
  const filters = buildStudentFilters(query);
  const students = await Student.findAll({
    where: filters.where,
    order: [['createdAt', 'DESC']],
  });

  let studentsWithPayments = await attachLatestPayments(students);

  if (filters.search) {
    studentsWithPayments = studentsWithPayments.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const nic = String(student.nic || '').toLowerCase();
      const passport = String(student.passport || '').toLowerCase();
      const paymentReference = String(student.latestPayment?.payment_reference || '').toLowerCase();
      return (
        fullName.includes(filters.search) ||
        nic.includes(filters.search) ||
        passport.includes(filters.search) ||
        paymentReference.includes(filters.search)
      );
    });
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
    studentsWithPayments = studentsWithPayments.filter(
      (student) => student.latestPayment?.payment_status === filters.paymentStatus
    );
  }

  if (filters.registrationStatus && filters.registrationStatus !== 'All') {
    studentsWithPayments = studentsWithPayments.filter(
      (student) => student.registrationStatus === filters.registrationStatus
    );
  }

  return { students: studentsWithPayments, appliedFilters: filters.appliedFilters };
};

// ============================================================
// 1. STUDENT APPLICATION SUBMISSION
// POST /api/students/register
// ============================================================
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const result = await createStudentApplication(req.body, (req.files as Express.Multer.File[]) || [], 'ADMIN_DIRECT');
    res.status(201).json({ success: true, message: 'Application submitted successfully', ...result, status: 'PENDING_REVIEW' });
  } catch (error: unknown) {
    if (error instanceof ApplicationValidationError) return res.status(400).json({ success: false, message: error.message, fields: error.fields });
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to submit the application.',
    });
  }
};

// ============================================================
// 2. GET PENDING APPLICATIONS (Admin View)
// GET /api/students/pending
// ============================================================
export const getPendingApplications = async (req: Request, res: Response) => {
  try {
    const students = await Student.findAll({
      where: { application_status: 'PENDING_REVIEW' },
      include: [
        {
          model: ApplicationDocument,
          as: 'documents',
          separate: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      count: students.length,
      students: students.map((s) => ({
        ...s.toJSON(),
        applicationStatus: s.application_status,
      })),
    });
  } catch (error: any) {
    console.error('Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// ============================================================
// 3. GET APPLICATION DETAILS (Admin View)
// GET /api/students/application/:id
// ============================================================
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id as string, {
      include: [
        {
          model: ApplicationDocument,
          as: 'documents',
          separate: true,
          attributes: { exclude: ['file_data'] },
        },
        {
          model: StudentPayment,
          as: 'payments',
          separate: true,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      student: student.toJSON(),
    });
  } catch (error: any) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// Stream one stored application document after confirming it belongs to the
// requested student. The admin frontend can request inline viewing or download.
export const getApplicationDocument = async (req: Request, res: Response) => {
  try {
    const document = await ApplicationDocument.findOne({
      where: {
        id: Number(req.params.documentId),
        student_id: req.params.id as string,
      },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const safeName = document.file_name.replace(/[\r\n"]/g, '_');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Length', document.file_data.length);
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(document.file_data);
  } catch (error: any) {
    console.error('Get application document error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve document' });
  }
};

// ============================================================
// 4. ADMIN APPROVAL & SEND PAYMENT REQUEST
// PATCH /api/students/:id/approve-payment
// ============================================================
export const approveAndSendPaymentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      registration_fee: registrationFeeInput,
      course_fee: courseFeeInput,
    } = req.body;

    const student = await Student.findByPk(id as string);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Validate student is in PENDING_REVIEW status
    if (student.application_status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Current application status: ${student.application_status}`,
      });
    }

    // Set fees
    const registration_fee =
      registrationFeeInput != null && registrationFeeInput !== ''
        ? Number(registrationFeeInput)
        : DEFAULT_REGISTRATION_FEE;
    const course_fee =
      courseFeeInput != null && courseFeeInput !== ''
        ? Number(courseFeeInput)
        : DEFAULT_COURSE_FEE;
    const full_amount_payable = formatAmount(registration_fee + course_fee);
    const transaction = await sequelize.transaction();
    let payment: StudentPayment;
    try {
      // Reuse the latest pending record if a previous approval attempt failed.
      // This makes approval idempotent and avoids duplicate payment requests.
      const pendingPayments = await StudentPayment.findAll({
        where: { student_id: student.id, payment_status: 'PENDING' },
        order: [['created_at', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const existingPayment = pendingPayments[0];
      if (existingPayment) {
        await existingPayment.update({
          registration_fee,
          course_fee,
          full_amount_payable,
          payment_method: 'GOVPAY',
          payment_completed: false,
        }, { transaction });
        payment = existingPayment;

        // Preserve failed-attempt records for audit, but make only one payable.
        for (const duplicate of pendingPayments.slice(1)) {
          await duplicate.update({
            payment_status: 'CANCELLED',
            remarks: 'Cancelled duplicate created by an earlier failed approval attempt',
          }, { transaction });
        }
      } else {
        payment = await StudentPayment.create({
          student_id: student.id,
          course_batch_id: null,
          registration_fee,
          course_fee,
          full_amount_payable,
          payment_reference: generatePaymentReference(student.id),
          payment_status: 'PENDING',
          payment_completed: false,
          payment_method: 'GOVPAY',
        }, { transaction });
      }

      await student.update({
        application_status: 'APPROVED',
        status: 'Qualified',
        payment_status_type: 'PENDING',
        approved_at: new Date(),
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const payment_reference = payment.payment_reference;

    // Send qualification & payment email
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const paymentPageUrl = `${frontendUrl}/student-management/payment?ref=${encodeURIComponent(payment_reference)}`;
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    let emailSent = false;
    let emailFailureMessage = '';
    try {
      await sendEnrollmentPaymentEmail(student.email, {
        studentName,
        studentCategory: student.studentCategory || 'Student',
        courseName: student.course,
        batchName: student.batch,
        paymentReference: payment_reference,
        registrationFee: registration_fee,
        courseFee: course_fee,
        totalAmount: full_amount_payable,
        paymentPageUrl,
      });
      emailSent = true;
    } catch (emailError: any) {
      console.error('Failed to send qualification payment email:', emailError?.message || emailError);
      emailFailureMessage = getEmailDeliveryFailureMessage(emailError);
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Application approved, payment record created, and qualification email sent successfully'
        : emailFailureMessage,
      student: student.toJSON(),
      payment: payment.toJSON(),
      emailSent,
    });
  } catch (error: any) {
    console.error('Approve and send payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// Retry only the notification for an already-approved application. This never
// creates a second payment and is safe to use after a temporary SMTP failure.
export const resendQualificationPaymentNotification = async (req: Request, res: Response) => {
  try {
    const student = await Student.findByPk(req.params.id as string);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.application_status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Only approved applications can resend a payment email' });
    }

    const payment = await StudentPayment.findOne({
      where: { student_id: student.id, payment_status: 'PENDING' },
      order: [['created_at', 'DESC']],
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Pending payment request not found' });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    await sendEnrollmentPaymentEmail(student.email, {
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentCategory: student.studentCategory || 'Student',
      courseName: student.course,
      batchName: student.batch,
      paymentReference: payment.payment_reference,
      registrationFee: Number(payment.registration_fee),
      courseFee: Number(payment.course_fee),
      totalAmount: Number(payment.full_amount_payable),
      paymentPageUrl: `${frontendUrl}/student-management/payment?ref=${encodeURIComponent(payment.payment_reference)}`,
    });

    return res.json({ success: true, emailSent: true, message: 'Payment email sent successfully' });
  } catch (error: any) {
    console.error('Resend qualification email error:', error?.message || error);
    const quotaExceeded = error?.responseCode === 550 && /sending limit exceeded/i.test(error?.message || '');
    return res.status(quotaExceeded ? 429 : 502).json({
      success: false,
      emailSent: false,
      message: getEmailDeliveryFailureMessage(error),
    });
  }
};

// ============================================================
// 5. ADMIN REQUEST CORRECTION
// PATCH /api/students/:id/request-correction
// ============================================================
export const requestCorrection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { correctionDetails } = req.body;

    if (!correctionDetails || typeof correctionDetails !== 'string' || !correctionDetails.trim()) {
      return res.status(400).json({
        success: false,
        message: 'correctionDetails is required',
      });
    }

    const student = await Student.findByPk(id as string);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.application_status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Cannot request correction. Current application status: ${student.application_status}`,
      });
    }

    // Update student status
    await student.update({
      application_status: 'CORRECTION_REQUESTED',
      admin_notes: correctionDetails,
    });

    // Send correction request email
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    let emailSent = false;
    try {
      await sendCorrectionRequestEmail(student.email, {
        studentName,
        courseName: student.course,
        correctionDetails,
      });
      emailSent = true;
    } catch (emailError: any) {
      console.error('Failed to send correction request email:', emailError?.message || emailError);
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Correction request sent to student successfully'
        : 'Correction request marked, but email could not be sent',
      student: student.toJSON(),
      emailSent,
    });
  } catch (error: any) {
    console.error('Request correction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// ============================================================
// 6. ADMIN REJECT APPLICATION
// PATCH /api/students/:id/reject
// ============================================================
export const rejectApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'rejectionReason is required',
      });
    }

    const student = await Student.findByPk(id as string);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.application_status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Current application status: ${student.application_status}`,
      });
    }

    // Update student status
    await student.update({
      application_status: 'REJECTED',
      status: 'Pending',
      admin_notes: rejectionReason,
    });

    // Send rejection email
    const studentName = `${student.firstName} ${student.lastName}`.trim();
    let emailSent = false;
    try {
      await sendApplicationRejectionEmail(student.email, {
        studentName,
        courseName: student.course,
        rejectionReason,
      });
      emailSent = true;
    } catch (emailError: any) {
      console.error('Failed to send rejection email:', emailError?.message || emailError);
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Application rejected and notification sent to student'
        : 'Application rejected, but notification email could not be sent',
      student: student.toJSON(),
      emailSent,
    });
  } catch (error: any) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// ============================================================
// 7. ADMIN UPDATE APPLICATION STUDENT DETAILS
// PATCH /api/students/:id/update-details (Admin Review Only)
// ============================================================
export const updateApplicationStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id as string);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Only allow updates while in PENDING_REVIEW or CORRECTION_REQUESTED
    const allowedStatuses: ApplicationStatus[] = ['PENDING_REVIEW', 'CORRECTION_REQUESTED'];
    if (!allowedStatuses.includes(student.application_status as ApplicationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update student details in ${student.application_status} status. Only pending applications can be edited.`,
      });
    }

    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dob',
      'gender',
      'address',
      'course',
      'batch',
      'studentCategory',
      'nic',
      'passport',
      'admin_notes',
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.idNumber !== undefined && updates.nic === undefined) {
      updates.nic = req.body.idNumber;
    }
    if (req.body.passportNumber !== undefined && updates.passport === undefined) {
      updates.passport = req.body.passportNumber;
    }
    if (req.body.qualificationsData !== undefined && updates.admin_notes === undefined) {
      updates.admin_notes = typeof req.body.qualificationsData === 'object'
        ? JSON.stringify(req.body.qualificationsData)
        : req.body.qualificationsData;
    }

    // Validate email uniqueness
    if (updates.email && updates.email !== student.email) {
      const existingStudent = await Student.findOne({
        where: {
          email: updates.email as string,
          id: { [Op.ne]: id as string },
        },
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'A student with this email already exists.',
        });
      }
    }

    await student.update(updates);
    res.json({
      success: true,
      message: 'Student details updated successfully',
      student: student.toJSON(),
    });
  } catch (error: any) {
    console.error('Update application student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// ============================================================
// LEGACY ENDPOINTS (Kept for backward compatibility)
// ============================================================

// Legacy: Enroll Student (still supports old workflow if needed)
export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      course,
      batch,
      studentCategory,
      nic,
      idNumber,
      passport,
      passportNumber,
      registration_fee: registrationFeeInput,
      course_fee: courseFeeInput,
    } = req.body;

    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(400).json({ message: 'A student with this email already exists.' });
    }

    const student = await Student.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      course,
      batch,
      studentCategory: studentCategory || null,
      nic: nic || idNumber || null,
      passport: passport || passportNumber || null,
      status: 'Enrolled',
      application_status: null,
      payment_status_type: 'PENDING',
    });

    const registration_fee =
      registrationFeeInput != null && registrationFeeInput !== ''
        ? Number(registrationFeeInput)
        : DEFAULT_REGISTRATION_FEE;
    const course_fee =
      courseFeeInput != null && courseFeeInput !== ''
        ? Number(courseFeeInput)
        : DEFAULT_COURSE_FEE;
    const full_amount_payable = formatAmount(registration_fee + course_fee);
    const payment_reference = generatePaymentReference(student.id);

    const payment = await StudentPayment.create({
      student_id: student.id,
      course_batch_id: null,
      registration_fee,
      course_fee,
      full_amount_payable,
      payment_reference,
      payment_status: 'PENDING',
      payment_completed: false,
      payment_method: 'GOVPAY',
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const paymentPageUrl = `${frontendUrl}/student-management/payment?ref=${encodeURIComponent(payment_reference)}`;
    const studentName = `${firstName} ${lastName}`.trim();

    let emailSent = false;
    try {
      await sendEnrollmentPaymentEmail(email, {
        studentName,
        studentCategory: studentCategory || 'Not specified',
        courseName: course,
        batchName: batch,
        paymentReference: payment_reference,
        registrationFee: registration_fee,
        courseFee: course_fee,
        totalAmount: full_amount_payable,
        paymentPageUrl,
      });
      emailSent = true;
    } catch (emailError: any) {
      console.error('Failed to send enrollment payment email:', emailError?.message || emailError);
    }

    const message = emailSent
      ? 'Student enrolled, pending payment created, and payment details emailed successfully'
      : 'Student enrolled and pending payment created successfully, but payment email could not be sent';

    res.status(201).json({
      message,
      student,
      payment,
      emailSent,
    });
  } catch (error: any) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { students } = await getFilteredStudents(req.query);
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getStudentsPdfReport = async (req: Request, res: Response) => {
  try {
    const { students, appliedFilters } = await getFilteredStudents(req.query);
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const fileName = `student-management-report-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    doc
      .fontSize(18)
      .fillColor('#0f172a')
      .text('MPMA ERP System', { align: 'center' })
      .fontSize(14)
      .text('Student Management Report', { align: 'center' })
      .moveDown(0.5);

    doc.fontSize(9).fillColor('#475569');
    doc.text(`Generated: ${new Date().toLocaleString('en-LK')}`);
    doc.text(`Total student count: ${students.length}`);
    doc.moveDown(0.5);

    doc.fontSize(8).fillColor('#334155').text('Applied Filters', { underline: true });
    doc.fillColor('#64748b').text(
      `Search: ${appliedFilters.search} | Category: ${appliedFilters.category} | Course: ${appliedFilters.course} | Batch: ${appliedFilters.batch} | Payment: ${appliedFilters.paymentStatus} | Registration: ${appliedFilters.registrationStatus} | From: ${appliedFilters.fromDate} | To: ${appliedFilters.toDate}`
    );
    doc.moveDown(1);

    const headers = [
      'Student ID',
      'Name',
      'Category',
      'NIC/Passport',
      'Course',
      'Batch',
      'Payment',
      'Registration',
      'Registered Date',
    ];
    const widths = [72, 105, 105, 92, 105, 70, 72, 88, 72];
    const startX = doc.x;
    let y = doc.y;

    const drawRow = (values: string[], isHeader = false) => {
      let x = startX;
      const rowHeight = 30;
      if (y + rowHeight > doc.page.height - 36) {
        doc.addPage();
        y = 36;
      }

      doc
        .rect(startX, y, widths.reduce((sum, width) => sum + width, 0), rowHeight)
        .fill(isHeader ? '#0f172a' : '#ffffff')
        .strokeColor('#e2e8f0')
        .stroke();

      values.forEach((value, index) => {
        doc
          .fillColor(isHeader ? '#ffffff' : '#0f172a')
          .fontSize(isHeader ? 7 : 7)
          .text(value || '-', x + 4, y + 7, {
            width: widths[index] - 8,
            height: rowHeight - 10,
            ellipsis: true,
          });
        x += widths[index];
      });
      y += rowHeight;
    };

    drawRow(headers, true);
    students.forEach((student) => {
      drawRow([
        String(student.id).slice(0, 8).toUpperCase(),
        `${student.firstName} ${student.lastName}`.trim(),
        student.studentCategory || '-',
        student.nic || student.passport || '-',
        student.course,
        student.batch,
        student.latestPayment?.payment_status || 'No Payment',
        student.registrationStatus,
        formatReportDate(student.enrollmentDate || student.createdAt),
      ]);
    });

    if (students.length === 0) {
      doc.moveDown(2).fillColor('#64748b').fontSize(10).text('No students found for the selected filters.');
    }

    doc.end();
  } catch (error: any) {
    console.error('Student PDF report error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || 'Server Error' });
    }
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id as string, {
      include: [
        {
          model: StudentPayment,
          as: 'payments',
          separate: true,
          order: [['created_at', 'DESC']],
        },
        {
          model: ApplicationDocument,
          as: 'documents',
          separate: true,
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentJson = student.toJSON() as Student & {
      payments?: StudentPayment[];
      documents?: ApplicationDocument[];
    };
    const payments = studentJson.payments || [];

    res.json({
      ...studentJson,
      latestPayment: payments[0] || null,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id as string);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dob',
      'gender',
      'address',
      'course',
      'batch',
      'studentCategory',
      'nic',
      'passport',
      'status',
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.idNumber !== undefined && updates.nic === undefined) {
      updates.nic = req.body.idNumber;
    }
    if (req.body.passportNumber !== undefined && updates.passport === undefined) {
      updates.passport = req.body.passportNumber;
    }

    if (updates.email && updates.email !== student.email) {
      const existingStudent = await Student.findOne({
        where: {
          email: updates.email as string,
          id: { [Op.ne]: id as string },
        },
      });
      if (existingStudent) {
        return res.status(400).json({ message: 'A student with this email already exists.' });
      }
    }

    await student.update(updates);
    res.json({ message: 'Student updated successfully', student });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id as string);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await student.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
