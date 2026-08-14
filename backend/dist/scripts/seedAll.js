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
const Classroom_1 = require("../models/Classroom");
const ClassroomBooking_1 = require("../models/ClassroomBooking");
const Vehicle_1 = require("../models/Vehicle");
const TransportBooking_1 = require("../models/TransportBooking");
const AuditoriumBooking_1 = require("../models/AuditoriumBooking");
const Course_1 = require("../models/Course");
const Batch_1 = require("../models/Batch");
const Lecturer_1 = require("../models/Lecturer");
const BatchLecturer_1 = require("../models/BatchLecturer");
const Student_1 = __importDefault(require("../models/Student"));
const StudentPayment_1 = __importDefault(require("../models/StudentPayment"));
const ApplicationDocument_1 = __importDefault(require("../models/ApplicationDocument"));
const VerificationChecklist_1 = __importDefault(require("../models/VerificationChecklist"));
const SlpaEmployee_1 = __importDefault(require("../models/SlpaEmployee"));
const Maintenance_1 = __importDefault(require("../models/Maintenance"));
const BankBranch_1 = __importDefault(require("../models/BankBranch"));
const CourseLecturer_1 = require("../models/CourseLecturer");
const bankBranchesData_1 = require("../data/bankBranchesData");
const associations_1 = require("../models/associations");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const toDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const seedAll = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Setup model relationships
        (0, associations_1.setupAssociations)();
        console.log('Syncing database (force=true) to recreate all tables cleanly...');
        yield db_1.sequelize.authenticate();
        yield db_1.sequelize.sync({ force: true });
        console.log('Database sync complete.');
        // Seed Bank Branches
        console.log('Seeding bank branches...');
        yield BankBranch_1.default.bulkCreate(bankBranchesData_1.INITIAL_BANK_BRANCHES);
        console.log(`Seeded ${bankBranchesData_1.INITIAL_BANK_BRANCHES.length} bank branch records.`);
        // 1. Seed Users
        console.log('Seeding users...');
        const salt = yield bcryptjs_1.default.genSalt(10);
        const adminPassword = yield bcryptjs_1.default.hash('admin123', salt);
        const officerPassword = yield bcryptjs_1.default.hash('officer123', salt);
        const userPassword = yield bcryptjs_1.default.hash('user123', salt);
        yield User_1.User.bulkCreate([
            {
                name: 'System Administrator',
                email: 'admin@erp.com',
                password: adminPassword,
                role: 'admin',
                employeeId: 'ADM-001',
                isActive: true,
                canBookAuditorium: true,
                canBookClassroom: true,
                canBookTransport: true,
                canManageVehicles: true,
                canManageClassrooms: true,
                canManageMaintenance: true,
                canManageCourses: true,
                canManageBatches: true,
                canManageLecturers: true,
                canManageEnrollment: true,
                canManagePayments: true,
                canManageCertificates: true,
                canManageStudents: true,
                canManageUsers: true,
                phoneNumber: '0112233445',
            },
            {
                name: 'New Administrator',
                email: 'admin2@erp.com',
                password: adminPassword,
                role: 'admin',
                employeeId: 'ADM-002',
                isActive: true,
                canBookAuditorium: true,
                canBookClassroom: true,
                canBookTransport: true,
                canManageVehicles: true,
                canManageClassrooms: true,
                canManageMaintenance: true,
                canManageCourses: true,
                canManageBatches: true,
                canManageLecturers: true,
                canManageEnrollment: true,
                canManagePayments: true,
                canManageCertificates: true,
                canManageStudents: true,
                canManageUsers: true,
                phoneNumber: '0771234567',
            },
            {
                name: 'Training Officer',
                email: 'officer@erp.com',
                password: officerPassword,
                role: 'officer',
                employeeId: 'OFF-001',
                isActive: true,
                canBookAuditorium: true,
                canBookClassroom: true,
                canBookTransport: true,
                canManageVehicles: false,
                canManageClassrooms: true,
                canManageMaintenance: false,
                canManageCourses: true,
                canManageBatches: true,
                canManageLecturers: true,
                canManageEnrollment: true,
                canManagePayments: true,
                canManageCertificates: true,
                canManageStudents: true,
                canManageUsers: false,
                phoneNumber: '0777654321',
            },
            {
                name: 'Standard User',
                email: 'user@erp.com',
                password: userPassword,
                role: 'user',
                employeeId: 'USR-001',
                isActive: true,
                canBookAuditorium: true,
                canBookClassroom: true,
                canBookTransport: true,
                canManageVehicles: false,
                canManageClassrooms: false,
                canManageMaintenance: false,
                canManageCourses: false,
                canManageBatches: false,
                canManageLecturers: false,
                canManageEnrollment: false,
                canManagePayments: false,
                canManageCertificates: false,
                canManageStudents: false,
                canManageUsers: false,
                phoneNumber: '0711122334',
            },
        ]);
        console.log('Users seeded.');
        // 2. Seed Courses
        console.log('Seeding courses...');
        const courseDataList = [
            {
                courseCode: 'MAR-SEA',
                courseName: 'Maritime & Seamanship',
                stream: 'Maritime & Seamanship',
                description: 'Professional maritime seamanship training covering navigation, vessel handling, safety operations, and international seafaring standards.',
            },
            {
                courseCode: 'OHS',
                courseName: 'Occupational Health & Safety',
                stream: 'Occupational Health & Safety',
                description: 'Comprehensive workplace safety, emergency response, and regulatory compliance programs for maritime and industrial environments.',
            },
            {
                courseCode: 'PORT-LOG',
                courseName: 'Port Operation & Logistics',
                stream: 'Port Operation & Logistics',
                description: 'Training in port management, cargo logistics, terminal operations, shipping documentation, and supply chain coordination.',
            },
            {
                courseCode: 'TECH',
                courseName: 'Technical',
                stream: 'Technical',
                description: 'Hands-on technical programs covering marine engineering systems, machinery maintenance, electrical systems, and diagnostics.',
            },
            {
                courseCode: 'MGT-IS',
                courseName: 'Management & IS',
                stream: 'Management & IS',
                description: 'Leadership, maritime administration, business management, and information systems training for modern maritime professionals.',
            },
        ].map((course) => (Object.assign(Object.assign({}, course), { duration: '6 Months', medium: 'English', location: 'MPMA Campus', maxParticipants: 40, registrationFee: 2500, courseFee: 25000, status: 'Active', schedule: 'Weekday', type: 'Full Time', mode: 'Physical', maxInstallments: 3 })));
        const seededCourses = yield Course_1.Course.bulkCreate(courseDataList);
        console.log('Courses seeded.');
        // 3. Seed Lecturers, Batches & Junction Table assignments
        console.log('Seeding lecturers and batches...');
        const lecturerNames = [
            'Capt. Nimal Perera',
            'Dr. Anushka Fernando',
            'Mr. Dinesh Silva',
            'Ms. Kavindi Jayasinghe',
            'Eng. Ruwan Wijesekara',
        ];
        const seededBatches = [];
        for (let courseIndex = 0; courseIndex < seededCourses.length; courseIndex += 1) {
            const course = seededCourses[courseIndex];
            const courseCode = course.courseCode;
            const lecturers = [];
            for (let lecturerIndex = 0; lecturerIndex < 5; lecturerIndex += 1) {
                const sequence = courseIndex * 5 + lecturerIndex + 1;
                const name = lecturerNames[lecturerIndex];
                const email = `${courseCode.toLowerCase().replace(/[^a-z0-9]/g, '')}.lecturer${lecturerIndex + 1}@mpma.demo`;
                const nicPassport = `MPMA-DEMO-${String(sequence).padStart(3, '0')}`;
                const lecturer = yield Lecturer_1.Lecturer.create({
                    fullName: `${name} (${courseCode})`,
                    nicPassport,
                    dateOfBirth: toDate(1975 + lecturerIndex * 3, lecturerIndex + 1, 10 + lecturerIndex),
                    gender: lecturerIndex === 1 || lecturerIndex === 3 ? 'Female' : 'Male',
                    mobile: `077${String(1000000 + sequence).padStart(7, '0')}`,
                    email,
                    address: `${20 + sequence}, Maritime Avenue, Colombo 15`,
                    emergencyContact: `071${String(2000000 + sequence).padStart(7, '0')}`,
                    bankName: 'Bank of Ceylon',
                    branchName: 'Colombo Fort',
                    accountHolderName: `${name} (${courseCode})`,
                    accountNumber: `70${String(100000 + sequence).padStart(6, '0')}`,
                    status: 'Active',
                });
                lecturers.push(lecturer);
                yield CourseLecturer_1.CourseLecturer.create({
                    courseId: course.id,
                    lecturerId: lecturer.id,
                });
            }
            for (let batchIndex = 0; batchIndex < 5; batchIndex += 1) {
                const batchNumber = batchIndex + 1;
                const startMonth = 1 + batchIndex * 2;
                const endMonth = Math.min(startMonth + 5, 12);
                const batchCode = `${courseCode}-2026-${String(batchNumber).padStart(2, '0')}`;
                const batch = yield Batch_1.Batch.create({
                    batchCode,
                    courseId: course.id,
                    startDate: toDate(2026, startMonth, 1),
                    endDate: toDate(2026, endMonth, 28),
                    location: `MPMA Training Room ${courseIndex + 1}`,
                    maxStudents: 40,
                    currentStudents: 10 + batchIndex * 3,
                    status: 'Available',
                });
                seededBatches.push(batch);
                for (const lecturer of lecturers) {
                    yield BatchLecturer_1.BatchLecturer.create({
                        batchId: batch.id,
                        lecturerId: lecturer.id,
                    });
                }
            }
        }
        console.log('Lecturers and batches seeded.');
        // 4. Seed Classrooms
        console.log('Seeding classrooms...');
        const classroomNames = ['Physics Lab', 'Chemistry Room', 'Computer Lab', 'Language Lab', 'Lecture Hall A', 'Lecture Hall B'];
        const locations = ['Block A, Level 1', 'Block A, Level 2', 'Block B, Level 1', 'Block C, Ground Floor', 'Main Wing, East', 'Main Wing, West'];
        const facilitiesList = [
            ['AC', 'Projector'],
            ['AC', 'Smart Board', 'Audio System'],
            ['Projector', 'Whiteboard'],
            ['AC', 'Webcam', 'Microphone'],
            ['PA System', 'Podium'],
            ['Projector', 'Desktop PC']
        ];
        const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
        const makeDateString = (daysAheadMin, daysAheadMax) => {
            const date = new Date();
            date.setDate(date.getDate() + daysAheadMin + Math.floor(Math.random() * (daysAheadMax - daysAheadMin + 1)));
            return date.toISOString().split('T')[0];
        };
        const classroomsToCreate = [];
        for (let i = 1; i <= 15; i++) {
            classroomsToCreate.push({
                name: `${pickRandom(classroomNames)} ${100 + i}`,
                capacity: 20 + (Math.floor(Math.random() * 7) * 5),
                location: pickRandom(locations),
                examReady: Math.random() > 0.25 ? 'Yes' : 'No',
                facilities: pickRandom(facilitiesList)
            });
        }
        const seededClassrooms = yield Classroom_1.Classroom.bulkCreate(classroomsToCreate);
        console.log('Classrooms seeded.');
        // 5. Seed Vehicles
        console.log('Seeding vehicles...');
        const vehicleTemplates = [
            { name: 'Toyota Coaster', number: 'WP BUS-1001', capacity: 30, type: 'Bus', acStatus: 'AC', status: 'Available' },
            { name: 'Mitsubishi Rosa', number: 'WP BUS-1002', capacity: 28, type: 'Bus', acStatus: 'AC', status: 'Available' },
            { name: 'Isuzu Journey', number: 'WP BUS-1003', capacity: 32, type: 'Bus', acStatus: 'AC', status: 'Available' },
            { name: 'Ashok Leyland Falcon', number: 'WP BUS-1004', capacity: 40, type: 'Bus', acStatus: 'Non-AC', status: 'Available' },
        ];
        const seededVehicles = yield Vehicle_1.Vehicle.bulkCreate(vehicleTemplates);
        console.log('Vehicles seeded.');
        // 6. Seed Classroom Bookings
        console.log('Seeding classroom bookings...');
        const courseNames = ['Advanced Excel', 'English Communication', 'Project Management', 'Data Science Basics', 'Teaching Methodology', 'Cyber Security Awareness'];
        const audienceTypes = ['Staff', 'Students', 'Mixed'];
        const courseCoordinators = ['Dr. Perera', 'Ms. Fernando', 'Mr. Silva', 'Dr. Jayasuriya', 'Ms. de Silva'];
        const classroomBookings = [];
        for (let i = 1; i <= 15; i++) {
            const classroom = pickRandom(seededClassrooms);
            const fromDate = makeDateString(1, 45);
            classroomBookings.push({
                requestingOfficerName: `Coordinator ${i}`,
                designation: pickRandom(['Lecturer', 'Instructor', 'Assistant Lecturer', 'Officer']),
                requestingOfficerEmail: `user${i}@example.com`,
                courseName: pickRandom(courseNames),
                audienceType: pickRandom(audienceTypes),
                batchCode: `BCH-${100 + i}`,
                numberOfParticipants: 10 + Math.floor(Math.random() * 40),
                dateFrom: fromDate,
                dateTo: fromDate,
                courseCoordinator: pickRandom(courseCoordinators),
                timeFrom: pickRandom(['08:00:00', '09:00:00', '13:00:00']),
                timeTo: pickRandom(['12:00:00', '15:00:00', '17:00:00']),
                preferredDaysOfWeek: pickRandom([
                    ['Monday', 'Wednesday'],
                    ['Tuesday', 'Thursday'],
                    ['Friday'],
                    ['Saturday']
                ]),
                paidCourse: Math.random() > 0.5 ? 'Yes' : 'No',
                classroomId: classroom.id,
                exam: Math.random() > 0.7 ? 'Yes' : 'No',
                additionalRequirements: pickRandom(['Projector', 'Whiteboard', 'Sound system', 'No special requirements']),
                status: pickRandom(['Pending', 'Approved', 'Rejected'])
            });
        }
        yield ClassroomBooking_1.ClassroomBooking.bulkCreate(classroomBookings);
        console.log('Classroom Bookings seeded.');
        // 7. Seed Transport Bookings
        console.log('Seeding transport bookings...');
        const departments = ['ICT', 'Engineering', 'Business', 'Science', 'Arts', 'Administration'];
        const destinations = ['Colombo', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Anuradhapura', 'Trincomalee'];
        const purposes = ['Field Trip', 'Staff Meeting', 'Guest Pickup', 'Site Visit', 'Emergency', 'Workshop'];
        const transportBookings = [];
        for (let i = 1; i <= 15; i++) {
            const vehicle = pickRandom(seededVehicles);
            const dateString = makeDateString(1, 21);
            transportBookings.push({
                requesterName: `Officer ${i}`,
                designation: pickRandom(['Staff', 'Lecturer', 'Coordinator']),
                department: pickRandom(departments),
                contactNumber: `07${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
                departureDate: dateString,
                returnDate: dateString,
                departureTime: pickRandom(['07:00:00', '08:00:00', '09:00:00']),
                pickupLocation: pickRandom(['Main Campus', 'City Office', 'Faculty Entrance']),
                destination: pickRandom(destinations),
                purpose: pickRandom(purposes),
                vehicleId: vehicle.id,
                status: pickRandom(['Pending', 'Approved', 'Rejected'])
            });
        }
        yield TransportBooking_1.TransportBooking.bulkCreate(transportBookings);
        console.log('Transport Bookings seeded.');
        // 8. Seed Auditorium Bookings
        console.log('Seeding auditorium bookings...');
        const auditoriumEvents = ['Graduation Ceremony', 'Guest Lecture', 'Annual General Meeting', 'Drama Competition', 'Career Fair', 'Award Night'];
        const auditoriumBookings = [];
        for (let i = 1; i <= 15; i++) {
            auditoriumBookings.push({
                name: `Organizer ${i}`,
                contact: `011${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
                date: makeDateString(1, 60),
                start: pickRandom(['08:00', '09:00', '10:00', '13:00']),
                end: pickRandom(['12:00', '15:00', '16:00', '18:00']),
                participants: 50 + (Math.floor(Math.random() * 8) * 25),
                description: pickRandom(auditoriumEvents),
                status: pickRandom(['Pending', 'Approved'])
            });
        }
        yield AuditoriumBooking_1.AuditoriumBooking.bulkCreate(auditoriumBookings);
        console.log('Auditorium Bookings seeded.');
        // 9. Seed Maintenance Records
        console.log('Seeding maintenance records...');
        const maintenances = [];
        const maintenanceTemplates = [
            { facilityType: 'Classroom', titlePrefix: 'AC Service', description: 'Routine classroom AC servicing.' },
            { facilityType: 'Transport', titlePrefix: 'Engine Check', description: 'Monthly vehicle inspection and oil change.' },
            { facilityType: 'Auditorium', titlePrefix: 'Seat Repair', description: 'Repairing seats and stage fittings.' },
            { facilityType: 'General', titlePrefix: 'Campus Inspection', description: 'General facility safety inspection.' }
        ];
        for (let i = 1; i <= 15; i++) {
            const template = pickRandom(maintenanceTemplates);
            const classroom = pickRandom(seededClassrooms);
            const vehicle = pickRandom(seededVehicles);
            const selectedFacilityId = template.facilityType === 'Classroom' ? classroom.id : template.facilityType === 'Transport' ? vehicle.id : undefined;
            const dateFrom = makeDateString(1, 45);
            maintenances.push({
                title: `${template.titlePrefix} ${i}`,
                description: template.description,
                facilityType: template.facilityType,
                facilityId: selectedFacilityId,
                dateFrom,
                dateTo: dateFrom,
                timeFrom: pickRandom(['08:00:00', '09:00:00', '13:00:00']),
                timeTo: pickRandom(['12:00:00', '15:00:00', '17:00:00'])
            });
        }
        yield Maintenance_1.default.bulkCreate(maintenances);
        console.log('Maintenance records seeded.');
        // 10. Seed SLPA Employees
        console.log('Seeding SLPA Employees...');
        yield SlpaEmployee_1.default.bulkCreate([
            {
                serviceNumber: 'SLPA-EMP-001',
                epfNumber: '11111',
                nic: '951234567V',
                fullName: 'Jayalath Bandara',
                firstName: 'Jayalath',
                lastName: 'Bandara',
                department: 'Operations',
                position: 'Terminal Operator',
                dob: '1995-05-12',
                gender: 'Male',
                email: 'jayalath.b@slpa.lk',
                phone: '0711234561',
                active: true,
            },
            {
                serviceNumber: 'SLPA-EMP-002',
                epfNumber: '22222',
                nic: '961234567V',
                fullName: 'Samantha Kumara',
                firstName: 'Samantha',
                lastName: 'Kumara',
                department: 'Logistics',
                position: 'Logistics Supervisor',
                dob: '1996-08-25',
                gender: 'Male',
                email: 'samantha.k@slpa.lk',
                phone: '0711234562',
                active: true,
            },
            {
                serviceNumber: 'SLPA-EMP-003',
                epfNumber: '33333',
                nic: '971234567V',
                fullName: 'Priyantha Perera',
                firstName: 'Priyantha',
                lastName: 'Perera',
                department: 'Security',
                position: 'Security Officer',
                dob: '1997-11-04',
                gender: 'Male',
                email: 'priyantha.p@slpa.lk',
                phone: '0711234563',
                active: true,
            },
            {
                serviceNumber: 'SLPA-EMP-004',
                epfNumber: '44444',
                nic: '981234567V',
                fullName: 'Niluni Fernando',
                firstName: 'Niluni',
                lastName: 'Fernando',
                department: 'Finance',
                position: 'Accounts Assistant',
                dob: '1988-02-15',
                gender: 'Female',
                email: 'niluni.f@slpa.lk',
                phone: '0711234564',
                active: true,
            },
            {
                serviceNumber: 'SLPA-EMP-005',
                epfNumber: '55555',
                nic: '991234567V',
                fullName: 'Ishara Madusanka',
                firstName: 'Ishara',
                lastName: 'Madusanka',
                department: 'IT Stream',
                position: 'Systems Support Specialist',
                dob: '1999-09-30',
                gender: 'Male',
                email: 'ishara.m@slpa.lk',
                phone: '0711234565',
                active: true,
            },
        ]);
        console.log('SLPA Employees seeded.');
        // 11. Seed Students, StudentPayments, VerificationChecklists, and ApplicationDocuments
        console.log('Seeding Student Application system data...');
        const maritimeCourse = seededCourses.find(c => c.courseCode === 'MAR-SEA');
        const ohsCourse = seededCourses.find(c => c.courseCode === 'OHS');
        const logisticsCourse = seededCourses.find(c => c.courseCode === 'PORT-LOG');
        const techCourse = seededCourses.find(c => c.courseCode === 'TECH');
        const mgtCourse = seededCourses.find(c => c.courseCode === 'MGT-IS');
        const maritimeBatch = seededBatches.find(b => b.courseId === maritimeCourse.id);
        const ohsBatch = seededBatches.find(b => b.courseId === ohsCourse.id);
        const logisticsBatch = seededBatches.find(b => b.courseId === logisticsCourse.id);
        const techBatch = seededBatches.find(b => b.courseId === techCourse.id);
        const mgtBatch = seededBatches.find(b => b.courseId === mgtCourse.id);
        // Student 1: PENDING_REVIEW
        const student1 = yield Student_1.default.create({
            firstName: 'Roshan',
            lastName: 'Ranasinghe',
            email: 'roshan.ranasinghe@example.com',
            phone: '0771234567',
            dob: '1998-05-15',
            gender: 'Male',
            address: '123, Galle Road, Colombo 03',
            course: maritimeCourse.courseName,
            batch: maritimeBatch.batchCode,
            studentCategory: 'Sri Lankan Student',
            nic: '981352468V',
            passport: null,
            status: 'Pending',
            application_status: 'PENDING_REVIEW',
            enrollment_type: 'STUDENT_SELF',
            payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000001',
            course_id: maritimeCourse.id,
            batch_id: maritimeBatch.id,
            admin_notes: JSON.stringify({
                ol: {
                    year: "2015",
                    indexNumber: "81234567",
                    medium: "English",
                    subjects: [
                        { id: "ol-1", subject: "Mathematics", grade: "A" },
                        { id: "ol-2", subject: "Science", grade: "A" },
                        { id: "ol-3", subject: "English Language", grade: "A" },
                        { id: "ol-4", subject: "Sinhala Language & Literature", grade: "A" },
                        { id: "ol-5", subject: "History", grade: "B" },
                        { id: "ol-6", subject: "Buddhism", grade: "A" },
                        { id: "ol-7", subject: "Information & Communication Technology (ICT)", grade: "A" },
                        { id: "ol-8", subject: "Business & Accounting Studies", grade: "B" }
                    ]
                },
                al: {
                    stream: "Physical Science",
                    year: "2018",
                    indexNumber: "21456789",
                    zScore: "1.8425",
                    subjects: [
                        { id: "al-1", subject: "Combined Mathematics", grade: "A" },
                        { id: "al-2", subject: "Physics", grade: "B" },
                        { id: "al-3", subject: "Chemistry", grade: "B" },
                        { id: "al-4", subject: "General English", grade: "A" }
                    ]
                },
                otherQualifications: [
                    { id: "oth-1", title: "Diploma in Maritime Operations", institute: "National Institute of Maritime Studies", year: "2020", result: "Distinction" },
                    { id: "oth-2", title: "STCW Basic Safety Certification", institute: "MPMA Maritime Academy", year: "2021", result: "Certified" }
                ]
            }),
        });
        yield student1.update({
            payment_plan: 'INSTALLMENT_2',
            installment_breakdown: 'Installment 1: LKR 14,000 | Installment 2: LKR 13,500'
        });
        yield VerificationChecklist_1.default.create({
            student_id: student1.id,
            identity_verified: false,
            documents_complete: false,
            eligibility_verified: false,
            course_available: true,
            checked_by: null,
            checked_at: null,
        });
        yield StudentPayment_1.default.create({
            student_id: student1.id,
            course_batch_id: null,
            registration_fee: 2500,
            course_fee: 25000,
            full_amount_payable: 27500,
            amount_paid: 0,
            payment_method: 'GOVPAY',
            payment_status: 'PENDING',
            payment_completed: false,
            payment_reference: `STU-PAY-20260815-${student1.id.substring(0, 8)}-1`,
        });
        // Student 2: CORRECTION_REQUESTED (SLPA Employee)
        const student2 = yield Student_1.default.create({
            firstName: 'Samantha',
            lastName: 'Kumara',
            email: 'samantha.k@example.com',
            phone: '0711234562',
            dob: '1996-08-25',
            gender: 'Male',
            address: '45, Temple Road, Kiribathgoda',
            course: ohsCourse.courseName,
            batch: ohsBatch.batchCode,
            studentCategory: 'SLPA Employee',
            nic: '961234567V',
            passport: null,
            status: 'Pending',
            application_status: 'CORRECTION_REQUESTED',
            enrollment_type: 'STUDENT_SELF',
            payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000002',
            course_id: ohsCourse.id,
            batch_id: ohsBatch.id,
            service_number: 'SLPA-EMP-002',
            epf_number: '22222',
            department: 'Logistics',
            slpa_position: 'Logistics Supervisor',
            admin_notes: JSON.stringify({
                ol: {
                    year: "2013",
                    indexNumber: "71543210",
                    medium: "Sinhala",
                    subjects: [
                        { id: "ol-1", subject: "Mathematics", grade: "B" },
                        { id: "ol-2", subject: "Science", grade: "B" },
                        { id: "ol-3", subject: "English Language", grade: "C" },
                        { id: "ol-4", subject: "Sinhala Language & Literature", grade: "A" },
                        { id: "ol-5", subject: "History", grade: "A" },
                        { id: "ol-6", subject: "Buddhism", grade: "A" }
                    ]
                },
                al: {
                    stream: "Commerce",
                    year: "2016",
                    indexNumber: "19876543",
                    zScore: "1.4520",
                    subjects: [
                        { id: "al-1", subject: "Accounting", grade: "B" },
                        { id: "al-2", subject: "Business Studies", grade: "A" },
                        { id: "al-3", subject: "Economics", grade: "B" }
                    ]
                },
                otherQualifications: [
                    { id: "oth-1", title: "NVQ Level 4 in Industrial Safety", institute: "TVEC Sri Lanka", year: "2019", result: "Pass" }
                ]
            }),
        });
        yield VerificationChecklist_1.default.create({
            student_id: student2.id,
            identity_verified: true,
            documents_complete: false,
            eligibility_verified: true,
            course_available: true,
            checked_by: 'System Administrator',
            checked_at: new Date(),
        });
        // Student 3: APPROVED (payment pending)
        const student3 = yield Student_1.default.create({
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            phone: '0723344556',
            dob: '1997-12-01',
            gender: 'Male',
            address: 'Apartment 5B, Ocean Breeze, Mount Lavinia',
            course: logisticsCourse.courseName,
            batch: logisticsBatch.batchCode,
            studentCategory: 'Non-Sri Lankan Student',
            nic: null,
            passport: 'N48593021',
            nationality: 'British',
            country_of_origin: 'United Kingdom',
            status: 'Qualified',
            application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF',
            payment_status_type: 'PENDING',
            application_number: 'MPMA-APP-2026-000003',
            course_id: logisticsCourse.id,
            batch_id: logisticsBatch.id,
            payment_plan: 'INSTALLMENT_3',
            installment_breakdown: 'Installment 1: LKR 10,000 | Installment 2: LKR 9,000 | Installment 3: LKR 8,500',
            approved_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
            admin_notes: JSON.stringify({
                ol: {
                    year: "2014",
                    indexNumber: "UK-884920",
                    medium: "English",
                    subjects: [
                        { id: "ol-1", subject: "Mathematics", grade: "A" },
                        { id: "ol-2", subject: "Science", grade: "A" },
                        { id: "ol-3", subject: "English Language", grade: "A" },
                        { id: "ol-4", subject: "Geography", grade: "B" }
                    ]
                },
                al: {
                    stream: "Information Technology",
                    year: "2017",
                    indexNumber: "UK-992014",
                    zScore: "N/A",
                    subjects: [
                        { id: "al-1", subject: "Business Studies", grade: "A" },
                        { id: "al-2", subject: "Economics", grade: "A" },
                        { id: "al-3", subject: "Information & Communication Technology (ICT)", grade: "B" }
                    ]
                },
                otherQualifications: [
                    { id: "oth-1", title: "BSc (Hons) in Logistics & Supply Chain", institute: "University of Plymouth", year: "2021", result: "First Class Honors" }
                ]
            }),
        });
        yield VerificationChecklist_1.default.create({
            student_id: student3.id,
            identity_verified: true,
            documents_complete: true,
            eligibility_verified: true,
            course_available: true,
            checked_by: 'System Administrator',
            checked_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 30 * 60 * 1000),
        });
        yield StudentPayment_1.default.create({
            student_id: student3.id,
            course_batch_id: null,
            registration_fee: 2500,
            course_fee: 25000,
            full_amount_payable: 27500,
            amount_paid: 0,
            payment_method: 'GOVPAY',
            payment_status: 'PENDING',
            payment_completed: false,
            payment_reference: `STU-PAY-20260714-${student3.id.substring(0, 8)}-1`,
        });
        // Student 4: Registered (PAID)
        const student4 = yield Student_1.default.create({
            firstName: 'Dilshan',
            lastName: 'Perera',
            email: 'dilshan.perera@example.com',
            phone: '0767788990',
            dob: '2000-02-18',
            gender: 'Male',
            address: '88/2, Kandy Road, Kadawatha',
            course: techCourse.courseName,
            batch: techBatch.batchCode,
            studentCategory: 'Sri Lankan Student',
            nic: '200004938201',
            passport: null,
            status: 'Registered',
            application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF',
            payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000004',
            course_id: techCourse.id,
            batch_id: techBatch.id,
            approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-TECH-0043',
            admin_notes: JSON.stringify({
                ol: {
                    year: "2017",
                    indexNumber: "91204857",
                    medium: "English",
                    subjects: [
                        { id: "ol-1", subject: "Mathematics", grade: "A" },
                        { id: "ol-2", subject: "Science", grade: "A" },
                        { id: "ol-3", subject: "English Language", grade: "B" },
                        { id: "ol-4", subject: "Sinhala Language & Literature", grade: "A" },
                        { id: "ol-5", subject: "Design & Mechanical Technology", grade: "A" },
                        { id: "ol-6", subject: "Information & Communication Technology (ICT)", grade: "A" }
                    ]
                },
                al: {
                    stream: "Engineering Technology",
                    year: "2020",
                    indexNumber: "31049284",
                    zScore: "1.6540",
                    subjects: [
                        { id: "al-1", subject: "Engineering Technology", grade: "A" },
                        { id: "al-2", subject: "Science for Technology", grade: "B" },
                        { id: "al-3", subject: "Information & Communication Technology (ICT)", grade: "B" }
                    ]
                },
                otherQualifications: [
                    { id: "oth-1", title: "Higher National Diploma (HND) in Marine Mechanical Engineering", institute: "SLATE Marine Campus", year: "2023", result: "Merit" }
                ]
            }),
        });
        yield VerificationChecklist_1.default.create({
            student_id: student4.id,
            identity_verified: true,
            documents_complete: true,
            eligibility_verified: true,
            course_available: true,
            checked_by: 'System Administrator',
            checked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000),
        });
        yield StudentPayment_1.default.create({
            student_id: student4.id,
            course_batch_id: null,
            registration_fee: 2500,
            course_fee: 25000,
            full_amount_payable: 27500,
            amount_paid: 27500,
            payment_method: 'GOVPAY',
            payment_status: 'PAID',
            payment_completed: true,
            payment_reference: `STU-PAY-20260713-${student4.id.substring(0, 8)}-2`,
            transaction_id: 'TXN-GOVPAY-123456',
            receipt_number: 'REC-20260713-0001',
            paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
            remarks: 'Payment confirmed via GovPay callback',
        });
        // Student 5: REJECTED
        const student5 = yield Student_1.default.create({
            firstName: 'Fathima',
            lastName: 'Azeez',
            email: 'fathima.azeez@example.com',
            phone: '0779988776',
            dob: '1999-07-07',
            gender: 'Female',
            address: '12, Peradeniya Road, Kandy',
            course: mgtCourse.courseName,
            batch: mgtBatch.batchCode,
            studentCategory: 'Sri Lankan Student',
            nic: '995874123V',
            passport: null,
            status: 'Pending',
            application_status: 'REJECTED',
            enrollment_type: 'STUDENT_SELF',
            payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000005',
            course_id: mgtCourse.id,
            batch_id: mgtBatch.id,
            admin_notes: 'Application rejected. Qualifications do not meet the minimum requirements for the course.',
        });
        yield VerificationChecklist_1.default.create({
            student_id: student5.id,
            identity_verified: true,
            documents_complete: true,
            eligibility_verified: false,
            course_available: true,
            checked_by: 'System Administrator',
            checked_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
        });
        // ── Extra Students 6-20 ─────────────────────────────────────────────────
        console.log('Seeding extra students (6-20)...');
        // Student 6 – Maritime, APPROVED + PAID (full payment)
        const student6 = yield Student_1.default.create({
            firstName: 'Nuwan', lastName: 'Dissanayake',
            email: 'nuwan.dissanayake@example.com', phone: '0712345678',
            dob: '1997-03-22', gender: 'Male',
            address: '14, Marine Drive, Colombo 15',
            course: maritimeCourse.courseName, batch: maritimeBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '973841250V', passport: null,
            status: 'Registered', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000006',
            course_id: maritimeCourse.id, batch_id: maritimeBatch.id,
            approved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-MAR-0011',
            admin_notes: 'All documents verified. Payment received in full.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student6.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student6.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 27500, payment_method: 'GOVPAY', payment_status: 'PAID', payment_completed: true, payment_reference: `STU-PAY-20260806-${student6.id.substring(0, 8)}-1`, transaction_id: 'TXN-GOVPAY-200101', receipt_number: 'REC-20260806-0006', paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), remarks: 'Full payment via GovPay' });
        // Student 7 – OHS, PENDING_REVIEW
        const student7 = yield Student_1.default.create({
            firstName: 'Thisari', lastName: 'Wickramasinghe',
            email: 'thisari.w@example.com', phone: '0756677889',
            dob: '2000-11-15', gender: 'Female',
            address: '77, Flower Road, Colombo 07',
            course: ohsCourse.courseName, batch: ohsBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '200031854201', passport: null,
            status: 'Pending', application_status: 'PENDING_REVIEW',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000007',
            course_id: ohsCourse.id, batch_id: ohsBatch.id,
            admin_notes: 'Awaiting document verification.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student7.id, identity_verified: false, documents_complete: false, eligibility_verified: false, course_available: true, checked_by: null, checked_at: null });
        // Student 8 – Port Logistics, APPROVED + 3 installments pending
        const student8 = yield Student_1.default.create({
            firstName: 'Pradeep', lastName: 'Jayawardena',
            email: 'pradeep.j@example.com', phone: '0771122334',
            dob: '1995-06-30', gender: 'Male',
            address: '33, Beira Lake Road, Colombo 02',
            course: logisticsCourse.courseName, batch: logisticsBatch.batchCode,
            studentCategory: 'SLPA Employee', nic: '951831240V', passport: null,
            status: 'Qualified', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PENDING',
            application_number: 'MPMA-APP-2026-000008',
            course_id: logisticsCourse.id, batch_id: logisticsBatch.id,
            payment_plan: 'INSTALLMENT_3', installment_breakdown: 'Installment 1: LKR 9,500 | Installment 2: LKR 9,000 | Installment 3: LKR 9,000',
            service_number: 'SLPA-EMP-003', epf_number: '33333', department: 'Operations', slpa_position: 'Terminal Supervisor',
            approved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            admin_notes: 'SLPA employee verified. Payment in 3 installments approved.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student8.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'Training Officer', checked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student8.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 0, payment_method: 'GOVPAY', payment_status: 'PENDING', payment_completed: false, payment_reference: `STU-PAY-20260808-${student8.id.substring(0, 8)}-1` });
        // Student 9 – Technical, APPROVED + PAID
        const student9 = yield Student_1.default.create({
            firstName: 'Kasun', lastName: 'Rajapaksha',
            email: 'kasun.raja@example.com', phone: '0768899001',
            dob: '1998-09-12', gender: 'Male',
            address: '56, Industrial Zone, Ratmalana',
            course: techCourse.courseName, batch: techBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '988561230V', passport: null,
            status: 'Registered', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000009',
            course_id: techCourse.id, batch_id: techBatch.id,
            approved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-TECH-0055',
            admin_notes: 'Payment confirmed.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student9.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student9.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 27500, payment_method: 'GOVPAY', payment_status: 'PAID', payment_completed: true, payment_reference: `STU-PAY-20260804-${student9.id.substring(0, 8)}-2`, transaction_id: 'TXN-GOVPAY-300202', receipt_number: 'REC-20260804-0009', paid_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), remarks: 'Full payment confirmed' });
        // Student 10 – Management IS, PENDING_REVIEW, Female
        const student10 = yield Student_1.default.create({
            firstName: 'Anusha', lastName: 'Seneviratne',
            email: 'anusha.s@example.com', phone: '0721234567',
            dob: '2001-01-20', gender: 'Female',
            address: '8, Lotus Road, Colombo 01',
            course: mgtCourse.courseName, batch: mgtBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '200104512301', passport: null,
            status: 'Pending', application_status: 'PENDING_REVIEW',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000010',
            course_id: mgtCourse.id, batch_id: mgtBatch.id,
            admin_notes: 'Application under review by admin.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student10.id, identity_verified: false, documents_complete: true, eligibility_verified: false, course_available: true, checked_by: null, checked_at: null });
        // Student 11 – Maritime, CORRECTION_REQUESTED
        const student11 = yield Student_1.default.create({
            firstName: 'Harith', lastName: 'Mendis',
            email: 'harith.m@example.com', phone: '0711324568',
            dob: '1996-04-18', gender: 'Male',
            address: '21, Sea View Terrace, Dehiwala',
            course: maritimeCourse.courseName, batch: maritimeBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '963492460V', passport: null,
            status: 'Pending', application_status: 'CORRECTION_REQUESTED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000011',
            course_id: maritimeCourse.id, batch_id: maritimeBatch.id,
            admin_notes: 'Please re-upload a clearer NIC scan and updated passport-size photo.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student11.id, identity_verified: false, documents_complete: false, eligibility_verified: false, course_available: true, checked_by: 'Training Officer', checked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) });
        // Student 12 – OHS, APPROVED + 2 installments, Inst 1 PAID
        const student12 = yield Student_1.default.create({
            firstName: 'Malini', lastName: 'Gunawardena',
            email: 'malini.g@example.com', phone: '0779001122',
            dob: '1994-12-05', gender: 'Female',
            address: '4, Mahaweli Road, Peradeniya',
            course: ohsCourse.courseName, batch: ohsBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '944782340V', passport: null,
            status: 'Qualified', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PENDING',
            application_number: 'MPMA-APP-2026-000012',
            course_id: ohsCourse.id, batch_id: ohsBatch.id,
            payment_plan: 'INSTALLMENT_2', installment_breakdown: 'Installment 1: LKR 14,000 | Installment 2: LKR 13,500',
            approved_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            admin_notes: 'Installment plan approved. First installment received.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student12.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student12.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 14000, payment_method: 'GOVPAY', payment_status: 'PENDING', payment_completed: false, payment_reference: `STU-PAY-20260801-${student12.id.substring(0, 8)}-1`, transaction_id: 'TXN-GOVPAY-400101', paid_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), remarks: 'Installment 1 paid. Installment 2 pending.' });
        // Student 13 – Port Logistics, REJECTED
        const student13 = yield Student_1.default.create({
            firstName: 'Chamara', lastName: 'Bandara',
            email: 'chamara.b@example.com', phone: '0745566778',
            dob: '2002-03-14', gender: 'Male',
            address: '99, Negombo Road, Ja-Ela',
            course: logisticsCourse.courseName, batch: logisticsBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '200231423501', passport: null,
            status: 'Pending', application_status: 'REJECTED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000013',
            course_id: logisticsCourse.id, batch_id: logisticsBatch.id,
            admin_notes: 'Batch is full. Application rejected. Student may re-apply for the next intake.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student13.id, identity_verified: true, documents_complete: false, eligibility_verified: false, course_available: false, checked_by: 'Training Officer', checked_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) });
        // Student 14 – Technical, Non-Sri Lankan, APPROVED + PAID
        const student14 = yield Student_1.default.create({
            firstName: 'Ahmed', lastName: 'Al-Farsi',
            email: 'ahmed.alfarsi@example.com', phone: '0701234567',
            dob: '1993-08-07', gender: 'Male',
            address: 'Sheraton Residency, Colombo 03',
            course: techCourse.courseName, batch: techBatch.batchCode,
            studentCategory: 'Non-Sri Lankan Student', nic: null, passport: 'UAE-P-994421',
            nationality: 'Emirati', country_of_origin: 'United Arab Emirates',
            status: 'Registered', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000014',
            course_id: techCourse.id, batch_id: techBatch.id,
            approved_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-TECH-0062',
            admin_notes: 'International student. Passport verified. Payment in full.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student14.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student14.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 27500, payment_method: 'GOVPAY', payment_status: 'PAID', payment_completed: true, payment_reference: `STU-PAY-20260727-${student14.id.substring(0, 8)}-1`, transaction_id: 'TXN-GOVPAY-500303', receipt_number: 'REC-20260727-0014', paid_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), remarks: 'Full payment confirmed. International student.' });
        // Student 15 – Management IS, SLPA Employee, APPROVED + PAID
        const student15 = yield Student_1.default.create({
            firstName: 'Sachini', lastName: 'Liyanage',
            email: 'sachini.l@example.com', phone: '0763344556',
            dob: '1990-06-25', gender: 'Female',
            address: '16, Port Access Road, Colombo 15',
            course: mgtCourse.courseName, batch: mgtBatch.batchCode,
            studentCategory: 'SLPA Employee', nic: '906842310V', passport: null,
            status: 'Registered', application_status: 'APPROVED',
            enrollment_type: 'ADMIN_DIRECT', payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000015',
            course_id: mgtCourse.id, batch_id: mgtBatch.id,
            service_number: 'SLPA-EMP-006', epf_number: '66666', department: 'Finance', slpa_position: 'Finance Manager',
            approved_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-MGT-0008',
            admin_notes: 'SLPA nominated. Fully registered.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student15.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student15.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 27500, payment_method: 'GOVPAY', payment_status: 'PAID', payment_completed: true, payment_reference: `STU-PAY-20260722-${student15.id.substring(0, 8)}-1`, transaction_id: 'TXN-GOVPAY-600401', receipt_number: 'REC-20260722-0015', paid_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), remarks: 'SLPA nominee. Full payment.' });
        // Student 16 – Maritime, PENDING_REVIEW, Female
        const student16 = yield Student_1.default.create({
            firstName: 'Dilrukshi', lastName: 'Pathirana',
            email: 'dilrukshi.p@example.com', phone: '0712233445',
            dob: '1998-02-28', gender: 'Female',
            address: '27, Galle Face Green, Colombo 03',
            course: maritimeCourse.courseName, batch: maritimeBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '984231560V', passport: null,
            status: 'Pending', application_status: 'PENDING_REVIEW',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000016',
            course_id: maritimeCourse.id, batch_id: maritimeBatch.id,
            admin_notes: 'Pending review of A/L results.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student16.id, identity_verified: true, documents_complete: false, eligibility_verified: false, course_available: true, checked_by: null, checked_at: null });
        // Student 17 – OHS, APPROVED + full payment PAID
        const student17 = yield Student_1.default.create({
            firstName: 'Tharaka', lastName: 'Wijesinghe',
            email: 'tharaka.w@example.com', phone: '0754455667',
            dob: '1992-07-10', gender: 'Male',
            address: '5, Hospital Road, Kurunegala',
            course: ohsCourse.courseName, batch: ohsBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '923941230V', passport: null,
            status: 'Registered', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PAID',
            application_number: 'MPMA-APP-2026-000017',
            course_id: ohsCourse.id, batch_id: ohsBatch.id,
            approved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            registration_number: 'REG-2026-OHS-0022',
            admin_notes: 'All checks passed. Registered.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student17.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'System Administrator', checked_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student17.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 27500, payment_method: 'GOVPAY', payment_status: 'PAID', payment_completed: true, payment_reference: `STU-PAY-20260803-${student17.id.substring(0, 8)}-1`, transaction_id: 'TXN-GOVPAY-700202', receipt_number: 'REC-20260803-0017', paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), remarks: 'Full payment received.' });
        // Student 18 – Port Logistics, APPROVED + 2 installments pending
        const student18 = yield Student_1.default.create({
            firstName: 'Rashmini', lastName: 'Abeywickrama',
            email: 'rashmini.a@example.com', phone: '0769988771',
            dob: '2000-09-03', gender: 'Female',
            address: '18, Baseline Road, Colombo 09',
            course: logisticsCourse.courseName, batch: logisticsBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '200354823401', passport: null,
            status: 'Qualified', application_status: 'APPROVED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'PENDING',
            application_number: 'MPMA-APP-2026-000018',
            course_id: logisticsCourse.id, batch_id: logisticsBatch.id,
            payment_plan: 'INSTALLMENT_2', installment_breakdown: 'Installment 1: LKR 14,000 | Installment 2: LKR 13,500',
            approved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            admin_notes: '2-installment plan approved.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student18.id, identity_verified: true, documents_complete: true, eligibility_verified: true, course_available: true, checked_by: 'Training Officer', checked_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) });
        yield StudentPayment_1.default.create({ student_id: student18.id, course_batch_id: null, registration_fee: 2500, course_fee: 25000, full_amount_payable: 27500, amount_paid: 0, payment_method: 'GOVPAY', payment_status: 'PENDING', payment_completed: false, payment_reference: `STU-PAY-20260805-${student18.id.substring(0, 8)}-1` });
        // Student 19 – Technical, PENDING_REVIEW
        const student19 = yield Student_1.default.create({
            firstName: 'Gayan', lastName: 'Subasinghe',
            email: 'gayan.sub@example.com', phone: '0741122334',
            dob: '1999-04-17', gender: 'Male',
            address: '62, Kirula Road, Narahenpita',
            course: techCourse.courseName, batch: techBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '993481250V', passport: null,
            status: 'Pending', application_status: 'PENDING_REVIEW',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000019',
            course_id: techCourse.id, batch_id: techBatch.id,
            admin_notes: 'Awaiting technical qualification verification.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student19.id, identity_verified: true, documents_complete: false, eligibility_verified: false, course_available: true, checked_by: null, checked_at: null });
        // Student 20 – Management IS, CORRECTION_REQUESTED
        const student20 = yield Student_1.default.create({
            firstName: 'Thilini', lastName: 'Kodithuwakku',
            email: 'thilini.k@example.com', phone: '0778844556',
            dob: '1996-11-22', gender: 'Female',
            address: '34, Sri Jayawardenepura Road, Kotte',
            course: mgtCourse.courseName, batch: mgtBatch.batchCode,
            studentCategory: 'Sri Lankan Student', nic: '964831120V', passport: null,
            status: 'Pending', application_status: 'CORRECTION_REQUESTED',
            enrollment_type: 'STUDENT_SELF', payment_status_type: 'NOT_REQUESTED',
            application_number: 'MPMA-APP-2026-000020',
            course_id: mgtCourse.id, batch_id: mgtBatch.id,
            admin_notes: 'Please resubmit birth certificate and educational certificates.',
        });
        yield VerificationChecklist_1.default.create({ student_id: student20.id, identity_verified: false, documents_complete: false, eligibility_verified: false, course_available: true, checked_by: 'Training Officer', checked_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) });
        const extraStudents = [student6, student7, student8, student9, student10, student11, student12, student13, student14, student15, student16, student17, student18, student19, student20];
        console.log(`Extra students seeded: ${extraStudents.length}`);
        // 12. Seed Application Documents for ALL Students
        console.log('Seeding Application Documents...');
        const studentsList = [student1, student2, student3, student4, student5, ...extraStudents];
        const dummyPdfContent = Buffer.from('PDF_DUMMY_DATA_CONTENT_MPMA');
        const dummyImageContent = Buffer.from('IMAGE_DUMMY_DATA_CONTENT_MPMA');
        for (const student of studentsList) {
            yield ApplicationDocument_1.default.create({
                student_id: student.id,
                document_type: student.nic ? 'NIC' : 'Passport',
                file_name: student.nic ? 'nic_scan.pdf' : 'passport_scan.pdf',
                mime_type: 'application/pdf',
                file_data: dummyPdfContent,
                uploaded_by_admin: false,
            });
            yield ApplicationDocument_1.default.create({
                student_id: student.id,
                document_type: 'Certificate',
                file_name: 'education_certificate.pdf',
                mime_type: 'application/pdf',
                file_data: dummyPdfContent,
                uploaded_by_admin: false,
            });
            yield ApplicationDocument_1.default.create({
                student_id: student.id,
                document_type: 'Photo',
                file_name: 'profile_photo.jpg',
                mime_type: 'image/jpeg',
                file_data: dummyImageContent,
                uploaded_by_admin: false,
            });
        }
        console.log('Application Documents seeded.');
        console.log('--------------------------------------------------');
        console.log('ALL PARTS OF SEEDING COMPLETED SUCCESSFULLY!');
        console.log('--------------------------------------------------');
        console.log('Users Seeding Info:');
        console.log('  Admin Username:   admin@erp.com / admin123');
        console.log('  Officer Username: officer@erp.com / officer123');
        console.log('  Standard User:    user@erp.com / user123');
        console.log('--------------------------------------------------');
        process.exit(0);
    }
    catch (error) {
        console.error('Seeding process failed with error:', error);
        process.exit(1);
    }
});
seedAll();
