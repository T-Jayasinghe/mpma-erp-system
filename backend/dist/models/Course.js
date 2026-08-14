"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
const db_1 = require("../config/db");
class Course extends db_1.Model {
}
exports.Course = Course;
Course.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    courseCode: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    courseName: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    stream: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: db_1.DataTypes.TEXT,
        allowNull: true,
    },
    duration: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    medium: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    maxParticipants: {
        type: db_1.DataTypes.INTEGER,
        allowNull: false,
    },
    registrationFee: {
        type: db_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    courseFee: {
        type: db_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: db_1.DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },
    schedule: {
        type: db_1.DataTypes.ENUM('Weekday', 'Weekend'),
        allowNull: true,
        defaultValue: 'Weekday',
    },
    type: {
        type: db_1.DataTypes.ENUM('Full Time', 'Part Time'),
        allowNull: true,
        defaultValue: 'Full Time',
    },
    mode: {
        type: db_1.DataTypes.ENUM('Online', 'Physical', 'Hybrid'),
        allowNull: true,
        defaultValue: 'Physical',
    },
    maxInstallments: {
        type: db_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    installmentAmounts: {
        type: db_1.DataTypes.JSON,
        allowNull: true,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'courses',
});
exports.default = Course;
