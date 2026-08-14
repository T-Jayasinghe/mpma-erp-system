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
exports.enrollStudent = exports.updateBatch = exports.createBatch = exports.getBatchById = exports.getBatches = void 0;
const Batch_1 = require("../models/Batch");
const Course_1 = require("../models/Course");
const getBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId, status } = req.query;
        const where = {};
        if (courseId) {
            where.courseId = courseId;
        }
        if (status) {
            where.status = status;
        }
        const batches = yield Batch_1.Batch.findAll({
            where,
            include: [{ model: Course_1.Course, as: 'course' }],
            order: [['batchCode', 'ASC']]
        });
        res.status(200).json(batches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBatches = getBatches;
const getBatchById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const batch = yield Batch_1.Batch.findByPk(req.params.id, {
            include: [{ model: Course_1.Course, as: 'course' }]
        });
        if (!batch) {
            res.status(404).json({ message: 'Batch not found' });
            return;
        }
        res.status(200).json(batch);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBatchById = getBatchById;
const createBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { batchCode, courseId, maxStudents, currentStudents, schedule, mode, type } = req.body;
        // Validate if course exists
        const course = yield Course_1.Course.findByPk(courseId);
        if (!course) {
            res.status(404).json({ message: 'Selected Course does not exist' });
            return;
        }
        // Check unique batchCode
        const existing = yield Batch_1.Batch.findOne({ where: { batchCode } });
        if (existing) {
            res.status(400).json({ message: `Batch code "${batchCode}" already exists` });
            return;
        }
        const max = Number(maxStudents);
        const current = Number(currentStudents || 0);
        if (current > max) {
            res.status(400).json({ message: 'Current student count cannot exceed max students limit' });
            return;
        }
        let status = 'Available';
        if (current === max) {
            status = 'Full';
        }
        const created = yield Batch_1.Batch.create(Object.assign(Object.assign({}, req.body), { schedule: schedule || course.schedule || 'Weekday', mode: mode || course.mode || 'Physical', type: type || course.type || 'Full Time', currentStudents: current, maxStudents: max, status }));
        const batch = yield Batch_1.Batch.findByPk(created.id, {
            include: [{ model: Course_1.Course, as: 'course' }]
        });
        res.status(201).json(batch);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createBatch = createBatch;
const updateBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const batch = yield Batch_1.Batch.findByPk(id);
        if (!batch) {
            res.status(404).json({ message: 'Batch not found' });
            return;
        }
        const { batchCode, maxStudents, currentStudents, status } = req.body;
        // Check unique code if changed
        if (batchCode && batchCode !== batch.batchCode) {
            const existing = yield Batch_1.Batch.findOne({ where: { batchCode } });
            if (existing) {
                res.status(400).json({ message: `Batch code "${batchCode}" is already in use` });
                return;
            }
        }
        const max = maxStudents !== undefined ? Number(maxStudents) : batch.maxStudents;
        const current = currentStudents !== undefined ? Number(currentStudents) : batch.currentStudents;
        if (current > max) {
            res.status(400).json({ message: 'Current student count cannot exceed max students limit' });
            return;
        }
        let calculatedStatus = status || batch.status;
        if (current === max) {
            calculatedStatus = 'Full';
        }
        else if (calculatedStatus === 'Full' && current < max) {
            calculatedStatus = 'Available';
        }
        yield batch.update(Object.assign(Object.assign({}, req.body), { maxStudents: max, currentStudents: current, status: calculatedStatus }));
        const updatedBatch = yield Batch_1.Batch.findByPk(id, {
            include: [{ model: Course_1.Course, as: 'course' }]
        });
        res.status(200).json(updatedBatch);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateBatch = updateBatch;
const enrollStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const batch = yield Batch_1.Batch.findByPk(id);
        if (!batch) {
            res.status(404).json({ message: 'Batch not found' });
            return;
        }
        // Check if batch is already full or completed
        if (batch.status === 'Completed') {
            res.status(400).json({ message: 'Enrollment blocked. This batch has already completed.' });
            return;
        }
        if (batch.currentStudents >= batch.maxStudents || batch.status === 'Full') {
            res.status(400).json({ message: 'Batch Capacity Reached. Please create a new batch for this course.' });
            return;
        }
        const nextCount = batch.currentStudents + 1;
        const nextStatus = nextCount === batch.maxStudents ? 'Full' : 'Available';
        yield batch.update({
            currentStudents: nextCount,
            status: nextStatus
        });
        res.status(200).json({
            message: 'Student enrolled successfully',
            batch
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.enrollStudent = enrollStudent;
