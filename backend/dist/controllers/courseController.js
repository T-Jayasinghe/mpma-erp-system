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
exports.removeLecturerFromCourse = exports.assignLecturerToCourse = exports.getCourseLecturers = exports.toggleCourseStatus = exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getCourses = void 0;
const Course_1 = require("../models/Course");
const Lecturer_1 = require("../models/Lecturer");
const CourseLecturer_1 = __importDefault(require("../models/CourseLecturer"));
const getCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield Course_1.Course.findAll({
            include: [{
                    model: Lecturer_1.Lecturer,
                    as: 'lecturers',
                    attributes: ['id', 'fullName', 'email', 'status'],
                }],
            order: [['courseName', 'ASC']]
        });
        res.status(200).json(courses);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCourses = getCourses;
const getCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_1.Course.findByPk(req.params.id, {
            include: [{
                    model: Lecturer_1.Lecturer,
                    as: 'lecturers',
                    attributes: ['id', 'fullName', 'email', 'status'],
                }],
        });
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        res.status(200).json(course);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCourseById = getCourseById;
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseCode } = req.body;
        // Check if course code is already registered
        const existing = yield Course_1.Course.findOne({ where: { courseCode } });
        if (existing) {
            res.status(400).json({ message: `Course code "${courseCode}" already exists` });
            return;
        }
        const course = yield Course_1.Course.create(req.body);
        res.status(201).json(course);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createCourse = createCourse;
const updateCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield Course_1.Course.findByPk(id);
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        const { courseCode } = req.body;
        if (courseCode && courseCode !== course.courseCode) {
            const existing = yield Course_1.Course.findOne({ where: { courseCode } });
            if (existing) {
                res.status(400).json({ message: `Course code "${courseCode}" is already in use by another course` });
                return;
            }
        }
        yield course.update(req.body);
        res.status(200).json(course);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateCourse = updateCourse;
const toggleCourseStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const course = yield Course_1.Course.findByPk(id);
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        const newStatus = course.status === 'Active' ? 'Inactive' : 'Active';
        yield course.update({ status: newStatus });
        res.status(200).json(course);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.toggleCourseStatus = toggleCourseStatus;
const getCourseLecturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_1.Course.findByPk(req.params.id);
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        const assignments = yield CourseLecturer_1.default.findAll({
            where: { courseId: course.id },
            include: [{ model: Lecturer_1.Lecturer, as: 'lecturer' }],
        });
        const lecturers = assignments.map((assignment) => assignment.lecturer).filter(Boolean);
        res.status(200).json(lecturers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCourseLecturers = getCourseLecturers;
const assignLecturerToCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { lecturerId } = req.body;
        const course = yield Course_1.Course.findByPk(id);
        if (!course) {
            res.status(404).json({ message: 'Course not found' });
            return;
        }
        const lecturer = yield Lecturer_1.Lecturer.findByPk(lecturerId);
        if (!lecturer) {
            res.status(404).json({ message: 'Lecturer not found' });
            return;
        }
        const existing = yield CourseLecturer_1.default.findOne({ where: { courseId: course.id, lecturerId: lecturer.id } });
        if (existing) {
            res.status(400).json({ message: 'This lecturer is already assigned to this course' });
            return;
        }
        const assignment = yield CourseLecturer_1.default.create({ courseId: course.id, lecturerId: lecturer.id });
        res.status(201).json(assignment);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.assignLecturerToCourse = assignLecturerToCourse;
const removeLecturerFromCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, lecturerId } = req.params;
        const assignment = yield CourseLecturer_1.default.findOne({ where: { courseId: id, lecturerId } });
        if (!assignment) {
            res.status(404).json({ message: 'Assignment record not found' });
            return;
        }
        yield assignment.destroy();
        res.status(200).json({ message: 'Lecturer removed from course successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.removeLecturerFromCourse = removeLecturerFromCourse;
