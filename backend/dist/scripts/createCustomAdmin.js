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
require("../config/env");
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const associations_1 = require("../models/associations");
const createCustomAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, associations_1.setupAssociations)();
        yield db_1.sequelize.authenticate();
        console.log('Database connected successfully.');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const adminsToCreate = [
            {
                name: 'MPMA Admin User',
                email: 'mpmaadmin@erp.com',
                password: 'adminpassword123',
                employeeId: 'ADM-003',
                phoneNumber: '0778899001',
            },
            {
                name: 'Super Administrator',
                email: 'superadmin@erp.com',
                password: 'Admin@2026Password',
                employeeId: 'ADM-004',
                phoneNumber: '0778899002',
            }
        ];
        console.log('--------------------------------------------------');
        console.log('CREATING NEW ADMIN CREDENTIALS...');
        console.log('--------------------------------------------------');
        for (const adminData of adminsToCreate) {
            const hashedPassword = yield bcryptjs_1.default.hash(adminData.password, salt);
            const [user, created] = yield User_1.User.findOrCreate({
                where: { email: adminData.email },
                defaults: {
                    name: adminData.name,
                    email: adminData.email,
                    password: hashedPassword,
                    role: 'admin',
                    employeeId: adminData.employeeId,
                    isActive: true,
                    canBookAuditorium: true,
                    canBookClassroom: true,
                    canBookTransport: true,
                    canManageVehicles: true,
                    canManageClassrooms: true,
                    canManageMaintenance: true,
                    phoneNumber: adminData.phoneNumber,
                }
            });
            if (!created) {
                yield user.update({
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    canBookAuditorium: true,
                    canBookClassroom: true,
                    canBookTransport: true,
                    canManageVehicles: true,
                    canManageClassrooms: true,
                    canManageMaintenance: true,
                });
                console.log(`[UPDATED] Admin User: ${adminData.email} | Password: ${adminData.password}`);
            }
            else {
                console.log(`[CREATED] Admin User: ${adminData.email} | Password: ${adminData.password}`);
            }
        }
        console.log('--------------------------------------------------');
        console.log('ALL ADMIN CREDENTIALS ARE READY FOR LOGIN!');
        console.log('--------------------------------------------------');
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating admin credentials:', error);
        process.exit(1);
    }
});
createCustomAdmin();
