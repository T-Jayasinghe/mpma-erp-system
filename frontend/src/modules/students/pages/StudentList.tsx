import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { fetchApi } from "../../../utils/api";
import { generateStudentProfilePdf } from "../../../utils/PDFGenerator";
import ReceiptModal from "../components/ReceiptModal";
import {
  Users,
  Search,
  Eye,
  Edit3,
  CreditCard,
  ReceiptText,
  GraduationCap,
  UserCheck,
  Calendar,
  FileDown,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Filter,
  Download,
  Paperclip,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import type { PaymentStatus, StudentRecord } from "../types/student";
import {
  formatStudentId,
  getNicOrPassport,
  getStudentFullName,
} from "../types/student";

const API_BASE_URL = "http://localhost:5001/api";

const categoryOptions = [
  "All",
  "SLPA Employee",
  "Sri Lankan Student",
  "Non-Sri Lankan Student",
];
const paymentStatusOptions = ["All", "Pending", "Paid", "Failed", "Cancelled", "Refunded"];
const registrationStatusOptions = ["All", "Pending Payment", "Registered", "Cancelled"];

const StudentStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "Pending Payment": "bg-amber-100 text-amber-700 border-amber-200",
    Registered: "bg-blue-100 text-blue-700 border-blue-200",
    Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
        styles[status] || styles["Pending Payment"]
      }`}
    >
      {status}
    </span>
  );
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus | "NONE" }) => {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
    REFUNDED: "bg-purple-100 text-purple-700 border-purple-200",
    NONE: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const label = status === "NONE" ? "No Payment" : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
        styles[status] || styles.NONE
      }`}
    >
      {label}
    </span>
  );
};

const getRegistrationStatus = (student: StudentRecord) => {
  if (student.registrationStatus) return student.registrationStatus;
  if (student.latestPayment?.payment_status === "CANCELLED" || student.status === "Dropout") {
    return "Cancelled";
  }
  if (student.status === "Registered") return "Registered";
  return "Pending Payment";
};

const buildQueryString = (filters: StudentFilters) => {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category !== "All") params.set("category", filters.category);
  if (filters.course) params.set("course_id", filters.course);
  if (filters.batch) params.set("batch_id", filters.batch);
  if (filters.paymentStatus !== "All") params.set("payment_status", filters.paymentStatus.toUpperCase());
  if (filters.registrationStatus !== "All") params.set("registration_status", filters.registrationStatus);
  if (filters.fromDate) params.set("from_date", filters.fromDate);
  if (filters.toDate) params.set("to_date", filters.toDate);
  return params.toString();
};

interface StudentFilters {
  search: string;
  category: string;
  paymentStatus: string;
  registrationStatus: string;
  course: string;
  batch: string;
  fromDate: string;
  toDate: string;
}

const emptyFilters: StudentFilters = {
  search: "",
  category: "All",
  paymentStatus: "All",
  registrationStatus: "All",
  course: "",
  batch: "",
  fromDate: "",
  toDate: "",
};

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StudentFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<StudentFilters>(emptyFilters);
  const [receiptPayment, setReceiptPayment] = useState<{
    payment: StudentRecord["latestPayment"];
    studentName: string;
  } | null>(null);

  // ── Document Viewer Modal State ──────────────────────────────────
  const [docModal, setDocModal] = useState<{
    studentId: string;
    studentName: string;
    documents: Array<{ id: number; document_type: string; file_name: string; mime_type: string }>;
    loading: boolean;
  } | null>(null);

  const openDocModal = async (student: StudentRecord, name: string) => {
    setDocModal({ studentId: student.id, studentName: name, documents: [], loading: true });
    try {
      const data = await fetchApi(`/students/application/${student.id}`);
      const docs: Array<{ id: number; document_type: string; file_name: string; mime_type: string }> =
        (data.student?.documents ?? []).map((d: any) => ({
          id: d.id,
          document_type: d.document_type,
          file_name: d.file_name,
          mime_type: d.mime_type,
        }));
      setDocModal({ studentId: student.id, studentName: name, documents: docs, loading: false });
    } catch {
      toast.error("Failed to load documents");
      setDocModal(null);
    }
  };

  const getDocumentUrl = (studentId: string, docId: number, download = false) =>
    `http://localhost:5001/api/students/application/${studentId}/documents/${docId}${
      download ? "?download=1" : ""
    }`;

  useEffect(() => {
    loadStudents(emptyFilters);
  }, []);

  const courseOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.course).filter(Boolean))).sort(),
    [students]
  );
  const batchOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).sort(),
    [students]
  );

  const loadStudents = async (nextFilters: StudentFilters) => {
    setLoading(true);
    try {
      const query = buildQueryString(nextFilters);
      const data = await fetchApi(`/students${query ? `?${query}` : ""}`);
      setStudents(data);
      setAppliedFilters(nextFilters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load students";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadStudents(filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    loadStudents(emptyFilters);
  };

  const downloadPdfReport = async () => {
    setReportLoading(true);
    try {
      const query = buildQueryString(appliedFilters);
      const response = await fetch(`${API_BASE_URL}/students/report/pdf${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Failed to generate PDF report");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `student-management-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Student PDF report downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF report";
      toast.error(message);
    } finally {
      setReportLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Student ID",
      "Full Name",
      "Student Category",
      "NIC / Passport",
      "Course",
      "Batch",
      "Payment Status",
      "Registration Status",
      "Registered Date",
    ];
    const rows = students.map((student) => [
      student.id,
      getStudentFullName(student),
      student.studentCategory || "",
      getNicOrPassport(student),
      student.course,
      student.batch,
      student.latestPayment?.payment_status || "No Payment",
      getRegistrationStatus(student),
      student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString("en-LK") : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: students.length,
    pending: students.filter((s) => getRegistrationStatus(s) === "Pending Payment").length,
    registered: students.filter((s) => getRegistrationStatus(s) === "Registered").length,
    paid: students.filter((s) => s.latestPayment?.payment_status === "PAID").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Student List</h1>
            </div>
            <p className="text-slate-500 font-medium">
              Search, filter, report, and manage student registration records.
            </p>
          </div>
          <button
            onClick={() => navigate("/student-management/enrollment/new")}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all font-semibold"
          >
            <GraduationCap className="w-5 h-5" />
            New Enrollment
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Students</p>
              <p className="text-2xl font-black text-slate-800 leading-tight">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Payment</p>
              <p className="text-2xl font-black text-amber-600 leading-tight">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered</p>
              <p className="text-2xl font-black text-blue-600 leading-tight">{stats.registered}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid</p>
              <p className="text-2xl font-black text-teal-600 leading-tight">{stats.paid}</p>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-800">Filter & Reports</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Name, NIC, passport, payment reference..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Student Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {paymentStatusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Registration Status</label>
                <select
                  value={filters.registrationStatus}
                  onChange={(e) => setFilters({ ...filters, registrationStatus: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  {registrationStatusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Course</label>
                <select
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">All Courses</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Batch</label>
                <select
                  value={filters.batch}
                  onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">All Batches</option>
                  {batchOptions.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
              <button
                onClick={clearFilters}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </button>
              <button
                onClick={downloadPdfReport}
                disabled={reportLoading || loading}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60"
              >
                {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                Generate PDF
              </button>
              <button
                onClick={exportCsv}
                disabled={loading || students.length === 0}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Student Records</h2>
              <div className="text-sm text-slate-500">
                Showing <span className="font-bold text-slate-800">{students.length}</span> filtered records
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
              <button
                onClick={() => setShowFilters((value) => !value)}
                title={showFilters ? "Hide Filters" : "Filter & Reports"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${
                  showFilters
                    ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-600"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1320px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-4">Student ID</th>
                  <th className="px-4 py-4">Full Name</th>
                  <th className="px-4 py-4">Student Category</th>
                  <th className="px-4 py-4">NIC / Passport</th>
                  <th className="px-4 py-4">Course</th>
                  <th className="px-4 py-4">Batch</th>
                  <th className="px-4 py-4 text-center">Payment Status</th>
                  <th className="px-4 py-4 text-center">Registration Status</th>
                  <th className="px-4 py-4">Registered Date</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
                      Loading students...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      No students found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const paymentStatus = (student.latestPayment?.payment_status || "NONE") as
                      | PaymentStatus
                      | "NONE";
                    const fullName = getStudentFullName(student);
                    const registrationStatus = getRegistrationStatus(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-slate-600" title={student.id}>
                            {formatStudentId(student.id)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-800">{fullName}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                          {student.studentCategory || "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          {getNicOrPassport(student)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                          {student.course}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-slate-400 uppercase">
                          {student.batch}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <PaymentStatusBadge status={paymentStatus} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <StudentStatusBadge status={registrationStatus} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {student.enrollmentDate
                              ? new Date(student.enrollmentDate).toLocaleDateString("en-LK")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="View"
                              onClick={() => navigate(`/student-management/students/${student.id}`)}
                              className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit"
                              onClick={() => navigate(`/student-management/students/${student.id}?edit=true`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              title="Payment"
                              onClick={() => {
                                const ref = student.latestPayment?.payment_reference;
                                navigate(
                                  ref
                                    ? `/student-management/payment?ref=${encodeURIComponent(ref)}`
                                    : "/student-management/payment"
                                );
                              }}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              title="Receipt"
                              disabled={student.latestPayment?.payment_status !== "PAID"}
                              onClick={() => {
                                if (student.latestPayment?.payment_status === "PAID") {
                                  setReceiptPayment({
                                    payment: student.latestPayment,
                                    studentName: fullName,
                                  });
                                }
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ReceiptText className="w-4 h-4" />
                            </button>
                            <button
                              title="Generate Student Profile PDF"
                              onClick={() =>
                                generateStudentProfilePdf({
                                  ...student,
                                  registrationStatus,
                                })
                              }
                              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              title="View Documents"
                              onClick={() => openDocModal(student, fullName)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {receiptPayment?.payment && (
        <ReceiptModal
          payment={receiptPayment.payment}
          studentName={receiptPayment.studentName}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* ═══ DOCUMENT VIEWER MODAL ═══ */}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Uploaded Documents</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {docModal.studentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {docModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" />
                  <p className="text-sm font-medium">Loading documents...</p>
                </div>
              ) : docModal.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <FileText className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">No documents uploaded</p>
                  <p className="text-xs text-slate-400 mt-1">This student has not submitted any documents yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docModal.documents.map((doc) => {
                    const isImage = doc.mime_type?.startsWith("image/");
                    const isPdf = doc.mime_type === "application/pdf";
                    const viewUrl = getDocumentUrl(docModal.studentId, doc.id);
                    const downloadUrl = getDocumentUrl(docModal.studentId, doc.id, true);

                    return (
                      <div
                        key={doc.id}
                        className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 hover:border-purple-200 transition-colors"
                      >
                        {/* Doc header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${isImage ? "bg-blue-50 text-blue-600" : isPdf ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{doc.document_type}</p>
                              <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View in new tab"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a
                              href={downloadUrl}
                              download={doc.file_name}
                              title="Download"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        {/* Preview */}
                        {isImage && (
                          <div className="p-3 flex justify-center bg-slate-50">
                            <img
                              src={viewUrl}
                              alt={doc.document_type}
                              className="max-h-48 rounded-lg object-contain border border-slate-200 shadow-sm"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                        {isPdf && (
                          <div className="p-3 bg-slate-50">
                            <iframe
                              src={viewUrl}
                              title={doc.file_name}
                              className="w-full h-48 rounded-lg border border-slate-200"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {docModal.loading ? "Loading..." : `${docModal.documents.length} document${docModal.documents.length !== 1 ? "s" : ""} found`}
              </span>
              <button
                onClick={() => setDocModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
