import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import BookingCalendar from "../components/BookingCalendar";
import { toast } from "react-toastify";
import { 
  Plus, 
  CheckCircle, 
  XOctagon, 
  Trash2, 
  Edit3, 
  BookOpen,
  Calendar,
  Clock,
  Users,
  Filter,
  Download,
  FileText,
  Search
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi, formatDate } from "../../../utils/api";
import { generateBookingSlip, generateListReport } from "../../../utils/PDFGenerator";
import CustomModal from "../components/CustomModal";
import ReportExportModal from "../components/ReportExportModal";

export default function ClassroomBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });
  const userRole = localStorage.getItem("userRole") || "user";

  useEffect(() => {
    loadBookings();
    loadMaintenances();
    loadClassrooms();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await fetchApi('/classroom-bookings');
      setBookings(data);
    } catch (_error) {
      toast.error("Failed to load classroom bookings");
    }
  };

  const loadMaintenances = async () => {
    try {
      const data = await fetchApi('/maintenances');
      setMaintenances(data.filter((m: any) => m.facilityType === 'General' || m.facilityType === 'Classroom'));
    } catch (error) {
      console.error("Failed to load maintenances", error);
    }
  };

  const loadClassrooms = async () => {
    try {
      const data = await fetchApi('/classrooms');
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      setClassrooms(sorted);
    } catch (error) {
      console.error("Failed to load classrooms", error);
    }
  };

  const filteredBookings = selectedClassroom === "all" 
    ? bookings 
    : bookings.filter(b => (b.classroomId || b.classroom?.id) === selectedClassroom);

  const filteredMaintenances = selectedClassroom === "all"
    ? maintenances
    : maintenances.filter(m => m.facilityType === 'General' || m.facilityId === selectedClassroom);

  const updateStatus = async (id: string, status: string) => {
    try {
      const updated = await fetchApi(`/classroom-bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setBookings(bookings.map(b => b.id === id ? updated : b));
      if (status === "Approved") toast.success("Reservation approved!");
      if (status === "Rejected") toast.error("Reservation rejected!");
    } catch (_error) {
      toast.error("Failed to update status");
    }
  };

  const deleteBooking = async (id: string, name: string) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Reservation",
      message: `Are you sure you want to delete the reservation for "${name}"? This action cannot be undone.`,
      type: "danger",
      confirmText: "Delete Now",
      onConfirm: async () => {
        try {
          await fetchApi(`/classroom-bookings/${id}`, { method: 'DELETE' });
          setBookings(bookings.filter(b => b.id !== id));
          toast.success("Booking deleted successfully!");
        } catch (_error) {
          toast.error("Failed to delete booking");
        }
      }
    });
  };

  const denyBooking = async (id: string, name: string) => {
    setModalConfig({
      isOpen: true,
      title: "Deny Reservation",
      message: `Are you sure you want to deny (cancel) the reservation for "${name}"? This will inform the administration that you are no longer proceeding with this booking.`,
      type: "warning",
      confirmText: "Yes, Deny",
      onConfirm: async () => {
        try {
          await fetchApi(`/classroom-bookings/${id}/status`, { 
            method: 'PATCH',
            body: JSON.stringify({ status: 'Denied' })
          });
          loadBookings();
          toast.success("Booking denied successfully!");
        } catch (_error) {
          toast.error("Failed to deny booking");
        }
      }
    });
  };

  const handleExportList = (filters: { startDate: string; endDate: string; scope: string }) => {
    const { startDate, endDate, scope } = filters;
    
    // Filter bookings by date and scope
    const reportBookings = bookings.filter(b => {
      const bDate = new Date(b.dateFrom || b.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const isInRange = (!start || bDate >= start) && (!end || bDate <= end);
      const isCorrectScope = scope === "all" || (b.classroomId || b.classroom?.id) === scope;
      
      return isInRange && isCorrectScope;
    });

    if (reportBookings.length === 0) {
      toast.warning("No bookings found for the selected period and scope.");
      return;
    }

    const columns = ["Requester", "Course", "Classroom", "Dates", "Time Slot", "Status"];
    const rows = reportBookings.map(b => [
      b.requestingOfficerName || b.name || 'N/A',
      b.courseName || 'N/A',
      b.classroom?.name || 'N/A',
      `${formatDate(b.dateFrom)} - ${formatDate(b.dateTo)}`,
      `${b.timeFrom || b.start || 'N/A'} - ${b.timeTo || b.end || 'N/A'}`,
      b.status
    ]);
    
    const dateRange = startDate && endDate 
      ? `(${startDate} to ${endDate})` 
      : startDate ? `(From ${startDate})` : endDate ? `(Until ${endDate})` : "(All Time)";

    const selectedClassroomName = scope !== "all" 
      ? classrooms.find(c => c.id === scope)?.name || "Classroom"
      : "Classroom";

    const title = scope === "all" 
      ? `Classroom Bookings ${dateRange}`
      : `${selectedClassroomName} Report ${dateRange}`;

    generateListReport(title, columns, rows);
    toast.success(`Exporting ${reportBookings.length} records...`);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Approved</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">Rejected</span>;
      case "Denied":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">Denied</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Pending</span>;
    }
  };

  return (
    <DashboardLayout>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 justify-center rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Classroom Bookings
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Manage and monitor reservations for lecture halls and classrooms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-semibold"
          >
            <Download className="w-5 h-5 text-slate-400" />
            Export Report
          </button>
          <button
            onClick={() => navigate("/new-classroom-booking")}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
            <p className="text-3xl font-extrabold text-slate-800 leading-tight mt-0.5">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-extrabold text-amber-600 leading-tight mt-0.5">{bookings.filter(b => b.status === 'Pending').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</p>
            <p className="text-3xl font-extrabold text-emerald-600 leading-tight mt-0.5">{bookings.filter(b => b.status === 'Approved').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-red-100 text-red-600">
            <XOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
            <p className="text-3xl font-extrabold text-red-600 leading-tight mt-0.5">{bookings.filter(b => b.status === 'Rejected').length}</p>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Availability Schedule
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
              >
                <option value="all">All Classrooms</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50/50 p-2">
          <BookingCalendar bookings={filteredBookings} maintenances={filteredMaintenances} />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Requests</h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Total: {bookings.length}
            </span>
          </div>
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text"
              placeholder="Search by requester or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none shadow-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-4 pl-6 whitespace-nowrap">Requester</th>
                <th className="p-4 whitespace-nowrap">Schedule</th>
                <th className="p-4 whitespace-nowrap">Participants</th>
                <th className="p-4 whitespace-nowrap text-center">Status</th>
                <th className="p-4 pr-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="w-12 h-12 text-emerald-200 mb-3" />
                      <p className="font-medium text-slate-600">No bookings found</p>
                      <p className="text-sm mt-1">There are currently no reservations for classrooms.</p>
                      <button 
                        onClick={() => navigate("/new-booking?type=classroom")}
                        className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-100"
                      >
                        Create the first one
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings
                  .filter(b => {
                    const search = searchQuery.toLowerCase();
                    return (
                      (b.name || b.requestingOfficerName || "").toLowerCase().includes(search) ||
                      (b.courseName || "").toLowerCase().includes(search)
                    );
                  })
                  .map((b, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    
                    <td className="p-4 pl-6 align-middle">
                      <div className="font-semibold text-slate-800">{b.courseName || b.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Requester: {b.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: #CLS-{1000 + index}</div>
                    </td>
                    
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-medium whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {b.dateFrom && b.dateTo ? `${formatDate(b.dateFrom)} to ${formatDate(b.dateTo)}` : formatDate(b.date)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 whitespace-nowrap">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {b.start} - {b.end}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        <Users className="w-4 h-4 text-slate-400" />
                        {b.participants} pax
                      </div>
                    </td>

                    <td className="p-4 align-middle text-center">
                      <StatusBadge status={b.status} />
                    </td>

                    <td className="p-4 pr-6 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {userRole === "admin" && b.status === "Pending" && (
                          <div className="flex bg-slate-100 rounded-lg p-1 mr-2 border border-slate-200">
                            <button title="Approve" onClick={() => updateStatus(b.id, "Approved")} className="p-1.5 text-emerald-600 hover:bg-white rounded-md transition-colors"><CheckCircle className="w-4 h-4" /></button>
                            <div className="w-px bg-slate-200 mx-0.5"></div>
                            <button title="Reject" onClick={() => updateStatus(b.id, "Rejected")} className="p-1.5 text-red-600 hover:bg-white rounded-md transition-colors"><XOctagon className="w-4 h-4" /></button>
                          </div>
                        )}

                        <button title="Edit" onClick={() => navigate(`/edit-classroom-booking/${b.id}`)} className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 hover:text-brand-700 rounded-lg transition-colors border border-brand-100"><Edit3 className="w-4 h-4" /></button>
                        
                        <button 
                          title="Download Slip" 
                          onClick={() => generateBookingSlip('Classroom', b)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        {userRole === "admin" ? (
                          <button 
                            title="Hard Delete" 
                            onClick={() => deleteBooking(b.id, b.courseName || b.name)} 
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          b.status !== "Denied" && (
                            <button 
                              title="Deny Booking" 
                              onClick={() => denyBooking(b.id, b.courseName || b.name)} 
                              className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors border border-slate-200"
                            >
                              <XOctagon className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportList}
        type="Classroom"
        options={classrooms}
      />

      <CustomModal 
        {...modalConfig} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
      />
    </DashboardLayout>
  );
}