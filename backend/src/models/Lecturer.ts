import { sequelize, DataTypes, Model, Optional } from '../config/db';

export interface LecturerAttributes {
  id: string;
  fullName: string;
  nicPassport: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
  address: string;
  emergencyContact: string;
  bankName: string;
  branchName: string;
  centralBankCode?: string | null;
  accountHolderName: string;
  accountNumber: string;
  qualifications?: string;
  category?: 'SLPA' | 'Outside';
  epfNumber?: string | null;
  department?: string | null;
  companyName?: string | null;
  designation?: string | null;
  status: 'Active' | 'Inactive';
  stream?: string | null;
}

interface LecturerCreationAttributes extends Optional<LecturerAttributes, 'id' | 'status' | 'category'> {}

export class Lecturer extends Model<LecturerAttributes, LecturerCreationAttributes> implements LecturerAttributes {
  public id!: string;
  public fullName!: string;
  public nicPassport!: string;
  public dateOfBirth!: string;
  public gender!: string;
  public mobile!: string;
  public email!: string;
  public address!: string;
  public emergencyContact!: string;
  public bankName!: string;
  public branchName!: string;
  public centralBankCode?: string | null;
  public accountHolderName!: string;
  public accountNumber!: string;
  public qualifications?: string;
  public category?: 'SLPA' | 'Outside';
  public epfNumber?: string | null;
  public department?: string | null;
  public companyName?: string | null;
  public designation?: string | null;
  public status!: 'Active' | 'Inactive';
  public stream?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lecturer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nicPassport: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branchName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    centralBankCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountHolderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualifications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('SLPA', 'Outside'),
      defaultValue: 'SLPA',
      allowNull: false,
    },
    epfNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',
    },
    stream: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'lecturers',
  }
);

export default Lecturer;
