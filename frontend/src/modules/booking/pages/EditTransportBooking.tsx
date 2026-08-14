import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Save, ArrowLeft, User, Phone, Calendar, Clock, Car, MapPin, Map, FileText, Briefcase, Building2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";

export default function EditTransportBooking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    requesterName: "",
    designation: "",
    department: "",
    contactNumber: "",
    departureDate: "",
    returnDate: "",
    departureTime: "",
    pickupLocation: "",
    destination: "",
    purpose: "",
    vehicleId: "",
    estimatedKm: "",
    status: "Pending"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleData, bookingData] = await Promise.all([
          fetchApi('/vehicles'),
          fetchApi('/transport-bookings')
        ]);
        const sortedVehicles = [...vehicleData].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        setVehicles(sortedVehicles);

        const booking = bookingData.find((b: any) => b.id === id);
        if (booking) {
          setForm({
            requesterName: booking.requesterName || "",
            designation: booking.designation || "",
            department: booking.department || "",
            contactNumber: booking.contactNumber || "",
            departureDate: booking.departureDate || "",
            returnDate: booking.returnDate || "",
            departureTime: booking.departureTime || "",
            pickupLocation: booking.pickupLocation || "",
            destination: booking.destination || "",
            purpose: booking.purpose || "",
            vehicleId: booking.vehicleId || "",
            estimatedKm: booking.estimatedKm || "",
            status: booking.status || "Pending"
          });
        } else {
          toast.error("Booking not found");
          navigate("/transport-booking");
        }
      } catch (_err: any) {
        toast.error("Failed to load booking");
        navigate("/transport-booking");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id, navigate]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.requesterName || !form.contactNumber || !form.departureDate || !form.returnDate || !form.vehicleId || !form.departureTime || !form.pickupLocation || !form.destination || !form.estimatedKm) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.returnDate < form.departureDate) {
      toast.error("Return date must be after or same as departure date");
      return;
    }

    try {
      await fetchApi(`/transport-bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          requesterName: form.requesterName,
          designation: form.designation,
          department: form.department,
          contactNumber: form.contactNumber,
          departureDate: form.departureDate,
          returnDate: form.returnDate,
          departureTime: form.departureTime,
          pickupLocation: form.pickupLocation,
          destination: form.destination,
          purpose: form.purpose,
          vehicleId: form.vehicleId,
          estimatedKm: form.estimatedKm
        })
      });
      toast.success("Transport request updated successfully!");
      navigate("/transport-booking");
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Edit Transport Request</h1>
          <p className="text-slate-500 font-medium mt-1">Update the details for booking ID: {id?.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Booking Details</h2>
            <p className="text-sm text-slate-500">Required fields are marked with an asterisk (*)</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            form.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
            form.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
            'bg-amber-100 text-amber-700 border-amber-200'
          }`}>
            Status: {form.status}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Requester Name *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="w-5 h-5 text-slate-400" /></div>
                <input name="requesterName" value={form.requesterName} onChange={handleChange} placeholder="Full name" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Designation *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Briefcase className="w-5 h-5 text-slate-400" /></div>
                <input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior Officer" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Division *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Building2 className="w-5 h-5 text-slate-400" /></div>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Admin" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="w-5 h-5 text-slate-400" /></div>
                <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="e.g. 0771234567" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Departure Date *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="w-5 h-5 text-slate-400" /></div>
                <input type="date" name="departureDate" value={form.departureDate} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Return Date *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="w-5 h-5 text-slate-400" /></div>
                <input type="date" name="returnDate" value={form.returnDate} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Departure Time *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Clock className="w-5 h-5 text-slate-400" /></div>
                <input type="time" name="departureTime" value={form.departureTime} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Choose Vehicle *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Car className="w-5 h-5 text-slate-400" /></div>
                <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all appearance-none" required>
                  <option value="" disabled>Select a vehicle</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.name} ({v.type} - {v.acStatus})</option>))}
                </select></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pickup Location *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="w-5 h-5 text-slate-400" /></div>
                <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="e.g. MPMA Main Gate" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Destination *</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Map className="w-5 h-5 text-slate-400" /></div>
                <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Colombo Port" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required /></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated KM *</label>
              <div className="relative">
                <input type="number" name="estimatedKm" value={form.estimatedKm} onChange={handleChange} placeholder="e.g. 50" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all" required />
              </div>
            </div>

          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Trip Purpose / Description *</label>
            <div className="relative"><div className="absolute top-3.5 left-0 pl-3.5 pointer-events-none"><FileText className="w-5 h-5 text-slate-400" /></div>
              <textarea name="purpose" value={form.purpose} onChange={handleChange} rows={4} placeholder="Describe the purpose of this trip..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all resize-none" required /></div>
          </div>

          <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"><Save className="w-5 h-5" />Update Request</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
