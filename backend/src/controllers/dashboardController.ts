import { Request, Response } from 'express';
import { AuditoriumBooking } from '../models/AuditoriumBooking';
import { ClassroomBooking } from '../models/ClassroomBooking';
import { TransportBooking } from '../models/TransportBooking';
import Maintenance from '../models/Maintenance';
import { Classroom } from '../models/Classroom';
import { Vehicle } from '../models/Vehicle';
import Student from '../models/Student';
import StudentPayment from '../models/StudentPayment';
import { Course } from '../models/Course';
import { Batch } from '../models/Batch';
import { Lecturer } from '../models/Lecturer';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Totals for resources
    const auditoriumTotal = await AuditoriumBooking.count();
    const classroomTotal = await ClassroomBooking.count();
    const transportTotal = await TransportBooking.count();

    // Student & Application Metrics
    const studentTotal = await Student.count();
    const pendingApps = await Student.count({ where: { application_status: 'PENDING_REVIEW' } });
    const approvedApps = await Student.count({ where: { application_status: 'APPROVED' } });
    const registeredStudents = await Student.count({ where: { status: 'Registered' } });

    // Academic Metrics
    const courseTotal = await Course.count();
    const batchTotal = await Batch.count();
    const lecturerTotal = await Lecturer.count();
    const maintenanceTotal = await Maintenance.count();

    // Financial Metrics
    const totalPaidSum = await StudentPayment.sum('amount_paid');
    const totalRevenue = typeof totalPaidSum === 'number' ? totalPaidSum : 0;
    const pendingPaymentsCount = await StudentPayment.count({ where: { payment_status: 'PENDING' } });

    // Facilities & Vehicles status counts
    const classroomCount = await Classroom.count();
    const vehicleCount = await Vehicle.count();

    // Recent items for stream feeds
    const recentAuditorium = await AuditoriumBooking.findAll({ limit: 5 });
    const recentClassroom = await ClassroomBooking.findAll({ limit: 5 });
    const recentTransport = await TransportBooking.findAll({ limit: 5 });
    const recentStudents = await Student.findAll({ limit: 5 });
    const recentMaintenance = await Maintenance.findAll({
      limit: 5,
      include: [
        { model: Classroom, as: 'classroom' },
        { model: Vehicle, as: 'vehicle' }
      ]
    });

    // Format unified activity stream
    const activities: any[] = [
      ...recentAuditorium.map(b => ({
        id: b.id,
        type: 'Auditorium',
        title: b.description || 'Auditorium Event',
        subtitle: `Capacity: ${b.participants} | Contact: ${b.name}`,
        time: b.date ? `${b.date} (${b.start} - ${b.end})` : `${b.start} - ${b.end}`,
        status: b.status,
        createdAt: (b as any).createdAt
      })),
      ...recentClassroom.map(b => ({
        id: b.id,
        type: 'Classroom',
        title: b.courseName || 'Classroom Session',
        subtitle: `Officer: ${b.requestingOfficerName || 'Staff'} | Batch: ${b.batchCode || 'N/A'}`,
        time: b.dateFrom,
        status: b.status,
        createdAt: (b as any).createdAt
      })),
      ...recentTransport.map(b => ({
        id: b.id,
        type: 'Transport',
        title: `Trip to ${b.destination}`,
        subtitle: `Requester: ${b.requesterName} (${b.department}) | ${b.purpose}`,
        time: b.departureDate,
        status: b.status,
        createdAt: (b as any).createdAt
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
      ...recentMaintenance.map((m: any) => {
        const facilityName = m.classroom?.name || m.vehicle?.name || m.facilityType;
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
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
};

