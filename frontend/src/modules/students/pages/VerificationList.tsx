import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Search,
  User,
  Mail,
  BookOpen,
  ClipboardCheck,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Clock,
} from "lucide-react";
import { fetchApi } from "../../../utils/api";

interface VerificationApplication {
  id: string;
  applicationNumber?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  course?: string;
  studentCategory?: string;
  registrationDate?: string;
  createdAt?: string;
  status?: string;
  [key: string]: unknown;
}

const getTimeSince = (date?: string) => {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  if (isNaN(diff)) return "Recently";
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

export default function VerificationList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await fetchApi("/students/pending")) as { students?: VerificationApplication[] };
      setApplications(data?.students || []);
    } catch {
      toast.error("Failed to load pending applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filtered = applications.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.course?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Application Verification
              </h1>
            </div>
            <p className="text-slate-500 font-medium">
              Review and approve pending student applications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadApplications}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Info Banner */}
        {applications.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {applications.length} application{applications.length !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Click on any application to open the full review & checklist.
              </p>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" />
              Pending Applications
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {filtered.length}
              </span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading applications...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No pending applications</p>
                  <p className="text-sm text-slate-400">All caught up! No applications need review.</p>
                </div>
              </div>
            ) : (
              filtered.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/student-management/verification/${app.id}`)}
                  className="flex items-center gap-4 p-5 hover:bg-slate-50 cursor-pointer transition-all group"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {app.firstName?.[0]}{app.lastName?.[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-800">
                        {app.firstName} {app.lastName}
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 uppercase">
                        Pending Review
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="w-3 h-3" /> {app.email}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <BookOpen className="w-3 h-3" /> {app.course}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" /> {app.studentCategory || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0 hidden sm:flex">
                    <Clock className="w-3.5 h-3.5" />
                    {getTimeSince(app.createdAt)}
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
