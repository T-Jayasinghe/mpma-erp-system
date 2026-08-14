"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const db_1 = require("../config/db");
class User extends db_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: db_1.DataTypes.ENUM('admin', 'user', 'officer'),
        defaultValue: 'user',
    },
    employeeId: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    canBookAuditorium: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canBookClassroom: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canBookTransport: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageVehicles: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageClassrooms: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageMaintenance: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageCourses: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageBatches: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageLecturers: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageEnrollment: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManagePayments: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageCertificates: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageStudents: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    canManageUsers: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    phoneNumber: {
        type: db_1.DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: db_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'users',
});
exports.default = User;
