"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = void 0;
const db_1 = require("../config/db");
class Student extends db_1.Model {
}
exports.Student = Student;
Student.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    firstName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    dob: {
        type: db_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    gender: {
        type: db_1.DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
    },
    address: {
        type: db_1.DataTypes.TEXT,
        allowNull: false,
    },
    course: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    batch: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    studentCategory: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    nic: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    passport: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    enrollmentDate: {
        type: db_1.DataTypes.DATEONLY,
        defaultValue: db_1.DataTypes.NOW,
    },
    status: {
        type: db_1.DataTypes.ENUM('Pending', 'Applied', 'Qualified', 'Enrolled', 'Registered', 'Graduated', 'Dropout'),
        defaultValue: 'Pending',
    },
    application_status: {
        type: db_1.DataTypes.ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED'),
        allowNull: true,
        defaultValue: null,
    },
    enrollment_type: {
        type: db_1.DataTypes.ENUM('STUDENT_SELF', 'ADMIN_DIRECT'),
        allowNull: true,
        defaultValue: null,
    },
    payment_status_type: {
        type: db_1.DataTypes.ENUM('NOT_REQUESTED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'),
        allowNull: true,
        defaultValue: null,
    },
    approved_at: {
        type: db_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    admin_notes: {
        type: db_1.DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    registration_number: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    application_number: { type: db_1.DataTypes.STRING, allowNull: true, unique: true },
    nationality: { type: db_1.DataTypes.STRING, allowNull: true },
    country_of_origin: { type: db_1.DataTypes.STRING, allowNull: true },
    course_id: { type: db_1.DataTypes.UUID, allowNull: true },
    batch_id: { type: db_1.DataTypes.UUID, allowNull: true },
    company_name: { type: db_1.DataTypes.STRING, allowNull: true },
    outside_position: { type: db_1.DataTypes.STRING, allowNull: true },
    service_number: { type: db_1.DataTypes.STRING, allowNull: true },
    epf_number: { type: db_1.DataTypes.STRING, allowNull: true },
    department: { type: db_1.DataTypes.STRING, allowNull: true },
    slpa_position: { type: db_1.DataTypes.STRING, allowNull: true },
    payment_plan: { type: db_1.DataTypes.STRING, allowNull: true, defaultValue: 'FULL_PAYMENT' },
    installment_breakdown: { type: db_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: db_1.sequelize,
    tableName: 'students',
});
exports.default = Student;
