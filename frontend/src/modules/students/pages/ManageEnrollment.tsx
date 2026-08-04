import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Plus,
  Trash2,
  Eye,
  GraduationCap,
  Search,
  User,
  Mail,
  Filter,
  ClipboardList,
  Calendar,
  ChevronDown
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Applied: { label: "Applied", className: "bg-violet-50 text-violet-700 border-violet-200/80" },
  Pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200/80" },
  Enrolled: { label: "Enrolled", className: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
  Qualified: { label: "Qualified", className: "bg-sky-50 text-sky-700 border-sky-200/80" },
  Registered: { label: "Registered", className: "bg-blue-50 text-blue-700 border-blue-200/80" },
  Graduated: { label: "Graduated", className: "bg-indigo-50 text-indigo-700 border-indigo-200/80" },
  Dropout: { label: "Dropout", className: "bg-rose-50 text-rose-700 border-rose-200/80" },
};

const APP_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200/80" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
  REJECTED: { label: "Rejected", className: "bg-rose-50 text-rose-700 border-rose-200/80" },
  CORRECTION_REQUESTED: { label: "Correction Needed", className: "bg-orange-50 text-orange-700 border-orange-200/80" },
};

const StatusBadge = ({ status, type = "status" }: { status: string; type?: "status" | "app_status" }) => {
  const config =
    type === "app_status"
      ? APP_STATUS_CONFIG[status]
      : STATUS_CONFIG[status];
  const cfg = config || { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// Static styles map for stats cards to prevent Tailwind purge issues
const STAT_CARD_STYLES: Record<string, { bg: string; border: string; text: string; activeBorder: string }> = {
  Total: { bg: "bg-indigo-50/50", border: "border-indigo-100", text: "text-indigo-700", activeBorder: "border-indigo-400" },
  Applied: { bg: "bg-violet-50/50", border: "border-violet-100", text: "text-violet-700", activeBorder: "border-violet-400" },
  Enrolled: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", activeBorder: "border-emerald-400" },
  Registered: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-700", activeBorder: "border-blue-400" },
  Graduated: { bg: "bg-sky-50/50", border: "border-sky-100", text: "text-sky-700", activeBorder: "border-sky-400" },
  Dropout: { bg: "bg-rose-50/50", border: "border-rose-100", text: "text-rose-700", activeBorder: "border-rose-400" },
};

export default function ManageEnrollment() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/students");
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Remove enrollment for ${name}?`)) return;
    try {
      await fetchApi(`/students/${id}`, { method: "DELETE" });
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student removed successfully");
    } catch {
      toast.error("Failed to remove student");
    }
  };

  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query);
    const emailMatch = s.email?.toLowerCase().includes(query);
    const courseMatch = s.course?.toLowerCase().includes(query);
    const statusMatch = filterStatus === "All" || s.status === filterStatus;
    return (nameMatch || emailMatch || courseMatch) && statusMatch;
  });

  const counts = {
    total: students.length,
    applied: students.filter((s) => s.status === "Applied").length,
    enrolled: students.filter((s) => s.status === "Enrolled").length,
    registered: students.filter((s) => s.status === "Registered").length,
    graduated: students.filter((s) => s.status === "Graduated").length,
    dropout: students.filter((s) => s.status === "Dropout").length,
  };

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-5 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-indigo-600 text-white rounded-xl shadow-md shadow-brand-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Student Enrollment
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Manage all student applications, enrollment workflows, and student records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/student-management/enrollment/new")}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/20 transition-all font-semibold text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Enroll New Student
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", count: counts.total, key: "Total" },
            { label: "Applied", count: counts.applied, key: "Applied" },
            { label: "Enrolled", count: counts.enrolled, key: "Enrolled" },
            { label: "Registered", count: counts.registered, key: "Registered" },
            { label: "Graduated", count: counts.graduated, key: "Graduated" },
            { label: "Dropout", count: counts.dropout, key: "Dropout" },
          ].map(({ label, count, key }) => {
            const style = STAT_CARD_STYLES[key] || STAT_CARD_STYLES.Total;
            const isSelected = (filterStatus === "All" && key === "Total") || filterStatus === key;

            return (
              <div
                key={label}
                onClick={() => setFilterStatus(key === "Total" ? "All" : key)}
                className={`bg-white rounded-2xl border ${isSelected ? style.activeBorder + " ring-2 ring-indigo-500/10 shadow-md" : style.border} shadow-sm p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-200`}
              >
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className={`text-2xl font-black ${style.text} leading-none`}>{count}</p>
                  <span className={`text-[10px] font-semibold ${style.bg} ${style.text} px-2 py-0.5 rounded-full border ${style.border}`}>
                    {counts.total > 0 ? `${Math.round((count / counts.total) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Container Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-600" />
                Enrollment Directory
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {filteredStudents.length} Students
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                />
              </div>

              {/* Status Filter Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-brand-600 transition-all text-xs font-semibold shadow-sm"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filterStatus === "All" ? "Filter Status" : filterStatus}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px] py-1.5">
                    {["All", "Applied", "Pending", "Enrolled", "Qualified", "Registered", "Graduated", "Dropout"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setShowFilters(false); }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-50 transition-all ${filterStatus === s ? "font-bold text-brand-600 bg-brand-50/50" : "text-slate-700"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Course & Batch</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Enrollment Date</th>
                  <th className="px-5 py-3.5 text-center">Lifecycle Status</th>
                  <th className="px-5 py-3.5 text-center">App Review</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-medium">Loading enrollment records...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-slate-600 font-semibold text-sm">No student records found</p>
                        <p className="text-slate-400 text-xs max-w-sm">No applications matched your search or status filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-brand-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs uppercase shrink-0">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">{student.course}</div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{student.batch}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {student.studentCategory || "Standard"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString("en-LK") : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        {student.application_status ? (
                          <StatusBadge status={student.application_status} type="app_status" />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/student-management/students/${student.id}`)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredStudents.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing {filteredStudents.length} of {students.length} enrollment records</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

