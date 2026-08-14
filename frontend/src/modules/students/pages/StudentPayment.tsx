import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  CreditCard,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  User,
  Loader2,
  Download,
  Copy,
  Check,
  Eye,
  X,
  ShieldCheck,
  Bell,
  Send,
  Mail,
  MessageSquare
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateStudentPaymentReceipt } from "../../../utils/PDFGenerator";

// ============================================================
// TypeScript Interfaces
// ============================================================
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  course: string;
  batch: string;
  payment_plan?: string;
  installment_breakdown?: string;
}

export interface StudentPaymentRecord {
  id: number;
  student_id: string;
  user_id: number | null;
  course_batch_id: number | null;
  registration_fee: number;
  course_fee: number;
  full_amount_payable: number;
  amount_paid: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_completed: boolean;
  payment_reference: string;
  transaction_id: string | null;
  receipt_number: string | null;
  paid_at: string | null;
  callback_response: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentInfo;
}

export interface GovPayInitiateResponse {
  success: boolean;
  message: string;
  data: {
    payment_url: string;
    payment_reference: string;
    amount: number;
  };
}

// ============================================================
// Payment Plan Parsing Helper
// ============================================================
const getPaymentPlanInfo = (payment_plan?: string | null, breakdown?: string | null) => {
  const isInstallment = Boolean(
    payment_plan && (payment_plan.includes("INSTALLMENT") || payment_plan.includes("Installment"))
  );

  let label = "Full Payment";
  if (payment_plan === "INSTALLMENT_2") label = "2 Installments Plan";
  else if (payment_plan === "INSTALLMENT_3") label = "3 Installments Plan";
  else if (isInstallment) label = "Installment Plan";

  let scheduleItems: string[] = [];
  if (breakdown) {
    if (breakdown.includes("|")) {
      scheduleItems = breakdown.split("|").map((s) => s.trim()).filter(Boolean);
    } else if (breakdown.includes(";")) {
      scheduleItems = breakdown.split(";").map((s) => s.trim()).filter(Boolean);
    } else {
      scheduleItems = [breakdown.trim()];
    }
  }

  return { isInstallment, label, scheduleItems };
};

// ============================================================
// Copyable Badge Component
// ============================================================
const CopyableBadge = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || "Value"} copied to clipboard!`, { autoClose: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  const display = text.length > 22 ? `${text.slice(0, 15)}...${text.slice(-4)}` : text;

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-mono text-[11px] font-semibold rounded border border-slate-200 transition-all cursor-pointer group whitespace-nowrap"
      title={`Click to copy: ${text}`}
    >
      <span>{display}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
};

// ============================================================
// Status Badge Component
// ============================================================
const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config: Record<PaymentStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    PENDING: {
      label: "Pending",
      classes: "bg-amber-50 text-amber-700 border-amber-200/80",
      icon: <Clock className="w-3 h-3 text-amber-500 animate-pulse" />,
    },
    PAID: {
      label: "Paid",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    },
    FAILED: {
      label: "Failed",
      classes: "bg-rose-50 text-rose-700 border-rose-200/80",
      icon: <XCircle className="w-3 h-3 text-rose-500" />,
    },
    CANCELLED: {
      label: "Cancelled",
      classes: "bg-slate-50 text-slate-600 border-slate-200/80",
      icon: <AlertCircle className="w-3 h-3 text-slate-400" />,
    },
    REFUNDED: {
      label: "Refunded",
      classes: "bg-purple-50 text-purple-700 border-purple-200/80",
      icon: <RotateCcw className="w-3 h-3 text-purple-500" />,
    },
  };

  const c = config[status] || config.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${c.classes} whitespace-nowrap`}
    >
      {c.icon}
      {c.label}
    </span>
  );
};

// ============================================================
// Send Installment Reminder Modal Component
// ============================================================
const SendReminderModal = ({
  payment,
  installmentLabel,
  onClose,
  onSuccess,
}: {
  payment: StudentPaymentRecord;
  installmentLabel?: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [reminderType, setReminderType] = useState<"Email Notification" | "SMS Alert" | "Official Notice">("Email Notification");
  const [sending, setSending] = useState(false);

  const studentName = payment.student
    ? `${payment.student.firstName} ${payment.student.lastName}`
    : `Student #${payment.student_id}`;
  const studentEmail = payment.student?.email || "student@mpma.edu.lk";
  const studentPhone = (payment.student as StudentInfo & { phone?: string })?.phone || "0771234567";

  const planInfo = getPaymentPlanInfo(payment.student?.payment_plan, payment.student?.installment_breakdown);
  const targetLabel = installmentLabel || (planInfo.scheduleItems.length > 0 ? planInfo.scheduleItems[0] : "Next Installment");

  const [message, setMessage] = useState(
    `Dear ${studentName},\n\nThis is a friendly payment reminder from Mahapola Ports & Maritime Academy (MPMA ERP System).\n\nYour ${targetLabel} for ${payment.student?.course || "Course"} is scheduled for payment. Total Amount Payable: LKR ${Number(payment.full_amount_payable).toLocaleString()}.\n\nPlease complete your installment payment via the secure GovPay portal link below:\nhttp://localhost:5173/student-management/payment?ref=${payment.payment_reference}\n\nThank you,\nAccounts & Finance Division\nMPMA ERP System`
  );

  const handleSendReminder = async () => {
    try {
      setSending(true);
      const res = await fetch("http://localhost:5001/api/student-payments/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payment.id,
          reminder_type: reminderType,
          message,
          recipient: studentEmail,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Installment reminder dispatched to ${studentName} via ${reminderType}!`);
        onSuccess();
        onClose();
      } else {
        toast.error(json.message || "Failed to dispatch reminder.");
      }
    } catch {
      toast.error("Could not connect to backend server.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-900 p-5 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Send Installment Payment Reminder
              </h2>
              <p className="text-xs text-indigo-200">
                Dispatch automated reminder for pending installment
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Target Student Box */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                Target Student & Program
              </p>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{studentName}</div>
              <p className="text-[11px] text-slate-500 font-medium">{payment.student?.course || "—"}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold border border-indigo-200">
              ⚡ {planInfo.label}
            </span>
          </div>

          {/* Reminder Channel Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Reminder Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "Email Notification", icon: Mail },
                { type: "SMS Alert", icon: MessageSquare },
                { type: "Official Notice", icon: Bell },
              ].map((channel) => (
                <button
                  key={channel.type}
                  type="button"
                  onClick={() => setReminderType(channel.type as "Email Notification" | "SMS Alert" | "Official Notice")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                    reminderType === channel.type
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <channel.icon className="w-4 h-4" />
                  <span className="text-[11px]">{channel.type.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Recipient Email:</span>
              <span className="font-bold text-slate-800">{studentEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Phone Number:</span>
              <span className="font-bold text-slate-800">{studentPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Due Target:</span>
              <span className="font-bold text-indigo-700">{targetLabel}</span>
            </div>
          </div>

          {/* Reminder Message Textarea */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Custom Reminder Message
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSendReminder}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Payment Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Payment Details Modal / Drawer
// ============================================================
const PaymentDetailsModal = ({
  payment,
  onClose,
  onInitiate,
  onVerify,
  onDownloadReceipt,
  onSendReminder,
}: {
  payment: StudentPaymentRecord;
  onClose: () => void;
  onInitiate: (p: StudentPaymentRecord, customAmount?: number, installmentLabel?: string) => void;
  onVerify: (ref: string) => void;
  onDownloadReceipt: (p: StudentPaymentRecord) => void;
  onSendReminder: (p: StudentPaymentRecord, installmentLabel?: string) => void;
}) => {
  const studentName = payment.student
    ? `${payment.student.firstName} ${payment.student.lastName}`
    : `Student #${payment.student_id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Payment Record #{payment.id}
              </h2>
              <p className="text-xs text-slate-400">
                Mahapola Ports & Maritime Academy — Payment Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Status & Amount Overview */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Amount Payable
              </p>
              <div className="text-xl font-black text-slate-800 mt-0.5">
                LKR {Number(payment.full_amount_payable).toLocaleString()}
              </div>
              {payment.payment_status === "PAID" && (
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                  Paid Amount: LKR {Number(payment.amount_paid).toLocaleString()}
                </p>
              )}
            </div>
            <StatusBadge status={payment.payment_status} />
          </div>

          {/* Student Profile & Course */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" /> Student & Course Info
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Student Name</span>
                <span className="font-bold text-slate-800">{studentName}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-700">{payment.student?.email || "—"}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Course</span>
                <span className="font-semibold text-indigo-600">{payment.student?.course || "—"}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Batch</span>
                <span className="font-semibold text-slate-700">{payment.student?.batch || "—"}</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown & Payment Plan */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-600 font-black text-xs bg-emerald-100 px-1.5 py-0.5 rounded">LKR</span> Fee Structure & Payment Plan
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Registration Fee</span>
                <span className="font-bold text-slate-800">LKR {Number(payment.registration_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Course Fee</span>
                <span className="font-bold text-slate-800">LKR {Number(payment.course_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Chosen Payment Plan</span>
                {(() => {
                  const planInfo = getPaymentPlanInfo(payment.student?.payment_plan, payment.student?.installment_breakdown);
                  return (
                    <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                      planInfo.isInstallment
                        ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                        : "text-slate-700 bg-slate-100 border-slate-200"
                    }`}>
                      {planInfo.isInstallment && <span className="mr-1">⚡</span>}
                      {planInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Installment Breakdown Box */}
            {(() => {
              const planInfo = getPaymentPlanInfo(payment.student?.payment_plan, payment.student?.installment_breakdown);
              if (!planInfo.isInstallment) return null;

              return (
                <div className="mt-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Installment Schedule ({planInfo.label})</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
                      {payment.payment_status === "PAID" ? "All Installments Paid" : "Installments Scheduled"}
                    </span>
                  </div>

                  {planInfo.scheduleItems.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {planInfo.scheduleItems.map((item, idx) => {
                        const numMatches = item.match(/\d[\d,.]*/g);
                        const instAmt = numMatches ? parseFloat(numMatches[numMatches.length - 1].replace(/,/g, '')) : null;

                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-100 text-xs shadow-2xs">
                            <span className="font-bold text-slate-800">{item}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                idx === 0 && payment.payment_status === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : idx === 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {idx === 0 && payment.payment_status === "PAID" ? "Paid" : idx === 0 ? "Initial Due" : `Installment ${idx + 1}`}
                              </span>

                              {payment.payment_status === "PENDING" && instAmt && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onSendReminder(payment, `Installment ${idx + 1}`);
                                    }}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                                    title="Send Payment Reminder"
                                  >
                                    <Bell className="w-3 h-3" />
                                    Reminder
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onInitiate(payment, instAmt, `Installment ${idx + 1}`);
                                    }}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Pay Inst. {idx + 1}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-700 font-medium">
                      {payment.student?.installment_breakdown || "Installment schedule selected by student during enrollment."}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Transaction Audit */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" /> Transaction Audit
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Reference</span>
                <CopyableBadge text={payment.payment_reference} label="Payment Reference" />
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction ID</span>
                {payment.transaction_id ? (
                  <CopyableBadge text={payment.transaction_id} label="Transaction ID" />
                ) : (
                  <span className="text-slate-400 font-mono">—</span>
                )}
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Receipt No.</span>
                <span className="font-mono font-bold text-emerald-700">{payment.receipt_number || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Created Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(payment.created_at).toLocaleString("en-LK")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {(payment.payment_status === "PENDING" || payment.payment_status === "FAILED") && (
              <button
                onClick={() => {
                  onClose();
                  onVerify(payment.payment_reference);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Verify Status
              </button>
            )}
            {payment.payment_status === "PAID" && (
              <button
                onClick={() => {
                  onClose();
                  onDownloadReceipt(payment);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF Receipt
              </button>
            )}
            {payment.payment_status === "PENDING" && (
              <button
                onClick={() => {
                  onClose();
                  onInitiate(payment);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Pay Full Amount
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main StudentPayment Page Component
// ============================================================
export default function StudentPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState<StudentPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("ref") || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [initiatingId, setInitiatingId] = useState<number | null>(null);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);
  const [selectedDetailsPayment, setSelectedDetailsPayment] = useState<StudentPaymentRecord | null>(null);
  const [selectedReminderPayment, setSelectedReminderPayment] = useState<StudentPaymentRecord | null>(null);
  const [selectedReminderLabel, setSelectedReminderLabel] = useState<string | undefined>(undefined);

  // ── Fetch all payments ──────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/api/student-payments");
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
      } else {
        toast.error("Failed to load payment transactions.");
      }
    } catch {
      toast.error("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ── Initiate GovPay ────────────────────────────────────────
  const handleInitiatePayment = async (payment: StudentPaymentRecord, customAmount?: number, installmentLabel?: string) => {
    try {
      setInitiatingId(payment.id);
      const res = await fetch("http://localhost:5001/api/student-payments/govpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payment.id,
          custom_amount: customAmount,
          installment_label: installmentLabel
        }),
      });
      const json: GovPayInitiateResponse = await res.json();

      if (json.success && json.data?.payment_url) {
        navigate(json.data.payment_url);
      } else {
        toast.error(json.message || "Failed to initiate GovPay transaction.");
      }
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setInitiatingId(null);
    }
  };

  // ── Verify payment ─────────────────────────────────────────
  const handleVerifyPayment = async (reference: string) => {
    try {
      setVerifyingRef(reference);
      const res = await fetch(`http://localhost:5001/api/student-payments/verify/${reference}`);
      const json = await res.json();
      if (json.success) {
        const s = json.data.payment_status;
        toast.info(`Status verified for ${reference}: ${s}`, { autoClose: 4000 });
        await fetchPayments();
      } else {
        toast.error(json.message || "Verification failed.");
      }
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setVerifyingRef(null);
    }
  };

  // ── Download PDF Receipt ───────────────────────────────────
  const handleDownloadReceipt = (payment: StudentPaymentRecord) => {
    const studentName = payment.student
      ? `${payment.student.firstName} ${payment.student.lastName}`
      : `Student #${payment.student_id}`;
    const courseBatch = payment.student
      ? `${payment.student.course} / ${payment.student.batch}`
      : undefined;

    generateStudentPaymentReceipt({
      payment,
      studentName,
      courseBatch,
    });
    toast.success("Official PDF receipt slip downloaded.");
  };

  // ── Derived stats & Installments ─────────────────────────────
  const installmentPendingPayments = payments.filter((p) => {
    const planInfo = getPaymentPlanInfo(p.student?.payment_plan, p.student?.installment_breakdown);
    return p.payment_status === "PENDING" && planInfo.isInstallment;
  });



  const stats = {
    total: payments.length,
    paid: payments.filter((p) => p.payment_status === "PAID").length,
    pending: payments.filter((p) => p.payment_status === "PENDING").length,
    reminders: installmentPendingPayments.length,
    failed: payments.filter((p) => p.payment_status === "FAILED").length,
    totalRevenue: payments
      .filter((p) => p.payment_status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount_paid), 0),
  };

  // ── Unique course & batch option lists ────────────────────
  const courseOptions = Array.from(
    new Set(payments.map((p) => p.student?.course).filter(Boolean) as string[])
  ).sort();

  const batchOptions = Array.from(
    new Set(
      payments
        .filter((p) => courseFilter === "ALL" || p.student?.course === courseFilter)
        .map((p) => p.student?.batch)
        .filter(Boolean) as string[]
    )
  ).sort();

  // ── Filtered list ──────────────────────────────────────────
  const filteredPayments = payments.filter((p) => {
    const name = p.student
      ? `${p.student.firstName} ${p.student.lastName}`.toLowerCase()
      : "";
    const course = p.student?.course?.toLowerCase() || "";
    const ref = p.payment_reference.toLowerCase();
    const txn = (p.transaction_id || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || name.includes(q) || ref.includes(q) || txn.includes(q) || course.includes(q);

    const planInfo = getPaymentPlanInfo(p.student?.payment_plan, p.student?.installment_breakdown);
    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "REMINDERS"
        ? p.payment_status === "PENDING" && planInfo.isInstallment
        : p.payment_status === statusFilter;

    const matchCourse = courseFilter === "ALL" || p.student?.course === courseFilter;
    const matchBatch  = batchFilter  === "ALL" || p.student?.batch  === batchFilter;

    return matchSearch && matchStatus && matchCourse && matchBatch;
  });

  // ── Status filter tabs ─────────────────────────────────────
  const filterTabs = [
    { key: "ALL", label: "All Records", count: stats.total },
    { key: "PENDING", label: "Pending", count: stats.pending },
    { key: "REMINDERS", label: "Installment Reminders", count: stats.reminders },
    { key: "PAID", label: "Paid", count: stats.paid },
    { key: "FAILED", label: "Failed", count: stats.failed },
  ];

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" />

      {/* Reminder Modal */}
      {selectedReminderPayment && (
        <SendReminderModal
          payment={selectedReminderPayment}
          installmentLabel={selectedReminderLabel}
          onClose={() => setSelectedReminderPayment(null)}
          onSuccess={fetchPayments}
        />
      )}

      {/* Details Modal */}
      {selectedDetailsPayment && (
        <PaymentDetailsModal
          payment={selectedDetailsPayment}
          onClose={() => setSelectedDetailsPayment(null)}
          onInitiate={handleInitiatePayment}
          onVerify={handleVerifyPayment}
          onDownloadReceipt={handleDownloadReceipt}
          onSendReminder={(p, label) => {
            setSelectedReminderPayment(p);
            setSelectedReminderLabel(label);
          }}
        />
      )}

      <div className="space-y-5">
        {/* ── Page Header Controls ─────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  Student Payments
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GovPay Enabled
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium">
                Official transaction ledger & GovPay payment management
              </p>
            </div>
          </div>

          <button
            onClick={fetchPayments}
            disabled={loading}
            id="btn-refresh-payments"
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
            Refresh
          </button>
        </div>

        {/* ── Metric Summary Bar ─────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">
                LKR {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-sm">
              LKR
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid Transactions</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.paid}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Payments</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{stats.pending}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed / Cancelled</p>
              <p className="text-xl font-black text-rose-500 mt-0.5">{stats.failed}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-500">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>



        {/* ── Payments Table Card ────────── */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
          {/* Header Toolbar */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50">
            {/* Row 1: Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    id={`filter-${tab.key.toLowerCase()}`}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-slate-800 text-white shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 px-1 py-0.2 rounded text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 2: Course / Batch filters + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">

              {/* Course Filter */}
              <div className="relative">
                <select
                  id="filter-course"
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setBatchFilter("ALL"); // reset batch when course changes
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-indigo-400 outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">All Courses</option>
                  {courseOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>

              {/* Batch Filter */}
              <div className="relative">
                <select
                  id="filter-batch"
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-indigo-400 outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">All Batches</option>
                  {batchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </span>
              </div>

              {/* Clear Filters */}
              {(courseFilter !== "ALL" || batchFilter !== "ALL") && (
                <button
                  onClick={() => { setCourseFilter("ALL"); setBatchFilter("ALL"); }}
                  className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}

              <div className="flex-1" />

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="search-payments"
                  type="text"
                  placeholder="Search student, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-500">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CreditCard className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No payment transactions found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Student & Program</th>
                    <th className="px-5 py-3">Reference & Date</th>
                    <th className="px-5 py-3">Amount & Payment Plan</th>
                    <th className="px-5 py-3">Status & Gateway</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPayments.map((p) => {
                    const studentName = p.student
                      ? `${p.student.firstName} ${p.student.lastName}`
                      : `Student #${p.student_id}`;
                    const courseName = p.student?.course || "—";
                    const batchName = p.student?.batch || "—";


                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedDetailsPayment(p)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* 1. Student & Program */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {p.student?.firstName?.[0] || "S"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                {studentName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={`${courseName} (${batchName})`}>
                                {courseName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Reference & Date */}
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-0.5">
                            <CopyableBadge text={p.payment_reference} label="Payment Reference" />
                            <div className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.created_at).toLocaleDateString("en-LK")}
                            </div>
                          </div>
                        </td>

                        {/* 3. Amount & Plan */}
                        <td className="px-5 py-3">
                          {(() => {
                            const planInfo = getPaymentPlanInfo(p.student?.payment_plan, p.student?.installment_breakdown);
                            return (
                              <div>
                                <div className="font-extrabold text-slate-800 text-xs">
                                  LKR {Number(p.full_amount_payable).toLocaleString()}
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                        planInfo.isInstallment
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {planInfo.isInstallment && <span className="mr-0.5">⚡</span>}
                                      {planInfo.label}
                                    </span>
                                    {p.payment_status === "PAID" && (
                                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                                        <CheckCircle2 className="w-3 h-3" /> Paid
                                      </span>
                                    )}
                                  </div>
                                  {planInfo.isInstallment && planInfo.scheduleItems.length > 0 && (
                                    <div className="text-[10px] text-indigo-600 font-semibold truncate max-w-[200px]" title={planInfo.scheduleItems[0]}>
                                      {planInfo.scheduleItems[0]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 4. Status & Gateway */}
                        <td className="px-5 py-3">
                          <div className="space-y-0.5">
                            <StatusBadge status={p.payment_status} />
                            {p.transaction_id && (
                              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                                {p.transaction_id}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. Actions */}
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {p.payment_status === "PAID" && (
                              <button
                                id={`btn-download-receipt-${p.id}`}
                                onClick={() => handleDownloadReceipt(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Receipt
                              </button>
                            )}

                            {p.payment_status === "PENDING" && (
                              <>
                                <button
                                  id={`btn-reminder-${p.id}`}
                                  onClick={() => {
                                    setSelectedReminderPayment(p);
                                    setSelectedReminderLabel(
                                      getPaymentPlanInfo(p.student?.payment_plan, p.student?.installment_breakdown).scheduleItems[0]
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer shadow-2xs"
                                  title="Send Installment Payment Reminder"
                                >
                                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                                  Reminder
                                </button>

                                <button
                                  id={`btn-pay-${p.id}`}
                                  onClick={() => handleInitiatePayment(p)}
                                  disabled={initiatingId === p.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer disabled:opacity-60 shadow-xs shadow-emerald-600/20"
                                >
                                  {initiatingId === p.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  )}
                                  Pay GovPay
                                </button>
                              </>
                            )}

                            {(p.payment_status === "PENDING" || p.payment_status === "FAILED") && (
                              <button
                                id={`btn-verify-${p.id}`}
                                onClick={() => handleVerifyPayment(p.payment_reference)}
                                disabled={verifyingRef === p.payment_reference}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer disabled:opacity-60"
                                title="Verify status"
                              >
                                {verifyingRef === p.payment_reference ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                Verify
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedDetailsPayment(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="View full audit details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          {!loading && filteredPayments.length > 0 && (
            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredPayments.length} of {payments.length} transactions</span>
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified GovPay Gateway
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
