import { useState, useEffect } from "react";
import type { ElementType } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { fetchApi } from "../../../utils/api";
import ReceiptModal from "../components/ReceiptModal";
import {
  ArrowLeft,
  User,
  Mail,
  BookOpen,
  CreditCard,
  Edit3,
  Save,
  X,
  ClipboardCheck,
  ReceiptText,
  Award,
} from "lucide-react";
import type { StudentRecord, StudentStatus } from "../types/student";
import {
  formatStudentId,
  getNicOrPassport,
  getStudentFullName,
} from "../types/student";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-slate-800 text-right">{value || "—"}</span>
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
    <div className="px-6 py-2">{children}</div>
  </div>
);

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "true");
  const [showReceipt, setShowReceipt] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
    address: "",
    course: "",
    batch: "",
    studentCategory: "",
    nic: "",
    passport: "",
    status: "Enrolled" as StudentStatus,
  });

  useEffect(() => {
    if (id) loadStudent(id);
  }, [id]);

  useEffect(() => {
    setIsEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const loadStudent = async (studentId: string) => {
    setLoading(true);
    try {
      const data: StudentRecord = await fetchApi(`/students/${studentId}`);
      setStudent(data);
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dob: data.dob?.split("T")[0] || data.dob,
        gender: data.gender,
        address: data.address,
        course: data.course,
        batch: data.batch,
        studentCategory: data.studentCategory || "",
        nic: data.nic || "",
        passport: data.passport || "",
        status: data.status,
      });
    } catch {
      toast.error("Failed to load student profile");
      navigate("/student-management/students");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const response = await fetchApi(`/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setStudent((prev) => (prev ? { ...prev, ...response.student } : prev));
      toast.success("Student updated successfully");
      setIsEditing(false);
      setSearchParams({});
      await loadStudent(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update student";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!student) return;
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dob: student.dob?.split("T")[0] || student.dob,
      gender: student.gender,
      address: student.address,
      course: student.course,
      batch: student.batch,
      studentCategory: student.studentCategory || "",
      nic: student.nic || "",
      passport: student.passport || "",
      status: student.status,
    });
    setIsEditing(false);
    setSearchParams({});
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-400">Loading student profile...</div>
      </DashboardLayout>
    );
  }

  if (!student) return null;

  const fullName = getStudentFullName(student);
  const latestPayment = student.latestPayment;
  const paymentStatus = latestPayment?.payment_status || "No Payment";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/student-management/students")}
              className="p-2 mt-1 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{fullName}</h1>
                  <p className="text-sm text-slate-500 font-mono">ID: {formatStudentId(student.id)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                  {student.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                  Payment: {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSearchParams({ edit: "true" });
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    const ref = latestPayment?.payment_reference;
                    navigate(
                      ref
                        ? `/student-management/payment?ref=${encodeURIComponent(ref)}`
                        : "/student-management/payment"
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-semibold hover:bg-amber-100 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Payment
                </button>
                {latestPayment?.payment_status === "PAID" && (
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                  >
                    <ReceiptText className="w-4 h-4" />
                    Receipt
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Personal Information" icon={User}>
            {isEditing ? (
              <div className="py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="First Name"
                  />
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="Last Name"
                  />
                </div>
                <input
                  value={editForm.studentCategory}
                  onChange={(e) => setEditForm({ ...editForm, studentCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Student Category"
                />
                <input
                  value={editForm.nic}
                  onChange={(e) => setEditForm({ ...editForm, nic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="NIC"
                />
                <input
                  value={editForm.passport}
                  onChange={(e) => setEditForm({ ...editForm, passport: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Passport"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <InfoRow label="Full Name" value={fullName} />
                <InfoRow label="Student Category" value={student.studentCategory || "—"} />
                <InfoRow label="NIC" value={student.nic || "—"} />
                <InfoRow label="Passport" value={student.passport || "—"} />
                <InfoRow label="NIC / Passport" value={getNicOrPassport(student)} />
                <InfoRow
                  label="Date of Birth"
                  value={new Date(student.dob).toLocaleDateString("en-LK")}
                />
                <InfoRow label="Gender" value={student.gender} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Contact Information" icon={Mail}>
            {isEditing ? (
              <div className="py-4 space-y-3">
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Email"
                />
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Phone"
                />
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Address"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <InfoRow label="Email" value={student.email} />
                <InfoRow label="Phone" value={student.phone} />
                <InfoRow label="Address" value={student.address} />
              </>
            )}
          </SectionCard>

          <SectionCard title="Course Information" icon={BookOpen}>
            {isEditing ? (
              <div className="py-4 space-y-3">
                <input
                  value={editForm.course}
                  onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Course"
                />
                <input
                  value={editForm.batch}
                  onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  placeholder="Batch"
                />
              </div>
            ) : (
              <>
                <InfoRow label="Course" value={student.course} />
                <InfoRow label="Batch" value={student.batch} />
                <InfoRow
                  label="Enrollment Date"
                  value={new Date(student.enrollmentDate).toLocaleDateString("en-LK")}
                />
                <InfoRow
                  label="Created Date"
                  value={new Date(student.createdAt).toLocaleDateString("en-LK")}
                />
              </>
            )}
          </SectionCard>

          <SectionCard title="Payment Information" icon={CreditCard}>
            {latestPayment ? (
              <>
                <InfoRow label="Payment Reference" value={latestPayment.payment_reference} />
                <InfoRow label="Payment Status" value={latestPayment.payment_status} />
                <InfoRow label="Payment Method" value={latestPayment.payment_method} />
                <InfoRow
                  label="Registration Fee"
                  value={`Rs. ${Number(latestPayment.registration_fee).toLocaleString()}`}
                />
                <InfoRow
                  label="Course Fee"
                  value={`Rs. ${Number(latestPayment.course_fee).toLocaleString()}`}
                />
                <InfoRow
                  label="Total Payable"
                  value={`Rs. ${Number(latestPayment.full_amount_payable).toLocaleString()}`}
                />
                <InfoRow
                  label="Amount Paid"
                  value={`Rs. ${Number(latestPayment.amount_paid).toLocaleString()}`}
                />
                {latestPayment.receipt_number && (
                  <InfoRow label="Receipt Number" value={latestPayment.receipt_number} />
                )}
              </>
            ) : (
              <p className="py-6 text-sm text-slate-500">No payment records found for this student.</p>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Registration Status" icon={ClipboardCheck}>
          {isEditing ? (
            <div className="py-4">
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as StudentStatus })
                }
                className="w-full sm:w-64 px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Pending">Pending</option>
                <option value="Enrolled">Enrolled</option>
                <option value="Registered">Registered</option>
                <option value="Graduated">Graduated</option>
                <option value="Dropout">Dropout</option>
              </select>
            </div>
          ) : (
            <>
              <InfoRow label="Student Status" value={student.status} />
              <InfoRow
                label="Registration Status"
                value={
                  student.status === "Registered"
                    ? "Fully Registered"
                    : student.status === "Enrolled"
                      ? "Enrolled — Awaiting Registration"
                      : student.status
                }
              />
            </>
          )}
        </SectionCard>

        {/* Educational Qualifications Section Card */}
        {(() => {
          let qualData: any = null;
          const rawNotes = student.admin_notes || (student as any).qualificationsData || (student as any).qualifications;
          if (rawNotes) {
            try {
              qualData = typeof rawNotes === 'string' ? JSON.parse(rawNotes) : rawNotes;
              if (typeof qualData === 'string') {
                qualData = JSON.parse(qualData);
              }
            } catch {
              qualData = null;
            }
          }
          const ol = qualData?.ol;
          const al = qualData?.al;
          const other = qualData?.otherQualifications || [];
          const hasOL = ol && (ol.year || ol.indexNumber || (ol.subjects && ol.subjects.length > 0));
          const hasAL = al && (al.year || al.indexNumber || al.zScore || (al.subjects && al.subjects.length > 0));
          const hasOther = Array.isArray(other) && other.length > 0;
          if (!hasOL && !hasAL && !hasOther) return null;

          return (
            <SectionCard title="Educational Qualifications & Exam Results" icon={Award}>
              <div className="py-4 space-y-5">
                {/* O/L Section */}
                {hasOL && (
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        G.C.E. Ordinary Level (O/L)
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                        {ol.year && <span>Year: <strong className="text-slate-800">{ol.year}</strong></span>}
                        {ol.indexNumber && <span>Index: <strong className="text-slate-800">{ol.indexNumber}</strong></span>}
                        {ol.medium && <span>Medium: <strong className="text-slate-800">{ol.medium}</strong></span>}
                      </div>
                    </div>

                    {ol.subjects && ol.subjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {ol.subjects.map((sub: any, idx: number) => (
                          <div key={idx} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                            <span className="font-semibold text-slate-700 truncate pr-2">{sub.subject}</span>
                            <span className={`px-2 py-0.5 rounded font-black text-xs shrink-0 ${
                              sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              sub.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                              sub.grade === 'S' ? 'bg-violet-100 text-violet-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {sub.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No O/L subject grades listed.</p>
                    )}
                  </div>
                )}

                {/* A/L Section */}
                {hasAL && (
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        G.C.E. Advanced Level (A/L) — {al.stream || 'Stream'}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                        {al.year && <span>Year: <strong className="text-slate-800">{al.year}</strong></span>}
                        {al.indexNumber && <span>Index: <strong className="text-slate-800">{al.indexNumber}</strong></span>}
                        {al.zScore && <span>Z-Score: <strong className="text-slate-800">{al.zScore}</strong></span>}
                      </div>
                    </div>

                    {al.subjects && al.subjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {al.subjects.map((sub: any, idx: number) => (
                          <div key={idx} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                            <span className="font-semibold text-slate-700 truncate pr-2">{sub.subject}</span>
                            <span className={`px-2 py-0.5 rounded font-black text-xs shrink-0 ${
                              sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              sub.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                              sub.grade === 'S' ? 'bg-violet-100 text-violet-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {sub.grade}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No A/L subject grades listed.</p>
                    )}
                  </div>
                )}

                {/* Other Qualifications Section */}
                {hasOther && (
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
                    <div className="pb-2 border-b border-slate-200/70">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        Higher Education & Other Qualifications
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <thead className="bg-slate-100/70 font-bold text-slate-700 uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Qualification Title</th>
                            <th className="py-2.5 px-3">Institute / University</th>
                            <th className="py-2.5 px-3 text-center">Year</th>
                            <th className="py-2.5 px-3 text-center">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {other.map((q: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-bold text-slate-800">{q.title}</td>
                              <td className="py-2 px-3 text-slate-600">{q.institute}</td>
                              <td className="py-2 px-3 text-center text-slate-700 font-medium">{q.year}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 text-slate-800 inline-block border border-slate-200">
                                  {q.result}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          );
        })()}

        {student.payments && student.payments.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-3 text-sm font-mono text-slate-700">
                        {payment.payment_reference}
                      </td>
                      <td className="px-6 py-3 text-sm">{payment.payment_status}</td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        Rs. {Number(payment.full_amount_payable).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">
                        {payment.created_at
                          ? new Date(payment.created_at).toLocaleDateString("en-LK")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showReceipt && latestPayment && (
        <ReceiptModal
          payment={latestPayment}
          studentName={fullName}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </DashboardLayout>
  );
}
