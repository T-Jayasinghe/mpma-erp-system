import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { Plus, Trash2, MonitorPlay, School, BookOpen, Wrench, Edit3, Search } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import { useNavigate } from "react-router-dom";

export default function ManageClassrooms() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const userRole = localStorage.getItem("userRole") || "user";

  const [form, setForm] = useState({
    name: "",
    capacity: "",
    location: "",
    isExamReady: false,
    facilities: [] as string[]
  });

  const availableFacilities = [
    "AC",
    "Projector",
    "Whiteboard",
    "Smartboard",
    "Computers",
    "Sound System",
    "Internet/WiFi"
  ];

  useEffect(() => {
    // Redirect non-admins
    if (userRole !== "admin") {
      window.location.href = "/dashboard";
    }
    loadClassrooms();
  }, [userRole]);

  const loadClassrooms = async () => {
    try {
      const data = await fetchApi('/classrooms');
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      setClassrooms(sorted);
    } catch (error) {
      toast.error("Failed to load classrooms");
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleFacilityToggle = (facility: string) => {
    setForm((prev) => {
      const isSelected = prev.facilities.includes(facility);
      if (isSelected) {
        return { ...prev, facilities: prev.facilities.filter(f => f !== facility) };
      } else {
        return { ...prev, facilities: [...prev.facilities, facility] };
      }
    });
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      capacity: c.capacity.toString(),
      location: c.location,
      isExamReady: c.examReady === 'Yes',
      facilities: c.facilities || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveClassroom = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.capacity || !form.location) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.capacity) <= 0) {
      toast.error("Capacity must be greater than 0");
      return;
    }

    try {
      const payload = {
        name: form.name,
        capacity: Number(form.capacity),
        location: form.location,
        examReady: form.isExamReady ? 'Yes' : 'No',
        facilities: form.facilities
      };

      if (editingId) {
        const updated = await fetchApi(`/classrooms/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setClassrooms(classrooms.map(c => c.id === editingId ? updated : c));
        toast.success("Classroom updated successfully!");
      } else {
        const newClassroom = await fetchApi('/classrooms', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setClassrooms([...classrooms, newClassroom]);
        toast.success("Classroom added successfully!");
      }
      
      setEditingId(null);
      setForm({
        name: "",
        capacity: "",
        location: "",
        isExamReady: false,
        facilities: []
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add classroom");
    }
  };

  const deleteClassroom = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this classroom?");
    if (!confirmDelete) return;
    try {
      await fetchApi(`/classrooms/${id}`, { method: 'DELETE' });
      setClassrooms(classrooms.filter(c => c.id !== id));
      toast.success("Classroom removed successfully!");
    } catch (error: any) {
      toast.error("Failed to delete classroom");
    }
  };

  return (
    <DashboardLayout>
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-4 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 text-pink-700 justify-center rounded-lg">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Manage Classrooms
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Add and manage classrooms available for booking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Classroom Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-[190px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Classroom" : "Add New Classroom"}
              </h2>
              {editingId && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", capacity: "", location: "", isExamReady: false, facilities: [] });
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleSaveClassroom} className="p-5 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Classroom Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Hall A, LH-1"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Location / Floor <span className="text-red-500">*</span>
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. 2nd Floor, Main Building"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Exam Ready <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="isExamReady"
                    value={form.isExamReady.toString()}
                    onChange={(e) => setForm({...form, isExamReady: e.target.value === 'true'})}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Included Facilities
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFacilities.map((fac) => {
                    const isSelected = form.facilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => handleFacilityToggle(fac)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isSelected 
                            ? "bg-pink-100 border-pink-200 text-pink-700" 
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {fac}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 mt-2 shadow-md ${
                  editingId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-pink-600 hover:bg-pink-700 shadow-pink-500/20"
                }`}
              >
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "Update Classroom" : "Add Classroom"}
              </button>
            </form>
          </div>
        </div>

        {/* Classrooms List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">Classroom Registry</h2>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  Total: {classrooms.length}
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search classrooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="p-5">
              {classrooms.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <MonitorPlay className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No classrooms added yet</p>
                  <p className="text-sm text-slate-500 mt-1">Use the form to add classrooms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {classrooms
                    .filter(c => 
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      c.location.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((c, index) => (
                    <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-pink-200 hover:shadow-md transition-all group gap-4">
                      
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors">
                          <School className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight flex items-center gap-2">
                            {c.name}
                            {c.isExamReady && (
                              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                Exam Ready
                              </span>
                            )}
                          </h3>
                          <div className="text-sm text-slate-500 mt-1">
                            {c.location} • Capacity: <strong className="text-slate-700">{c.capacity} pax</strong>
                          </div>
                          
                          {Array.isArray(c.facilities) && c.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {c.facilities.map((f: string) => (
                                <span key={f} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center md:flex-col justify-end gap-2 md:border-l md:border-slate-100 md:pl-4">
                        <button
                          onClick={() => handleEdit(c)}
                          className="flex items-center justify-center gap-2 p-2 w-full text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                          title="Edit Classroom"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="text-sm font-medium md:hidden">Edit</span>
                        </button>
                        <button
                          onClick={() => navigate(`/manage-maintenance?type=Classroom&id=${c.id}&name=${encodeURIComponent(c.name)}`)}
                          className="flex items-center justify-center gap-2 p-2 w-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Manage Maintenance"
                        >
                          <Wrench className="w-4 h-4" />
                          <span className="text-sm font-medium md:hidden">Maintenance</span>
                        </button>
                        <button
                          onClick={() => deleteClassroom(c.id)}
                          className="flex items-center justify-center gap-2 p-2 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Remove Classroom"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm font-medium md:hidden">Delete</span>
                        </button>
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
