"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseLecturer = void 0;
const db_1 = require("../config/db");
class CourseLecturer extends db_1.Model {
}
exports.CourseLecturer = CourseLecturer;
CourseLecturer.init({
    id: {
        type: db_1.DataTypes.UUID,
        defaultValue: db_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    courseId: {
        type: db_1.DataTypes.UUID,
        allowNull: false,
    },
    lecturerId: {
        type: db_1.DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    tableName: 'course_lecturers',
});
exports.default = CourseLecturer;
