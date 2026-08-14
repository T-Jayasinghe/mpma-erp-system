import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { 
  Users, 
  CalendarCheck, 
  MonitorPlay,
  Bus,
  ArrowRight,
  Clock,
  PieChart,
  Calendar,
  AlertCircle,
  GraduationCap,
  BookOpen,
  CreditCard,
  Wrench,
  Sparkles,
  Layers,
  Activity,
  FileText,
  School,
  ArrowUpRight,
  CheckCircle,
  Clock3,
  XCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { fetchApi } from "../utils/api";
import { Link } from "react-router-dom";

interface ActivityItem {
  id?: string | number;
  type?: string;
  title?: string;
  subtitle?: string;
  time?: string;
  status?: string;
  [key: string]: unknown;
}

interface StudentItem {
  id: string;
  name: string;
  course: string;
  batch: string;
  appNum: string;
  status: string;
  paymentStatus?: string;
}

interface SummaryData {
  totals?: {
    auditorium?: number;
    classroom?: number;
    transport?: number;
    overall?: number;
    students?: number;
    pendingApps?: number;
    approvedApps?: number;
    registeredStudents?: number;
    courses?: number;
    batches?: number;
    lecturers?: number;
    maintenance?: number;
    totalRevenue?: number;
    pendingPayments?: number;
    classroomCount?: number;
    vehicleCount?: number;
  };
  todayActivities?: ActivityItem[];
  recentStudents?: StudentItem[];
}

const getGreetingText = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const getDateText = () => {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function Dashboard() {
  const [greeting] = useState(getGreetingText);
  const [dateStr] = useState(getDateText);
  const [activeTab, setActiveTab] = useState<"all" | "bookings" | "students" | "maintenance">("all");
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totals: {
      auditorium: 0,
      classroom: 0,
      transport: 0,
      overall: 0,
      students: 0,
      pendingApps: 0,
      approvedApps: 0,
      registeredStudents: 0,
      courses: 0,
      batches: 0,
      lecturers: 0,
      maintenance: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      classroomCount: 0,
      vehicleCount: 0,
    },
    todayActivities: [],
    recentStudents: [],
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = currentUser.name || "Administrator";
  const userRole = currentUser.role || localStorage.getItem("userRole") || "user";

  useEffect(() => {
    let isMounted = true;
    fetchApi("/dashboard/stats")
      .then((res) => {
        const data = res as SummaryData;
        if (isMounted && data) {
          setSummaryData(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard stats", error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const totals = summaryData?.totals || {};
  const totalRevenue = totals.totalRevenue ?? 0;
  const classroomCount = totals.classroomCount ?? 15;
  const vehicleCount = totals.vehicleCount ?? 4;
  const studentsCount = totals.students ?? 0;
  const pendingApps = totals.pendingApps ?? 0;
  const approvedApps = totals.approvedApps ?? 0;
  const coursesCount = totals.courses ?? 0;
  const batchesCount = totals.batches ?? 0;
  const lecturersCount = totals.lecturers ?? 0;
  const overallBookings = totals.overall ?? 0;
  const classroomBookings = totals.classroom ?? 0;
  const transportBookings = totals.transport ?? 0;
  const auditoriumBookings = totals.auditorium ?? 0;
  const pendingPayments = totals.pendingPayments ?? 0;

  const activitiesList = summaryData?.todayActivities || [];
  const recentStudentsList = summaryData?.recentStudents || [];

  // Filter activities based on tab
  const filteredActivities = activitiesList.filter((act) => {
    if (activeTab === "all") return true;
    if (activeTab === "bookings") return ["Classroom", "Transport", "Auditorium"].includes(act.type || "");
    if (activeTab === "students") return act.type === "Enrollment";
    if (activeTab === "maintenance") return act.type === "Maintenance";
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "Accepted":
      case "Active":
      case "PAID":
      case "Registered":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            {status}
          </span>
        );
      case "PENDING_REVIEW":
      case "Pending":
      case "Scheduled":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
            <Clock3 className="w-3 h-3 text-amber-500" />
            {status}
          </span>
        );
      case "CORRECTION_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
            <HelpCircle className="w-3 h-3 text-blue-500" />
            Correction Req.
          </span>
        );
      case "REJECTED":
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 shadow-2xs">
            <XCircle className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            {status || "Active"}
          </span>
        );
    }
  };

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case "Enrollment":
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case "Classroom":
        return <School className="w-4 h-4 text-emerald-600" />;
      case "Transport":
        return <Bus className="w-4 h-4 text-amber-600" />;
      case "Auditorium":
        return <MonitorPlay className="w-4 h-4 text-blue-600" />;
      case "Maintenance":
        return <Wrench className="w-4 h-4 text-rose-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const academicStreams = [
    { name: "Maritime & Seamanship", code: "MAR-SEA", icon: GraduationCap, color: "from-blue-500 to-cyan-500" },
    { name: "Occupational Health & Safety", code: "OHS", icon: ShieldCheck, color: "from-emerald-500 to-teal-500" },
    { name: "Port Operation & Logistics", code: "PORT-LOG", icon: Layers, color: "from-amber-500 to-orange-500" },
    { name: "Technical Engineering", code: "TECH", icon: Wrench, color: "from-purple-500 to-indigo-500" },
    { name: "Management & IS", code: "MGT-IS", icon: BookOpen, color: "from-rose-500 to-pink-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">

        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-brand-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ERP System Online • MPMA Academy
              </div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-sky-200 to-indigo-200">{userName}</span>
              </h1>
              <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                {dateStr} • Real-time Operations & Resource Management Center
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Access Role</p>
                  <p className="text-sm font-bold capitalize text-white">{userRole}</p>
                </div>
              </div>

              <Link
                to="/student-management/enrollment"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <GraduationCap className="w-4 h-4" />
                Review Applications
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Card 1: Student Applications */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  Applications
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Student Applications</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                  {studentsCount}
                </h3>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                  {pendingApps} Pending
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  {approvedApps} Approved
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Academic & Batches */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-100 transition-colors"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  Academics
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Courses & Batches</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                  {coursesCount} <span className="text-lg font-bold text-slate-400">/ {batchesCount} Batches</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                <span className="text-emerald-700 font-bold">
                  {lecturersCount} Lecturers Assigned
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Facilities & Resource Bookings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-sky-100 transition-colors"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform shadow-xs">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">
                  Resource Bookings
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Bookings</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                  {overallBookings}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
                <span className="text-blue-600">Class: {classroomBookings}</span>
                <span>•</span>
                <span className="text-amber-600">Bus: {transportBookings}</span>
                <span>•</span>
                <span className="text-emerald-600">Aud: {auditoriumBookings}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Financial & Revenue */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-100 transition-colors"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform shadow-xs">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  Revenue
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Payments Collected</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                  LKR {totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                  {pendingPayments} Payment Requests Pending
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Central Operations Hub & Side Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column (8 cols): Activity Stream & Recent Applications */}
          <div className="lg:col-span-8 space-y-8">

            {/* Combined Activity Feed */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Operational Activities Feed</h2>
                    <p className="text-xs font-medium text-slate-400">Live stream of system events, bookings & enrollments</p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 self-start sm:self-auto">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeTab === "bookings" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeTab === "students" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab("maintenance")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeTab === "maintenance" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-brand-200 hover:bg-white transition-all flex items-center justify-between gap-4 group shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          {getCategoryIcon(act.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {act.type}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {act.time}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-brand-600 transition-colors mt-0.5">
                            {act.title}
                          </h4>
                          {act.subtitle && (
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                              {act.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">{getStatusBadge(act.status)}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-70">
                    <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 font-bold text-sm">No activity items matching tab filter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Student Applications Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Recent Student Applications</h2>
                    <p className="text-xs font-medium text-slate-400">Applications requiring administrative review & verification</p>
                  </div>
                </div>

                <Link
                  to="/student-management/enrollment"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  View All Applications
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="py-3 px-4 rounded-l-xl">App Ref</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Applied Course</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {recentStudentsList.length > 0 ? (
                      recentStudentsList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-xs text-brand-600">
                            {st.appNum}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {st.name}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600 text-xs">
                            {st.course}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(st.status)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/student-management/verification/${st.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Review
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                          No student applications submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Resource Occupancy & Performance Sidebar */}
          <div className="lg:col-span-4 space-y-8">

            {/* Resource Capacity Tracker */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-sky-50 rounded-2xl text-sky-600">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Facility Availability</h2>
                  <p className="text-xs text-slate-400 font-medium">Real-time resource capacity</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Classrooms */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <School className="w-4 h-4 text-emerald-500" />
                      Classrooms ({classroomCount})
                    </span>
                    <span className="text-emerald-600">100% Operational</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>

                {/* Transport Fleet */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-amber-500" />
                      Transport Fleet ({vehicleCount} Buses)
                    </span>
                    <span className="text-amber-600">Active</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-4/5"></div>
                  </div>
                </div>

                {/* Main Auditorium */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <MonitorPlay className="w-4 h-4 text-blue-500" />
                      Main Auditorium
                    </span>
                    <span className="text-blue-600">Available</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Streams Quick Chips */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Academic Streams</h2>
                  <p className="text-xs text-slate-400 font-medium">MPMA Maritime Disciplines</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {academicStreams.map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 border border-slate-100/80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${st.color} text-white shadow-2xs shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{st.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{st.code}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                        5 Batches
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Module Navigator Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            Executive Module Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <Link
              to="/student-management/enrollment"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                    Student Enrollment & Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Review incoming student applications, check eligibility & assign registration numbers.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
            </Link>

            <Link
              to="/classroom-booking"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-emerald-600 transition-colors">
                    Classroom Booking
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Schedule lecture halls, manage time slots and review room allocations.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
            </Link>

            <Link
              to="/transport-booking"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-600 transition-colors">
                    Transport & Fleet
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Reserve campus buses, manage driver assignments & trip schedules.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors shrink-0" />
            </Link>

            <Link
              to="/auditorium-booking"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                    Auditorium Reservation
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Book the main academy auditorium for ceremonies & guest lectures.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </Link>

            <Link
              to="/manage-courses"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-purple-600 transition-colors">
                    Course & Batch Management
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Configure curriculum details, batch schedules and lecturer allocations.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors shrink-0" />
            </Link>

            <Link
              to="/manage-users"
              className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all group flex items-start justify-between relative overflow-hidden"
            >
              <div className="space-y-3 relative z-10">
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors w-fit shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base group-hover:text-rose-600 transition-colors">
                    User Management
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Manage administrative users, access privileges and officer roles.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-rose-600 transition-colors shrink-0" />
            </Link>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}