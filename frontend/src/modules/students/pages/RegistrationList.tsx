import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import {
  Award,
  Search,
  Download,
  ClipboardCheck,
  Calendar,
  Hash,
  Loader2,
  RefreshCw,
  Printer,
} from "lucide-react";
import { fetchApi } from "../../../utils/api";

const generateRegistrationNumber = (index: number): string => {
  const year = new Date().getFullYear();
  const seq = String(index + 1).padStart(4, "0");
  return `MPMA-REG-${year}-${seq}`;
};

const formatCurrency = (amount: number) =>
  `Rs. ${amount?.toLocaleString("en-LK") || "0"}`;

export default function RegistrationList() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRegisteredStudents();
  }, []);

  const loadRegisteredStudents = async () => {
    setLoading(true);
    try {
      // Fetch students with PAID payment status
      const data = await fetchApi("/students");
      const paid = (Array.isArray(data) ? data : []).filter(
        (s: any) => s.latestPayment?.payment_status === "PAID" || s.status === "Registered"
      );
      setStudents(paid);
    } catch {
      toast.error("Failed to load registered students");
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q)
    );
  });

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
          <title>Registration Certificate - ${selectedStudent?.firstName} ${selectedStudent?.lastName}</title>
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
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Award className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Registration
              </h1>
            </div>
            <p className="text-slate-500 font-medium">
              Students who have completed payment and are officially registered
            </p>
          </div>
          <button
            onClick={loadRegisteredStudents}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</p>
              <p className="text-2xl font-black text-blue-600 leading-tight">{students.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Year</p>
              <p className="text-2xl font-black text-indigo-600 leading-tight">
                {students.filter((s) => new Date(s.enrollmentDate).getFullYear() === new Date().getFullYear()).length}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates Issued</p>
              <p className="text-2xl font-black text-emerald-600 leading-tight">{students.length}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              Registered Students
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {filtered.length}
              </span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course & Batch</th>
                  <th className="px-6 py-4">Registration No.</th>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Award className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-400 font-medium">No registered students yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700">{student.course}</div>
                        <div className="text-xs text-slate-400 uppercase font-bold">{student.batch}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {student.registration_number || generateRegistrationNumber(index)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(student.latestPayment?.amount_paid || student.latestPayment?.full_amount_payable || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {student.latestPayment?.paid_at
                            ? new Date(student.latestPayment.paid_at).toLocaleDateString()
                            : student.enrollmentDate
                            ? new Date(student.enrollmentDate).toLocaleDateString()
                            : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openCertificate(student, index)}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all text-xs font-bold border border-blue-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Certificate
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
              <h3 className="font-bold text-slate-800">Registration Certificate</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button onClick={() => setShowCertificate(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2">×</button>
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
          CERTIFICATE OF REGISTRATION
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
          has been officially registered as a student of
        </p>
        <p style={{ fontSize: "16px", fontWeight: "bold", color: "#1d4ed8", margin: "4px 0" }}>
          {student.course}
        </p>
        <p style={{ fontSize: "13px", color: "#64748b" }}>
          Batch: <strong>{student.batch}</strong> · Category: <strong>{student.studentCategory || "General"}</strong>
        </p>
      </div>

      {/* Details Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "white", padding: "20px", borderRadius: "12px", marginBottom: "32px" }}>
        <Detail label="Registration Number" value={student.registration_number} />
        <Detail label="Student ID" value={student.id?.slice(0, 8).toUpperCase()} />
        <Detail label="NIC / Passport" value={student.nic || student.passport || "—"} />
        <Detail label="Date of Registration" value={paidDate} />
        <Detail label="Payment Reference" value={student.latestPayment?.payment_reference || "—"} />
        <Detail label="Certificate Issued" value={today} />
      </div>

      {/* Footer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#64748b" }}>Student Signature</p>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #94a3b8", paddingTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#64748b" }}>Registrar, MPMA</p>
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
