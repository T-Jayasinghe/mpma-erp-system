import { Op, Transaction } from 'sequelize';
import { sequelize } from '../config/db';
import Student from '../models/Student';
import Course from '../models/Course';
import Batch from '../models/Batch';
import ApplicationDocument from '../models/ApplicationDocument';
import SlpaEmployee from '../models/SlpaEmployee';

export class ApplicationValidationError extends Error { constructor(message: string, public fields?: Record<string, string>) { super(message); } }
const clean = (value: unknown) => typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : '';
const required = (body: any, key: string, fields: Record<string, string>) => { const value = clean(body[key]); if (!value) fields[key] = `${key} is required`; return value; };

export async function createStudentApplication(body: any, files: Express.Multer.File[], enrollmentType: 'STUDENT_SELF' | 'ADMIN_DIRECT') {
  const fields: Record<string, string> = {};
  const category = required(body, 'studentCategory', fields);
  if (!['SLPA Employee', 'Sri Lankan Student', 'Non-Sri Lankan Student'].includes(category)) fields.studentCategory = 'Invalid student category';
  const fullName = required(body, 'fullName', fields);
  const email = required(body, 'email', fields).toLowerCase();
  const phone = required(body, 'phone', fields); const address = required(body, 'address', fields);
  const dob = required(body, 'dob', fields); const gender = required(body, 'gender', fields);
  const courseId = required(body, 'courseId', fields); const batchId = required(body, 'batchId', fields);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Enter a valid email address';
  if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) fields.phone = 'Enter a valid phone number';
  if (!['Male', 'Female', 'Other'].includes(gender)) fields.gender = 'Select a valid gender';
  const nic = clean(body.nic || body.idNumber); const passport = clean(body.passport || body.passportNumber);
  if (category === 'Sri Lankan Student' && !nic) fields.nic = 'NIC is required';
  if (category === 'Non-Sri Lankan Student' && !passport) fields.passport = 'Passport number is required';
  if (category === 'Non-Sri Lankan Student' && !clean(body.nationality)) fields.nationality = 'Nationality is required';
  if (category === 'Non-Sri Lankan Student' && !clean(body.countryOfOrigin)) fields.countryOfOrigin = 'Country of origin is required';
  if (Object.keys(fields).length) throw new ApplicationValidationError('Please correct the highlighted fields.', fields);

  return sequelize.transaction(async (transaction: Transaction) => {
    const course = await Course.findOne({ where: { id: courseId, status: 'Active' }, transaction });
    if (!course) throw new ApplicationValidationError('Selected course is not active.', { courseId: 'Select an active course' });
    const batch = await Batch.findOne({ where: { id: batchId, courseId, status: 'Available' }, transaction });
    if (!batch) throw new ApplicationValidationError('Selected batch is not available for this course.', { batchId: 'Select an available batch' });
    if (category === 'SLPA Employee') {
      const employee = await SlpaEmployee.findOne({ where: { active: true, [Op.or]: [{ serviceNumber: clean(body.serviceNumber) }, { epfNumber: clean(body.epfNumber) }, { nic }] }, transaction });
      if (!employee) throw new ApplicationValidationError('SLPA employee record could not be verified.');
    }
    const identity = nic ? { nic } : { passport };
    const duplicate = await Student.findOne({ where: { ...identity, course_id: courseId, batch_id: batchId, application_status: { [Op.ne]: 'REJECTED' } }, transaction });
    if (duplicate) throw new ApplicationValidationError('An active application already exists for this identity, course and batch.');
    const names = fullName.split(/\s+/); const firstName = clean(body.firstName) || names[0]; const lastName = clean(body.lastName) || names.slice(1).join(' ') || '-';
    const student = await Student.create({
      firstName, lastName, email, phone, dob, gender: gender as 'Male' | 'Female' | 'Other', address, course: course.courseName, batch: batch.batchCode,
      studentCategory: category, nic: nic || null, passport: passport || null, enrollmentDate: new Date().toISOString().slice(0, 10),
      // `students.status` is the legacy enrollment status column. Keep new
      // applications at its schema-supported Pending value; review state is
      // tracked separately by `application_status`.
      status: 'Pending', application_status: 'PENDING_REVIEW', payment_status_type: 'NOT_REQUESTED', enrollment_type: enrollmentType,
      nationality: clean(body.nationality) || null, country_of_origin: clean(body.countryOfOrigin) || null, course_id: course.id, batch_id: batch.id,
      company_name: clean(body.companyName) || null, outside_position: clean(body.outsidePosition) || null,
      service_number: clean(body.serviceNumber) || null, epf_number: clean(body.epfNumber) || null, department: clean(body.department) || null,
      slpa_position: clean(body.slpaPosition) || null,
      admin_notes: typeof body.qualificationsData === 'object' ? JSON.stringify(body.qualificationsData) : (clean(body.qualificationsData || body.admin_notes) || null),
    }, { transaction });
    const applicationNumber = `MPMA-APP-${new Date().getFullYear()}-${String(await Student.count({ transaction })).padStart(6, '0')}`;
    await student.update({ application_number: applicationNumber }, { transaction });
    if (files.length) {
      const rawTypes = body.documentTypes || body.document_types || '';
      const docTypesList = typeof rawTypes === 'string' ? rawTypes.split(',') : (Array.isArray(rawTypes) ? rawTypes : []);
      await ApplicationDocument.bulkCreate(files.map((file, idx) => ({
        student_id: student.id,
        document_type: clean(docTypesList[idx]) || 'Support Document',
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_data: file.buffer,
        uploaded_by_admin: enrollmentType === 'ADMIN_DIRECT'
      })), { transaction });
    }
    return { applicationId: student.id, applicationNumber };
  });
}
