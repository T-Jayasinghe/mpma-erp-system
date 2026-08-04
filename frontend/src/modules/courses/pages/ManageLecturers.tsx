import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { 
  Plus, 
  Edit3, 
  Search, 
  Phone, 
  Mail, 
  Home, 
  User, 
  Landmark,
  Download
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import CourseReportModal from "../components/CourseReportModal";
import { parseSriLankanNIC } from "../../../utils/nicParser";

export default function ManageLecturers() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const userRole = localStorage.getItem("userRole") || "user";

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const [form, setForm] = useState({
    fullName: "",
    nicPassport: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    address: "",
    emergencyContact: "",
    bankName: "",
    branchName: "",
    accountHolderName: "",
    accountNumber: "",
    qualifications: "",
    category: "SLPA",
    epfNumber: "",
    department: "",
    companyName: "",
    designation: "",
    status: "Active"
  });

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "officer") {
      window.location.href = "/dashboard";
    }
    loadLecturers();
  }, [userRole]);

  const loadLecturers = async () => {
    try {
      const data = await fetchApi('/lecturers');
      setLecturers(data);
    } catch (error) {
      toast.error("Failed to load lecturers list");
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "nicPassport") {
        const nicInfo = parseSriLankanNIC(value);
        if (nicInfo) {
          updated.dateOfBirth = nicInfo.dob;
          updated.gender = nicInfo.gender;
        }
      }
      return updated;
    });
  };

  const handleEdit = (l: any) => {
    setEditingId(l.id);
    setForm({
      fullName: l.fullName,
      nicPassport: l.nicPassport,
      dateOfBirth: l.dateOfBirth,
      gender: l.gender,
      mobile: l.mobile,
      email: l.email,
      address: l.address,
      emergencyContact: l.emergencyContact,
      bankName: l.bankName,
      branchName: l.branchName,
      accountHolderName: l.accountHolderName,
      accountNumber: l.accountNumber,
      qualifications: l.qualifications || "",
      category: l.category === "Outside" ? "Outside" : "SLPA",
      epfNumber: l.epfNumber || "",
      department: l.department || "",
      companyName: l.companyName || "",
      designation: l.designation || "",
      status: l.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await fetchApi(`/lecturers/${id}/status`, {
        method: 'PATCH'
      });
      setLecturers(lecturers.map(l => l.id === id ? updated : l));
      toast.info(`Lecturer status toggled to ${updated.status}`);
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveLecturer = async (e: any) => {
    e.preventDefault();

    if (!form.fullName || !form.nicPassport || !form.dateOfBirth || !form.mobile || !form.email || !form.address || !form.emergencyContact || !form.bankName || !form.branchName || !form.accountHolderName || !form.accountNumber) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingId) {
        const updated = await fetchApi(`/lecturers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        setLecturers(lecturers.map(l => l.id === editingId ? updated : l));
        toast.success("Lecturer profile updated successfully!");
      } else {
        const newLecturer = await fetchApi('/lecturers', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        setLecturers([...lecturers, newLecturer]);
        toast.success("Lecturer profile registered into registry!");
      }
      
      handleReset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save lecturer");
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setForm({
      fullName: "",
      nicPassport: "",
      dateOfBirth: "",
      gender: "Male",
      mobile: "",
      email: "",
      address: "",
      emergencyContact: "",
      bankName: "",
      branchName: "",
      accountHolderName: "",
      accountNumber: "",
      qualifications: "",
      category: "SLPA",
      epfNumber: "",
      department: "",
      companyName: "",
      designation: "",
      status: "Active"
    });
  };

  // No active stats calculations

  return (
    <DashboardLayout>
      <div className="sticky -top-8 bg-slate-50/95 backdrop-blur-sm z-10 -mx-8 px-8 pt-8 pb-4 mb-6 border-b border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-700 justify-center rounded-lg">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Manage Lecturers
            </h1>
          </div>
          <p className="text-slate-500 font-medium">
            Create and manage lecturer profiles, contact attributes, and payout settings.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-[190px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Lecturer" : "Register Lecturer"}
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
            <form onSubmit={handleSaveLecturer} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
              
              {/* Section 1: Biographical Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1.5">
                  1. Biographical Attributes
                </h3>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Prof. Aruna Perera"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Category / Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-medium"
                    required
                  >
                    <option value="SLPA">SLPA (SLPA Internal / Port Authority Staff)</option>
                    <option value="Outside">Outside (Visiting / External Lecturer)</option>
                  </select>
                </div>

                {/* Conditional Fields based on Category */}
                {form.category === "SLPA" ? (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">SLPA Employee Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">EPF / Service No.</label>
                        <input
                          name="epfNumber"
                          value={form.epfNumber}
                          onChange={handleChange}
                          placeholder="e.g. SLPA-10492"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Department</label>
                        <input
                          name="department"
                          value={form.department}
                          onChange={handleChange}
                          placeholder="e.g. Logistics & Navigation"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Position / Designation</label>
                      <input
                        name="designation"
                        value={form.designation}
                        onChange={handleChange}
                        placeholder="e.g. Senior Harbor Master"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Outside Organization Details</p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Company Name</label>
                      <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Maritime Institute of Colombo"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role</label>
                      <input
                        name="designation"
                        value={form.designation}
                        onChange={handleChange}
                        placeholder="e.g. Visiting Professor / Consultant"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">NIC / Passport</label>
                    <input
                      name="nicPassport"
                      value={form.nicPassport}
                      onChange={handleChange}
                      placeholder="e.g. 199012345678"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile No.</label>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="e.g. 0771234567"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. aruna@domain.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, City, Postal Code"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={form.qualifications || ""}
                    onChange={handleChange}
                    placeholder="e.g. B.Sc. in Marine Engineering, MBA, Certified Safety Officer..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    placeholder="e.g. Spouse - 0777654321"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Section 2: Bank Details */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1.5">
                  2. Remittance Banking
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      placeholder="e.g. Bank of Ceylon"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Branch Name</label>
                    <input
                      name="branchName"
                      value={form.branchName}
                      onChange={handleChange}
                      placeholder="e.g. Fort Branch"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    name="accountHolderName"
                    value={form.accountHolderName}
                    onChange={handleChange}
                    placeholder="e.g. Prof. A. Perera"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    placeholder="e.g. 70123456"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 mt-2 shadow-md ${
                  editingId ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                }`}
              >
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? "Update Lecturer" : "Add Lecturer"}
              </button>
            </form>
          </div>
        </div>

        {/* Directory List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            
            {/* List Utilities */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">Lecturer Registry</h2>
                  <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Total: {lecturers.length}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search lecturers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="px-5 pt-3 pb-1 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/30 text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1">Filter:</span>
              {["All", "SLPA", "Outside"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedCategoryFilter === cat
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {cat === "All" ? "All Categories" : cat === "SLPA" ? "SLPA Staff" : "Outside / Visiting"}
                </button>
              ))}
            </div>

            {/* List Items */}
            <div className="p-5">
              {lecturers.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No lecturers registered yet</p>
                  <p className="text-sm text-slate-500 mt-1">Use the form to register lecturer profiles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lecturers
                    .filter(l => {
                      const matchesSearch = 
                        l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        l.nicPassport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.epfNumber && l.epfNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (l.companyName && l.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
                      
                      const matchesCategory = 
                        selectedCategoryFilter === "All" || 
                        (l.category === "Outside" ? "Outside" : "SLPA") === selectedCategoryFilter;

                      return matchesSearch && matchesCategory;
                    })
                    .map((l, index) => {
                      const nameParts = l.fullName.split(" ");
                      const initials = nameParts.length > 1 
                        ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}` 
                        : l.fullName.substring(0, 2);
                      
                      const category = l.category === "Outside" ? "Outside" : "SLPA";

                      return (
                        <div 
                          key={index} 
                          className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl flex items-center justify-center shrink-0 uppercase">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-800 text-sm truncate leading-tight">{l.fullName}</h3>
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                    category === 'Outside'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-blue-50 border-blue-200 text-blue-700'
                                  }`}>
                                    {category === 'Outside' ? 'Outside' : 'SLPA Staff'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">NIC: {l.nicPassport}</span>
                                </div>
                                {category === 'SLPA' && (l.epfNumber || l.department || l.designation) && (
                                  <p className="text-[11px] text-blue-700 font-medium mt-1 truncate">
                                    {[l.designation, l.department].filter(Boolean).join(' • ')} {l.epfNumber ? `(EPF: ${l.epfNumber})` : ''}
                                  </p>
                                )}
                                {category === 'Outside' && (l.companyName || l.designation) && (
                                  <p className="text-[11px] text-amber-800 font-medium mt-1 truncate">
                                    {[l.designation, l.companyName].filter(Boolean).join(' @ ')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleToggleStatus(l.id)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  l.status === 'Active' 
                                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                                title={l.status === 'Active' ? 'Deactivate Lecturer' : 'Activate Lecturer'}
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(l)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Lecturer profile"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Personal Contact Details */}
                          <div className="space-y-2 py-3 border-t border-slate-100 text-xs text-slate-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{l.mobile}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{l.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{l.address}</span>
                            </div>
                          </div>

                          {/* Qualifications */}
                          {l.qualifications && (
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs mb-3">
                              <p className="font-semibold text-blue-700 mb-1.5 block">Qualifications</p>
                              <p className="text-blue-600 line-clamp-3 whitespace-pre-wrap">{l.qualifications}</p>
                            </div>
                          )}

                          {/* Bank details card display */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate">
                              <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="truncate text-[11px]">
                                <span className="font-semibold text-slate-700 block truncate">{l.bankName}</span>
                                <span className="text-slate-500 block truncate">{l.branchName} • {l.accountNumber}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border shrink-0 ${
                              l.status === 'Active' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {l.status}
                            </span>
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
        type="Lecturers"
        data={lecturers}
      />
    </DashboardLayout>
  );
}
