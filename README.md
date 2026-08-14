<div align="center">

<img src="logo.png" alt="MPMA Logo" width="120" />

# MPMA ERP System
### Mahapola Port & Maritime Academy — Enterprise Resource Planning


[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Sequelize-4479A1?style=flat&logo=mysql)](https://sequelize.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

> An integrated Enterprise Resource Planning framework designed to simplify bookings, optimize operations, and connect the MPMA maritime community.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [API Reference](#-api-reference)
- [Modules](#-modules)
- [User Roles](#-user-roles)

---

## 🌐 Overview

The **MPMA ERP System** is a full-stack web application built for the **Mahapola Ports & Maritime Academy (MPMA)** in Sri Lanka. It provides a centralized digital platform for managing:

- Student enrolment, registrations, and payment processing (via GovPay gateway)
- Course, batch, and lecturer management
- Facility bookings — transport, classrooms, and auditorium
- Document verification workflows for student applications
- Administrative dashboards with real-time metrics

---

## ✨ Features

### 🎓 Student Management
- Online student application and enrollment portal
- Document upload and NIC-based identity verification
- Verification checklist workflow for admin review
- Student profile management and status tracking

### 💳 Payment Management
- GovPay payment gateway integration for course fee collection
- Support for full payment and installment plans (2 or 3 installments)
- Automated installment reminder dispatching (Email / SMS / Official Notice)
- PDF receipt generation for paid transactions
- Payment status verification and audit trail

### 📚 Course & Batch Management
- Create and manage maritime courses with detailed fee structures
- Batch scheduling with lecturer assignments
- Course registration list and enrollment approval

### 🏛️ Facility Booking
- **Transport Booking** — Vehicle allocation and transport scheduling
- **Classroom Booking** — Classroom reservation with conflict detection
- **Auditorium Booking** — Event and ceremony booking management
- Maintenance scheduling across all facility types
- Booking calendar view and export reports

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- Admin and Regular User roles with granular permission handling
- Password change and account settings management

### 📊 Dashboard
- Real-time overview of key operational metrics
- Summary statistics for bookings, payments, and student activity

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 7 | Build tool & dev server |
| Tailwind CSS | 3 | Utility-first styling |
| React Router DOM | 7 | Client-side routing |
| Lucide React | 0.576 | Icon library |
| React Big Calendar | 1.19 | Booking calendar UI |
| React Toastify | 11 | Notification toasts |
| jsPDF + AutoTable | 4/5 | PDF receipt generation |
| Moment.js | 2.30 | Date formatting |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | LTS | Runtime environment |
| Express | 5 | HTTP server framework |
| TypeScript | 6 | Type safety |
| Sequelize | 6 | ORM for MySQL |
| MySQL2 | 3 | MySQL database driver |
| Nodemailer | 8 | Email sending |
| JWT | 9 | Authentication tokens |
| bcryptjs | 3 | Password hashing |
| Multer | 2 | File upload handling |
| PDFKit | 0.19 | Server-side PDF generation |
| dotenv | 17 | Environment variable management |

---

## 📁 Project Structure

```
mpma-erp-system/
├── README.md
├── frontend/                          # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                    # Static assets (images, logos)
│   │   ├── components/                # Shared UI components
│   │   │   ├── BankSettingsModal.tsx
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── data/                      # Static data files
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx    # Main app shell with sidebar
│   │   ├── modules/                   # Feature modules
│   │   │   ├── booking/
│   │   │   │   ├── components/        # BookingCalendar, ReportExportModal
│   │   │   │   └── pages/             # AuditoriumBooking, ClassroomBooking,
│   │   │   │                          #   TransportBooking, ManageVehicles,
│   │   │   │                          #   ManageClassrooms, ManageMaintenance,
│   │   │   │                          #   NewBooking, EditBooking, ...
│   │   │   ├── courses/
│   │   │   │   ├── components/        # CourseReportModal
│   │   │   │   └── pages/             # ManageCourses, ManageBatches,
│   │   │   │                          #   ManageLecturers
│   │   │   └── students/
│   │   │       ├── components/
│   │   │       └── pages/             # StudentList, StudentPayment,
│   │   │                              #   StudentEnrollment, StudentProfile,
│   │   │                              #   ManageEnrollment, RegistrationList,
│   │   │                              #   VerificationDetail
│   │   ├── pages/                     # Top-level pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── utils/
│   │   │   └── PDFGenerator.ts        # PDF receipt & report generation
│   │   ├── App.tsx                    # App router & route definitions
│   │   ├── main.tsx
│   │   └── index.css
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                           # Express + TypeScript API
    ├── src/
    │   ├── config/
    │   │   ├── db.ts                  # Sequelize MySQL connection
    │   │   └── env.ts                 # dotenv loader
    │   ├── controllers/               # Route handler logic
    │   ├── middleware/
    │   │   └── auth.ts                # JWT authentication middleware
    │   ├── models/                    # Sequelize ORM models
    │   │   ├── User.ts
    │   │   ├── Student.ts
    │   │   ├── StudentPayment.ts
    │   │   ├── Course.ts
    │   │   ├── CourseBatch.ts
    │   │   ├── Lecturer.ts
    │   │   ├── Vehicle.ts
    │   │   ├── Classroom.ts
    │   │   ├── Maintenance.ts
    │   │   ├── BankBranch.ts
    │   │   ├── ApplicationDocument.ts
    │   │   ├── VerificationChecklist.ts
    │   │   └── associations.ts        # Model relationship definitions
    │   ├── routes/                    # Express route definitions (16 route files)
    │   ├── scripts/                   # Database seed scripts
    │   ├── services/                  # Business logic services
    │   ├── utils/                     # Helper utilities
    │   └── server.ts                  # Entry point
    ├── migrations/                    # Database migration files
    ├── .env                           # Environment variables (not committed)
    ├── tsconfig.json
    └── package.json
```

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **MySQL** 8.0 or later — [Download](https://dev.mysql.com/downloads/)
- **npm** v9 or later (comes with Node.js)
- **Git** — [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mpma-erp-system.git
cd mpma-erp-system
```

### 2. Set Up the Database

Create a MySQL database:

```sql
CREATE DATABASE mpma_erp;
```

### 3. Configure Backend Environment

```bash
cd backend
# Create your .env file (see Environment Variables section below)
```

### 4. Install Backend Dependencies & Build

```bash
cd backend
npm install
npm run build        # Compiles TypeScript → dist/
```

### 5. Seed the Database *(Optional)*

```bash
npm run seed:all     # Seeds courses, batches, lecturers, and bank branches
```

### 6. Start the Backend Server

```bash
# Production
npm start            # Runs compiled dist/server.js on port 5001

# Development (hot-reload)
npm run dev          # Uses nodemon + ts-node
```

### 7. Install Frontend Dependencies & Start

```bash
cd ../frontend
npm install
npm run dev          # Starts Vite dev server at http://localhost:5173
```

### 8. Open in Browser

Navigate to **http://localhost:5173** and sign in with your admin credentials.

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# ─── Database ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mpma_erp

# ─── Server ────────────────────────────────────────
PORT=5001
NODE_ENV=development

# ─── Authentication ────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# ─── Email (Nodemailer) ────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ─── GovPay Gateway ────────────────────────────────
GOVPAY_MERCHANT_ID=your_merchant_id
GOVPAY_API_KEY=your_govpay_api_key
GOVPAY_BASE_URL=https://api.govpay.lk
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

## 📜 Available Scripts

### Backend (`/backend`)

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start with nodemon + ts-node (hot reload) |
| Build | `npm run build` | Compile TypeScript to `dist/` |
| Production | `npm start` | Run compiled `dist/server.js` |
| Seed All | `npm run seed:all` | Run all seed scripts |
| Seed Courses | `npm run seed:courses` | Seed MPMA course catalog |
| Seed Course Data | `npm run seed:course-data` | Seed batches and lecturers |

### Frontend (`/frontend`)

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start Vite dev server on :5173 |
| Build | `npm run build` | Type-check + production build to `dist/` |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | Run ESLint across all `.ts` / `.tsx` files |

---

## 🔌 API Reference

All endpoints are prefixed with `http://localhost:5001`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `POST` | `/api/auth/change-password` | Change authenticated user's password |

### Students
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | List all students |
| `GET` | `/api/students/:id` | Get student by ID |
| `POST` | `/api/students` | Create new student |
| `PUT` | `/api/students/:id` | Update student |
| `DELETE` | `/api/students/:id` | Delete student |
| `GET` | `/api/students/application/:id` | Get application details for verification |

### Student Payments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student-payments` | List all payment records |
| `POST` | `/api/student-payments/govpay/initiate` | Initiate a GovPay transaction |
| `GET` | `/api/student-payments/verify/:ref` | Verify payment status by reference |
| `POST` | `/api/student-payments/send-reminder` | Dispatch an installment reminder |

### Courses & Batches
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/courses` | List all courses |
| `POST` | `/api/courses` | Create a new course |
| `PUT` | `/api/courses/:id` | Update a course |
| `DELETE` | `/api/courses/:id` | Delete a course |
| `GET` | `/api/batches` | List all batches |
| `POST` | `/api/batches` | Create a batch |
| `GET` | `/api/lecturers` | List all lecturers |
| `POST` | `/api/lecturers` | Create a lecturer |
| `PUT` | `/api/lecturers/:id` | Update a lecturer |

### Facility Bookings
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transport-bookings` | List all transport bookings |
| `POST` | `/api/transport-bookings` | Create a transport booking |
| `PUT` | `/api/transport-bookings/:id` | Update a transport booking |
| `GET` | `/api/classroom-bookings` | List all classroom bookings |
| `POST` | `/api/classroom-bookings` | Create a classroom booking |
| `GET` | `/api/auditorium-bookings` | List all auditorium bookings |
| `POST` | `/api/auditorium-bookings` | Create an auditorium booking |

### Resources & Maintenance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all vehicles |
| `POST` | `/api/vehicles` | Add a vehicle |
| `GET` | `/api/classrooms` | List all classrooms |
| `POST` | `/api/classrooms` | Add a classroom |
| `GET` | `/api/maintenances` | List all maintenance records |
| `POST` | `/api/maintenances` | Log a maintenance entry |
| `GET` | `/api/banks` | List all bank branches (715 records) |

### Public Routes *(No Authentication Required)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/courses` | List published courses for applicants |
| `POST` | `/api/public/apply` | Submit a new student application |
| `GET` | `/api/public/application/:id` | Check application status |

---

## 🧩 Modules

### 🎓 Students Module
| Page | Description |
|---|---|
| **StudentList** | Searchable, filterable table of all enrolled students with PDF export |
| **StudentEnrollment** | Multi-step enrollment form with NIC parsing, fee calculation, and installment plan selection |
| **StudentProfile** | Full profile view with document management and status |
| **ManageEnrollment** | Admin approval workflow for pending enrollments |
| **RegistrationList** | View all course registrations across batches |
| **StudentPayment** | Payment ledger with GovPay integration, installment tracking, receipt downloads, and automated reminder system |
| **VerificationDetail** | Document verification checklist for admin/staff |

### 📚 Courses Module
| Page | Description |
|---|---|
| **ManageCourses** | CRUD for maritime courses including fee structure and status management |
| **ManageBatches** | Batch scheduling linked to courses with date and capacity management |
| **ManageLecturers** | Lecturer registry with NIC-based profile, status, and course assignments |

### 🏛️ Booking Module
| Page | Description |
|---|---|
| **TransportBooking** | Fleet vehicle booking management and approval |
| **ClassroomBooking** | Classroom reservation with availability checking |
| **AuditoriumBooking** | Auditorium event and ceremony bookings |
| **ManageVehicles** | Vehicle fleet registry (type, capacity, AC/Non-AC) |
| **ManageClassrooms** | Classroom registry with capacity and facilities |
| **ManageMaintenance** | Maintenance scheduling across General, Transport, Classroom, and Auditorium facility types |
| **BookingCalendar** | Unified calendar view of all bookings across facility types |
| **ReportExportModal** | Export booking reports to PDF or Excel |

---

## 👥 User Roles

| Role | Access Level |
|---|---|
| **Administrator** | Full system access — manage all modules, approve enrollments, verify documents, manage users and system settings |
| **Regular User** | Restricted access — create and view bookings, view student records; limited to operational tasks |

Roles are set at login, stored in `localStorage` as `userRole`, and enforced on both the **frontend** (route guards and UI restrictions) and **backend** (JWT middleware role checks).

---

<div align="center">

**MPMA ERP System** · Mahapola Port & Maritime Academy · Sri Lanka

*Built for maritime education excellence*

</div>
