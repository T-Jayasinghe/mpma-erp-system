import { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";



const VerificationBadge = ({ status, onClick }: { status?: string; onClick?: () => void }) => {
  if (status === "APPROVED") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 uppercase tracking-wider inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Verified
      </span>
    );
  }
  if (status === "CORRECTION_REQUESTED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider hover:bg-orange-100 transition-all inline-flex items-center gap-1 cursor-pointer"
        title="Click to review requested correction"
      >
        <AlertCircle className="w-3 h-3 text-orange-600" />
        Correction Needed
      </button>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider inline-flex items-center gap-1">
        Rejected
      </span>
    );
  }
  // PENDING_REVIEW or default pending
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300/80 uppercase tracking-wider hover:bg-amber-100 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
      title="Click to review and verify document application"
    >
      <ShieldCheck className="w-3 h-3 text-amber-600" />
      Pending Verification
    </button>
  );
};

const STAT_CARD_STYLES: Record<string, { bg: string; border: string; text: string; activeBorder: string }> = {
  Total: { bg: "bg-indigo-50/50", border: "border-indigo-100", text: "text-indigo-700", activeBorder: "border-indigo-400" },
  Pending: { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-700", activeBorder: "border-amber-400" },
  Verified: { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700", activeBorder: "border-emerald-400" },
  Enrolled: { bg: "bg-blue-50/50", border: "border-blue-100", text: "text-blue-700", activeBorder: "border-blue-400" },
  Registered: { bg: "bg-indigo-50/50", border: "border-indigo-100", text: "text-indigo-700", activeBorder: "border-indigo-400" },
  Graduated: { bg: "bg-sky-50/50", border: "border-sky-100", text: "text-sky-700", activeBorder: "border-sky-400" },
};

export default function ManageEnrollment() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/students");
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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
    
    let statusMatch = true;
    if (filterStatus === "Pending Verification") {
      statusMatch = s.application_status === "PENDING_REVIEW" || !s.application_status;
    } else if (filterStatus === "Verified") {
      statusMatch = s.application_status === "APPROVED";
    } else if (filterStatus !== "All") {
      statusMatch = s.status === filterStatus;
    }

    return (nameMatch || emailMatch || courseMatch) && statusMatch;
  });

  const counts = {
    total: students.length,
    pending: students.filter((s) => s.application_status === "PENDING_REVIEW" || !s.application_status).length,
    verified: students.filter((s) => s.application_status === "APPROVED").length,
    enrolled: students.filter((s) => s.status === "Enrolled").length,
    registered: students.filter((s) => s.status === "Registered").length,
    graduated: students.filter((s) => s.status === "Graduated").length,
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
                View all enrolled students, verification statuses, and student records in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/student-management/enrollment/new")}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-brand-500/20 transition-all font-semibold text-xs sm:text-sm cursor-pointer"
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
            { label: "Total Students", count: counts.total, key: "Total" },
            { label: "Pending Verification", count: counts.pending, key: "Pending" },
            { label: "Verified", count: counts.verified, key: "Verified" },
            { label: "Enrolled", count: counts.enrolled, key: "Enrolled" },
            { label: "Registered", count: counts.registered, key: "Registered" },
            { label: "Graduated", count: counts.graduated, key: "Graduated" },
          ].map(({ label, count, key }) => {
            const style = STAT_CARD_STYLES[key] || STAT_CARD_STYLES.Total;
            const filterKey = key === "Total" ? "All" : key === "Pending" ? "Pending Verification" : key;
            const isSelected = filterStatus === filterKey;

            return (
              <div
                key={key}
                onClick={() => setFilterStatus(filterKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${style.bg} ${
                  isSelected ? `${style.activeBorder} shadow-sm ring-1 ring-brand-500/20` : style.border
                }`}
              >
                <div className={`text-2xl font-black ${style.text}`}>{count}</div>
                <div className="text-xs font-bold text-slate-600 mt-0.5 truncate">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Directory Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-600" />
                Enrolled Students List
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                {filteredStudents.length} Records
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-brand-600 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filterStatus === "All" ? "Filter Status" : filterStatus}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[170px] py-1.5">
                    {["All", "Pending Verification", "Verified", "Applied", "Enrolled", "Registered", "Graduated", "Dropout"].map((s) => (
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
                  <th className="px-5 py-3.5 text-center">Verification Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">Loading enrollment records...</td></tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
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
                      {/* Verification Status Column */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <VerificationBadge
                          status={student.application_status}
                          onClick={() => navigate(`/student-management/verification/${student.id}`)}
                        />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {student.application_status !== "APPROVED" && (
                            <button
                              onClick={() => navigate(`/student-management/verification/${student.id}`)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Verify Documents"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/student-management/students/${student.id}`)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
