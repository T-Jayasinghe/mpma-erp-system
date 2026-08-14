import { sequelize, DataTypes, Model, Optional } from '../config/db';

export interface UserAttributes {
  id: string; // Wait, let's use UUIDs or auto-incrementing integers? Integers are standard for MySQL, but existing frontend uses strings (Mongo IDs). Let's use UUIDs so they map 1:1 with string IDs.
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'officer';
  employeeId?: string;
  canBookAuditorium: boolean;
  canBookClassroom: boolean;
  canBookTransport: boolean;
  canManageVehicles: boolean;
  canManageClassrooms: boolean;
  canManageMaintenance: boolean;
  canManageCourses: boolean;
  canManageBatches: boolean;
  canManageLecturers: boolean;
  canManageEnrollment: boolean;
  canManagePayments: boolean;
  canManageCertificates: boolean;
  canManageStudents: boolean;
  canManageUsers: boolean;
  phoneNumber?: string;
  isActive: boolean;
  createdAt?: string;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'id'
    | 'canBookAuditorium'
    | 'canBookClassroom'
    | 'canBookTransport'
    | 'canManageVehicles'
    | 'canManageClassrooms'
    | 'canManageMaintenance'
    | 'canManageCourses'
    | 'canManageBatches'
    | 'canManageLecturers'
    | 'canManageEnrollment'
    | 'canManagePayments'
    | 'canManageCertificates'
    | 'canManageStudents'
    | 'canManageUsers'
  > {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'user' | 'officer';
  public employeeId?: string;
  public canBookAuditorium!: boolean;
  public canBookClassroom!: boolean;
  public canBookTransport!: boolean;
  public canManageVehicles!: boolean;
  public canManageClassrooms!: boolean;
  public canManageMaintenance!: boolean;
  public canManageCourses!: boolean;
  public canManageBatches!: boolean;
  public canManageLecturers!: boolean;
  public canManageEnrollment!: boolean;
  public canManagePayments!: boolean;
  public canManageCertificates!: boolean;
  public canManageStudents!: boolean;
  public canManageUsers!: boolean;
  public phoneNumber?: string;
  public isActive!: boolean;
  public readonly createdAt!: string;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'officer'),
      defaultValue: 'user',
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    canBookAuditorium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canBookClassroom: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canBookTransport: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageVehicles: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageClassrooms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageMaintenance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageCourses: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageBatches: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageLecturers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageEnrollment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManagePayments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageCertificates: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageStudents: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canManageUsers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;
