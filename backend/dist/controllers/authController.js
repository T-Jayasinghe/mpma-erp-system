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
exports.updateUser = exports.deleteUser = exports.getUsers = exports.changePassword = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const email_1 = require("../utils/email");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, employeeId, phoneNumber, isActive, canBookAuditorium, canBookClassroom, canBookTransport, canManageVehicles, canManageClassrooms, canManageMaintenance, canManageCourses, canManageBatches, canManageLecturers, canManageEnrollment, canManagePayments, canManageCertificates, canManageStudents, canManageUsers } = req.body;
        const existingUser = yield User_1.User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = yield User_1.User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            employeeId,
            phoneNumber,
            isActive: isActive !== undefined ? !!isActive : true,
            canBookAuditorium: !!canBookAuditorium,
            canBookClassroom: !!canBookClassroom,
            canBookTransport: !!canBookTransport,
            canManageVehicles: !!canManageVehicles,
            canManageClassrooms: !!canManageClassrooms,
            canManageMaintenance: !!canManageMaintenance,
            canManageCourses: !!canManageCourses,
            canManageBatches: !!canManageBatches,
            canManageLecturers: !!canManageLecturers,
            canManageEnrollment: !!canManageEnrollment,
            canManagePayments: !!canManagePayments,
            canManageCertificates: !!canManageCertificates,
            canManageStudents: !!canManageStudents,
            canManageUsers: !!canManageUsers
        });
        // Send welcome email with login credentials
        yield (0, email_1.sendWelcomeEmail)(email, password, name);
        res.status(201).json({
            message: 'User registered successfully and email sent.',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.User.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                isActive: user.isActive,
                canBookAuditorium: user.canBookAuditorium,
                canBookClassroom: user.canBookClassroom,
                canBookTransport: user.canBookTransport,
                canManageVehicles: user.canManageVehicles,
                canManageClassrooms: user.canManageClassrooms,
                canManageMaintenance: user.canManageMaintenance,
                canManageCourses: user.canManageCourses,
                canManageBatches: user.canManageBatches,
                canManageLecturers: user.canManageLecturers,
                canManageEnrollment: user.canManageEnrollment,
                canManagePayments: user.canManagePayments,
                canManageCertificates: user.canManageCertificates,
                canManageStudents: user.canManageStudents,
                canManageUsers: user.canManageUsers
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.login = login;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not found in request' });
            return;
        }
        const user = yield User_1.User.findByPk(userId);
        if (!user || !user.password) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Verify current password
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Incorrect current password' });
            return;
        }
        // Hash new password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedNewPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        // Update password
        user.password = hashedNewPassword;
        yield user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.changePassword = changePassword;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getUsers = getUsers;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        console.log('DELETE request for user ID:', id);
        const user = yield User_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Prevent deleting self
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (adminId === id) {
            res.status(400).json({ message: 'You cannot delete your own account' });
            return;
        }
        yield user.destroy();
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteUser = deleteUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, employeeId, role, phoneNumber, isActive, canBookAuditorium, canBookClassroom, canBookTransport, canManageVehicles, canManageClassrooms, canManageMaintenance, canManageCourses, canManageBatches, canManageLecturers, canManageEnrollment, canManagePayments, canManageCertificates, canManageStudents, canManageUsers } = req.body;
        const user = yield User_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (employeeId !== undefined)
            user.employeeId = employeeId;
        if (phoneNumber !== undefined)
            user.phoneNumber = phoneNumber;
        if (isActive !== undefined)
            user.isActive = isActive;
        if (role)
            user.role = role;
        if (canBookAuditorium !== undefined)
            user.canBookAuditorium = canBookAuditorium;
        if (canBookClassroom !== undefined)
            user.canBookClassroom = canBookClassroom;
        if (canBookTransport !== undefined)
            user.canBookTransport = canBookTransport;
        if (canManageVehicles !== undefined)
            user.canManageVehicles = canManageVehicles;
        if (canManageClassrooms !== undefined)
            user.canManageClassrooms = canManageClassrooms;
        if (canManageMaintenance !== undefined)
            user.canManageMaintenance = canManageMaintenance;
        if (canManageCourses !== undefined)
            user.canManageCourses = canManageCourses;
        if (canManageBatches !== undefined)
            user.canManageBatches = canManageBatches;
        if (canManageLecturers !== undefined)
            user.canManageLecturers = canManageLecturers;
        if (canManageEnrollment !== undefined)
            user.canManageEnrollment = canManageEnrollment;
        if (canManagePayments !== undefined)
            user.canManagePayments = canManagePayments;
        if (canManageCertificates !== undefined)
            user.canManageCertificates = canManageCertificates;
        if (canManageStudents !== undefined)
            user.canManageStudents = canManageStudents;
        if (canManageUsers !== undefined)
            user.canManageUsers = canManageUsers;
        yield user.save();
        yield user.save();
        res.status(200).json({ message: 'User updated successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateUser = updateUser;
