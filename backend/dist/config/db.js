"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.DataTypes = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
Object.defineProperty(exports, "DataTypes", { enumerable: true, get: function () { return sequelize_1.DataTypes; } });
Object.defineProperty(exports, "Model", { enumerable: true, get: function () { return sequelize_1.Model; } });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize(process.env.DB_DATABASE || "event1", process.env.DB_USER || "root", process.env.DB_PASSWORD || "", {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
});
exports.sequelize = sequelize;
console.log("Connecting to database:", process.env.DB_DATABASE);
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        console.log('MySQL Connected successfully.');
        // Synchronize all models
        yield sequelize.sync();
        console.log('MySQL Database synchronized.');
        // Programmatically ensure new Course columns exist
        try {
            const queryInterface = sequelize.getQueryInterface();
            const tableDefinition = yield queryInterface.describeTable('courses');
            if (!tableDefinition.schedule) {
                yield queryInterface.addColumn('courses', 'schedule', {
                    type: sequelize_1.DataTypes.ENUM('Weekday', 'Weekend'),
                    allowNull: true,
                    defaultValue: 'Weekday',
                });
                console.log('Successfully added missing column "schedule" to courses table.');
            }
            if (!tableDefinition.type) {
                yield queryInterface.addColumn('courses', 'type', {
                    type: sequelize_1.DataTypes.ENUM('Full Time', 'Part Time'),
                    allowNull: true,
                    defaultValue: 'Full Time',
                });
                console.log('Successfully added missing column "type" to courses table.');
            }
            if (!tableDefinition.mode) {
                yield queryInterface.addColumn('courses', 'mode', {
                    type: sequelize_1.DataTypes.ENUM('Online', 'Physical', 'Hybrid'),
                    allowNull: true,
                    defaultValue: 'Physical',
                });
                console.log('Successfully added missing column "mode" to courses table.');
            }
        }
        catch (migrationError) {
            console.warn('Notice: Course table column checks skipped or table does not exist yet:', migrationError.message);
        }
        // Programmatically ensure new Lecturer columns exist
        try {
            const queryInterface = sequelize.getQueryInterface();
            const lecturerTableDefinition = yield queryInterface.describeTable('lecturers');
            if (!lecturerTableDefinition.qualifications) {
                yield queryInterface.addColumn('lecturers', 'qualifications', {
                    type: sequelize_1.DataTypes.TEXT,
                    allowNull: true,
                });
                console.log('Successfully added missing column "qualifications" to lecturers table.');
            }
            if (!lecturerTableDefinition.category) {
                yield queryInterface.addColumn('lecturers', 'category', {
                    type: sequelize_1.DataTypes.ENUM('SLPA', 'Outside'),
                    allowNull: false,
                    defaultValue: 'SLPA',
                });
                console.log('Successfully added missing column "category" to lecturers table.');
            }
            if (!lecturerTableDefinition.epfNumber) {
                yield queryInterface.addColumn('lecturers', 'epfNumber', {
                    type: sequelize_1.DataTypes.STRING,
                    allowNull: true,
                });
            }
            if (!lecturerTableDefinition.department) {
                yield queryInterface.addColumn('lecturers', 'department', {
                    type: sequelize_1.DataTypes.STRING,
                    allowNull: true,
                });
            }
            if (!lecturerTableDefinition.companyName) {
                yield queryInterface.addColumn('lecturers', 'companyName', {
                    type: sequelize_1.DataTypes.STRING,
                    allowNull: true,
                });
            }
            if (!lecturerTableDefinition.designation) {
                yield queryInterface.addColumn('lecturers', 'designation', {
                    type: sequelize_1.DataTypes.STRING,
                    allowNull: true,
                });
            }
        }
        catch (migrationError) {
            console.warn('Notice: Lecturer table column checks skipped or table does not exist yet:', migrationError.message);
        }
    }
    catch (error) {
        console.error(`Error connecting to MySQL: ${error.message}`);
        process.exit(1);
    }
});
exports.default = connectDB;
