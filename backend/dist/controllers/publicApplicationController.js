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
exports.submitPublicApplication = exports.lookupStudentByNic = exports.searchSlpaEmployee = void 0;
const sequelize_1 = require("sequelize");
const SlpaEmployee_1 = __importDefault(require("../models/SlpaEmployee"));
const Student_1 = __importDefault(require("../models/Student"));
const studentApplicationService_1 = require("../services/studentApplicationService");
const searchSlpaEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = String(req.query.query || '').trim();
    if (!query || query.length > 50)
        return res.status(400).json({ success: false, message: 'Enter a valid service number, EPF number or NIC.' });
    const employee = yield SlpaEmployee_1.default.findOne({ where: { active: true, [sequelize_1.Op.or]: [{ serviceNumber: query }, { epfNumber: query }, { nic: query }] }, attributes: { exclude: ['active', 'createdAt', 'updatedAt'] } });
    if (!employee)
        return res.status(404).json({ success: false, message: 'No active SLPA employee was found.' });
    return res.json({ success: true, employee });
});
exports.searchSlpaEmployee = searchSlpaEmployee;
const lookupStudentByNic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const nic = String(req.query.nic || '').trim();
        if (!nic || nic.length < 5 || nic.length > 30) {
            return res.status(400).json({ success: false, message: 'Enter a valid NIC or Passport number.' });
        }
        // 1. First search Student database table
        const student = yield Student_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    { nic: nic },
                    { passport: nic }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        if (student) {
            return res.json({
                success: true,
                found: true,
                source: 'STUDENT_DATABASE',
                student: {
                    fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.course || '',
                    firstName: student.firstName || '',
                    lastName: student.lastName || '',
                    email: student.email || '',
                    phone: student.phone || '',
                    dob: student.dob || '',
                    gender: student.gender || 'Male',
                    address: student.address || '',
                    idNumber: student.nic || nic,
                    passportNumber: student.passport || '',
                    nationality: student.nationality || 'Sri Lankan',
                    countryOfOrigin: student.country_of_origin || 'Sri Lanka',
                    studentCategory: student.studentCategory || 'Sri Lankan Student',
                    companyName: student.company_name || '',
                    outsidePosition: student.outside_position || '',
                    serviceNumber: student.service_number || '',
                    epfNumber: student.epf_number || '',
                    department: student.department || '',
                    slpaPosition: student.slpa_position || ''
                }
            });
        }
        // 2. Fallback search SLPA Employee database table
        const employee = yield SlpaEmployee_1.default.findOne({
            where: {
                active: true,
                [sequelize_1.Op.or]: [{ nic: nic }, { serviceNumber: nic }, { epfNumber: nic }]
            }
        });
        if (employee) {
            return res.json({
                success: true,
                found: true,
                source: 'SLPA_EMPLOYEE_DATABASE',
                student: {
                    fullName: employee.fullName,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email || '',
                    phone: employee.phone || '',
                    dob: employee.dob || '',
                    gender: employee.gender || 'Male',
                    address: '',
                    idNumber: employee.nic || nic,
                    passportNumber: '',
                    nationality: 'Sri Lankan',
                    countryOfOrigin: 'Sri Lanka',
                    studentCategory: 'SLPA Employee',
                    companyName: 'Sri Lanka Ports Authority',
                    outsidePosition: '',
                    serviceNumber: employee.serviceNumber || '',
                    epfNumber: employee.epfNumber || '',
                    department: employee.department || '',
                    slpaPosition: employee.position || ''
                }
            });
        }
        return res.json({ success: true, found: false, student: null });
    }
    catch (error) {
        console.error('Error looking up student by NIC:', error);
        return res.status(500).json({ success: false, message: 'Server error during NIC lookup.' });
    }
});
exports.lookupStudentByNic = lookupStudentByNic;
const submitPublicApplication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, studentApplicationService_1.createStudentApplication)(req.body, req.files || [], 'STUDENT_SELF');
        return res.status(201).json(Object.assign(Object.assign({ success: true, message: 'Application submitted successfully' }, result), { status: 'PENDING_REVIEW' }));
    }
    catch (error) {
        if (error instanceof studentApplicationService_1.ApplicationValidationError)
            return res.status(400).json({ success: false, message: error.message, fields: error.fields });
        console.error('Application submission failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to submit the application.' });
    }
});
exports.submitPublicApplication = submitPublicApplication;
