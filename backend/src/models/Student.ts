import { sequelize, DataTypes, Model, Optional } from '../config/db';

export type ApplicationStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CORRECTION_REQUESTED';

export type PaymentStatusType =
  | 'NOT_REQUESTED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface StudentAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  course: string;
  batch: string;
  studentCategory?: string | null;
  nic?: string | null;
  passport?: string | null;
  enrollmentDate: string;
  status: 'Pending' | 'Applied' | 'Qualified' | 'Enrolled' | 'Registered' | 'Graduated' | 'Dropout';
  // New workflow fields
  application_status?: ApplicationStatus | null;
  enrollment_type?: 'STUDENT_SELF' | 'ADMIN_DIRECT' | null;
  payment_status_type?: PaymentStatusType | null;
  approved_at?: Date | null;
  admin_notes?: string | null;
  registration_number?: string | null;
  application_number?: string | null;
  nationality?: string | null;
  country_of_origin?: string | null;
  course_id?: string | null;
  batch_id?: string | null;
  company_name?: string | null;
  outside_position?: string | null;
  service_number?: string | null;
  epf_number?: string | null;
  department?: string | null;
  slpa_position?: string | null;
  payment_plan?: string | null;
  installment_breakdown?: string | null;
}

interface StudentCreationAttributes extends Optional<
  StudentAttributes,
  | 'id'
  | 'enrollmentDate'
  | 'status'
  | 'studentCategory'
  | 'nic'
  | 'passport'
  | 'application_status'
  | 'enrollment_type'
  | 'payment_status_type'
  | 'approved_at'
  | 'admin_notes'
  | 'registration_number'
  | 'application_number' | 'nationality' | 'country_of_origin' | 'course_id' | 'batch_id'
  | 'company_name' | 'outside_position' | 'service_number' | 'epf_number' | 'department' | 'slpa_position'
  | 'payment_plan' | 'installment_breakdown'
> { }

export class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone!: string;
  public dob!: string;
  public gender!: 'Male' | 'Female' | 'Other';
  public address!: string;
  public course!: string;
  public batch!: string;
  public studentCategory!: string | null;
  public nic!: string | null;
  public passport!: string | null;
  public enrollmentDate!: string;
  public status!: 'Pending' | 'Applied' | 'Qualified' | 'Enrolled' | 'Registered' | 'Graduated' | 'Dropout';
  public application_status!: ApplicationStatus | null;
  public enrollment_type!: 'STUDENT_SELF' | 'ADMIN_DIRECT' | null;
  public payment_status_type!: PaymentStatusType | null;
  public approved_at!: Date | null;
  public admin_notes!: string | null;
  public registration_number!: string | null;
  public application_number!: string | null;
  public nationality!: string | null;
  public country_of_origin!: string | null;
  public course_id!: string | null;
  public batch_id!: string | null;
  public company_name!: string | null;
  public outside_position!: string | null;
  public service_number!: string | null;
  public epf_number!: string | null;
  public department!: string | null;
  public slpa_position!: string | null;
  public payment_plan!: string | null;
  public installment_breakdown!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    course: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    batch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    studentCategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passport: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enrollmentDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Applied', 'Qualified', 'Enrolled', 'Registered', 'Graduated', 'Dropout'),
      defaultValue: 'Pending',
    },
    application_status: {
      type: DataTypes.ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CORRECTION_REQUESTED'),
      allowNull: true,
      defaultValue: null,
    },
    enrollment_type: {
      type: DataTypes.ENUM('STUDENT_SELF', 'ADMIN_DIRECT'),
      allowNull: true,
      defaultValue: null,
    },
    payment_status_type: {
      type: DataTypes.ENUM('NOT_REQUESTED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'),
      allowNull: true,
      defaultValue: null,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    registration_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    application_number: { type: DataTypes.STRING, allowNull: true, unique: true },
    nationality: { type: DataTypes.STRING, allowNull: true },
    country_of_origin: { type: DataTypes.STRING, allowNull: true },
    course_id: { type: DataTypes.UUID, allowNull: true },
    batch_id: { type: DataTypes.UUID, allowNull: true },
    company_name: { type: DataTypes.STRING, allowNull: true },
    outside_position: { type: DataTypes.STRING, allowNull: true },
    service_number: { type: DataTypes.STRING, allowNull: true },
    epf_number: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    slpa_position: { type: DataTypes.STRING, allowNull: true },
    payment_plan: { type: DataTypes.STRING, allowNull: true, defaultValue: 'FULL_PAYMENT' },
    installment_breakdown: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'students',
  }
);

export default Student;
