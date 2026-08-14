import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Save,
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  BookOpen,
  CalendarDays,
  Clock,
  Users,
  FileText,
  School,
  Tags,
  CheckCircle2,
  ListOrdered
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi, formatDate } from "../../../utils/api";

export default function EditClassroomBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    courseName: "",
    audienceType: "",
    batchCode: "",
    participants: "",
    dateFrom: "",
    dateTo: "",
    coordinator: "",
    start: "",
    end: "",
    preferredDates: [] as string[],
    isPaid: "No",
    classroomId: "",
    isExam: "No",
    description: "",
    requestedDate: new Date().toISOString().split("T")[0]
  });

  const availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load classrooms from API
        const classroomData = await fetchApi('/classrooms');
        setClassrooms(classroomData);

        // Load classroom bookings from API and find by UUID
        const bookingsData = await fetchApi('/classroom-bookings');
        const b = bookingsData.find((item: any) => item.id === id);

        if (b) {
          setForm({
            name: b.requestingOfficerName || b.name || "",
            designation: b.designation || "",
            email: b.requestingOfficerEmail || b.email || "",
            courseName: b.courseName || "",
            audienceType: b.audienceType || "",
            batchCode: b.batchCode || "",
            participants: b.numberOfParticipants?.toString() || b.participants || "",
            dateFrom: b.dateFrom || "",
            dateTo: b.dateTo || "",
            coordinator: b.courseCoordinator || b.coordinator || "",
            start: b.timeFrom || b.start || "",
            end: b.timeTo || b.end || "",
            preferredDates: Array.isArray(b.preferredDaysOfWeek) ? b.preferredDaysOfWeek : (Array.isArray(b.preferredDates) ? b.preferredDates : []),
            isPaid: b.paidCourse || b.isPaid || "No",
            classroomId: b.classroomId || "",
            isExam: b.exam || b.isExam || "No",
            description: b.additionalRequirements || b.description || "",
            requestedDate: b.createdAt ? b.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
          });

          if (b.classroomId) {
            const found = classroomData.find((c: any) => c.id === b.classroomId);
            setSelectedClassroom(found || null);
          }
        } else {
          toast.error("Booking not found");
          navigate("/classroom-booking");
        }
      } catch (_err: any) {
        toast.error("Failed to load booking");
        navigate("/classroom-booking");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id, navigate]);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleClassroomChange = (e: any) => {
    const cid = e.target.value;
    setForm({ ...form, classroomId: cid });
    if (cid) {
      const found = classrooms.find(c => c.id === cid);
      setSelectedClassroom(found || null);
    } else {
      setSelectedClassroom(null);
    }
  };

  const handleDayToggle = (day: string) => {
    setForm((prev) => {
      const isSelected = prev.preferredDates.includes(day);
      if (isSelected) {
        return { ...prev, preferredDates: prev.preferredDates.filter(d => d !== day) };
      } else {
        return { ...prev, preferredDates: [...prev.preferredDates, day] };
      }
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.courseName || !form.dateFrom || !form.dateTo || !form.start || !form.end || !form.classroomId) {
      toast.error("Please fill all required fields");
      return;
    }

    if (Number(form.participants) <= 0) {
      toast.error("Participants must be greater than 0");
      return;
    }

    if (form.dateFrom > form.dateTo) {
      toast.error("Date To must be after Date From");
      return;
    }

    if (form.start >= form.end) {
      toast.error("End time must be after start time");
      return;
    }

    if (selectedClassroom && Number(form.participants) > Number(selectedClassroom.capacity)) {
      toast.error(`Participants exceed classroom capacity (${selectedClassroom.capacity})`);
      return;
    }
    
    if (form.isExam === "Yes" && selectedClassroom && !selectedClassroom.isExamReady) {
      toast.error("Selected classroom is not exam ready. Please select an exam-ready classroom.");
      return;
    }

    try {
      await fetchApi(`/classroom-bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          requestingOfficerName: form.name,
          designation: form.designation,
          requestingOfficerEmail: form.email,
          courseName: form.courseName,
          audienceType: form.audienceType,
          batchCode: form.batchCode,
          numberOfParticipants: Number(form.participants),
          dateFrom: form.dateFrom,
          dateTo: form.dateTo,
          courseCoordinator: form.coordinator,
          timeFrom: form.start,
          timeTo: form.end,
          preferredDaysOfWeek: form.preferredDates,
          paidCourse: form.isPaid,
          classroomId: form.classroomId,
          exam: form.isExam,
          additionalRequirements: form.description
        })
      });
      toast.success("Classroom Reservation updated successfully!");
      navigate("/classroom-booking");
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
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Edit Classroom Booking
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Update the details for your existing classroom reservation.
          </p>
        </div>
      </div>

      <div className="max-w-5xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Update Booking</h2>
            <p className="text-sm text-slate-500">Required fields are marked with an asterisk (*)</p>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            Requested Date: <strong className="text-slate-800">{formatDate(form.requestedDate)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            <div className="md:col-span-2">
              <h3 className="text-md font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">1. Requester Information</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Requesting Officer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="e.g. Senior Lecturer"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Requesting Officer Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-md font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">2. Course Information</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Course Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to Programming"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Course Coordinator <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  name="coordinator"
                  value={form.coordinator}
                  onChange={handleChange}
                  placeholder="Coordinator Name"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Audience Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Tags className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    name="audienceType"
                    value={form.audienceType}
                    onChange={handleChange}
                    placeholder="e.g. Undergraduates"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Batch Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ListOrdered className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    name="batchCode"
                    value={form.batchCode}
                    onChange={handleChange}
                    placeholder="e.g. BATCH-23"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Participants <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="participants"
                    value={form.participants}
                    onChange={handleChange}
                    placeholder="50"
                    min="1"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Paid Course?
                </label>
                <select
                  name="isPaid"
                  value={form.isPaid}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-md font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">3. Schedule & Timings</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date From <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <CalendarDays className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    name="dateFrom"
                    value={form.dateFrom}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <CalendarDays className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    name="dateTo"
                    value={form.dateTo}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time From <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    name="start"
                    value={form.start}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    name="end"
                    value={form.end}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Preferred Dates of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {availableDays.map((day) => {
                  const isSelected = form.preferredDates.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        isSelected 
                          ? "bg-brand-100 border-brand-200 text-brand-700 shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-md font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">4. Resource Selection</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Choose Classroom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <School className="w-5 h-5 text-slate-400" />
                </div>
                <select
                  name="classroomId"
                  value={form.classroomId}
                  onChange={handleClassroomChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none appearance-none"
                  required
                >
                  <option value="" disabled>Select a classroom</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Capacity: {c.capacity})
                    </option>
                  ))}
                </select>
                {selectedClassroom && (
                  <div className="mt-3 p-4 bg-slate-100 rounded-xl border border-slate-200">
                     <p className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Selected Classroom Facilities
                     </p>
                     {selectedClassroom.facilities && selectedClassroom.facilities.length > 0 ? (
                       <div className="flex flex-wrap gap-1.5">
                         {selectedClassroom.facilities.map((f: string) => (
                            <span key={f} className="text-xs font-semibold bg-white text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                              {f}
                            </span>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-slate-500">No specific facilities logged for this classroom.</p>
                     )}
                     {selectedClassroom.isExamReady && (
                       <div className="mt-3 inline-block text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md border border-amber-200">
                          Exam Ready
                       </div>
                     )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Is this for an Exam?
              </label>
              <select
                name="isExam"
                value={form.isExam}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Additional Requirements / Things Wanted
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-0 pl-3.5 pointer-events-none">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide any additional requests here..."
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>
            </div>

          </div>

          <div className="mt-10 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
            >
              <Save className="w-5 h-5" />
              Update Reservation
            </button>
          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}
