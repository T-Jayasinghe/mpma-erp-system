import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  CheckCircle2,
  Circle,
  CheckCheck,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Loader2,
  Send,
  Ban,
  Eye,
  Download,
  Award,
  CreditCard,
} from "lucide-react";
import { BASE_URL, fetchApi } from "../../../utils/api";

interface ChecklistState {
  identity_verified: boolean;
  documents_complete: boolean;
  eligibility_verified: boolean;
  course_available: boolean;
}

const CHECKLIST_ITEMS: { key: keyof ChecklistState; label: string; desc: string }[] = [
  { key: "identity_verified", label: "Identity Verified", desc: "NIC / Passport checked against provided documents" },
  { key: "documents_complete", label: "Documents Complete", desc: "All required supporting documents are present" },
  { key: "eligibility_verified", label: "Eligibility Verified", desc: "Student meets all course prerequisites" },
  { key: "course_available", label: "Course Availability Confirmed", desc: "Available seats exist in the selected batch" },
];

export default function VerificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistState>({
    identity_verified: false,
    documents_complete: false,
    eligibility_verified: false,
    course_available: false,
  });

  const [correctionText, setCorrectionText] = useState("");
  const [rejectionText, setRejectionText] = useState("");
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [regFee, setRegFee] = useState(2500);
  const [courseFee, setCourseFee] = useState(25000);
  const [documentLoading, setDocumentLoading] = useState<number | null>(null);
  const [approvalCompleted, setApprovalCompleted] = useState(false);

  const openDocument = async (doc: any, download = false) => {
    setDocumentLoading(doc.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/students/application/${student.id}/documents/${doc.id}${download ? "?download=1" : ""}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Unable to retrieve document");
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = doc.file_name || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error: any) {
      toast.error(error.message || "Unable to retrieve document");
    } finally {
      setDocumentLoading(null);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/students/application/${id}`);
      setStudent(data?.student || null);
      if (data?.student?.checklist) {
        setChecklist({
          identity_verified: data.student.checklist.identity_verified || false,
          documents_complete: data.student.checklist.documents_complete || false,
          eligibility_verified: data.student.checklist.eligibility_verified || false,
          course_available: data.student.checklist.course_available || false,
        });
      }
    } catch {
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleApprove = async () => {
    if (!allChecked) {
      toast.error("Please complete all 4 checklist items before approving.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchApi(`/students/${id}/approve-payment`, {
        method: "PATCH",
        body: JSON.stringify({ registration_fee: regFee, course_fee: courseFee }),
      });
      if (res.success) {
        if (res.emailSent) {
          toast.success("Application approved and payment email sent to student.");
          setShowApproveModal(false);
          navigate("/student-management/enrollment");
        } else {
          toast.warning(res.message || "Application approved, but the payment email could not be sent. Check SMTP settings and retry the email.");
          setApprovalCompleted(true);
        }
      } else {
        toast.error(res.message || "Failed to approve");
      }
    } catch (err: any) {
      toast.error(err.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendPaymentEmail = async () => {
    setSubmitting(true);
    try {
      const res = await fetchApi(`/students/${id}/resend-payment-email`, { method: "POST" });
      if (res.success && res.emailSent) {
        toast.success("Payment email sent to student.");
        setShowApproveModal(false);
        navigate("/student-management/enrollment");
      }
    } catch (error: any) {
      toast.error(error.message || "Email could not be sent");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!correctionText.trim()) { toast.error("Please enter correction details."); return; }
    setSubmitting(true);
    try {
      const res = await fetchApi(`/students/${id}/request-correction`, {
        method: "PATCH",
        body: JSON.stringify({ correctionDetails: correctionText }),
      });
      if (res.success) {
        toast.success("Correction requested. Student notified via email.");
        setShowCorrectionModal(false);
        navigate("/student-management/enrollment");
      } else {
        toast.error(res.message || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionText.trim()) { toast.error("Please enter rejection reason."); return; }
    setSubmitting(true);
    try {
      const res = await fetchApi(`/students/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason: rejectionText }),
      });
      if (res.success) {
        toast.success("Application rejected. Student notified via email.");
        setShowRejectionModal(false);
        navigate("/student-management/enrollment");
      } else {
        toast.error(res.message || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center p-12 text-slate-500">Application not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/student-management/enrollment")}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">
              Review Application — {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-slate-500">Application ID: {student.id?.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 uppercase tracking-wide">
              Pending Review
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-slate-800">Student Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={student.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={student.phone} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString() : "—"} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Gender" value={student.gender} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="NIC" value={student.nic || "—"} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Passport" value={student.passport || "—"} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Category" value={student.studentCategory || "—"} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Application No." value={student.application_number || "—"} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Nationality / Country" value={[student.nationality, student.country_of_origin].filter(Boolean).join(' / ') || "—"} />
                <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={student.course} />
                <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Batch" value={student.batch} />
                <InfoRow 
                  icon={<CreditCard className="w-4 h-4 text-emerald-600" />} 
                  label="Chosen Payment Method Option" 
                  value={
                    student.payment_plan === "INSTALLMENT_2"
                      ? `2 Installments (${student.installment_breakdown || "Split"})`
                      : student.payment_plan === "INSTALLMENT_3"
                      ? `3 Installments (${student.installment_breakdown || "Split"})`
                      : "Full Payment (1 Payment)"
                  } 
                  className="sm:col-span-2" 
                />
                {student.studentCategory === 'SLPA Employee' && <>
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="Service / EPF" value={[student.service_number, student.epf_number].filter(Boolean).join(' / ') || "—"} />
                  <InfoRow icon={<User className="w-4 h-4" />} label="Department / Position" value={[student.department, student.slpa_position].filter(Boolean).join(' / ') || "—"} />
                </>}
                {student.studentCategory !== 'SLPA Employee' && <InfoRow icon={<User className="w-4 h-4" />} label="Employment / Role" value={[student.company_name, student.outside_position].filter(Boolean).join(' / ') || "—"} />}
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={student.address} className="sm:col-span-2" />
              </div>
            </div>

            {/* Educational Qualifications Card */}
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
              const olAttemptsList: any[] = Array.isArray(qualData?.olAttempts) && qualData.olAttempts.length > 0
                ? qualData.olAttempts
                : (hasOL ? [{ attemptName: '1st Attempt', ...ol }] : []);

              const alAttemptsList: any[] = Array.isArray(qualData?.alAttempts) && qualData.alAttempts.length > 0
                ? qualData.alAttempts
                : (hasAL ? [{ attemptName: '1st Attempt', ...al }] : []);

              const hasOther = Array.isArray(other) && other.length > 0;
              const hasAnyQual = olAttemptsList.length > 0 || alAttemptsList.length > 0 || hasOther;

              return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden space-y-4">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h2 className="font-bold text-slate-800">Educational Qualifications & Exam Results</h2>
                    </div>
                    {hasAnyQual && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        Provided
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    {!hasAnyQual ? (
                      <div className="py-6 text-center text-slate-400 text-sm font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p>No educational qualifications or exam results recorded for this application.</p>
                      </div>
                    ) : (
                      <>
                        {/* O/L Section */}
                        {olAttemptsList.length > 0 && olAttemptsList.map((olAtt: any, idx: number) => (
                          <div key={idx} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                G.C.E. Ordinary Level (O/L) {olAtt.attemptName ? `— ${olAtt.attemptName}` : ''}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                                {olAtt.year && <span>Year: <strong className="text-slate-800">{olAtt.year}</strong></span>}
                                {olAtt.indexNumber && <span>Index: <strong className="text-slate-800">{olAtt.indexNumber}</strong></span>}
                                {olAtt.medium && <span>Medium: <strong className="text-slate-800">{olAtt.medium}</strong></span>}
                              </div>
                            </div>

                            {olAtt.subjects && olAtt.subjects.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {olAtt.subjects.map((sub: any, subIdx: number) => (
                                  <div key={subIdx} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
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
                              <p className="text-xs text-slate-400 italic">No O/L subject grades listed for this attempt.</p>
                            )}
                          </div>
                        ))}

                        {/* A/L Section */}
                        {alAttemptsList.length > 0 && alAttemptsList.map((alAtt: any, idx: number) => (
                          <div key={idx} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                G.C.E. Advanced Level (A/L) {alAtt.attemptName ? `— ${alAtt.attemptName}` : ''} {alAtt.stream ? `(${alAtt.stream})` : ''}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                                {alAtt.year && <span>Year: <strong className="text-slate-800">{alAtt.year}</strong></span>}
                                {alAtt.indexNumber && <span>Index: <strong className="text-slate-800">{alAtt.indexNumber}</strong></span>}
                                {alAtt.zScore && <span>Z-Score: <strong className="text-slate-800">{alAtt.zScore}</strong></span>}
                              </div>
                            </div>

                            {alAtt.subjects && alAtt.subjects.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {alAtt.subjects.map((sub: any, subIdx: number) => (
                                  <div key={subIdx} className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
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
                              <p className="text-xs text-slate-400 italic">No A/L subject grades listed for this attempt.</p>
                            )}
                          </div>
                        ))}

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
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Documents */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-slate-800">Submitted Documents</h2>
                <span className="ml-auto text-xs text-slate-400">
                  {student.documents?.length || 0} file(s)
                </span>
              </div>
              <div className="p-4">
                {!student.documents || student.documents.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No documents uploaded by student.</p>
                ) : (
                  <div className="space-y-2">
                    {student.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{doc.file_name}</p>
                            <p className="text-xs text-slate-400">{doc.document_type} · {doc.mime_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            type="button"
                            onClick={() => openDocument(doc)}
                            disabled={documentLoading === doc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="View document"
                          >
                            {documentLoading === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(doc, true)}
                            disabled={documentLoading === doc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Checklist + Actions */}
          <div className="space-y-6">
            {/* Verification Checklist */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-slate-800">Verification Checklist</h2>
              </div>
              <div className="p-4 space-y-3">
                {CHECKLIST_ITEMS.map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      checklist[key]
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {checklist[key] ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${checklist[key] ? "text-emerald-800" : "text-slate-700"}`}>{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}

                <div className={`mt-2 p-3 rounded-xl text-xs font-semibold text-center ${
                  allChecked ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {allChecked ? "✓ All checks complete — ready to approve" : `${Object.values(checklist).filter(Boolean).length}/4 checks completed`}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Actions</h2>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={!allChecked}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                    allChecked
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  Approve & Send Payment
                </button>
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Request Correction
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                >
                  <Ban className="w-4 h-4" />
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <Modal title="Approve & Send Payment" onClose={() => setShowApproveModal(false)}>
          <p className="text-sm text-slate-600 mb-4">
            Set fees for <strong>{student.firstName} {student.lastName}</strong>. An email with payment details will be sent immediately.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Registration Fee (Rs.)</label>
              <input type="number" value={regFee} onChange={(e) => setRegFee(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Course Fee (Rs.)</label>
              <input type="number" value={courseFee} onChange={(e) => setCourseFee(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-4">
            <span className="text-sm font-semibold text-slate-600">Total Payable</span>
            <span className="text-lg font-black text-slate-800">Rs. {(regFee + courseFee).toLocaleString()}</span>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={approvalCompleted ? handleResendPaymentEmail : handleApprove} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {approvalCompleted ? "Resend Payment Email" : "Approve & Email Student"}
            </button>
          </div>
        </Modal>
      )}

      {/* Correction Modal */}
      {showCorrectionModal && (
        <Modal title="Request Correction" onClose={() => setShowCorrectionModal(false)}>
          <p className="text-sm text-slate-600 mb-3">Describe the corrections needed. The student will be notified by email.</p>
          <textarea value={correctionText} onChange={(e) => setCorrectionText(e.target.value)} rows={4}
            placeholder="e.g. NIC copy is blurry. Please resubmit a clear photo..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={handleRequestCorrection} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Request
            </button>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <Modal title="Reject Application" onClose={() => setShowRejectionModal(false)}>
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl mb-3">
            <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700">This action will permanently reject the application. The student will be notified via email.</p>
          </div>
          <textarea value={rejectionText} onChange={(e) => setRejectionText(e.target.value)} rows={4}
            placeholder="e.g. Does not meet minimum age requirement..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 mb-4" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowRejectionModal(false)} className="px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
            <button onClick={handleReject} disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Confirm Rejection
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function InfoRow({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <span className="text-slate-300">{icon}</span>
        {label}
      </span>
      <span className="text-sm text-slate-700 font-medium">{value || "—"}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
