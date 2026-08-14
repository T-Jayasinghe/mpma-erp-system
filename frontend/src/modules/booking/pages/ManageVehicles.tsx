import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { Plus, Trash2, Bus, Car, Truck, Wrench, Edit3, Search } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import { useNavigate } from "react-router-dom";

export default function ManageVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const userRole = localStorage.getItem("userRole") || "user";

  const [form, setForm] = useState({
    name: "",
    number: "",
    capacity: "",
    type: "Van",
    acStatus: "AC"
  });

  useEffect(() => {
    if (userRole !== "admin") {
      window.location.href = "/dashboard";
    }
    loadVehicles();
  }, [userRole]);

  const loadVehicles = async () => {
    try {
      const data = await fetchApi('/vehicles');
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      setVehicles(sorted);
    } catch (_error) {
      toast.error("Failed to load vehicles from database");
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      number: v.number,
      capacity: v.capacity.toString(),
      type: v.type,
      acStatus: v.acStatus
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveVehicle = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.number || !form.capacity) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.capacity) <= 0) {
      toast.error("Capacity must be greater than 0");
      return;
    }

    try {
      if (editingId) {
        const updated = await fetchApi(`/vehicles/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        setVehicles(vehicles.map(v => v.id === editingId ? updated : v));
        toast.success("Vehicle updated successfully!");
      } else {
        const newVehicle = await fetchApi('/vehicles', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        setVehicles([...vehicles, newVehicle]);
        toast.success("Vehicle added successfully!");
      }
      
      setEditingId(null);
      setForm({
        name: "",
        number: "",
        capacity: "",
        type: "Van",
        acStatus: "AC"
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add vehicle");
    }
  };

  const deleteVehicle = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmDelete) return;
    
    try {
      await fetchApi(`/vehicles/${id}`, { method: 'DELETE' });
      setVehicles(vehicles.filter(v => v.id !== id));
      toast.success("Vehicle removed successfully!");
    } catch (_error: any) {
      toast.error("Failed to delete vehicle");
    }
  };

  return (
    <DashboardLayout>
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-4 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 justify-center rounded-lg">
              <Bus className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Manage Vehicles
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Add and manage vehicles available for transport booking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Vehicle Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-[190px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              {editingId && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", number: "", capacity: "", type: "Van", acStatus: "AC" });
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleSaveVehicle} className="p-5 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Vehicle Name / Model <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Car className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Toyota Hiace"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Vehicle Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  placeholder="e.g. WP ND-1234"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Car">Car</option>
                    <option value="Mini-bus">Mini-bus</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    A/C <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="acStatus"
                    value={form.acStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 mt-2 shadow-md ${
                  editingId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                }`}
              >
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "Update Vehicle" : "Add Vehicle"}
              </button>
            </form>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">Fleet Registry</h2>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  Total: {vehicles.length}
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search fleet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="p-5">
              {vehicles.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No vehicles added yet</p>
                  <p className="text-sm text-slate-500 mt-1">Use the form to add vehicles to the fleet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles
                    .filter(v => 
                      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      v.number.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((v, index) => (
                    <div key={index} className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {v.type === 'Bus' || v.type === 'Mini-bus' ? <Bus className="w-5 h-5" /> : 
                             v.type === 'Truck' ? <Truck className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 leading-tight">{v.name}</h3>
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                              {v.number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(v)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Vehicle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/manage-maintenance?type=Transport&id=${v.id}&name=${encodeURIComponent(v.name)}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Manage Maintenance"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteVehicle(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-auto pt-3 border-t border-slate-100">
                        <span className="text-slate-500">Capacity: <strong className="text-slate-700">{v.capacity} pax</strong></span>
                        <span className="text-slate-500">Type: <strong className="text-slate-700">{v.type} ({v.acStatus})</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
