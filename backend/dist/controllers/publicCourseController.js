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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableBatches = exports.getPublicCourseById = exports.getPublicCourses = void 0;
const Course_1 = require("../models/Course");
const Batch_1 = require("../models/Batch");
// Public website-ல் active courses மட்டும் காட்டும்
const getPublicCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield Course_1.Course.findAll({
            where: {
                status: 'Active',
            },
            attributes: [
                'id',
                'courseCode',
                'courseName',
                'stream',
                'description',
                'duration',
                'medium',
                'location',
                'maxParticipants',
                'registrationFee',
                'courseFee',
                'status',
                'schedule',
                'type',
                'mode',
            ],
            order: [['courseName', 'ASC']],
        });
        res.status(200).json(courses);
    }
    catch (error) {
        console.error('Get public courses error:', error);
        res.status(500).json({
            message: 'Unable to retrieve courses',
            error: error.message,
        });
    }
});
exports.getPublicCourses = getPublicCourses;
// Public website-ல் ஒரு specific course-ஐ காட்டும்
const getPublicCourseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseId = req.params.id;
        const course = yield Course_1.Course.findOne({
            where: {
                id: courseId,
                status: 'Active',
            },
            attributes: [
                'id',
                'courseCode',
                'courseName',
                'stream',
                'description',
                'duration',
                'medium',
                'location',
                'maxParticipants',
                'registrationFee',
                'courseFee',
                'status',
                'schedule',
                'type',
                'mode',
            ],
        });
        if (!course) {
            res.status(404).json({
                message: 'Active course not found',
            });
            return;
        }
        res.status(200).json(course);
    }
    catch (error) {
        console.error('Get public course error:', error);
        res.status(500).json({
            message: 'Unable to retrieve course',
            error: error.message,
        });
    }
});
exports.getPublicCourseById = getPublicCourseById;
const getAvailableBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const course = yield Course_1.Course.findOne({ where: { id: req.params.id, status: 'Active' }, attributes: ['id'] });
        if (!course) {
            res.status(404).json({ message: 'Active course not found' });
            return;
        }
        const batches = yield Batch_1.Batch.findAll({ where: { courseId: course.id, status: 'Available' }, order: [['startDate', 'ASC']] });
        res.json(batches);
    }
    catch (_a) {
        res.status(500).json({ message: 'Unable to retrieve batches' });
    }
});
exports.getAvailableBatches = getAvailableBatches;
