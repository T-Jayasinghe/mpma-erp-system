"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Batch = void 0;
const db_1 = require("../config/db");
class Batch extends db_1.Model {
}
exports.Batch = Batch;
Batch.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    batchCode: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    courseId: {
        type: db_1.DataTypes.UUID,
        allowNull: false,
    },
    startDate: {
        type: db_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    endDate: {
        type: db_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    location: {
        type: db_1.DataTypes.STRING,
        allowNull: false,
    },
    maxStudents: {
        type: db_1.DataTypes.INTEGER,
        allowNull: false,
    },
    currentStudents: {
        type: db_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: db_1.DataTypes.ENUM('Available', 'Full', 'Completed'),
        defaultValue: 'Available',
    },
    schedule: {
        type: db_1.DataTypes.ENUM('Weekday', 'Weekend'),
        allowNull: true,
        defaultValue: 'Weekday',
    },
    mode: {
        type: db_1.DataTypes.ENUM('Online', 'Physical', 'Hybrid'),
        allowNull: true,
        defaultValue: 'Physical',
    },
    type: {
        type: db_1.DataTypes.ENUM('Full Time', 'Part Time'),
        allowNull: true,
        defaultValue: 'Full Time',
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'batches',
});
exports.default = Batch;
