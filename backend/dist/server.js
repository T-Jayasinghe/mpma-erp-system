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
require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const transportBookingRoutes_1 = __importDefault(require("./routes/transportBookingRoutes"));
const classroomRoutes_1 = __importDefault(require("./routes/classroomRoutes"));
const classroomBookingRoutes_1 = __importDefault(require("./routes/classroomBookingRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const auditoriumBookingRoutes_1 = __importDefault(require("./routes/auditoriumBookingRoutes"));
const maintenanceRoutes_1 = __importDefault(require("./routes/maintenanceRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const batchRoutes_1 = __importDefault(require("./routes/batchRoutes"));
const lecturerRoutes_1 = __importDefault(require("./routes/lecturerRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const studentPaymentRoutes_1 = __importDefault(require("./routes/studentPaymentRoutes"));
const associations_1 = require("./models/associations");
const publicCourseRoutes_1 = __importDefault(require("./routes/publicCourseRoutes"));
const publicApplicationRoutes_1 = __importDefault(require("./routes/publicApplicationRoutes"));
require("./models/SlpaEmployee");
require("./models/CourseLecturer");
// Set up model relationships
(0, associations_1.setupAssociations)();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Basic Route
app.get('/', (req, res) => {
    res.send('MPMA ERP API is running...');
});
// API Routes
app.use('/api/vehicles', vehicleRoutes_1.default);
app.use('/api/transport-bookings', transportBookingRoutes_1.default);
app.use('/api/classrooms', classroomRoutes_1.default);
app.use('/api/classroom-bookings', classroomBookingRoutes_1.default);
app.use('/api/auditorium-bookings', auditoriumBookingRoutes_1.default);
app.use('/api/maintenances', maintenanceRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/courses', courseRoutes_1.default);
app.use('/api/batches', batchRoutes_1.default);
app.use('/api/lecturers', lecturerRoutes_1.default);
app.use('/api/students', studentRoutes_1.default);
app.use('/api/student-payments', studentPaymentRoutes_1.default);
app.use('/api/public/courses', publicCourseRoutes_1.default);
app.use('/api/public', publicApplicationRoutes_1.default);
// Error Handler
app.use((err, req, res, next) => {
    const uploadError = (err === null || err === void 0 ? void 0 : err.name) === 'MulterError' || String((err === null || err === void 0 ? void 0 : err.message) || '').includes('PDF, JPG');
    if (!uploadError)
        console.error(err.stack);
    res.status(uploadError ? 400 : (err.status || 500)).json({
        success: false,
        message: uploadError ? (err.code === 'LIMIT_FILE_SIZE' ? 'Each document must be 5 MB or smaller.' : err.message) : 'Internal Server Error'
    });
});
const PORT = process.env.PORT || 5001;
// Database Connection & Server Start
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        // connectDB() already synchronizes all registered models. Running
        // per-model alter syncs here causes Sequelize/MySQL to create duplicate
        // unique indexes on every startup until MySQL reaches its index limit.
        console.log("Database models synchronized.");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
});
init();
