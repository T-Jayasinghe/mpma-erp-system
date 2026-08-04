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
exports.ApplicationValidationError = void 0;
exports.createStudentApplication = createStudentApplication;
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const Student_1 = __importDefault(require("../models/Student"));
const Course_1 = __importDefault(require("../models/Course"));
const Batch_1 = __importDefault(require("../models/Batch"));
const ApplicationDocument_1 = __importDefault(require("../models/ApplicationDocument"));
const SlpaEmployee_1 = __importDefault(require("../models/SlpaEmployee"));
class ApplicationValidationError extends Error {
    constructor(message, fields) {
        super(message);
        this.fields = fields;
    }
}
exports.ApplicationValidationError = ApplicationValidationError;
const clean = (value) => typeof value === 'string' ? value.trim().replace(/[<>]/g, '') : '';
const required = (body, key, fields) => { const value = clean(body[key]); if (!value)
    fields[key] = `${key} is required`; return value; };
function createStudentApplication(body, files, enrollmentType) {
    return __awaiter(this, void 0, void 0, function* () {
        const fields = {};
        const category = required(body, 'studentCategory', fields);
        if (!['SLPA Employee', 'Sri Lankan Student', 'Non-Sri Lankan Student'].includes(category))
            fields.studentCategory = 'Invalid student category';
        const fullName = required(body, 'fullName', fields);
        const email = required(body, 'email', fields).toLowerCase();
        const phone = required(body, 'phone', fields);
        const address = required(body, 'address', fields);
        const dob = required(body, 'dob', fields);
        const gender = required(body, 'gender', fields);
        const courseId = required(body, 'courseId', fields);
        const batchId = required(body, 'batchId', fields);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            fields.email = 'Enter a valid email address';
        if (!/^[+\d][\d\s()-]{6,19}$/.test(phone))
            fields.phone = 'Enter a valid phone number';
        if (!['Male', 'Female', 'Other'].includes(gender))
            fields.gender = 'Select a valid gender';
        const nic = clean(body.nic || body.idNumber);
        const passport = clean(body.passport || body.passportNumber);
        if (category === 'Sri Lankan Student' && !nic)
            fields.nic = 'NIC is required';
        if (category === 'Non-Sri Lankan Student' && !passport)
            fields.passport = 'Passport number is required';
        if (category === 'Non-Sri Lankan Student' && !clean(body.nationality))
            fields.nationality = 'Nationality is required';
        if (category === 'Non-Sri Lankan Student' && !clean(body.countryOfOrigin))
            fields.countryOfOrigin = 'Country of origin is required';
        if (Object.keys(fields).length)
            throw new ApplicationValidationError('Please correct the highlighted fields.', fields);
        return db_1.sequelize.transaction((transaction) => __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.default.findOne({ where: { id: courseId, status: 'Active' }, transaction });
            if (!course)
                throw new ApplicationValidationError('Selected course is not active.', { courseId: 'Select an active course' });
            const batch = yield Batch_1.default.findOne({ where: { id: batchId, courseId, status: 'Available' }, transaction });
            if (!batch)
                throw new ApplicationValidationError('Selected batch is not available for this course.', { batchId: 'Select an available batch' });
            if (category === 'SLPA Employee') {
                const employee = yield SlpaEmployee_1.default.findOne({ where: { active: true, [sequelize_1.Op.or]: [{ serviceNumber: clean(body.serviceNumber) }, { epfNumber: clean(body.epfNumber) }, { nic }] }, transaction });
                if (!employee)
                    throw new ApplicationValidationError('SLPA employee record could not be verified.');
            }
            const identity = nic ? { nic } : { passport };
            const duplicate = yield Student_1.default.findOne({ where: Object.assign(Object.assign({}, identity), { course_id: courseId, batch_id: batchId, application_status: { [sequelize_1.Op.ne]: 'REJECTED' } }), transaction });
            if (duplicate)
                throw new ApplicationValidationError('An active application already exists for this identity, course and batch.');
            const names = fullName.split(/\s+/);
            const firstName = clean(body.firstName) || names[0];
            const lastName = clean(body.lastName) || names.slice(1).join(' ') || '-';
            const student = yield Student_1.default.create({
                firstName, lastName, email, phone, dob, gender: gender, address, course: course.courseName, batch: batch.batchCode,
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
            const applicationNumber = `MPMA-APP-${new Date().getFullYear()}-${String(yield Student_1.default.count({ transaction })).padStart(6, '0')}`;
            yield student.update({ application_number: applicationNumber }, { transaction });
            if (files.length) {
                const rawTypes = body.documentTypes || body.document_types || '';
                const docTypesList = typeof rawTypes === 'string' ? rawTypes.split(',') : (Array.isArray(rawTypes) ? rawTypes : []);
                yield ApplicationDocument_1.default.bulkCreate(files.map((file, idx) => ({
                    student_id: student.id,
                    document_type: clean(docTypesList[idx]) || 'Support Document',
                    file_name: file.originalname,
                    mime_type: file.mimetype,
                    file_data: file.buffer,
                    uploaded_by_admin: enrollmentType === 'ADMIN_DIRECT'
                })), { transaction });
            }
            return { applicationId: student.id, applicationNumber };
        }));
    });
}
