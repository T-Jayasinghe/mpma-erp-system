import { useState, useEffect } from "react";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { toast } from "react-toastify";
import { 
  Plus, 
  Edit3, 
  Search, 
  User, 
  Landmark,
  Download,
  Power,
  Info,
  X
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { fetchApi } from "../../../utils/api";
import CourseReportModal from "../components/CourseReportModal";
import { parseSriLankanNIC } from "../../../utils/nicParser";
import { SRI_LANKA_BANKS } from "../../../data/sriLankaBanks";

export default function ManageLecturers() {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingLecturer, setViewingLecturer] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const userRole = localStorage.getItem("userRole") || "user";

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Bank DB state for dynamic options
  const [dbBranches, setDbBranches] = useState<any[]>([]);

  const [editForm, setEditForm] = useState({
    id: "",
    fullName: "",
    stream: "",
    nicPassport: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    address: "",
    emergencyContact: "",
    bankName: "",
    branchName: "",
    centralBankCode: "",
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

  const [form, setForm] = useState({
    fullName: "",
    stream: "",
    nicPassport: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    address: "",
    emergencyContact: "",
    bankName: "",
    branchName: "",
    centralBankCode: "",
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

  const loadDbBranches = async () => {
    try {
      const branchesData = await fetchApi('/banks/branches').catch(() => []);
      if (Array.isArray(branchesData)) {
        setDbBranches(branchesData);
      }
    } catch (_err) {
      console.error("Failed to load db bank branches", err);
    }
  };

  const getMergedBankList = () => {
    const staticBanks = SRI_LANKA_BANKS.map(b => b.bankName);
    const dbBankNames = dbBranches.map(b => b.bankName);
    const allNames = Array.from(new Set([...staticBanks, ...dbBankNames]));
    return allNames.sort();
  };

  const getMergedBranchList = (selectedBankName: string) => {
    if (!selectedBankName) return [];
    const staticBank = SRI_LANKA_BANKS.find(b => b.bankName === selectedBankName);
    const staticBranches = staticBank ? staticBank.branches : [];
    
    const dbMatching = dbBranches
      .filter(b => b.bankName.toLowerCase() === selectedBankName.toLowerCase())
      .map(b => ({ name: b.branchName, centralBankCode: b.centralBankCode, slpaCode: b.slpaCode, id: b.id }));

    const branchMap = new Map();
    staticBranches.forEach(br => branchMap.set(br.name.toUpperCase(), br));
    dbMatching.forEach(br => branchMap.set(br.name.toUpperCase(), br));

    return Array.from(branchMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleBankChange = (selectedBankName: string) => {
    setForm(prev => ({
      ...prev,
      bankName: selectedBankName,
      branchName: "",
      centralBankCode: ""
    }));
  };

  const handleBranchChange = (selectedBranchName: string) => {
    const branches = getMergedBranchList(form.bankName);
    const branch = branches.find(br => br.name === selectedBranchName);
    setForm(prev => ({
      ...prev,
      branchName: selectedBranchName,
      centralBankCode: branch ? branch.centralBankCode : prev.centralBankCode
    }));
  };

  const handleEditBankChange = (selectedBankName: string) => {
    setEditForm(prev => ({
      ...prev,
      bankName: selectedBankName,
      branchName: "",
      centralBankCode: ""
    }));
  };

  const handleEditBranchChange = (selectedBranchName: string) => {
    const branches = getMergedBranchList(editForm.bankName);
    const branch = branches.find(br => br.name === selectedBranchName);
    setEditForm(prev => ({
      ...prev,
      branchName: selectedBranchName,
      centralBankCode: branch ? branch.centralBankCode : prev.centralBankCode
    }));
  };

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "officer") {
      window.location.href = "/dashboard";
    }
    loadLecturers();
    loadDbBranches();
  }, [userRole]);

  const loadLecturers = async () => {
    try {
      const [data, coursesData] = await Promise.all([
        fetchApi('/lecturers'),
        fetchApi('/courses').catch(() => [])
      ]);
      setLecturers(data);
      setCourses(coursesData || []);
    } catch (_error) {
      toast.error("Failed to load lecturers list");
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "nicPassport") {
        const cleanNic = value.trim();
        if (cleanNic.length >= 9) {
          // Check if lecturer already exists in registry by NIC
          const existing = lecturers.find(
            l => l.nicPassport && l.nicPassport.trim().toLowerCase() === cleanNic.toLowerCase()
          );

          if (existing) {
            toast.info(`Found existing profile for ${existing.fullName}. Profile details completed.`);
            return {
              ...updated,
              fullName: existing.fullName || updated.fullName,
              stream: existing.stream || updated.stream,
              category: existing.category === "Outside" ? "Outside" : "SLPA",
              epfNumber: existing.epfNumber || "",
              department: existing.department || "",
              companyName: existing.companyName || "",
              designation: existing.designation || "",
              dateOfBirth: existing.dateOfBirth || updated.dateOfBirth,
              gender: existing.gender || updated.gender,
              mobile: existing.mobile || updated.mobile,
              email: existing.email || updated.email,
              address: existing.address || updated.address,
              emergencyContact: existing.emergencyContact || updated.emergencyContact,
              bankName: existing.bankName || updated.bankName,
              branchName: existing.branchName || updated.branchName,
              centralBankCode: existing.centralBankCode || updated.centralBankCode,
              accountHolderName: existing.accountHolderName || updated.accountHolderName,
              accountNumber: existing.accountNumber || updated.accountNumber,
              qualifications: existing.qualifications || updated.qualifications
            };
          }
        }

        // If not found in existing records, parse NIC for DOB & Gender
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
    setEditForm({
      id: l.id,
      fullName: l.fullName || "",
      stream: l.stream || "",
      nicPassport: l.nicPassport || "",
      dateOfBirth: l.dateOfBirth || "",
      gender: l.gender || "Male",
      mobile: l.mobile || "",
      email: l.email || "",
      address: l.address || "",
      emergencyContact: l.emergencyContact || "",
      bankName: l.bankName || "",
      branchName: l.branchName || "",
      centralBankCode: l.centralBankCode || "",
      accountHolderName: l.accountHolderName || "",
      accountNumber: l.accountNumber || "",
      qualifications: l.qualifications || "",
      category: l.category === "Outside" ? "Outside" : "SLPA",
      epfNumber: l.epfNumber || "",
      department: l.department || "",
      companyName: l.companyName || "",
      designation: l.designation || "",
      status: l.status || "Active"
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: any) => {
    const { name, value } = e.target;
    setEditForm(prev => {
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

  const handleUpdateLecturer = async (e: any) => {
    e.preventDefault();

    if (!editForm.fullName || !editForm.nicPassport || !editForm.dateOfBirth || !editForm.mobile || !editForm.email || !editForm.address || !editForm.emergencyContact || !editForm.bankName || !editForm.branchName || !editForm.accountHolderName || !editForm.accountNumber) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const updated = await fetchApi(`/lecturers/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setLecturers(lecturers.map(l => l.id === editForm.id ? updated : l));
      toast.success("Lecturer profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update lecturer");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await fetchApi(`/lecturers/${id}/status`, {
        method: 'PATCH'
      });
      setLecturers(lecturers.map(l => l.id === id ? updated : l));
      toast.info(`Lecturer status toggled to ${updated.status}`);
    } catch (_error: any) {
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
      stream: "",
      nicPassport: "",
      dateOfBirth: "",
      gender: "Male",
      mobile: "",
      email: "",
      address: "",
      emergencyContact: "",
      bankName: "",
      branchName: "",
      centralBankCode: "",
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-1 sticky top-24 max-h-[calc(100vh-200px)] flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                Register Lecturer
              </h2>
            </div>
            <form onSubmit={handleSaveLecturer} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 space-y-5 flex-1 overflow-y-auto scrollbar-thin">
              
              {/* Section 1: Biographical Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1.5">
                  1. Biographical Attributes
                </h3>
                
                {/* NIC / Passport FIRST */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    NIC / Passport Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nicPassport"
                    value={form.nicPassport}
                    onChange={handleChange}
                    placeholder="e.g. 199012345678"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter NIC to auto-complete existing profile or calculate DOB & Gender.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Academic Stream / Specialization
                  </label>
                  <select
                    name="stream"
                    value={form.stream}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-medium"
                  >
                    <option value="">-- Select Academic Stream --</option>
                    {Array.from(new Set([
                      "Management & IS",
                      "Maritime & Seamanship",
                      "Occupational Health & Safety",
                      "Port Operation & Logistics",
                      "Technical",
                      ...courses.map((c: any) => c.stream).filter(Boolean)
                    ])).map((stream) => (
                      <option key={stream} value={stream}>{stream}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Fields based on Category */}
                {form.category === "SLPA" ? (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">SLPA Employee Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Number</label>
                        <input
                          name="epfNumber"
                          value={form.epfNumber}
                          onChange={handleChange}
                          placeholder="e.g. SLPA-10492"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Division</label>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth *</label>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. *</label>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="e.g. 0771234567"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      name="emergencyContact"
                      value={form.emergencyContact}
                      onChange={handleChange}
                      placeholder="e.g. 0779998877"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
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
              </div>

              {/* Section 2: Bank Details */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1.5">
                  2. Remittance Banking
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name *</label>
                    <select
                      name="bankName"
                      value={form.bankName}
                      onChange={(e) => handleBankChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {getMergedBankList().map((bName) => (
                        <option key={bName} value={bName}>
                          {bName}
                        </option>
                      ))}
                      <option value="Other">Other Bank</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Branch Name *</label>
                      {(() => {
                        const branches = getMergedBranchList(form.bankName);
                        if (branches.length > 0) {
                          return (
                            <select
                              name="branchName"
                              value={form.branchName}
                              onChange={(e) => handleBranchChange(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all cursor-pointer"
                              required
                            >
                              <option value="">-- Select Branch --</option>
                              {branches.map((br: any) => (
                                <option key={br.name} value={br.name}>
                                  {br.name} ({br.centralBankCode || 'No Code'})
                                </option>
                              ))}
                              <option value="Other">Other Branch</option>
                            </select>
                          );
                        }
                        return (
                          <input
                            name="branchName"
                            value={form.branchName}
                            onChange={handleChange}
                            placeholder="e.g. Fort Branch"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                            required
                          />
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Central Bank Code</label>
                      <input
                        name="centralBankCode"
                        value={form.centralBankCode}
                        onChange={handleChange}
                        placeholder="e.g. 7010060"
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-700 outline-none"
                      />
                    </div>
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
              </div>

              {/* Fixed Footer with Submit Button */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 shadow-md bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Directory List Column */}
        <div className="lg:col-span-2 sticky top-24 max-h-[calc(100vh-200px)] flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            
            {/* List Utilities */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-4 shrink-0">
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
            <div className="px-5 pt-3 pb-1 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/30 text-xs font-semibold shrink-0">
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

            {/* Table Section */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {lecturers.filter(l => {
                const matchesSearch = 
                  l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  l.nicPassport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (l.stream && l.stream.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (l.epfNumber && l.epfNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (l.companyName && l.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
                
                const matchesCategory = 
                  selectedCategoryFilter === "All" || 
                  (l.category === "Outside" ? "Outside" : "SLPA") === selectedCategoryFilter;

                return matchesSearch && matchesCategory;
              }).length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-5">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm">No lecturers found</p>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new lecturer profile.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Lecturer Name</th>
                      <th className="py-3.5 px-4">Academic Stream</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {lecturers
                      .filter(l => {
                        const matchesSearch = 
                          l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.nicPassport.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.stream && l.stream.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.epfNumber && l.epfNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.companyName && l.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
                        
                        const matchesCategory = 
                          selectedCategoryFilter === "All" || 
                          (l.category === "Outside" ? "Outside" : "SLPA") === selectedCategoryFilter;

                        return matchesSearch && matchesCategory;
                      })
                      .map((l) => {
                        const nameParts = l.fullName.split(" ");
                        const initials = nameParts.length > 1 
                          ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}` 
                          : l.fullName.substring(0, 2);
                        
                        const category = l.category === "Outside" ? "Outside" : "SLPA";

                        return (
                          <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Lecturer Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl flex items-center justify-center shrink-0 uppercase">
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-xs">{l.fullName}</p>
                                </div>
                              </div>
                            </td>

                            {/* Academic Stream */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {l.stream ? (
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                                  {l.stream}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Unassigned</span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                                category === 'Outside'
                                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                                {category === 'Outside' ? 'Outside' : 'SLPA Staff'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewingLecturer(l)}
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="View Lecturer Full Details"
                                >
                                  <Info className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(l.id)}
                                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                    l.status === 'Active' 
                                      ? 'text-emerald-600 hover:bg-emerald-50' 
                                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                  }`}
                                  title={l.status === 'Active' ? 'Deactivate Lecturer' : 'Activate Lecturer'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(l)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Lecturer profile"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Full Details Modal Popup */}
      {viewingLecturer && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setViewingLecturer(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl flex items-center justify-center uppercase">
                  {viewingLecturer.fullName.split(" ").length > 1 
                    ? `${viewingLecturer.fullName.split(" ")[0].charAt(0)}${viewingLecturer.fullName.split(" ")[viewingLecturer.fullName.split(" ").length - 1].charAt(0)}`
                    : viewingLecturer.fullName.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{viewingLecturer.fullName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      viewingLecturer.status === 'Active' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${viewingLecturer.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {viewingLecturer.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      viewingLecturer.category === 'Outside'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      {viewingLecturer.category === 'Outside' ? 'Outside / Visiting' : 'SLPA Internal Staff'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingLecturer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 scrollbar-thin">
              
              {/* Academic Stream & Category Summary */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-purple-50/50 rounded-xl border border-purple-100/80">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Category / Source</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {viewingLecturer.category === "Outside" ? "Outside (Visiting / External)" : "SLPA Staff (Internal)"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Academic Stream</p>
                  <p className="font-bold text-indigo-700 text-xs mt-0.5">
                    {viewingLecturer.stream || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Identity Details */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Identity Attributes
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIC / Passport</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs">{viewingLecturer.nicPassport}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gender</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.dateOfBirth}</span>
                  </div>
                </div>
              </div>

              {/* Employment Attributes */}
              {viewingLecturer.category === "SLPA" ? (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                  <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">SLPA Employee Information</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Employee Number</span>
                      <span className="font-semibold text-slate-800">{viewingLecturer.epfNumber || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Division</span>
                      <span className="font-semibold text-slate-800">{viewingLecturer.department || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px]">Designation</span>
                      <span className="font-semibold text-slate-800">{viewingLecturer.designation || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-2">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Outside Organization Details</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Company / Organization</span>
                      <span className="font-semibold text-slate-800">{viewingLecturer.companyName || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Role / Designation</span>
                      <span className="font-semibold text-slate-800">{viewingLecturer.designation || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Attributes */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Contact Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile No.</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Address</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.address}</span>
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              {viewingLecturer.qualifications && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                    Qualifications & Credentials
                  </p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                    {viewingLecturer.qualifications}
                  </p>
                </div>
              )}

              {/* Bank & Payout Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-500" /> Bank & Payout Attributes
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bank Name</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Branch Name</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Central Bank Code</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingLecturer.centralBankCode || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Holder</span>
                    <span className="font-semibold text-slate-800">{viewingLecturer.accountHolderName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Number</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingLecturer.accountNumber}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewingLecturer(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lecturer Modal Popup */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 to-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Edit Lecturer Profile</h2>
                  <p className="text-xs text-slate-500">Update biographical attributes, payout, and specialization details.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUpdateLecturer} className="p-6 overflow-y-auto space-y-5 max-h-[75vh] scrollbar-thin">
              
              {/* Section 1: Biographical Attributes */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1.5">
                  1. Biographical & Categorization Attributes
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleEditChange}
                    placeholder="e.g. Prof. Aruna Perera"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category / Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium"
                      required
                    >
                      <option value="SLPA">SLPA (Internal / Port Authority Staff)</option>
                      <option value="Outside">Outside (Visiting / External)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Stream / Specialization
                    </label>
                    <select
                      name="stream"
                      value={editForm.stream}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium"
                    >
                      <option value="">-- Select Academic Stream --</option>
                      {Array.from(new Set([
                        "Management & IS",
                        "Maritime & Seamanship",
                        "Occupational Health & Safety",
                        "Port Operation & Logistics",
                        "Technical",
                        ...courses.map((c: any) => c.stream).filter(Boolean)
                      ])).map((stream) => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Category Fields */}
                {editForm.category === "SLPA" ? (
                  <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">SLPA Employee Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Number</label>
                        <input
                          name="epfNumber"
                          value={editForm.epfNumber}
                          onChange={handleEditChange}
                          placeholder="e.g. SLPA-10492"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Division</label>
                        <input
                          name="department"
                          value={editForm.department}
                          onChange={handleEditChange}
                          placeholder="e.g. Logistics & Navigation"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Position / Designation</label>
                      <input
                        name="designation"
                        value={editForm.designation}
                        onChange={handleEditChange}
                        placeholder="e.g. Senior Harbor Master"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                        value={editForm.companyName}
                        onChange={handleEditChange}
                        placeholder="e.g. Maritime Institute of Colombo"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role</label>
                      <input
                        name="designation"
                        value={editForm.designation}
                        onChange={handleEditChange}
                        placeholder="e.g. Visiting Professor / Consultant"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">NIC / Passport *</label>
                    <input
                      name="nicPassport"
                      value={editForm.nicPassport}
                      onChange={handleEditChange}
                      placeholder="e.g. 199012345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={editForm.gender}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editForm.dateOfBirth}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile No. *</label>
                    <input
                      name="mobile"
                      value={editForm.mobile}
                      onChange={handleEditChange}
                      placeholder="e.g. 0771234567"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="e.g. lecturer@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact No. *</label>
                  <input
                    name="emergencyContact"
                    value={editForm.emergencyContact}
                    onChange={handleEditChange}
                    placeholder="e.g. 0779998877"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    placeholder="Street, City, Postal Code"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={editForm.qualifications}
                    onChange={handleEditChange}
                    placeholder="e.g. B.Sc. in Marine Engineering, MBA..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Financial & Bank Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-slate-500" /> Bank & Payout Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name *</label>
                    <select
                      name="bankName"
                      value={editForm.bankName}
                      onChange={(e) => handleEditBankChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Select Bank --</option>
                      {getMergedBankList().map((bName) => (
                        <option key={bName} value={bName}>
                          {bName}
                        </option>
                      ))}
                      <option value="Other">Other Bank</option>
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                    {(() => {
                      const branches = getMergedBranchList(editForm.bankName);
                      if (branches.length > 0) {
                        return (
                          <select
                            name="branchName"
                            value={editForm.branchName}
                            onChange={(e) => handleEditBranchChange(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                            required
                          >
                            <option value="">-- Select Branch --</option>
                            {branches.map((br: any) => (
                              <option key={br.name} value={br.name}>
                                {br.name} ({br.centralBankCode || 'No Code'})
                              </option>
                            ))}
                            <option value="Other">Other Branch</option>
                          </select>
                        );
                      }
                      return (
                        <input
                          name="branchName"
                          value={editForm.branchName}
                          onChange={handleEditChange}
                          placeholder="e.g. Colombo Fort"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                          required
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Central Bank Code</label>
                    <input
                      name="centralBankCode"
                      value={editForm.centralBankCode}
                      onChange={handleEditChange}
                      placeholder="e.g. 7010060"
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs outline-none font-mono font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name *</label>
                    <input
                      name="accountHolderName"
                      value={editForm.accountHolderName}
                      onChange={handleEditChange}
                      placeholder="e.g. A. B. C. Perera"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number *</label>
                    <input
                      name="accountNumber"
                      value={editForm.accountNumber}
                      onChange={handleEditChange}
                      placeholder="e.g. 70123456"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Submit Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Update Lecturer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CourseReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type="Lecturers"
        data={lecturers}
      />
    </DashboardLayout>
  );
}

