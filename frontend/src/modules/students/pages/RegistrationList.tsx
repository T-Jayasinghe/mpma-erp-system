import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import {
  Award,
  Search,
  Calendar,
  Loader2,
  RefreshCw,
  Printer,
  CheckCircle2,
  GraduationCap,
  Filter,
  ChevronDown
} from "lucide-react";
import { fetchApi } from "../../../utils/api";

const generateRegistrationNumber = (index: number): string => {
  const year = new Date().getFullYear();
  const seq = String(index + 1).padStart(4, "0");
  return `MPMA-CERT-${year}-${seq}`;
};

export default function RegistrationList() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showBatchFilter, setShowBatchFilter] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCompletedBatchStudents();
  }, []);

  const loadCompletedBatchStudents = async () => {
    setLoading(true);
    try {
      const [studentsData, batchesData] = await Promise.all([
        fetchApi("/students"),
        fetchApi("/batches").catch(() => []),
      ]);

      const allBatches = Array.isArray(batchesData) ? batchesData : [];

      const allStudents = Array.isArray(studentsData) ? studentsData : [];
      // Filter students in completed batches or who are registered/graduated/paid
      const completedBatchIds = allBatches
        .filter((b: any) => b.status === "Completed" || b.isCompleted)
        .map((b: any) => b.id || b.batch_id || b.batchName || b.name);

      const eligible = allStudents.filter((s: any) => {
        const isPaidOrReg = s.latestPayment?.payment_status === "PAID" || s.status === "Registered" || s.status === "Graduated" || s.status === "Enrolled";
        const isInCompletedBatch = completedBatchIds.some((id: string) => 
          String(id).toLowerCase() === String(s.batchId || s.batch).toLowerCase()
        );
        return isPaidOrReg || isInCompletedBatch;
      });

      setStudents(eligible);
    } catch {
      toast.error("Failed to load certificate records");
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
    const emailMatch = s.email?.toLowerCase().includes(q);
    const courseMatch = s.course?.toLowerCase().includes(q);
    const batchMatch = batchFilter === "All" || s.batch === batchFilter;
    return (nameMatch || emailMatch || courseMatch) && batchMatch;
  });

  const uniqueBatches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean)));

  const openCertificate = (student: any, index: number) => {
    setSelectedStudent({
      ...student,
      registration_number: student.registration_number || generateRegistrationNumber(index),
    });
    setShowCertificate(true);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Course Completion Certificate - ${selectedStudent?.firstName} ${selectedStudent?.lastName}</title>
          <style>
            body { margin: 0; padding: 0; font-family: 'Georgia', serif; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Student Certificates
              </h1>
            </div>
            <p className="text-slate-500 font-medium">
              Course completion certificates for students from completed batches & registered graduates
            </p>
          </div>
          <button
            onClick={loadCompletedBatchStudents}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Records
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-xs p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eligible Students</p>
              <p className="text-2xl font-black text-blue-600 leading-tight">{students.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Batches</p>
              <p className="text-2xl font-black text-indigo-600 leading-tight">
                {uniqueBatches.length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates Ready</p>
              <p className="text-2xl font-black text-emerald-600 leading-tight">{students.length}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Completed Batch Certificates Directory
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {filtered.length}
              </span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Batch Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowBatchFilter(!showBatchFilter)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-brand-600 transition-all text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{batchFilter === "All" ? "Filter Batch" : batchFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showBatchFilter && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px] py-1.5 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => { setBatchFilter("All"); setShowBatchFilter(false); }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-50 transition-all ${batchFilter === "All" ? "font-bold text-brand-600 bg-brand-50/50" : "text-slate-700"}`}
                    >
                      All Batches
                    </button>
                    {uniqueBatches.map((b: any) => (
                      <button
                        key={b}
                        onClick={() => { setBatchFilter(b); setShowBatchFilter(false); }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-slate-50 transition-all ${batchFilter === b ? "font-bold text-brand-600 bg-brand-50/50" : "text-slate-700"}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course & Batch</th>
                  <th className="px-6 py-4">Certificate No.</th>
                  <th className="px-6 py-4 text-center">Batch Status</th>
                  <th className="px-6 py-4 text-right">Certificate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Award className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-600 font-semibold">No certificate records found</p>
                        <p className="text-xs text-slate-400">Students in completed batches will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">{student.course}</div>
                        <div className="text-xs text-slate-400 uppercase font-bold">{student.batch}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {student.registration_number || generateRegistrationNumber(index)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Batch Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCertificate(student, index)}
                          className="flex items-center gap-1.5 ml-auto px-3.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          View Certificate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-slate-800">Course Completion Certificate</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button onClick={() => setShowCertificate(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2 cursor-pointer">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div ref={printRef}>
                <Certificate student={selectedStudent} />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Certificate({ student }: { student: any }) {
  const today = new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" });
  const paidDate = student.latestPayment?.paid_at
    ? new Date(student.latestPayment.paid_at).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })
    : today;

  return (
    <div style={{
      width: "100%",
      padding: "48px",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      border: "3px solid #1e3a5f",
      borderRadius: "16px",
      fontFamily: "Georgia, serif",
      position: "relative",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", color: "#64748b", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>
          Sri Lanka Ports Authority
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "1px" }}>
          Mahapola Ports & Maritime Academy
        </h1>
        <div style={{ width: "80px", height: "3px", background: "#1d4ed8", margin: "12px auto" }} />
        <h2 style={{ fontSize: "20px", color: "#1d4ed8", margin: "8px 0 0 0", fontWeight: "700", letterSpacing: "2px" }}>
          CERTIFICATE OF COURSE COMPLETION
        </h2>
      </div>

      {/* Body */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
          This is to certify that
        </p>
        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: "8px 0", borderBottom: "1px solid #94a3b8", paddingBottom: "8px" }}>
          {student.firstName} {student.lastName}
        </p>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.8", marginTop: "8px" }}>
          has successfully completed the prescribed course of study in
        </p>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#1d4ed8", margin: "4px 0" }}>
          {student.course}
        </p>
        <p style={{ fontSize: "13px", color: "#64748b" }}>
          Batch: <strong>{student.batch}</strong> · Category: <strong>{student.studentCategory || "General"}</strong>
        </p>
      </div>

      {/* Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "white", padding: "20px", borderRadius: "12px", marginBottom: "32px" }}>
        <Detail label="Certificate Number" value={student.registration_number} />
        <Detail label="Student ID" value={student.id?.slice(0, 8).toUpperCase()} />
        <Detail label="NIC / Passport" value={student.nic || student.passport || "—"} />
        <Detail label="Completion Date" value={paidDate} />
        <Detail label="Batch Status" value="COMPLETED" />
        <Detail label="Date Issued" value={today} />
      </div>

      {/* Footer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#64748b" }}>Director / Registrar, MPMA</p>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#64748b" }}>Head of Maritime Studies</p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-30deg)",
        fontSize: "80px",
        color: "rgba(29, 78, 216, 0.04)",
        fontWeight: "900",
        letterSpacing: "8px",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        userSelect: "none",
      }}>
        MPMA
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: "#0f172a", fontWeight: "bold" }}>{value || "—"}</p>
    </div>
  );
}
