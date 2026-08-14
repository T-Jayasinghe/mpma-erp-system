import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { 
  Plus, 
  Edit3, 
  Search, 
  BookOpen, 
  Clock, 
  Globe, 
  MapPin, 
  Users, 
  Power, 
  FileText,
  X,
  GraduationCap,
  Sparkles,
  Layers,
  Download,
  Filter,
  ChevronDown
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import CourseReportModal from "../components/CourseReportModal";

export default function ManageCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [assignedLecturersByCourse, setAssignedLecturersByCourse] = useState<Record<string, any[]>>({});
  const [lecturerSelections, setLecturerSelections] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStream, setSelectedStream] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const userRole = localStorage.getItem("userRole") || "user";

  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    stream: "",
    description: "",
    duration: "",
    medium: "English",
    location: "",
    maxParticipants: "",
    registrationFee: "",
    courseFee: "",
    schedule: "Weekday",
    type: "Full Time",
    mode: "Physical"
  });

  const [maxInstallments, setMaxInstallments] = useState<number>(1);
  const [installmentAmounts, setInstallmentAmounts] = useState<string[]>(["", "", ""]);

  const autoSplitInstallments = (count: number, totalFeeStr: string) => {
    const total = Number(totalFeeStr) || 0;
    if (count <= 1 || total <= 0) {
      setInstallmentAmounts(["", "", ""]);
      return;
    }
    const equalShare = Math.floor(total / count);
    const remainder = total - (equalShare * count);
    const amounts = Array(count).fill(equalShare.toString());
    amounts[0] = (equalShare + remainder).toString();
    while (amounts.length < 3) amounts.push("");
    setInstallmentAmounts(amounts);
  };

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "officer") {
      window.location.href = "/dashboard";
    }
    loadCoursesAndLecturers();
  }, [userRole]);

  const loadCoursesAndLecturers = async () => {
    try {
      const [coursesData, lecturerData] = await Promise.all([
        fetchApi('/courses'),
        fetchApi('/lecturers')
      ]);

      setCourses(coursesData);
      setLecturers(lecturerData.filter((lecturer: any) => lecturer.status === 'Active'));

      const assignmentResults = await Promise.all(
        coursesData.map(async (course: any) => {
          try {
            const assigned = await fetchApi(`/courses/${course.id}/lecturers`);
            return [course.id, assigned];
          } catch {
            return [course.id, []];
          }
        })
      );

      setAssignedLecturersByCourse(Object.fromEntries(assignmentResults));
    } catch (error) {
      toast.error("Failed to load courses and lecturers");
    }
  };

  const loadCourseLecturers = async (courseId: string) => {
    try {
      const assigned = await fetchApi(`/courses/${courseId}/lecturers`);
      setAssignedLecturersByCourse((prev) => ({ ...prev, [courseId]: assigned }));
    } catch (error) {
      toast.error("Failed to load assigned lecturers");
    }
  };

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    const instCount = Number(c.maxInstallments) || 1;
    setMaxInstallments(instCount);
    
    let instArray: string[] = ["", "", ""];
    if (Array.isArray(c.installmentAmounts)) {
      instArray = c.installmentAmounts.map((amt: any) => String(amt));
    } else if (typeof c.installmentAmounts === "string") {
      try {
        const parsed = JSON.parse(c.installmentAmounts);
        if (Array.isArray(parsed)) instArray = parsed.map((amt: any) => String(amt));
      } catch {}
    }
    while (instArray.length < 3) instArray.push("");
    setInstallmentAmounts(instArray);

    setForm({
      courseCode: c.courseCode,
      courseName: c.courseName,
      stream: c.stream,
      description: c.description || "",
      duration: c.duration,
      medium: c.medium,
      location: c.location,
      maxParticipants: c.maxParticipants.toString(),
      registrationFee: c.registrationFee.toString(),
      courseFee: c.courseFee.toString(),
      schedule: c.schedule || "Weekday",
      type: c.type || "Full Time",
      mode: c.mode || "Physical"
    });
    setShowEditModal(true);
  };

  const handleSaveCourse = async (e: any) => {
    e.preventDefault();

    if (!form.courseCode || !form.courseName || !form.stream || !form.duration || !form.location || !form.maxParticipants || !form.registrationFee || !form.courseFee) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.maxParticipants) <= 0) {
      toast.error("Max participants must be greater than 0");
      return;
    }

    const parsedInstAmounts = installmentAmounts.slice(0, maxInstallments).map(v => Number(v) || 0);

    if (maxInstallments > 1) {
      const sumInst = parsedInstAmounts.reduce((a, b) => a + b, 0);
      const totalCourseFee = Number(form.courseFee);
      if (sumInst !== totalCourseFee) {
        toast.error(`Sum of installment amounts (Rs. ${sumInst.toLocaleString()}) must equal the Course Fee (Rs. ${totalCourseFee.toLocaleString()})`);
        return;
      }
    }

    const payload = {
      ...form,
      maxParticipants: Number(form.maxParticipants),
      registrationFee: Number(form.registrationFee),
      courseFee: Number(form.courseFee),
      maxInstallments,
      installmentAmounts: maxInstallments > 1 ? parsedInstAmounts : []
    };

    try {
      if (editingId) {
        const updated = await fetchApi(`/courses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setCourses(courses.map(c => c.id === editingId ? updated : c));
        toast.success("Course details successfully updated!");
      } else {
        const newCourse = await fetchApi('/courses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setCourses([...courses, newCourse]);
        toast.success("Course registered into registry successfully!");
      }

      await loadCoursesAndLecturers();
      handleReset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save course");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await fetchApi(`/courses/${id}/status`, {
        method: 'PATCH'
      });
      setCourses(courses.map(c => c.id === id ? updated : c));
      toast.info(`Course code ${updated.courseCode} is now ${updated.status}`);
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setShowEditModal(false);
    setMaxInstallments(1);
    setInstallmentAmounts(["", "", ""]);
    setForm({
      courseCode: "",
      courseName: "",
      stream: "",
      description: "",
      duration: "",
      medium: "English",
      location: "",
      maxParticipants: "",
      registrationFee: "",
      courseFee: "",
      schedule: "Weekday",
      type: "Full Time",
      mode: "Physical"
    });
  };

  const handleAssignLecturer = async (courseId: string) => {
    const selectedLecturerId = lecturerSelections[courseId];

    if (!selectedLecturerId) {
      toast.error("Please select a lecturer before assigning");
      return;
    }

    try {
      await fetchApi(`/courses/${courseId}/lecturers`, {
        method: 'POST',
        body: JSON.stringify({ lecturerId: selectedLecturerId })
      });

      setLecturerSelections((prev) => ({ ...prev, [courseId]: "" }));
      await loadCourseLecturers(courseId);
      toast.success("Lecturer assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign lecturer");
    }
  };

  const handleRemoveLecturer = async (courseId: string, lecturerId: string) => {
    try {
      await fetchApi(`/courses/${courseId}/lecturers/${lecturerId}`, {
        method: 'DELETE'
      });
      await loadCourseLecturers(courseId);
      toast.info("Lecturer removed from course");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove lecturer");
    }
  };

  // Get unique streams for filtering
  const streams = ["All", ...Array.from(new Set(courses.map(c => c.stream).filter(Boolean)))];

  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.stream.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStream = selectedStream === "All" || c.stream === selectedStream;
    return matchesSearch && matchesStream;
  });

  const activeCount = courses.filter(c => c.status === 'Active').length;

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-5 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Manage Courses
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Configure curriculum templates, fee matrices, and academic streams.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {courses.length}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-700">Total Courses</p>
              <p className="text-slate-400 text-[11px]">{activeCount} Active</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-700">Streams</p>
              <p className="text-slate-400 text-[11px]">{streams.length - 1} Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Column (5 cols) */}
        <div className="lg:col-span-4 sticky top-24 max-h-[calc(100vh-200px)] flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">
                  {editingId ? "Edit Course Template" : "Register New Course"}
                </h2>
              </div>
              {editingId && (
                <button 
                  onClick={handleReset}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleSaveCourse} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
              
              {/* Basic Identifiers */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                  <input
                    name="courseCode"
                    value={form.courseCode}
                    onChange={handleChange}
                    placeholder="e.g. C-DSE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Name *</label>
                  <input
                    name="stream"
                    value={form.stream}
                    onChange={handleChange}
                    placeholder="e.g. IT & Software"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program Name *</label>
                <input
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  placeholder="e.g. Diploma in Software Engineering"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Delivery Attributes */}
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Delivery Settings
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Schedule</label>
                    <select
                      name="schedule"
                      value={form.schedule}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Weekday">Weekday</option>
                      <option value="Weekend">Weekend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Mode</label>
                    <select
                      name="mode"
                      value={form.mode}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="Physical">Physical</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Duration & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medium</label>
                  <select
                    name="medium"
                    value={form.medium}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration *</label>
                  <input
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="e.g. 6 Months"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Lab 02"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={form.maxParticipants}
                    onChange={handleChange}
                    placeholder="e.g. 40"
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {/* Financial Matrix & Installment Plan */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-3">
                 <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                   <span className="text-emerald-600 font-black text-xs bg-emerald-100 px-1.5 py-0.5 rounded">LKR</span> Fee Structure & Installment Options (LKR)
                 </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Registration Fee</label>
                    <input
                      type="number"
                      name="registrationFee"
                      value={form.registrationFee}
                      onChange={handleChange}
                      placeholder="1500"
                      min="0"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Course Fee</label>
                    <input
                      type="number"
                      name="courseFee"
                      value={form.courseFee}
                      onChange={(e) => {
                        handleChange(e);
                        if (maxInstallments > 1) {
                          autoSplitInstallments(maxInstallments, e.target.value);
                        }
                      }}
                      placeholder="45000"
                      min="0"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Max Installments Selection (Max 3 as requested) */}
                <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Payment Installments (Max 3)
                    </label>
                    {maxInstallments > 1 && (
                      <button
                        type="button"
                        onClick={() => autoSplitInstallments(maxInstallments, form.courseFee)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      >
                        Auto-Split Equally
                      </button>
                    )}
                  </div>
                  <select
                    value={maxInstallments}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setMaxInstallments(count);
                      autoSplitInstallments(count, form.courseFee);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value={1}>1 Payment (Full Payment Only)</option>
                    <option value={2}>2 Installments Plan</option>
                    <option value={3}>3 Installments Plan (Maximum 3)</option>
                  </select>

                  {/* Individual Installment Amounts Input */}
                  {maxInstallments > 1 && (
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Set Installment Amounts
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: maxInstallments }).map((_, idx) => (
                          <div key={idx}>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              Inst. {idx + 1} (LKR)
                            </label>
                            <input
                              type="number"
                              value={installmentAmounts[idx] || ""}
                              onChange={(e) => {
                                const newAmts = [...installmentAmounts];
                                newAmts[idx] = e.target.value;
                                setInstallmentAmounts(newAmts);
                              }}
                              placeholder={`Amount ${idx + 1}`}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-right pt-1">
                        {(() => {
                          const sum = installmentAmounts.slice(0, maxInstallments).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
                          const target = Number(form.courseFee) || 0;
                          const matches = sum === target && target > 0;
                          return (
                            <span className={matches ? "text-emerald-600" : "text-amber-600"}>
                              Total: LKR {sum.toLocaleString()} / LKR {target.toLocaleString()} {matches ? "✓ Matches" : "⚠️ Must equal Course Fee"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Syllabus Overview</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Outline key academic outcomes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white transition-all hover:-translate-y-0.5 shadow-md ${
                    editingId 
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                  }`}
                >
                  {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? "Update Course Template" : "Save Course to Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Course Registry Column (7 cols) */}
        <div className="lg:col-span-8 sticky top-24 max-h-[calc(100vh-200px)] flex flex-col space-y-4">
          
          {/* Filter & Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            
            {/* Category Stream Dropdown */}
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-600">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                {streams.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream === "All" ? "All Streams / Categories" : stream}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Search Input & Export Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="relative w-full sm:w-56">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  type="text"
                  placeholder="Search code, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-6">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">No courses found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedStream !== "All" 
                  ? "No results matched your search criteria. Try clearing the filter."
                  : "Use the form on the left to register your first course curriculum."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((c) => {
                const assignedIds = new Set((assignedLecturersByCourse[c.id] || []).map((lecturer: any) => lecturer.id));
                const availableLecturers = lecturers.filter((lecturer: any) => lecturer.status === 'Active' && !assignedIds.has(lecturer.id));
                const assignedCount = (assignedLecturersByCourse[c.id] || []).length;

                return (
                  <div 
                    key={c.id} 
                    className="flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                  >
                    {/* Top Header Row */}
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 via-white to-white">
                      
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-wider shrink-0">
                            {c.courseCode}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg truncate">
                            {c.stream}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleStatus(c.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              c.status === 'Active' 
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                                : 'text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={c.status === 'Active' ? 'Deactivate Program' : 'Activate Program'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Program"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {c.courseName}
                      </h3>

                      {/* Delivery Mode Pills Row */}
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-slate-500">
                        {c.schedule && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100/60 font-semibold">
                            {c.schedule}
                          </span>
                        )}
                        {c.type && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100/60 font-semibold">
                            {c.type}
                          </span>
                        )}
                        {c.mode && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100/60 font-semibold">
                            {c.mode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      
                      {/* Description if present */}
                      {c.description ? (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No syllabus description added.</p>
                      )}

                      {/* Key Attributes 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{c.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{c.medium}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{c.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{c.maxParticipants} PAX</span>
                        </div>
                      </div>

                      {/* Assigned Lecturers Section */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Assigned Lecturers
                          </span>
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {assignedCount}
                          </span>
                        </div>

                        {/* Lecturer Chips */}
                        {assignedCount > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                            {(assignedLecturersByCourse[c.id] || []).map((lecturer: any) => (
                              <span 
                                key={lecturer.id} 
                                className="inline-flex items-center gap-1 bg-indigo-50/80 border border-indigo-100 text-indigo-800 text-[11px] font-medium px-2 py-0.5 rounded-lg"
                              >
                                <span className="truncate max-w-[110px]">{lecturer.fullName}</span>
                                <button
                                  onClick={() => handleRemoveLecturer(c.id, lecturer.id)}
                                  className="text-indigo-400 hover:text-rose-600 rounded p-0.5 transition-colors"
                                  title="Remove lecturer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No lecturer assigned yet.</p>
                        )}

                        {/* Assign Control Bar */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <select
                            value={lecturerSelections[c.id] || ""}
                            onChange={(e) => setLecturerSelections((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500 truncate"
                          >
                            <option value="">+ Add Lecturer</option>
                            {availableLecturers.map((lecturer: any) => (
                              <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignLecturer(c.id)}
                            disabled={!lecturerSelections[c.id]}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shrink-0 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Pricing & Status */}
                    <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block leading-none">Course Fee</span>
                        <span className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5 block">
                          LKR {Number(c.courseFee || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Reg: LKR {Number(c.registrationFee || 0).toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                          c.status === 'Active' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {c.status}
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

      {/* ═══════════════════════════════════════════════════════
           EDIT COURSE MODAL
      ════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Edit Course Template</h2>
                  <p className="text-xs text-slate-500 font-medium">Update curriculum configuration for <span className="font-bold text-amber-700">{form.courseName}</span></p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <form onSubmit={handleSaveCourse} className="flex flex-col min-h-0 flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                {/* Basic Identifiers */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                    <input
                      name="courseCode" value={form.courseCode} onChange={handleChange}
                      placeholder="e.g. C-DSE"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stream Name *</label>
                    <input
                      name="stream" value={form.stream} onChange={handleChange}
                      placeholder="e.g. IT & Software"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Program Name *</label>
                  <input
                    name="courseName" value={form.courseName} onChange={handleChange}
                    placeholder="e.g. Diploma in Software Engineering"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>

                {/* Delivery Settings */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" /> Delivery Settings
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Schedule</label>
                      <select name="schedule" value={form.schedule} onChange={handleChange}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500">
                        <option value="Weekday">Weekday</option>
                        <option value="Weekend">Weekend</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                      <select name="type" value={form.type} onChange={handleChange}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500">
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Mode</label>
                      <select name="mode" value={form.mode} onChange={handleChange}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500">
                        <option value="Physical">Physical</option>
                        <option value="Online">Online</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Duration & Capacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medium</label>
                    <select name="medium" value={form.medium} onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none">
                      <option value="English">English</option>
                      <option value="Sinhala">Sinhala</option>
                      <option value="Tamil">Tamil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration *</label>
                    <input name="duration" value={form.duration} onChange={handleChange}
                      placeholder="e.g. 6 Months"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
                    <input name="location" value={form.location} onChange={handleChange}
                      placeholder="e.g. Lab 02"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity *</label>
                    <input type="number" name="maxParticipants" value={form.maxParticipants} onChange={handleChange}
                      placeholder="e.g. 40" min="1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                      required />
                  </div>
                </div>

                {/* Fee Structure & Installments */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/80 space-y-3">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-emerald-600 font-black text-xs bg-emerald-100 px-1.5 py-0.5 rounded">LKR</span> Fee Structure & Installment Options (LKR)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Registration Fee</label>
                      <input type="number" name="registrationFee" value={form.registrationFee} onChange={handleChange}
                        placeholder="1500" min="0"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold"
                        required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Course Fee</label>
                      <input type="number" name="courseFee" value={form.courseFee}
                        onChange={(e) => { handleChange(e); if (maxInstallments > 1) autoSplitInstallments(maxInstallments, e.target.value); }}
                        placeholder="45000" min="0"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold"
                        required />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700">Payment Installments (Max 3)</label>
                      {maxInstallments > 1 && (
                        <button type="button" onClick={() => autoSplitInstallments(maxInstallments, form.courseFee)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer">
                          Auto-Split Equally
                        </button>
                      )}
                    </div>
                    <select value={maxInstallments} onChange={(e) => { const count = Number(e.target.value); setMaxInstallments(count); autoSplitInstallments(count, form.courseFee); }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold cursor-pointer">
                      <option value={1}>1 Payment (Full Payment Only)</option>
                      <option value={2}>2 Installments Plan</option>
                      <option value={3}>3 Installments Plan (Maximum 3)</option>
                    </select>

                    {maxInstallments > 1 && (
                      <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Set Installment Amounts</p>
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: maxInstallments }).map((_, idx) => (
                            <div key={idx}>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Inst. {idx + 1} (LKR)</label>
                              <input type="number" value={installmentAmounts[idx] || ""}
                                onChange={(e) => { const newAmts = [...installmentAmounts]; newAmts[idx] = e.target.value; setInstallmentAmounts(newAmts); }}
                                placeholder={`Amount ${idx + 1}`}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none" />
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] font-bold text-right pt-1">
                          {(() => {
                            const sum = installmentAmounts.slice(0, maxInstallments).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
                            const target = Number(form.courseFee) || 0;
                            const matches = sum === target && target > 0;
                            return <span className={matches ? "text-emerald-600" : "text-amber-600"}>Total: LKR {sum.toLocaleString()} / LKR {target.toLocaleString()} {matches ? "✓ Matches" : "⚠️ Must equal Course Fee"}</span>;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Syllabus */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Syllabus Overview</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Outline key academic outcomes..." rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none" />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Update Course Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CourseReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type="Courses"
        data={courses}
        streamsList={streams.filter(s => s !== "All")}
      />
    </DashboardLayout>
  );
}

