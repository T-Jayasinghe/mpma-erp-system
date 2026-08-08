import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Info,
  Lock,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function GovPayDemo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const reference = searchParams.get("reference");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!reference || !amount) {
      toast.error("Invalid payment reference or amount.");
      setTimeout(() => navigate("/student-management/payment"), 3000);
    }
  }, [reference, amount, navigate]);

  const handleSimulatePayment = async (status: "SUCCESS" | "FAILED") => {
    try {
      setLoading(true);
      const payload = {
        payment_reference: reference,
        transaction_id: status === "SUCCESS" ? `GP-TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
        status: status,
        amount: amount,
        paid_at: status === "SUCCESS" ? new Date().toISOString() : null,
      };

      const res = await fetch("http://localhost:5001/api/student-payments/govpay/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(`Payment simulation completed: ${status}`);
        setTimeout(() => navigate("/student-management/payment"), 2000);
      } else {
        toast.error(json.message || "Failed to process callback.");
      }
    } catch {
      toast.error("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <ToastContainer position="top-right" />
      
      {/* GovPay Branding */}
      <div className="w-full max-w-md mb-8 flex items-center justify-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <CreditCard className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter">
          Gov<span className="text-blue-600">Pay</span> <span className="font-light text-slate-400">| Sandbox</span>
        </h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate("/student-management/payment")}
              className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Checkout
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-slate-400 text-sm font-medium">Payment Amount</p>
            <h2 className="text-4xl font-black text-slate-900">
              Rs. {Number(amount).toLocaleString()}
            </h2>
            <p className="text-slate-500 text-xs font-mono bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
              Ref: {reference}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This is a <span className="font-bold">Sandbox/Demo</span> page. No real money will be charged. Use the buttons below to simulate different payment outcomes.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSimulatePayment("SUCCESS")}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Simulate Successful Payment
            </button>
            <button
              onClick={() => handleSimulatePayment("FAILED")}
              disabled={loading}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Simulate Failed Payment
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-medium uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            256-bit SSL Encryption
          </div>
          <div className="flex gap-4 opacity-30 grayscale">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-400 text-xs font-medium">
        &copy; 2026 GovPay Gateway Service. All rights reserved.
      </p>
    </div>
  );
}
