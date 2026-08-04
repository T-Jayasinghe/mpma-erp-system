import './config/env';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import vehicleRoutes from './routes/vehicleRoutes';
import transportBookingRoutes from './routes/transportBookingRoutes';
import classroomRoutes from './routes/classroomRoutes';
import classroomBookingRoutes from './routes/classroomBookingRoutes';
import authRoutes from './routes/authRoutes';
import auditoriumBookingRoutes from './routes/auditoriumBookingRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

import courseRoutes from './routes/courseRoutes';
import batchRoutes from './routes/batchRoutes';
import lecturerRoutes from './routes/lecturerRoutes';
import studentRoutes from './routes/studentRoutes';
import studentPaymentRoutes from './routes/studentPaymentRoutes';
import Maintenance from './models/Maintenance';
import User from './models/User';
import Student from './models/Student';
import StudentPayment from './models/StudentPayment';
import ApplicationDocument from './models/ApplicationDocument';
import VerificationChecklist from './models/VerificationChecklist';
import { setupAssociations } from './models/associations';
import publicCourseRoutes from './routes/publicCourseRoutes';
import publicApplicationRoutes from './routes/publicApplicationRoutes';
import './models/SlpaEmployee';
import './models/CourseLecturer';

// Set up model relationships
setupAssociations();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Route
app.get('/', (req, res) => {
  res.send('MPMA ERP API is running...');
});

// API Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/transport-bookings', transportBookingRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/classroom-bookings', classroomBookingRoutes);
app.use('/api/auditorium-bookings', auditoriumBookingRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student-payments', studentPaymentRoutes);
app.use('/api/public/courses', publicCourseRoutes);
app.use('/api/public', publicApplicationRoutes);
// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const uploadError = err?.name === 'MulterError' || String(err?.message || '').includes('PDF, JPG');
  if (!uploadError) console.error(err.stack);
  res.status(uploadError ? 400 : (err.status || 500)).json({
    success: false,
    message: uploadError ? (err.code === 'LIMIT_FILE_SIZE' ? 'Each document must be 5 MB or smaller.' : err.message) : 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;

// Database Connection & Server Start
const init = async () => {
  try {
    await connectDB();
    
    // connectDB() already synchronizes all registered models. Running
    // per-model alter syncs here causes Sequelize/MySQL to create duplicate
    // unique indexes on every startup until MySQL reaches its index limit.
    console.log("Database models synchronized.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

init();
