import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { 
  Plus, 
  Edit3, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  AlertTriangle, 
  UserPlus, 
  Layers, 
  CalendarDays,
  Download
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import CourseReportModal from "../components/CourseReportModal";

export default function ManageBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const userRole = localStorage.getItem("userRole") || "user";

  const [form, setForm] = useState({
    batchCode: "",
    courseId: "",
    startDate: "",
    endDate: "",
    location: "",
    maxStudents: "",
    currentStudents: "0",
    status: "Available"
  });

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "officer") {
      window.location.href = "/dashboard";
    }
    loadBatches();
    loadCourses();
  }, [userRole]);

  const loadBatches = async () => {
    try {
      const data = await fetchApi('/batches');
      setBatches(data);
    } catch (error) {
      toast.error("Failed to load batches");
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchApi('/courses');
      setCourses(data.filter((c: any) => c.status === 'Active'));
    } catch (error) {
      toast.error("Failed to load courses");
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (b: any) => {
    setEditingId(b.id);
    setForm({
      batchCode: b.batchCode,
      courseId: b.courseId,
      startDate: b.startDate,
      endDate: b.endDate,
      location: b.location,
      maxStudents: b.maxStudents.toString(),
      currentStudents: b.currentStudents.toString(),
      status: b.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBatch = async (e: any) => {
    e.preventDefault();

    if (!form.batchCode || !form.courseId || !form.startDate || !form.endDate || !form.location || !form.maxStudents) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.maxStudents) <= 0) {
      toast.error("Max students must be greater than 0");
      return;
    }

    if (Number(form.currentStudents) < 0) {
      toast.error("Current students cannot be negative");
      return;
    }

    if (Number(form.currentStudents) > Number(form.maxStudents)) {
      toast.error("Current students cannot exceed maximum students");
      return;
    }

    const payload = {
      ...form,
      maxStudents: Number(form.maxStudents),
      currentStudents: Number(form.currentStudents)
    };

    try {
      if (editingId) {
        const updated = await fetchApi(`/batches/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setBatches(batches.map(b => b.id === editingId ? updated : b));
        toast.success("Batch configuration updated successfully!");
      } else {
        const newBatch = await fetchApi('/batches', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setBatches([...batches, newBatch]);
        toast.success("Batch successfully created and opened for enrollment!");
      }
      
      handleReset();
      loadBatches();
    } catch (error: any) {
      toast.error(error.message || "Failed to save batch");
    }
  };

  const handleEnroll = async (id: string) => {
    try {
      const res = await fetchApi(`/batches/${id}/enroll`, {
        method: 'POST'
      });
      toast.success(res.message);
      loadBatches();
    } catch (error: any) {
      toast.error(error.message || "Failed to enroll student");
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setForm({
      batchCode: "",
      courseId: "",
      startDate: "",
      endDate: "",
      location: "",
      maxStudents: "",
      currentStudents: "0",
      status: "Available"
    });
  };

  // No active stats calculations

  return (
    <DashboardLayout>
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-4 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 justify-center rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Manage Batches
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Open batch intakes, monitor classroom seating capacity, record student enrollments, and check seat allocations.
          </p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-[190px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Batch" : "Add New Batch"}
              </h2>
              {editingId && (
                <button 
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
            
            <form onSubmit={handleSaveBatch} className="p-5 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch Identifier / Code</label>
                <input
                  name="batchCode"
                  value={form.batchCode}
                  onChange={handleChange}
                  placeholder="e.g. B-DSE-30-01"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Parent Course Offering</label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  required
                >
                  <option value="">-- Associate Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Commencement</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conclusion</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lecture Room / Venue</label>
                <input
                  name="location"
                  value={form.location}
                  placeholder="e.g. Block A Level 02 LH-1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Seats</label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={form.maxStudents}
                    onChange={handleChange}
                    placeholder="e.g. 35"
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Manual Intake</label>
                  <input
                    type="number"
                    name="currentStudents"
                    value={form.currentStudents}
                    onChange={handleChange}
                    disabled={!!editingId}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Academic Intake Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Full">Full</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 mt-2 shadow-md ${
                  editingId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                }`}
              >
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "Update Batch" : "Add Batch"}
              </button>
            </form>
          </div>
        </div>

        {/* Batches Table List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* Filtering Tools */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">Recent Intakes</h2>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                  Total: {batches.length}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-sm"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.courseCode}</option>
                  ))}
                </select>

                <div className="relative w-full sm:w-56">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search batches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-5">
              {batches.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No batches open yet</p>
                  <p className="text-sm text-slate-500 mt-1">Use the form to open a new batch intake.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches
                    .filter(b => 
                      (selectedCourseFilter === "" || b.courseId === selectedCourseFilter) &&
                      (b.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (b.course?.courseName || "").toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((b, index) => {
                      const remaining = b.maxStudents - b.currentStudents;
                      const isFull = b.currentStudents >= b.maxStudents || b.status === 'Full';
                      const fillPercent = Math.min(100, Math.round((b.currentStudents / b.maxStudents) * 100));
                      
                      return (
                        <div 
                          key={index} 
                          className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                                  {b.batchCode}
                                </span>
                                <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider max-w-[250px] truncate">
                                  {b.course?.courseName || "General Intake"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEdit(b)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Batch Details"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {b.status !== 'Completed' && (
                                <button
                                  onClick={() => handleEnroll(b.id)}
                                  disabled={isFull}
                                  className={`p-1.5 rounded-lg transition-all border ${
                                    isFull 
                                      ? "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed" 
                                      : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100"
                                  }`}
                                  title={isFull ? 'Batch capacity limit reached' : 'Record Student Enrollment'}
                                >
                                  <UserPlus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Capacity warning alert message */}
                          {isFull && b.status !== 'Completed' && (
                            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl mb-3">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-xs text-red-800">Batch Capacity Reached (FULL)</h4>
                              </div>
                            </div>
                          )}

                          {/* Horizontal details grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 border-t border-slate-100 text-xs text-slate-600 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{b.startDate} to {b.endDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{b.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{b.currentStudents} / {b.maxStudents} pax</span>
                            </div>
                          </div>

                          {/* Seat progress bar */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs font-semibold text-slate-500">
                              <span>Seat Allocation</span>
                              <span className={fillPercent >= 100 ? "text-red-600 font-bold" : "text-slate-700"}>{fillPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  b.status === 'Completed' ? 'bg-slate-400' :
                                  fillPercent >= 100 ? 'bg-red-500' :
                                  fillPercent >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Footer details row */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500">
                                Seats Remaining: 
                                <strong className={`ml-1 ${remaining === 0 ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                                  {remaining}
                                </strong>
                              </span>
                            </div>
                            <div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                                b.status === 'Available' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                b.status === 'Full' ? 'bg-red-50 border-red-200 text-red-700' : 
                                'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <CourseReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type="Batches"
        data={batches}
        coursesList={courses}
      />
    </DashboardLayout>
  );
}
