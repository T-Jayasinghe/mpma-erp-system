"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const Maintenance_1 = __importDefault(require("./Maintenance"));
const Classroom_1 = require("./Classroom");
const Vehicle_1 = require("./Vehicle");
const ClassroomBooking_1 = require("./ClassroomBooking");
const TransportBooking_1 = require("./TransportBooking");
const Course_1 = require("./Course");
const Batch_1 = require("./Batch");
const Lecturer_1 = require("./Lecturer");
const BatchLecturer_1 = require("./BatchLecturer");
const StudentPayment_1 = __importDefault(require("./StudentPayment"));
const Student_1 = __importDefault(require("./Student"));
const ApplicationDocument_1 = __importDefault(require("./ApplicationDocument"));
const VerificationChecklist_1 = __importDefault(require("./VerificationChecklist"));
const CourseLecturer_1 = __importDefault(require("./CourseLecturer"));
const setupAssociations = () => {
    // Classroom & Bookings
    Classroom_1.Classroom.hasMany(ClassroomBooking_1.ClassroomBooking, { foreignKey: 'classroomId', as: 'bookings' });
    ClassroomBooking_1.ClassroomBooking.belongsTo(Classroom_1.Classroom, { foreignKey: 'classroomId', as: 'classroom' });
    // Vehicle & Bookings
    Vehicle_1.Vehicle.hasMany(TransportBooking_1.TransportBooking, { foreignKey: 'vehicleId', as: 'bookings' });
    TransportBooking_1.TransportBooking.belongsTo(Vehicle_1.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
    // Maintenance associations
    Maintenance_1.default.belongsTo(Classroom_1.Classroom, { foreignKey: 'facilityId', as: 'classroom', constraints: false });
    Maintenance_1.default.belongsTo(Vehicle_1.Vehicle, { foreignKey: 'facilityId', as: 'vehicle', constraints: false });
    // Course & Batch associations
    Course_1.Course.hasMany(Batch_1.Batch, { foreignKey: 'courseId', as: 'batches' });
    Batch_1.Batch.belongsTo(Course_1.Course, { foreignKey: 'courseId', as: 'course' });
    // Course & Lecturer many-to-many associations
    Course_1.Course.belongsToMany(Lecturer_1.Lecturer, { through: CourseLecturer_1.default, foreignKey: 'courseId', otherKey: 'lecturerId', as: 'lecturers' });
    Lecturer_1.Lecturer.belongsToMany(Course_1.Course, { through: CourseLecturer_1.default, foreignKey: 'lecturerId', otherKey: 'courseId', as: 'courses' });
    // Direct associations for junction query convenience
    Course_1.Course.hasMany(CourseLecturer_1.default, { foreignKey: 'courseId', as: 'courseLecturerAssignments' });
    CourseLecturer_1.default.belongsTo(Course_1.Course, { foreignKey: 'courseId', as: 'course' });
    Lecturer_1.Lecturer.hasMany(CourseLecturer_1.default, { foreignKey: 'lecturerId', as: 'courseLecturerAssignments' });
    CourseLecturer_1.default.belongsTo(Lecturer_1.Lecturer, { foreignKey: 'lecturerId', as: 'lecturer' });
    // Batch & Lecturer many-to-many associations
    Batch_1.Batch.belongsToMany(Lecturer_1.Lecturer, { through: BatchLecturer_1.BatchLecturer, foreignKey: 'batchId', otherKey: 'lecturerId', as: 'lecturers' });
    Lecturer_1.Lecturer.belongsToMany(Batch_1.Batch, { through: BatchLecturer_1.BatchLecturer, foreignKey: 'lecturerId', otherKey: 'batchId', as: 'batches' });
    // Direct associations for junction query convenience
    Batch_1.Batch.hasMany(BatchLecturer_1.BatchLecturer, { foreignKey: 'batchId', as: 'assignments' });
    BatchLecturer_1.BatchLecturer.belongsTo(Batch_1.Batch, { foreignKey: 'batchId', as: 'batch' });
    Lecturer_1.Lecturer.hasMany(BatchLecturer_1.BatchLecturer, { foreignKey: 'lecturerId', as: 'assignments' });
    BatchLecturer_1.BatchLecturer.belongsTo(Lecturer_1.Lecturer, { foreignKey: 'lecturerId', as: 'lecturer' });
    // StudentPayment & Student associations
    Student_1.default.hasMany(StudentPayment_1.default, { foreignKey: 'student_id', as: 'payments', constraints: false });
    StudentPayment_1.default.belongsTo(Student_1.default, { foreignKey: 'student_id', as: 'student', constraints: false });
    // ApplicationDocument & Student associations
    Student_1.default.hasMany(ApplicationDocument_1.default, { foreignKey: 'student_id', as: 'documents', constraints: false });
    ApplicationDocument_1.default.belongsTo(Student_1.default, { foreignKey: 'student_id', as: 'student', constraints: false });
    // VerificationChecklist & Student associations
    Student_1.default.hasOne(VerificationChecklist_1.default, { foreignKey: 'student_id', as: 'checklist', constraints: false });
    VerificationChecklist_1.default.belongsTo(Student_1.default, { foreignKey: 'student_id', as: 'student', constraints: false });
};
exports.setupAssociations = setupAssociations;
