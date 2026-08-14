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
exports.getDashboardStats = void 0;
const AuditoriumBooking_1 = require("../models/AuditoriumBooking");
const ClassroomBooking_1 = require("../models/ClassroomBooking");
const TransportBooking_1 = require("../models/TransportBooking");
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const Classroom_1 = require("../models/Classroom");
const Vehicle_1 = require("../models/Vehicle");
const Student_1 = __importDefault(require("../models/Student"));
const StudentPayment_1 = __importDefault(require("../models/StudentPayment"));
const Course_1 = require("../models/Course");
const Batch_1 = require("../models/Batch");
const Lecturer_1 = require("../models/Lecturer");
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Totals for resources
        const auditoriumTotal = yield AuditoriumBooking_1.AuditoriumBooking.count();
        const classroomTotal = yield ClassroomBooking_1.ClassroomBooking.count();
        const transportTotal = yield TransportBooking_1.TransportBooking.count();
        // Student & Application Metrics
        const studentTotal = yield Student_1.default.count();
        const pendingApps = yield Student_1.default.count({ where: { application_status: 'PENDING_REVIEW' } });
        const approvedApps = yield Student_1.default.count({ where: { application_status: 'APPROVED' } });
        const registeredStudents = yield Student_1.default.count({ where: { status: 'Registered' } });
        // Academic Metrics
        const courseTotal = yield Course_1.Course.count();
        const batchTotal = yield Batch_1.Batch.count();
        const lecturerTotal = yield Lecturer_1.Lecturer.count();
        const maintenanceTotal = yield Maintenance_1.default.count();
        // Financial Metrics
        const totalPaidSum = yield StudentPayment_1.default.sum('amount_paid');
        const totalRevenue = typeof totalPaidSum === 'number' ? totalPaidSum : 0;
        const pendingPaymentsCount = yield StudentPayment_1.default.count({ where: { payment_status: 'PENDING' } });
        // Facilities & Vehicles status counts
        const classroomCount = yield Classroom_1.Classroom.count();
        const vehicleCount = yield Vehicle_1.Vehicle.count();
        // Recent items for stream feeds
        const recentAuditorium = yield AuditoriumBooking_1.AuditoriumBooking.findAll({ limit: 5 });
        const recentClassroom = yield ClassroomBooking_1.ClassroomBooking.findAll({ limit: 5 });
        const recentTransport = yield TransportBooking_1.TransportBooking.findAll({ limit: 5 });
        const recentStudents = yield Student_1.default.findAll({ limit: 5 });
        const recentMaintenance = yield Maintenance_1.default.findAll({
            limit: 5,
            include: [
                { model: Classroom_1.Classroom, as: 'classroom' },
                { model: Vehicle_1.Vehicle, as: 'vehicle' }
            ]
        });
        // Format unified activity stream
        const activities = [
            ...recentAuditorium.map(b => ({
                id: b.id,
                type: 'Auditorium',
                title: b.description || 'Auditorium Event',
                subtitle: `Capacity: ${b.participants} | Contact: ${b.name}`,
                time: b.date ? `${b.date} (${b.start} - ${b.end})` : `${b.start} - ${b.end}`,
                status: b.status,
                createdAt: b.createdAt
            })),
            ...recentClassroom.map(b => ({
                id: b.id,
                type: 'Classroom',
                title: b.courseName || 'Classroom Session',
                subtitle: `Officer: ${b.requestingOfficerName || 'Staff'} | Batch: ${b.batchCode || 'N/A'}`,
                time: b.dateFrom,
                status: b.status,
                createdAt: b.createdAt
            })),
            ...recentTransport.map(b => ({
                id: b.id,
                type: 'Transport',
                title: `Trip to ${b.destination}`,
                subtitle: `Requester: ${b.requesterName} (${b.department}) | ${b.purpose}`,
                time: b.departureDate,
                status: b.status,
                createdAt: b.createdAt
            })),
            ...recentStudents.map(s => ({
                id: s.id,
                type: 'Enrollment',
                title: `App: ${s.firstName} ${s.lastName}`,
                subtitle: `Course: ${s.course} (${s.application_number})`,
                time: s.createdAt ? String(s.createdAt).substring(0, 10) : 'Recent',
                status: s.application_status,
                createdAt: s.createdAt
            })),
            ...recentMaintenance.map((m) => {
                var _a, _b;
                const facilityName = ((_a = m.classroom) === null || _a === void 0 ? void 0 : _a.name) || ((_b = m.vehicle) === null || _b === void 0 ? void 0 : _b.name) || m.facilityType;
                return {
                    id: m.id,
                    type: 'Maintenance',
                    title: m.title,
                    subtitle: `Facility: ${facilityName}`,
                    time: m.dateFrom,
                    status: 'Scheduled',
                    createdAt: m.createdAt
                };
            })
        ].slice(0, 12);
        res.json({
            totals: {
                auditorium: auditoriumTotal,
                classroom: classroomTotal,
                transport: transportTotal,
                overall: auditoriumTotal + classroomTotal + transportTotal,
                students: studentTotal,
                pendingApps,
                approvedApps,
                registeredStudents,
                courses: courseTotal,
                batches: batchTotal,
                lecturers: lecturerTotal,
                maintenance: maintenanceTotal,
                totalRevenue,
                pendingPayments: pendingPaymentsCount,
                classroomCount,
                vehicleCount,
            },
            todayActivities: activities,
            recentStudents: recentStudents.map(s => ({
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                course: s.course,
                batch: s.batch,
                appNum: s.application_number,
                status: s.application_status,
                paymentStatus: s.payment_status_type,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getDashboardStats = getDashboardStats;
