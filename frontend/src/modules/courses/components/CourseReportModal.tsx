import { useState } from "react";
import { X, FileText, Download, Filter, Calendar, FileSpreadsheet } from "lucide-react";
import { exportToCSV, generateCoursesReport, generateBatchesReport, generateLecturersReport } from "../../../utils/PDFGenerator";

interface CourseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Courses' | 'Batches' | 'Lecturers';
  data: any[];
  coursesList?: any[];
  streamsList?: string[];
}

export default function CourseReportModal({
  isOpen,
  onClose,
  type,
  data,
  coursesList = [],
  streamsList = []
}: CourseReportModalProps) {
  // Filters state
  const [courseFilters, setCourseFilters] = useState({
    stream: "All",
    mode: "All",
    schedule: "All",
    status: "All",
    search: ""
  });

  const [batchFilters, setBatchFilters] = useState({
    courseId: "",
    status: "All",
    startDate: "",
    endDate: "",
    search: ""
  });

  const [lecturerFilters, setLecturerFilters] = useState({
    category: "All",
    status: "All",
    department: "",
    search: ""
  });

  if (!isOpen) return null;

  // Filter evaluation logic
  const getFilteredData = () => {
    if (type === 'Courses') {
      return data.filter((c: any) => {
        const matchesStream = courseFilters.stream === "All" || c.stream === courseFilters.stream;
        const matchesMode = courseFilters.mode === "All" || c.mode === courseFilters.mode;
        const matchesSchedule = courseFilters.schedule === "All" || c.schedule === courseFilters.schedule;
        const matchesStatus = courseFilters.status === "All" || c.status === courseFilters.status;
        const matchesSearch = !courseFilters.search || 
          (c.courseCode?.toLowerCase().includes(courseFilters.search.toLowerCase()) ||
           c.courseName?.toLowerCase().includes(courseFilters.search.toLowerCase()));
        return matchesStream && matchesMode && matchesSchedule && matchesStatus && matchesSearch;
      });
    }

    if (type === 'Batches') {
      return data.filter((b: any) => {
        const matchesCourse = !batchFilters.courseId || b.courseId === batchFilters.courseId;
        const matchesStatus = batchFilters.status === "All" || b.status === batchFilters.status;
        
        let matchesStartDate = true;
        if (batchFilters.startDate && b.startDate) {
          matchesStartDate = new Date(b.startDate) >= new Date(batchFilters.startDate);
        }

        let matchesEndDate = true;
        if (batchFilters.endDate && b.endDate) {
          matchesEndDate = new Date(b.endDate) <= new Date(batchFilters.endDate);
        }

        const matchesSearch = !batchFilters.search || 
          b.batchCode?.toLowerCase().includes(batchFilters.search.toLowerCase()) ||
          b.location?.toLowerCase().includes(batchFilters.search.toLowerCase());

        return matchesCourse && matchesStatus && matchesStartDate && matchesEndDate && matchesSearch;
      });
    }

    if (type === 'Lecturers') {
      return data.filter((l: any) => {
        const matchesCategory = lecturerFilters.category === "All" || 
          (lecturerFilters.category === "SLPA" ? l.category !== "Outside" : l.category === "Outside");
        const matchesStatus = lecturerFilters.status === "All" || l.status === lecturerFilters.status;
        const matchesDept = !lecturerFilters.department || 
          (l.department?.toLowerCase().includes(lecturerFilters.department.toLowerCase()) ||
           l.companyName?.toLowerCase().includes(lecturerFilters.department.toLowerCase()));
        const matchesSearch = !lecturerFilters.search || 
          l.fullName?.toLowerCase().includes(lecturerFilters.search.toLowerCase()) ||
          l.email?.toLowerCase().includes(lecturerFilters.search.toLowerCase()) ||
          l.mobile?.toLowerCase().includes(lecturerFilters.search.toLowerCase());

        return matchesCategory && matchesStatus && matchesDept && matchesSearch;
      });
    }

    return data;
  };

  const filteredItems = getFilteredData();

  const handleExportPDF = () => {
    if (type === 'Courses') {
      generateCoursesReport(filteredItems, courseFilters);
    } else if (type === 'Batches') {
      generateBatchesReport(filteredItems, coursesList, batchFilters);
    } else if (type === 'Lecturers') {
      generateLecturersReport(filteredItems, lecturerFilters);
    }
    onClose();
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (type === 'Courses') {
      const headers = ['Course Code', 'Course Title', 'Stream', 'Duration', 'Mode', 'Schedule', 'Max Participants', 'Registration Fee (LKR)', 'Course Fee (LKR)', 'Status'];
      const rows = filteredItems.map(c => [
        c.courseCode || '',
        c.courseName || '',
        c.stream || '',
        c.duration || '',
        c.mode || 'Physical',
        c.schedule || '',
        c.maxParticipants || '',
        c.registrationFee || 0,
        c.courseFee || 0,
        c.status || 'Active'
      ]);
      exportToCSV(`courses_report_${timestamp}.csv`, headers, rows);
    } else if (type === 'Batches') {
      const getCourseName = (courseId: string) => {
        const course = coursesList.find((c: any) => c.id === courseId);
        return course ? `${course.courseCode} - ${course.courseName}` : courseId || '';
      };
      const headers = ['Batch Code', 'Course', 'Location', 'Start Date', 'End Date', 'Enrolled Students', 'Max Capacity', 'Occupancy Rate', 'Status'];
      const rows = filteredItems.map(b => {
        const enrolled = Number(b.currentStudents || 0);
        const maxCap = Number(b.maxStudents || 0);
        const occupancy = maxCap > 0 ? `${Math.round((enrolled / maxCap) * 100)}%` : '0%';
        return [
          b.batchCode || '',
          getCourseName(b.courseId),
          b.location || '',
          b.startDate || '',
          b.endDate || '',
          enrolled,
          maxCap,
          occupancy,
          b.status || 'Available'
        ];
      });
      exportToCSV(`batches_report_${timestamp}.csv`, headers, rows);
    } else if (type === 'Lecturers') {
      const headers = ['Lecturer Name', 'Category', 'NIC / Passport', 'Mobile', 'Email', 'Department / Company', 'Designation', 'Status'];
      const rows = filteredItems.map(l => [
        l.fullName || '',
        l.category === 'Outside' ? 'Outside' : 'SLPA Internal',
        l.nicPassport || '',
        l.mobile || '',
        l.email || '',
        l.category === 'Outside' ? (l.companyName || '') : (l.department || ''),
        l.designation || '',
        l.status || 'Active'
      ]);
      exportToCSV(`lecturers_report_${timestamp}.csv`, headers, rows);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Download {type} Report</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course Management Module</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Form Controls based on Type */}
          <div className="space-y-4">
            {type === 'Courses' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Stream
                    </label>
                    <select
                      value={courseFilters.stream}
                      onChange={(e) => setCourseFilters({ ...courseFilters, stream: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Streams</option>
                      {streamsList.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Mode
                    </label>
                    <select
                      value={courseFilters.mode}
                      onChange={(e) => setCourseFilters({ ...courseFilters, mode: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Modes</option>
                      <option value="Physical">Physical</option>
                      <option value="Online">Online</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Schedule
                    </label>
                    <select
                      value={courseFilters.schedule}
                      onChange={(e) => setCourseFilters({ ...courseFilters, schedule: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Schedules</option>
                      <option value="Weekday">Weekday</option>
                      <option value="Weekend">Weekend</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Status
                    </label>
                    <select
                      value={courseFilters.status}
                      onChange={(e) => setCourseFilters({ ...courseFilters, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Search Course Code / Title
                  </label>
                  <input
                    type="text"
                    placeholder="Search by code or title..."
                    value={courseFilters.search}
                    onChange={(e) => setCourseFilters({ ...courseFilters, search: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </>
            )}

            {type === 'Batches' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Course Filter
                  </label>
                  <select
                    value={batchFilters.courseId}
                    onChange={(e) => setBatchFilters({ ...batchFilters, courseId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                  >
                    <option value="">All Courses</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} - {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Status
                    </label>
                    <select
                      value={batchFilters.status}
                      onChange={(e) => setBatchFilters({ ...batchFilters, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Available">Available</option>
                      <option value="Full">Full</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Search Batch Code / Location
                    </label>
                    <input
                      type="text"
                      placeholder="Search batch code..."
                      value={batchFilters.search}
                      onChange={(e) => setBatchFilters({ ...batchFilters, search: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Start Date (From)
                    </label>
                    <input
                      type="date"
                      value={batchFilters.startDate}
                      onChange={(e) => setBatchFilters({ ...batchFilters, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      End Date (To)
                    </label>
                    <input
                      type="date"
                      value={batchFilters.endDate}
                      onChange={(e) => setBatchFilters({ ...batchFilters, endDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {type === 'Lecturers' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Category
                    </label>
                    <select
                      value={lecturerFilters.category}
                      onChange={(e) => setLecturerFilters({ ...lecturerFilters, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="SLPA">SLPA Internal</option>
                      <option value="Outside">Outside External</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Status
                    </label>
                    <select
                      value={lecturerFilters.status}
                      onChange={(e) => setLecturerFilters({ ...lecturerFilters, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Filter by Department / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Marine Operations..."
                    value={lecturerFilters.department}
                    onChange={(e) => setLecturerFilters({ ...lecturerFilters, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Search Lecturer Name / Email / Phone
                  </label>
                  <input
                    type="text"
                    placeholder="Search by lecturer name..."
                    value={lecturerFilters.search}
                    onChange={(e) => setLecturerFilters({ ...lecturerFilters, search: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Results Counter summary */}
          <div className="my-5 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Matching Report Records:</span>
            <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={filteredItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-3 rounded-2xl shadow-lg shadow-brand-500/20 transition-all font-semibold text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all font-semibold text-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
