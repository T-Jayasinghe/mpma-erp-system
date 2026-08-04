import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Check,
  ChevronRight,
  ArrowLeft,
  Save,
  Upload,
  X,
  FileText,
  IdCard,
  Globe,
  Search,
  Info,
  Loader2,
  CheckCircle2,
  Users,
  Flag,
  Award,
  Plus,
  Trash2,
  BookOpen
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchApi } from "../../../utils/api";
import { parseSriLankanNIC } from "../../../utils/nicParser";

type StudentCategory = "SLPA Employee" | "Sri Lankan Student" | "Non-Sri Lankan Student";

interface CourseOption { id: string; courseCode: string; courseName: string; }
interface BatchOption { id: string; batchCode: string; startDate: string; }

const MAIN_OL_SUBJECTS = [
  "Mathematics",
  "Science",
  "English Language",
  "Sinhala Language & Literature",
  "Tamil Language & Literature",
  "History",
  "Buddhism",
  "Hinduism",
  "Christianity / Catholicism",
  "Islam",
  "Information & Communication Technology (ICT)",
  "Business & Accounting Studies",
  "Geography",
  "Civic Education",
  "English Literature",
  "Art",
  "Music",
  "Dancing",
  "Drama & Theatre",
  "Health & Physical Education",
  "Agriculture & Food Technology",
  "Design & Mechanical Technology",
  "Home Economics",
  "Other (Type Custom Subject)"
];

const MAIN_AL_SUBJECTS = [
  "Combined Mathematics",
  "Higher Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Agricultural Science",
  "Accounting",
  "Business Studies",
  "Economics",
  "Information & Communication Technology (ICT)",
  "Engineering Technology",
  "Science for Technology",
  "Bio Systems Technology",
  "Political Science",
  "Logic & Scientific Method",
  "Geography",
  "History",
  "Sinhala",
  "Tamil",
  "English Literature",
  "General English",
  "General Information Technology (GIT)",
  "Other (Type Custom Subject)"
];

const StudentEnrollment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Category
    studentCategory: "", // "SLPA Employee", "Sri Lankan Student", "Non-Sri Lankan Student"

    // Step 2: Personal
    firstName: "",
    lastName: "",
    fullName: "",
    identificationType: "NIC",
    idNumber: "",
    passportNumber: "",
    nationality: "Sri Lankan",
    countryOfOrigin: "Sri Lanka",
    dob: "",
    gender: "Male",

    // Step 3: Contact
    email: "",
    phone: "",
    address: "",

    // Step 4: Course
    course: "",
    batch: "",
    courseId: "",
    batchId: "",
    serviceNumber: "",
    registrationDate: new Date().toISOString().split('T')[0],

    // Step 5: Educational Qualifications (Starts Empty as requested)
    olYear: "",
    olIndexNumber: "",
    olMedium: "English",
    olSubjects: [] as { id: string; subject: string; grade: string }[],

    alStream: "Physical Science",
    alYear: "",
    alIndexNumber: "",
    alZScore: "",
    alSubjects: [] as { id: string; subject: string; grade: string }[],

    otherQualifications: [] as { id: string; title: string; institute: string; year: string; result: string }[],

    // Step 6: Additional Details
    companyName: "",
    outsidePosition: "",
    epfNumber: "",
    department: "",
    slpaPosition: "",

    // Step 7: Documents
    documents: [] as File[]
  });

  const [olCertificate, setOlCertificate] = useState<File | null>(null);
  const [alCertificate, setAlCertificate] = useState<File | null>(null);
  const [higherCertificate, setHigherCertificate] = useState<File | null>(null);
  const [otherDocuments, setOtherDocuments] = useState<File[]>([]);

  const [newOLSubjectSelect, setNewOLSubjectSelect] = useState("");
  const [newOLSubjectCustom, setNewOLSubjectCustom] = useState("");
  const [newOLGrade, setNewOLGrade] = useState("A");

  const [newALSubjectSelect, setNewALSubjectSelect] = useState("");
  const [newALSubjectCustom, setNewALSubjectCustom] = useState("");
  const [newALGrade, setNewALGrade] = useState("A");

  const [newOtherTitle, setNewOtherTitle] = useState("");
  const [newOtherInstitute, setNewOtherInstitute] = useState("");
  const [newOtherYear, setNewOtherYear] = useState("");
  const [newOtherResult, setNewOtherResult] = useState("");

  const [employeeSearchId, setEmployeeSearchId] = useState("");
  const [isSearchingEmployee, setIsSearchingEmployee] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");

  const handleAddOLSubject = () => {
    const subjectName = newOLSubjectSelect === "Other" ? newOLSubjectCustom.trim() : newOLSubjectSelect.trim();
    if (!subjectName) {
      toast.warning("Please select or enter an O/L subject name");
      return;
    }
    setFormData(prev => ({
      ...prev,
      olSubjects: [...prev.olSubjects, { id: `ol-${Date.now()}`, subject: subjectName, grade: newOLGrade }]
    }));
    setNewOLSubjectSelect("");
    setNewOLSubjectCustom("");
    setNewOLGrade("A");
    toast.success(`O/L Subject "${subjectName}" added to table`);
  };

  const handleRemoveOLSubject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      olSubjects: prev.olSubjects.filter(sub => sub.id !== id)
    }));
  };

  const handleAddALSubject = () => {
    const subjectName = newALSubjectSelect === "Other" ? newALSubjectCustom.trim() : newALSubjectSelect.trim();
    if (!subjectName) {
      toast.warning("Please select or enter an A/L subject name");
      return;
    }
    setFormData(prev => ({
      ...prev,
      alSubjects: [...prev.alSubjects, { id: `al-${Date.now()}`, subject: subjectName, grade: newALGrade }]
    }));
    setNewALSubjectSelect("");
    setNewALSubjectCustom("");
    setNewALGrade("A");
    toast.success(`A/L Subject "${subjectName}" added to table`);
  };

  const handleRemoveALSubject = (id: string) => {
    setFormData(prev => ({
      ...prev,
      alSubjects: prev.alSubjects.filter(sub => sub.id !== id)
    }));
  };

  const handleAddOtherQualification = () => {
    if (!newOtherTitle.trim()) {
      toast.warning("Please enter qualification title");
      return;
    }
    setFormData(prev => ({
      ...prev,
      otherQualifications: [
        ...prev.otherQualifications,
        {
          id: `other-${Date.now()}`,
          title: newOtherTitle.trim(),
          institute: newOtherInstitute.trim() || "N/A",
          year: newOtherYear.trim() || "N/A",
          result: newOtherResult.trim() || "Pass"
        }
      ]
    }));
    setNewOtherTitle("");
    setNewOtherInstitute("");
    setNewOtherYear("");
    setNewOtherResult("");
    toast.success("Qualification record added to table");
  };

  const handleRemoveOtherQualification = (id: string) => {
    setFormData(prev => ({
      ...prev,
      otherQualifications: prev.otherQualifications.filter(q => q.id !== id)
    }));
  };

  useEffect(() => {
    setCourseLoading(true);
    fetchApi('/public/courses').then((data) => setCourses(data as CourseOption[])).catch((e) => toast.error(e.message)).finally(() => setCourseLoading(false));
  }, []);

  useEffect(() => {
    if (!formData.courseId) { setBatches([]); return; }
    setCourseLoading(true);
    fetchApi(`/public/courses/${formData.courseId}/batches`).then((data) => setBatches(data as BatchOption[])).catch((e) => toast.error(e.message)).finally(() => setCourseLoading(false));
  }, [formData.courseId]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: "Student Category", icon: Users },
    { id: 2, title: "Personal Information", icon: User },
    { id: 3, title: "Contact Information", icon: Mail },
    { id: 4, title: "Course Selection", icon: GraduationCap },
    { id: 5, title: "Educational Qualifications", icon: Award },
    { id: 6, title: "Additional Details", icon: Info },
    { id: 7, title: "Documents", icon: Upload },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-extract DOB and Gender if NIC number is entered/changed
      if (name === "idNumber") {
        const nicInfo = parseSriLankanNIC(value);
        if (nicInfo) {
          updated.dob = nicInfo.dob;
          updated.gender = nicInfo.gender;
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        if (name === "idNumber") {
          delete newErrors.dob;
          delete newErrors.gender;
        }
        return newErrors;
      });
    }
  };

  const handleCategorySelect = (studentCategory: StudentCategory) => {
    setFormData(prev => ({
      ...prev,
      studentCategory,
      idNumber: studentCategory === "Non-Sri Lankan Student" ? "" : prev.idNumber,
      passportNumber: studentCategory === "Non-Sri Lankan Student" ? prev.passportNumber : "",
      nationality: studentCategory === "Non-Sri Lankan Student" ? "" : "Sri Lankan",
      countryOfOrigin: studentCategory === "Non-Sri Lankan Student" ? "" : "Sri Lanka",
      fullName: "", firstName: "", lastName: "", dob: "", email: "", phone: "",
      serviceNumber: "", epfNumber: "", department: "", slpaPosition: "",
    }));
    setEmployeeSearchId("");
    setErrors({});
    setCurrentStep(2);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.studentCategory) {
        toast.error("Please select a student category");
        return false;
      }
    } else if (step === 2) {
      if (formData.studentCategory === "SLPA Employee") {
        if (!formData.fullName) newErrors.fullName = "Employee details are required. Please search.";
      } else if (formData.studentCategory === "Sri Lankan Student") {
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (!formData.idNumber) newErrors.idNumber = "NIC Number is required";
      } else if (formData.studentCategory === "Non-Sri Lankan Student") {
        if (!formData.fullName) newErrors.fullName = "Full Name is required";
        if (!formData.passportNumber) newErrors.passportNumber = "Passport Number is required";
        if (!formData.nationality) newErrors.nationality = "Nationality is required";
        if (!formData.countryOfOrigin) newErrors.countryOfOrigin = "Country of origin is required";
      }
      if (!formData.dob) newErrors.dob = "Date of Birth is required";
    } else if (step === 3) {
      if (!formData.phone) newErrors.phone = "Phone number is required";
      if (!formData.address) newErrors.address = "Address is required";
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email";
      if (formData.phone && !/^[+\d][\d\s()-]{6,19}$/.test(formData.phone)) newErrors.phone = "Enter a valid phone number";
    } else if (step === 4) {
      if (!formData.courseId) newErrors.course = "Course selection is required";
      if (!formData.batchId) newErrors.batch = "Batch selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) setCurrentStep(prev => prev + 1);
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleEmployeeSearch = async () => {
    if (!employeeSearchId) {
      toast.warning("Please enter Service Number or NIC");
      return;
    }
    setIsSearchingEmployee(true);
    try {
      const result = await fetchApi(`/public/slpa-employees/search?query=${encodeURIComponent(employeeSearchId.trim())}`) as { employee: any };
      const employee = result.employee;
      setFormData(prev => ({
        ...prev,
        fullName: employee.fullName, firstName: employee.firstName, lastName: employee.lastName,
        idNumber: employee.nic, email: employee.email || '', phone: employee.phone || '', dob: employee.dob,
        gender: employee.gender, serviceNumber: employee.serviceNumber, epfNumber: employee.epfNumber,
        department: employee.department, slpaPosition: employee.position,
      }));
      toast.success("Employee record verified.");
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Employee search failed'); }
    finally { setIsSearchingEmployee(false); }
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDraftSaving(false);
    toast.success("Draft saved successfully.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(7)) return;

    setLoading(true);
    try {
      const names = formData.fullName.split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || " ";

      const qualificationsData = JSON.stringify({
        ol: {
          year: formData.olYear,
          indexNumber: formData.olIndexNumber,
          medium: formData.olMedium,
          subjects: formData.olSubjects
        },
        al: {
          stream: formData.alStream,
          year: formData.alYear,
          indexNumber: formData.alIndexNumber,
          zScore: formData.alZScore,
          subjects: formData.alSubjects
        },
        otherQualifications: formData.otherQualifications
      });

      const submitData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        fullName: formData.fullName, courseId: formData.courseId, batchId: formData.batchId,
        studentCategory: formData.studentCategory,
        idNumber: formData.idNumber,
        passportNumber: formData.passportNumber,
        nationality: formData.nationality, countryOfOrigin: formData.countryOfOrigin,
        companyName: formData.companyName, outsidePosition: formData.outsidePosition,
        serviceNumber: formData.serviceNumber, epfNumber: formData.epfNumber, department: formData.department,
        slpaPosition: formData.slpaPosition, enrollmentType: 'ADMIN_DIRECT',
        qualificationsData,
      };

      const filesToUpload: File[] = [];
      const documentTypesToUpload: string[] = [];

      if (olCertificate) {
        filesToUpload.push(olCertificate);
        documentTypesToUpload.push("O/L Certificate");
      }
      if (alCertificate) {
        filesToUpload.push(alCertificate);
        documentTypesToUpload.push("A/L Certificate");
      }
      if (higherCertificate) {
        filesToUpload.push(higherCertificate);
        documentTypesToUpload.push("Higher Qualification Certificate");
      }
      otherDocuments.forEach((file) => {
        filesToUpload.push(file);
        documentTypesToUpload.push("Support Document");
      });
      formData.documents.forEach((file) => {
        if (!filesToUpload.includes(file)) {
          filesToUpload.push(file);
          documentTypesToUpload.push("Support Document");
        }
      });

      const payload = new FormData();
      Object.entries(submitData).forEach(([key, value]) => payload.append(key, value));
      payload.append("documentTypes", documentTypesToUpload.join(","));
      filesToUpload.forEach(file => payload.append('documents', file));

      const response = await fetchApi('/students/register', {
        method: 'POST',
        body: payload
      }) as { message?: string; success?: boolean; applicationNumber?: string; fields?: Record<string,string> };

      setApplicationNumber(response.applicationNumber || '');
      toast.success(`Application submitted: ${response.applicationNumber}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Enrollment failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
      const newFiles = Array.from(e.target.files).filter(file => {
        if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: use PDF/JPG/PNG up to 5 MB`); return false; }
        return true;
      });
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newFiles] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Enrollment</h1>
              <p className="text-slate-500 font-medium">Enterprise Academic Enrollment Portal</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="hidden lg:flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentStep === step.id
                      ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                      : currentStep > step.id
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${currentStep === step.id
                      ? "bg-brand-600 text-white"
                      : currentStep > step.id
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100"
                    }`}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{step.title}</span>
                </div>
                {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-10">

              {/* Step 1: Student Category */}
              {currentStep === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Student Category</h2>
                      <p className="text-sm text-slate-500">Select your enrollment classification</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: "SLPA Employee", title: "SLPA Employee", desc: "Current employees of Sri Lanka Ports Authority", icon: IdCard },
                      { id: "Sri Lankan Student", title: "Sri Lankan Student", desc: "Local students with a valid NIC", icon: User },
                      { id: "Non-Sri Lankan Student", title: "Non-Sri Lankan Student", desc: "International students with a valid Passport", icon: Globe }
                    ].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id as StudentCategory)}
                        className={`group relative overflow-hidden flex flex-col p-8 rounded-[2rem] border-2 transition-all cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 ${formData.studentCategory === cat.id
                            ? 'bg-brand-50 border-brand-500 shadow-xl shadow-brand-500/10'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${formData.studentCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500'
                          }`}>
                          <cat.icon className="w-7 h-7" />
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${formData.studentCategory === cat.id ? 'text-brand-900' : 'text-slate-800'}`}>{cat.title}</h3>
                        <p className={`text-sm font-medium leading-relaxed ${formData.studentCategory === cat.id ? 'text-brand-600' : 'text-slate-500'}`}>{cat.desc}</p>

                        {formData.studentCategory === cat.id && (
                          <div className="absolute top-6 right-6 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                      <p className="text-sm text-slate-500">
                        {formData.studentCategory === "SLPA Employee" ? "Verify employee credentials" : "Standardized identity verification fields"}
                      </p>
                    </div>
                  </div>

                  {formData.studentCategory === "SLPA Employee" ? (
                    <div className="space-y-8">
                      <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                        <label className="text-sm font-bold text-slate-700 ml-1">Search Employee By Service Number or NIC</label>
                        <div className="mt-3 flex gap-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              value={employeeSearchId}
                              onChange={(e) => setEmployeeSearchId(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:border-brand-500 outline-none transition-all shadow-sm"
                              placeholder="Enter EPF/Service No or NIC"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleEmployeeSearch}
                            disabled={isSearchingEmployee}
                            className="px-8 bg-brand-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-brand-700 transition-all disabled:opacity-50"
                          >
                            {isSearchingEmployee ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Search
                          </button>
                        </div>
                      </div>

                      {formData.fullName && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                          <div className="md:col-span-2 p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                              <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="text-emerald-800 font-bold">Employee Record Verified</p>
                              <p className="text-emerald-600 text-sm font-medium">Following details have been auto-populated from SLPA database.</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <input value={formData.fullName} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Service Number</label>
                            <input value={formData.serviceNumber} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                            <input value={formData.department} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">EPF Number</label>
                            <input value={formData.epfNumber} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">NIC</label>
                            <input value={formData.idNumber} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Position</label>
                            <input value={formData.slpaPosition} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                            <input value={formData.gender} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                            <input value={formData.dob} readOnly className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] text-sm font-semibold text-slate-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Full Name (As per identification) <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all ${errors.fullName ? 'border-red-400 bg-red-50/30' : ''}`}
                            placeholder="Enter full name"
                          />
                        </div>
                        {errors.fullName && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.fullName}</p>}
                      </div>

                      {formData.studentCategory === "Sri Lankan Student" ? (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">NIC Number <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input
                                name="idNumber"
                                value={formData.idNumber}
                                onChange={handleInputChange}
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all ${errors.idNumber ? 'border-red-400' : ''}`}
                                placeholder="eg: 199512345678 or 952341234V"
                              />
                            </div>
                            {parseSriLankanNIC(formData.idNumber) && (
                              <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-semibold text-emerald-700 flex items-center justify-between animate-in fade-in duration-200 mt-1.5">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  Auto-detected from NIC:
                                </span>
                                <span className="font-bold bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800 shadow-2xs">
                                  DOB: {formData.dob} &bull; Gender: {formData.gender}
                                </span>
                              </div>
                            )}
                            {errors.idNumber && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.idNumber}</p>}
                          </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Passport Number <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              name="passportNumber"
                              value={formData.passportNumber}
                              onChange={handleInputChange}
                              className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all ${errors.passportNumber ? 'border-red-400' : ''}`}
                              placeholder="Enter passport number"
                            />
                          </div>
                          {errors.passportNumber && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.passportNumber}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">
                          Nationality {formData.studentCategory === "Non-Sri Lankan Student" && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all"
                          />
                        </div>
                        {errors.nationality && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.nationality}</p>}
                      </div>

                      {formData.studentCategory === "Non-Sri Lankan Student" && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Country of Origin <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                              name="countryOfOrigin"
                              value={formData.countryOfOrigin}
                              onChange={handleInputChange}
                              className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all ${errors.countryOfOrigin ? 'border-red-400' : ''}`}
                              placeholder="Enter country of origin"
                            />
                          </div>
                          {errors.countryOfOrigin && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.countryOfOrigin}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all"
                          />
                        </div>
                        {errors.dob && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.dob}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                        <div className="grid grid-cols-2 gap-4">
                          {["Male", "Female"].map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                              className={`py-4 rounded-2xl font-bold transition-all ${formData.gender === g ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:border-slate-200'}`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Contact Information */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Contact Information</h2>
                      <p className="text-sm text-slate-500">How we can reach the student</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all"
                          placeholder="example@email.com"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Phone Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all"
                          placeholder="e.g. 077 123 4567"
                        />
                      </div>
                      {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.phone}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Address <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-6 w-5 h-5 text-slate-400" />
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all resize-none"
                          placeholder="Residential address"
                        />
                      </div>
                      {errors.address && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.address}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Course Selection */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Course Selection</h2>
                      <p className="text-sm text-slate-500">Select academic program</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Program <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <select
                          name="courseId"
                          value={formData.courseId}
                          disabled={courseLoading}
                          onChange={(e) => { const selected = courses.find(c => c.id === e.target.value); setFormData(prev => ({ ...prev, courseId: e.target.value, course: selected?.courseName || '', batchId: '', batch: '' })); }}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Choose a course</option>
                          {courses.map(course => <option key={course.id} value={course.id}>{course.courseCode} — {course.courseName}</option>)}
                        </select>
                      </div>
                      {errors.course && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.course}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Batch <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          name="batchId"
                          value={formData.batchId}
                          disabled={!formData.courseId || courseLoading}
                          onChange={(e) => { const selected = batches.find(b => b.id === e.target.value); setFormData(prev => ({ ...prev, batchId: e.target.value, batch: selected?.batchCode || '' })); }}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:bg-white focus:border-brand-500 outline-none transition-all"
                        ><option value="">Choose an available batch</option>{batches.map(batch => <option key={batch.id} value={batch.id}>{batch.batchCode} — {batch.startDate}</option>)}</select>
                      </div>
                      {errors.batch && <p className="text-xs text-red-500 mt-1 ml-1 font-bold">{errors.batch}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Educational Qualifications */}
              {currentStep === 5 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Educational Qualifications</h2>
                      <p className="text-sm text-slate-500">
                        Add your G.C.E. O/L results, G.C.E. A/L results, and higher qualifications step by step.
                      </p>
                    </div>
                  </div>

                  {/* Section 1: G.C.E. O/L Results */}
                  <div className="bg-slate-50/70 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl font-black text-xs uppercase tracking-wider">
                          Part 1
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">1. G.C.E. Ordinary Level (O/L) Results</h3>
                          <p className="text-xs text-slate-500">Enter exam details and subject grades table</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Examination Year</label>
                        <input
                          type="number"
                          name="olYear"
                          value={formData.olYear}
                          onChange={handleInputChange}
                          placeholder="e.g. 2018"
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Index Number</label>
                        <input
                          type="text"
                          name="olIndexNumber"
                          value={formData.olIndexNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. 81234567"
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Examination Medium</label>
                        <select
                          name="olMedium"
                          value={formData.olMedium}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="English">English</option>
                          <option value="Sinhala">Sinhala</option>
                          <option value="Tamil">Tamil</option>
                        </select>
                      </div>
                    </div>

                    {/* Add O/L Subject Row */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                      <label className="text-xs font-bold text-slate-700">Select O/L Subject & Grade</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={newOLSubjectSelect}
                          onChange={(e) => {
                            setNewOLSubjectSelect(e.target.value);
                            if (e.target.value !== "Other") {
                              setNewOLSubjectCustom("");
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="">Select Main O/L Subject...</option>
                          {MAIN_OL_SUBJECTS.map((sub) => (
                            <option key={sub} value={sub === "Other (Type Custom Subject)" ? "Other" : sub}>
                              {sub}
                            </option>
                          ))}
                        </select>

                        {newOLSubjectSelect === "Other" && (
                          <input
                            type="text"
                            value={newOLSubjectCustom}
                            onChange={(e) => setNewOLSubjectCustom(e.target.value)}
                            placeholder="Type custom O/L subject..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                          />
                        )}

                        <select
                          value={newOLGrade}
                          onChange={(e) => setNewOLGrade(e.target.value)}
                          className="w-28 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="A">Grade A</option>
                          <option value="B">Grade B</option>
                          <option value="C">Grade C</option>
                          <option value="S">Grade S</option>
                          <option value="W">Grade W</option>
                          <option value="F">Grade F</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddOLSubject}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 justify-center cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Add Subject
                        </button>
                      </div>
                    </div>

                    {/* O/L Subjects Table */}
                    <div className="overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">O/L Subject Name</th>
                            <th className="py-3 px-4 w-28 text-center">Result Grade</th>
                            <th className="py-3 px-4 w-20 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.olSubjects.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400 font-medium italic">
                                No O/L subjects added yet. Select a subject from the dropdown above to add it to your table.
                              </td>
                            </tr>
                          ) : (
                            formData.olSubjects.map((sub, idx) => (
                              <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{sub.subject}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs inline-block ${
                                    sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                    sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    sub.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                    sub.grade === 'S' ? 'bg-violet-100 text-violet-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOLSubject(sub.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: G.C.E. A/L Results */}
                  <div className="bg-slate-50/70 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-wider">
                          Part 2
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">2. G.C.E. Advanced Level (A/L) Results</h3>
                          <p className="text-xs text-slate-500">Stream selection, year, Z-score, and subject grades table</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Stream</label>
                        <select
                          name="alStream"
                          value={formData.alStream}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="Physical Science">Physical Science (Maths)</option>
                          <option value="Biological Science">Biological Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                          <option value="Engineering Technology">Engineering Technology</option>
                          <option value="Bio Systems Technology">Bio Systems Technology</option>
                          <option value="Information Technology">Information Technology</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Examination Year</label>
                        <input
                          type="number"
                          name="alYear"
                          value={formData.alYear}
                          onChange={handleInputChange}
                          placeholder="e.g. 2021"
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Index Number</label>
                        <input
                          type="text"
                          name="alIndexNumber"
                          value={formData.alIndexNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. 21234567"
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 ml-1">Z-Score (Optional)</label>
                        <input
                          type="text"
                          name="alZScore"
                          value={formData.alZScore}
                          onChange={handleInputChange}
                          placeholder="e.g. 1.7645"
                          className="w-full px-4 py-3 mt-1 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Add A/L Subject Row */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3">
                      <label className="text-xs font-bold text-slate-700">Select A/L Subject & Grade</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={newALSubjectSelect}
                          onChange={(e) => {
                            setNewALSubjectSelect(e.target.value);
                            if (e.target.value !== "Other") {
                              setNewALSubjectCustom("");
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="">Select Main A/L Subject...</option>
                          {MAIN_AL_SUBJECTS.map((sub) => (
                            <option key={sub} value={sub === "Other (Type Custom Subject)" ? "Other" : sub}>
                              {sub}
                            </option>
                          ))}
                        </select>

                        {newALSubjectSelect === "Other" && (
                          <input
                            type="text"
                            value={newALSubjectCustom}
                            onChange={(e) => setNewALSubjectCustom(e.target.value)}
                            placeholder="Type custom A/L subject..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                          />
                        )}

                        <select
                          value={newALGrade}
                          onChange={(e) => setNewALGrade(e.target.value)}
                          className="w-28 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-500 outline-none cursor-pointer"
                        >
                          <option value="A">Grade A</option>
                          <option value="B">Grade B</option>
                          <option value="C">Grade C</option>
                          <option value="S">Grade S</option>
                          <option value="F">Grade F</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddALSubject}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 justify-center cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Add Subject
                        </button>
                      </div>
                    </div>

                    {/* A/L Subjects Table */}
                    <div className="overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">A/L Subject Name</th>
                            <th className="py-3 px-4 w-28 text-center">Result Grade</th>
                            <th className="py-3 px-4 w-20 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.alSubjects.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400 font-medium italic">
                                No A/L subjects added yet. Use the input bar above to add A/L subjects.
                              </td>
                            </tr>
                          ) : (
                            formData.alSubjects.map((sub, idx) => (
                              <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-semibold text-slate-800">{sub.subject}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs inline-block ${
                                    sub.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                    sub.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    sub.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                    sub.grade === 'S' ? 'bg-violet-100 text-violet-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveALSubject(sub.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Other Qualifications */}
                  <div className="bg-slate-50/70 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs uppercase tracking-wider">
                          Part 3
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">3. Higher Education & Other Qualifications</h3>
                          <p className="text-xs text-slate-500">Diplomas, Degrees, NVQ levels, Professional Certificates</p>
                        </div>
                      </div>
                    </div>

                    {/* Add Other Qualification Row */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4">
                      <label className="text-xs font-bold text-slate-700 block">Add New Qualification Details</label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                          type="text"
                          value={newOtherTitle}
                          onChange={(e) => setNewOtherTitle(e.target.value)}
                          placeholder="Qualification Title (e.g. Diploma in IT)"
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          value={newOtherInstitute}
                          onChange={(e) => setNewOtherInstitute(e.target.value)}
                          placeholder="Institute / University"
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          value={newOtherYear}
                          onChange={(e) => setNewOtherYear(e.target.value)}
                          placeholder="Year (e.g. 2023)"
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                        <input
                          type="text"
                          value={newOtherResult}
                          onChange={(e) => setNewOtherResult(e.target.value)}
                          placeholder="Result / Grade / Pass"
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-brand-500 outline-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddOtherQualification}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Qualification Record
                        </button>
                      </div>
                    </div>

                    {/* Other Qualifications Table */}
                    <div className="overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Qualification Title</th>
                            <th className="py-3 px-4">Institute / Awarding Body</th>
                            <th className="py-3 px-4 w-24 text-center">Year</th>
                            <th className="py-3 px-4 w-28 text-center">Result / Status</th>
                            <th className="py-3 px-4 w-20 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.otherQualifications.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 font-medium italic">
                                No other higher qualifications added yet. Enter details above if applicable.
                              </td>
                            </tr>
                          ) : (
                            formData.otherQualifications.map((q, idx) => (
                              <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-bold text-slate-800">{q.title}</td>
                                <td className="py-3 px-4 font-medium text-slate-600">{q.institute}</td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-700">{q.year}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 inline-block border border-slate-200">
                                    {q.result}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOtherQualification(q.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Additional Details */}
              {currentStep === 6 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Additional Details</h2>
                      <p className="text-sm text-slate-500">Supplementary information</p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100">
                    {formData.studentCategory === "SLPA Employee" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">SLPA EPF Number</label>
                          <input
                            name="epfNumber"
                            value={formData.epfNumber}
                            readOnly
                            className="w-full px-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:border-brand-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">SLPA Department</label>
                          <input
                            name="department"
                            value={formData.department}
                            readOnly
                            className="w-full px-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:border-brand-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">SLPA Position</label>
                          <input value={formData.slpaPosition} readOnly className="w-full px-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold shadow-sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Current Employment / School</label>
                          <input
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:border-brand-500 outline-none transition-all shadow-sm"
                            placeholder="Name of institution"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">Designation</label>
                          <input
                            name="outsidePosition"
                            value={formData.outsidePosition}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 bg-white border-2 border-transparent rounded-[1.25rem] text-sm font-semibold focus:border-brand-500 outline-none transition-all shadow-sm"
                            placeholder="e.g. Student, Manager"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7: Documents */}
              {currentStep === 7 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 py-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Support Documents & Qualification Certificates</h2>
                      <p className="text-sm text-slate-500">Upload scanned PDF or Image copies of O/L, A/L, Higher Education certificates and supporting IDs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Slot 1: O/L Certificate */}
                    <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">G.C.E. O/L Certificate</h3>
                            <p className="text-xs text-slate-500">Official Ordinary Level Results Sheet</p>
                          </div>
                        </div>
                        {olCertificate && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Uploaded</span>
                        )}
                      </div>

                      {olCertificate ? (
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-xs">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">{olCertificate.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOlCertificate(null)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-500 cursor-pointer transition-all text-xs font-bold text-slate-600">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>Choose O/L Certificate File</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setOlCertificate(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Slot 2: A/L Certificate */}
                    <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">G.C.E. A/L Certificate</h3>
                            <p className="text-xs text-slate-500">Official Advanced Level Results Sheet</p>
                          </div>
                        </div>
                        {alCertificate && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Uploaded</span>
                        )}
                      </div>

                      {alCertificate ? (
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-xs">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">{alCertificate.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAlCertificate(null)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-500 cursor-pointer transition-all text-xs font-bold text-slate-600">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>Choose A/L Certificate File</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setAlCertificate(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Slot 3: Higher Qualification Certificate */}
                    <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Higher Qualification Certificate</h3>
                            <p className="text-xs text-slate-500">Degree, Diploma, or NVQ Certification</p>
                          </div>
                        </div>
                        {higherCertificate && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Uploaded</span>
                        )}
                      </div>

                      {higherCertificate ? (
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 text-xs">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-bold text-slate-700 truncate">{higherCertificate.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHigherCertificate(null)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-500 cursor-pointer transition-all text-xs font-bold text-slate-600">
                          <Upload className="w-4 h-4 text-amber-600" />
                          <span>Choose Higher Cert File</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setHigherCertificate(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Slot 4: Other Support Documents */}
                    <div className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Other Support Documents</h3>
                            <p className="text-xs text-slate-500">NIC, Passport, Service Letter, etc.</p>
                          </div>
                        </div>
                        {otherDocuments.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">{otherDocuments.length} File(s)</span>
                        )}
                      </div>

                      <label className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 cursor-pointer transition-all text-xs font-bold text-slate-600">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Add Other Files</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              const newFiles = Array.from(e.target.files);
                              setOtherDocuments((prev) => [...prev, ...newFiles]);
                            }
                          }}
                        />
                      </label>

                      {otherDocuments.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {otherDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                              <span className="font-semibold text-slate-700 truncate pr-2">{doc.name}</span>
                              <button
                                type="button"
                                onClick={() => setOtherDocuments((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-rose-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {applicationNumber && <div className="mx-10 mb-4 p-5 rounded-2xl bg-emerald-50 text-emerald-800 font-bold">Application submitted successfully. Application number: {applicationNumber}</div>}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:border-brand-500 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={draftSaving}
                  className="px-8 py-4 text-slate-500 hover:text-brand-600 font-bold rounded-2xl transition-all flex items-center gap-2 active:scale-95"
                >
                  {draftSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Draft
                </button>
              </div>

              <div className="flex gap-4">
                {currentStep > 1 && currentStep < 7 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {currentStep === 7 && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Complete Enrollment
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentEnrollment;
