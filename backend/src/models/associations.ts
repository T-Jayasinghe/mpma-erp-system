import Maintenance from './Maintenance';
import { Classroom } from './Classroom';
import { Vehicle } from './Vehicle';
import { ClassroomBooking } from './ClassroomBooking';
import { TransportBooking } from './TransportBooking';
import { Course } from './Course';
import { Batch } from './Batch';
import { Lecturer } from './Lecturer';
import { BatchLecturer } from './BatchLecturer';
import StudentPayment from './StudentPayment';
import Student from './Student';
import ApplicationDocument from './ApplicationDocument';
import VerificationChecklist from './VerificationChecklist';
import CourseLecturer from './CourseLecturer';


export const setupAssociations = () => {
  // Classroom & Bookings
  Classroom.hasMany(ClassroomBooking, { foreignKey: 'classroomId', as: 'bookings' });
  ClassroomBooking.belongsTo(Classroom, { foreignKey: 'classroomId', as: 'classroom' });

  // Vehicle & Bookings
  Vehicle.hasMany(TransportBooking, { foreignKey: 'vehicleId', as: 'bookings' });
  TransportBooking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

  // Maintenance associations
  Maintenance.belongsTo(Classroom, { foreignKey: 'facilityId', as: 'classroom', constraints: false });
  Maintenance.belongsTo(Vehicle, { foreignKey: 'facilityId', as: 'vehicle', constraints: false });

  // Course & Batch associations
  Course.hasMany(Batch, { foreignKey: 'courseId', as: 'batches' });
  Batch.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  // Course & Lecturer many-to-many associations
  Course.belongsToMany(Lecturer, { through: CourseLecturer, foreignKey: 'courseId', otherKey: 'lecturerId', as: 'lecturers' });
  Lecturer.belongsToMany(Course, { through: CourseLecturer, foreignKey: 'lecturerId', otherKey: 'courseId', as: 'courses' });

  // Direct associations for junction query convenience
  Course.hasMany(CourseLecturer, { foreignKey: 'courseId', as: 'courseLecturerAssignments' });
  CourseLecturer.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

  Lecturer.hasMany(CourseLecturer, { foreignKey: 'lecturerId', as: 'courseLecturerAssignments' });
  CourseLecturer.belongsTo(Lecturer, { foreignKey: 'lecturerId', as: 'lecturer' });

  // Batch & Lecturer many-to-many associations
  Batch.belongsToMany(Lecturer, { through: BatchLecturer, foreignKey: 'batchId', otherKey: 'lecturerId', as: 'lecturers' });
  Lecturer.belongsToMany(Batch, { through: BatchLecturer, foreignKey: 'lecturerId', otherKey: 'batchId', as: 'batches' });

  // Direct associations for junction query convenience
  Batch.hasMany(BatchLecturer, { foreignKey: 'batchId', as: 'assignments' });
  BatchLecturer.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });

  Lecturer.hasMany(BatchLecturer, { foreignKey: 'lecturerId', as: 'assignments' });
  BatchLecturer.belongsTo(Lecturer, { foreignKey: 'lecturerId', as: 'lecturer' });

  // StudentPayment & Student associations
  Student.hasMany(StudentPayment, { foreignKey: 'student_id', as: 'payments', constraints: false });
  StudentPayment.belongsTo(Student, { foreignKey: 'student_id', as: 'student', constraints: false });

  // ApplicationDocument & Student associations
  Student.hasMany(ApplicationDocument, { foreignKey: 'student_id', as: 'documents', constraints: false });
  ApplicationDocument.belongsTo(Student, { foreignKey: 'student_id', as: 'student', constraints: false });

  // VerificationChecklist & Student associations
  Student.hasOne(VerificationChecklist, { foreignKey: 'student_id', as: 'checklist', constraints: false });
  VerificationChecklist.belongsTo(Student, { foreignKey: 'student_id', as: 'student', constraints: false });
};
