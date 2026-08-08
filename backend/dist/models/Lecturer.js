"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lecturer = void 0;
const db_1 = require("../config/db");
class Lecturer extends db_1.Model {
}
exports.Lecturer = Lecturer;
Lecturer.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    fullName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    nicPassport: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    dateOfBirth: {
        type: db_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    gender: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    mobile: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    address: {
        type: db_1.DataTypes.TEXT,
        allowNull: false,
    },
    emergencyContact: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    bankName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    branchName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    centralBankCode: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    accountHolderName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    accountNumber: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    qualifications: {
        type: db_1.DataTypes.TEXT,
        allowNull: true,
    },
    category: {
        type: db_1.DataTypes.ENUM('SLPA', 'Outside'),
        defaultValue: 'SLPA',
        allowNull: false,
    },
    epfNumber: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    department: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    companyName: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    designation: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: db_1.DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },
    stream: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'lecturers',
});
exports.default = Lecturer;
