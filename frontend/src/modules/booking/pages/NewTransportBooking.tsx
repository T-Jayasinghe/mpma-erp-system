import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Save,
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Clock,
  Car,
  MapPin,
  Map,
  FileText
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import MaintenanceWarningModal from "../components/MaintenanceWarningModal";

export default function NewTransportBooking() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await fetchApi('/vehicles');
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      setVehicles(sorted);
    } catch (_error) {
      toast.error("Failed to load vehicles");
    }
  };

  const [form, setForm] = useState({
    requesterName: "",
    designation: "",
    department: "",
    contactNumber: "",
    departureDate: "",
    returnDate: "",
    departureTime: "",
    vehicleId: "",
    pickupLocation: "",
    destination: "",
    passengers: "",
    estimatedKm: "",
    purpose: ""
  });

  const [maintenanceWarnings, setMaintenanceWarnings] = useState<any[]>([]);

  const checkMaintenanceForDate = async (departureDate: string, returnDate: string, vehicle: string) => {
    if (!departureDate) { setMaintenanceWarnings([]); return; }
    try {
      const result = await fetchApi('/maintenances/check-conflict', {
        method: 'POST',
        body: JSON.stringify({
          facilityType: 'Transport',
          facilityId: vehicle || undefined,
          dateFrom: departureDate,
          dateTo: returnDate || departureDate,
          timeFrom: '00:00',
          timeTo: '23:59'
        })
      });
      setMaintenanceWarnings(result.hasConflict ? result.conflicts.map((m: any) => ({
        ...m,
        facilityName: m.classroom?.name || m.vehicle?.name || m.facilityType
      })) : []);
    } catch (_) { setMaintenanceWarnings([]); }
  };

  const handleChange = (e: any) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (e.target.name === 'departureDate' || e.target.name === 'returnDate' || e.target.name === 'vehicleId') {
      checkMaintenanceForDate(
        e.target.name === 'departureDate' ? e.target.value : form.departureDate,
        e.target.name === 'returnDate' ? e.target.value : form.returnDate,
        e.target.name === 'vehicleId' ? e.target.value : form.vehicleId
      );
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.requesterName || !form.contactNumber || !form.department || !form.designation || !form.departureDate || !form.returnDate || !form.vehicleId || !form.departureTime || !form.pickupLocation || !form.destination || !form.passengers || !form.estimatedKm) {
      toast.error("Please fill all required fields");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (form.departureDate < today) {
      toast.error("Cannot book a past departure date");
      return;
    }
    
    if (form.returnDate < form.departureDate) {
      toast.error("Return date must be after or same as departure date");
      return;
    }

    try {
      const maintenanceCheck = await fetchApi('/maintenances/check-conflict', {
        method: 'POST',
        body: JSON.stringify({
          facilityType: 'Transport',
          facilityId: form.vehicleId,
          dateFrom: form.departureDate,
          dateTo: form.returnDate,
          timeFrom: form.departureTime,
          timeTo: form.departureTime
        })
      });

      if (maintenanceCheck.hasConflict) {
        // Only block if the maintenance is for THIS specific vehicle OR it's a general transport block
        const specificConflict = maintenanceCheck.conflicts.find((m: any) => 
          !m.facilityId || m.facilityId === form.vehicleId
        );

        if (specificConflict) {
          toast.error(`Selected vehicle is under maintenance: ${specificConflict.title}`);
          return;
        }
      }

      const payload = {
        ...form,
        passengers: Number(form.passengers),
        purpose: form.purpose || "Trip",
        requestedDate: today
      };

      await fetchApi('/transport-bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      toast.success("Transport request submitted successfully!");
      navigate("/transport-booking");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    }
  };

  return (
    <DashboardLayout>
      <MaintenanceWarningModal
        warnings={maintenanceWarnings}
        onClose={() => setMaintenanceWarnings([])}
      />
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            New Transport Request
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Fill out the details below to request a vehicle for your trip.
          </p>
        </div>
      </div>

      <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Trip Details</h2>
          <p className="text-sm text-slate-500">Required fields are marked with an asterisk (*)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Requester Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Requester Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="w-5 h-5 text-slate-400" /></div>
                <input name="requesterName" value={form.requesterName} onChange={handleChange} placeholder="Full Name" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Designation <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="w-5 h-5 text-slate-400" /></div>
                <input name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Lecturer / Manager" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Division */}
            <div className="relative group">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Division <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="w-5 h-5 text-slate-400" /></div>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. IT / Engineering" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="w-5 h-5 text-slate-400" /></div>
                <input name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="0xxxxxxxxx" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Departure Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Departure Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="w-5 h-5 text-slate-400" /></div>
                <input type="date" min={new Date().toISOString().split("T")[0]} name="departureDate" value={form.departureDate} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Return Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="w-5 h-5 text-slate-400" /></div>
                <input type="date" min={new Date().toISOString().split("T")[0]} name="returnDate" value={form.returnDate} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Departure Time <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Clock className="w-5 h-5 text-slate-400" /></div>
                <input type="time" name="departureTime" value={form.departureTime} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Choose Vehicle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Choose Vehicle <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Car className="w-5 h-5 text-slate-400" /></div>
                <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none appearance-none" required>
                  <option value="" disabled>Select a vehicle</option>
                  {vehicles.length === 0 && <option value="" disabled>No vehicles available</option>}
                  {vehicles.map((v) => (
                    <option key={v.id || v._id} value={v.id || v._id}>{v.name} ({v.type} - {v.isAc ? 'AC' : 'Non-AC'}) - Cap: {v.capacity}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pickup Location <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="w-5 h-5 text-slate-400" /></div>
                <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="e.g. Main Gate" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Destination <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Map className="w-5 h-5 text-slate-400" /></div>
                <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Colombo Port" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Participants */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Passengers <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" name="passengers" value={form.passengers} onChange={handleChange} placeholder="E.g., 5" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>

            {/* Estimated KM */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated KM <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type="number" name="estimatedKm" value={form.estimatedKm} onChange={handleChange} placeholder="E.g., 50" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none" required />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Trip Purpose / Description <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute top-3.5 left-0 pl-3.5 pointer-events-none">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <textarea name="purpose" value={form.purpose} onChange={handleChange} placeholder="Provide details about the trip..." rows={4} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none resize-none" required />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"><Save className="w-5 h-5" />Submit Request</button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
