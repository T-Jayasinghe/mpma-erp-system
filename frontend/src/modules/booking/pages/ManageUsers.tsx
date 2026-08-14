import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { 
  User as UserIcon, Mail, Lock, Shield, Plus, Loader2, RefreshCcw, Hash, Trash2, X, Settings2, Check, 
  Users, UserCheck, ShieldCheck, Search, Phone, GraduationCap, Calendar, Wrench
} from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchApi } from '../../../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  phoneNumber?: string;
  isActive: boolean;
  canBookAuditorium: boolean;
  canBookClassroom: boolean;
  canBookTransport: boolean;
  canManageVehicles: boolean;
  canManageClassrooms: boolean;
  canManageMaintenance: boolean;
  canManageCourses: boolean;
  canManageBatches: boolean;
  canManageLecturers: boolean;
  canManageEnrollment: boolean;
  canManagePayments: boolean;
  canManageCertificates: boolean;
  canManageStudents: boolean;
  canManageUsers: boolean;
}

const PERMISSION_FIELDS = [
  { field: 'canBookAuditorium', label: 'Auditorium Booking', category: 'Booking' },
  { field: 'canBookClassroom', label: 'Classroom Booking', category: 'Booking' },
  { field: 'canBookTransport', label: 'Transport Booking', category: 'Booking' },
  { field: 'canManageVehicles', label: 'Vehicle Management', category: 'Facility' },
  { field: 'canManageClassrooms', label: 'Classroom Management', category: 'Facility' },
  { field: 'canManageMaintenance', label: 'Maintenance Management', category: 'Facility' },
  { field: 'canManageCourses', label: 'Course Management', category: 'Academic' },
  { field: 'canManageBatches', label: 'Batch Management', category: 'Academic' },
  { field: 'canManageLecturers', label: 'Lecturer Management', category: 'Academic' },
  { field: 'canManageEnrollment', label: 'Student Enrollment', category: 'Student' },
  { field: 'canManagePayments', label: 'Payments & GovPay', category: 'Student' },
  { field: 'canManageCertificates', label: 'Certificates Registry', category: 'Student' },
  { field: 'canManageStudents', label: 'All Student Records', category: 'Student' },
  { field: 'canManageUsers', label: 'User Permissions Admin', category: 'System' },
];

export default function ManageUsers() {
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const data = await fetchApi('/auth/users');
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setDeletingId(id);
    try {
      await fetchApi(`/auth/${id}`, { method: 'DELETE' });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePermission = async (user: User, permissionField: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingId(user.id);
    const updatedValue = !(user as any)[permissionField];
    
    try {
      await fetchApi(`/auth/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [permissionField]: updatedValue }),
      });
      toast.success('User permissions updated');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleStatus = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingId(user.id);
    try {
      await fetchApi(`/auth/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.employeeId && u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phoneNumber && u.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive).length,
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User & Permission Management</h1>
            <p className="text-slate-500 font-medium text-xs">Configure system user roles, access control modules, and granular ERP permissions</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add New User Account
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admins</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.admins}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.active}</h3>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, email, phone or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchUsers}
                disabled={fetching}
                className="p-3 text-slate-500 hover:text-brand-600 rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95 bg-slate-100/50 cursor-pointer"
              >
                <RefreshCcw className={`w-5 h-5 ${fetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">User Identity</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Module Access Permissions</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status & Role</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fetching ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-12 bg-slate-100 rounded-2xl w-48"></div></td>
                      <td className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-xl w-64"></div></td>
                      <td className="px-8 py-6"><div className="h-8 bg-slate-100 rounded-full w-24"></div></td>
                      <td className="px-8 py-6 text-right"><div className="h-10 bg-slate-100 rounded-xl w-10 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-slate-200" />
                        <p className="text-slate-500 font-medium">No users match your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr 
                      key={u.id} 
                      onClick={() => openEditModal(u)}
                      className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${!u.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
                    >
                      {/* Identity */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-brand-700 font-black text-lg shadow-sm group-hover:scale-105 transition-all duration-300 ${
                            u.isActive ? 'from-brand-50 to-brand-100' : 'from-slate-100 to-slate-200 text-slate-400'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                              <span>{u.email}</span>
                              {u.phoneNumber && (
                                <span className="flex items-center gap-1 before:content-['•'] before:mr-1">
                                  <Phone className="w-3 h-3" />
                                  {u.phoneNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-brand-600 font-black uppercase mt-1 tracking-tighter bg-brand-50 inline-block px-1.5 rounded-md">ID: {u.employeeId || 'NOT SET'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Permissions Breakdown Badges */}
                      <td className="px-8 py-5">
                        <div className="space-y-1.5 max-w-md">
                          {/* Academic & Student Permissions */}
                          <div className="flex flex-wrap gap-1">
                            {[
                              { field: 'canManageCourses', label: 'Courses' },
                              { field: 'canManageBatches', label: 'Batches' },
                              { field: 'canManageLecturers', label: 'Lecturers' },
                              { field: 'canManageEnrollment', label: 'Enrollment' },
                              { field: 'canManagePayments', label: 'Payments' },
                              { field: 'canManageCertificates', label: 'Certificates' },
                              { field: 'canManageStudents', label: 'Students' }
                            ].map(p => {
                              const active = !!(u as any)[p.field];
                              return (
                                <button
                                  key={p.field}
                                  onClick={(e) => togglePermission(u, p.field, e)}
                                  disabled={updatingId === u.id}
                                  title={`Toggle ${p.label} Permission`}
                                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase transition-all border cursor-pointer ${
                                    active 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                      : 'bg-slate-50 text-slate-300 border-slate-100'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Booking & Facility Permissions */}
                          <div className="flex flex-wrap gap-1">
                            {[
                              { field: 'canBookAuditorium', label: 'Auditorium' },
                              { field: 'canBookClassroom', label: 'Classroom' },
                              { field: 'canBookTransport', label: 'Transport' },
                              { field: 'canManageVehicles', label: 'Vehicles' },
                              { field: 'canManageClassrooms', label: 'Rooms' },
                              { field: 'canManageMaintenance', label: 'Maintenance' },
                              { field: 'canManageUsers', label: 'User Admin' }
                            ].map(p => {
                              const active = !!(u as any)[p.field];
                              return (
                                <button
                                  key={p.field}
                                  onClick={(e) => togglePermission(u, p.field, e)}
                                  disabled={updatingId === u.id}
                                  title={`Toggle ${p.label} Permission`}
                                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase transition-all border cursor-pointer ${
                                    active 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-slate-50 text-slate-300 border-slate-100'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Status & Role */}
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <button 
                            onClick={(e) => toggleStatus(u, e)}
                            disabled={updatingId === u.id}
                            className={`w-fit inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                              u.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </button>
                          <span className={`w-fit inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 ${
                            u.role === 'admin' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={(e) => handleDelete(u.id, e)}
                          disabled={deletingId === u.id}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                          title="Delete User Account"
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
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

      {/* Add User Modal */}
      {isAddModalOpen && (
        <UserModal 
          mode="add"
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={fetchUsers}
        />
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <UserModal 
          mode="edit"
          user={selectedUser}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onRefresh={fetchUsers}
        />
      )}
    </DashboardLayout>
  );
}

interface ModalProps {
  mode: 'add' | 'edit';
  user?: User;
  onClose: () => void;
  onRefresh: () => void;
}

function UserModal({ mode, user, onClose, onRefresh }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    employeeId: user?.employeeId || '',
    phoneNumber: user?.phoneNumber || '',
    isActive: user?.isActive !== undefined ? user.isActive : true,
    role: user?.role || 'user',
    canBookAuditorium: user?.canBookAuditorium || false,
    canBookClassroom: user?.canBookClassroom || false,
    canBookTransport: user?.canBookTransport || false,
    canManageVehicles: user?.canManageVehicles || false,
    canManageClassrooms: user?.canManageClassrooms || false,
    canManageMaintenance: user?.canManageMaintenance || false,
    canManageCourses: user?.canManageCourses || false,
    canManageBatches: user?.canManageBatches || false,
    canManageLecturers: user?.canManageLecturers || false,
    canManageEnrollment: user?.canManageEnrollment || false,
    canManagePayments: user?.canManagePayments || false,
    canManageCertificates: user?.canManageCertificates || false,
    canManageStudents: user?.canManageStudents || false,
    canManageUsers: user?.canManageUsers || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'add') {
        await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('User created successfully. Credentials sent to email.');
      } else {
        await fetchApi(`/auth/${user?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
        toast.success('User updated successfully');
      }
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${mode} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-brand-600 flex items-center justify-center text-white shadow-2xl shadow-brand-500/40 rotate-3">
              {mode === 'add' ? <Plus className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{mode === 'add' ? 'Create New User' : 'Edit User Profile'}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{mode === 'add' ? 'Set up a new system account & module permissions' : 'Update account details and granular access permissions'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all hover:rotate-90 cursor-pointer">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Primary Details */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Core Account Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 ml-1">Full Identity Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 ml-1">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all"
                    placeholder="example@mpma.lk"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all"
                    placeholder="+94 7X XXX XXXX"
                  />
                </div>
              </div>

              {mode === 'add' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 ml-1">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all"
                      placeholder="Min 8 characters"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 ml-1">Employee ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all"
                      placeholder="EMP001"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 ml-1">System Role</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-12 pr-8 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-500/20 focus:bg-white rounded-[1.25rem] text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="user">Regular User</option>
                      <option value="officer">Academy Officer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200/80 cursor-pointer transition-all hover:bg-slate-100/60">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-extrabold text-slate-800">Account Status</p>
                    <p className="text-[11px] text-slate-500 font-medium">{formData.isActive ? 'Account Active (User can log in)' : 'Account Blocked (Login suspended)'}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 transition-all cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Permissions Panel */}
            <div className="bg-slate-50/60 rounded-[2rem] p-6 space-y-6 border border-slate-200/80">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-brand-600" />
                  Module Access Permissions
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = PERMISSION_FIELDS.every(p => (formData as any)[p.field]);
                    const updated = { ...formData };
                    PERMISSION_FIELDS.forEach(p => { (updated as any)[p.field] = !allChecked; });
                    setFormData(updated);
                  }}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                >
                  {PERMISSION_FIELDS.every(p => (formData as any)[p.field]) ? "Deselect All" : "Select All Permissions"}
                </button>
              </div>

              {/* 1. Academic & Course Permissions */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Course & Academic Management
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'canManageCourses', label: 'Course Creation & Management' },
                    { field: 'canManageBatches', label: 'Batch Scheduling & Batches' },
                    { field: 'canManageLecturers', label: 'Lecturer Assignments' }
                  ].map(p => (
                    <label key={p.field} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 transition-all cursor-pointer shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      <input 
                        type="checkbox" 
                        name={p.field}
                        checked={(formData as any)[p.field]}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Student & Payment Permissions */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Student & Payment Operations
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'canManageEnrollment', label: 'Student Applications & Enrollment' },
                    { field: 'canManagePayments', label: 'Payment Transactions & GovPay' },
                    { field: 'canManageCertificates', label: 'Course Completion Certificates' },
                    { field: 'canManageStudents', label: 'Student Directory & Records' }
                  ].map(p => (
                    <label key={p.field} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 transition-all cursor-pointer shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      <input 
                        type="checkbox" 
                        name={p.field}
                        checked={(formData as any)[p.field]}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 transition-all cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Booking Permissions */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> Resource Booking Permissions
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'canBookAuditorium', label: 'Auditorium Booking' },
                    { field: 'canBookClassroom', label: 'Classroom Booking' },
                    { field: 'canBookTransport', label: 'Transport Booking' }
                  ].map(p => (
                    <label key={p.field} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-400 transition-all cursor-pointer shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      <input 
                        type="checkbox" 
                        name={p.field}
                        checked={(formData as any)[p.field]}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 transition-all cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Facility Management Permissions */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" /> Facility & Asset Management
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'canManageVehicles', label: 'Vehicle Management' },
                    { field: 'canManageClassrooms', label: 'Classroom Facility Management' },
                    { field: 'canManageMaintenance', label: 'Maintenance Management' }
                  ].map(p => (
                    <label key={p.field} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 transition-all cursor-pointer shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      <input 
                        type="checkbox" 
                        name={p.field}
                        checked={(formData as any)[p.field]}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 transition-all cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. System Administration & Security */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Security Administration
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { field: 'canManageUsers', label: 'User & Access Permission Administration' }
                  ].map(p => (
                    <label key={p.field} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-400 transition-all cursor-pointer shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{p.label}</span>
                      <input 
                        type="checkbox" 
                        name={p.field}
                        checked={(formData as any)[p.field]}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500/20 transition-all cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-500/30 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'add' ? <Plus className="w-5 h-5" /> : <Check className="w-5 h-5" />)}
              {mode === 'add' ? 'Create User Account' : 'Save Permission Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
