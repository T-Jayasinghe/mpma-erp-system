import React, { useState, useEffect } from "react";
import { 
  X, 
  Building, 
  Plus, 
  Search, 
  Trash2,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchApi } from "../utils/api";
import { SRI_LANKA_BANKS } from "../data/sriLankaBanks";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBankBranchAdded?: (bankName: string, branchName: string, centralBankCode: string) => void;
}

type SettingCategory = "bank";

export default function SettingsModal({ isOpen, onClose, onBankBranchAdded }: SettingsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>("bank");
  const [dbBranches, setDbBranches] = useState<any[]>([]);
  const [bankSettingsTab, setBankSettingsTab] = useState<"add" | "registry">("add");
  const [newBankForm, setNewBankForm] = useState({
    bankName: "",
    bankShortCode: "",
    branchName: "",
    centralBankCode: "",
    slpaCode: ""
  });
  const [bankSearchFilter, setBankSearchFilter] = useState("");
  const [isSavingBankBranch, setIsSavingBankBranch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDbBranches();
    }
  }, [isOpen]);

  const loadDbBranches = async () => {
    try {
      const branchesData = await fetchApi('/banks/branches').catch(() => []);
      if (Array.isArray(branchesData)) {
        setDbBranches(branchesData);
      }
    } catch (err) {
      console.error("Failed to load db bank branches", err);
    }
  };

  const getMergedBankList = () => {
    const staticBanks = SRI_LANKA_BANKS.map(b => b.bankName);
    const dbBankNames = dbBranches.map(b => b.bankName);
    const allNames = Array.from(new Set([...staticBanks, ...dbBankNames]));
    return allNames.sort();
  };

  const handleSaveNewBankBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankForm.bankName.trim() || !newBankForm.branchName.trim() || !newBankForm.centralBankCode.trim()) {
      toast.error("Bank Name, Branch Name, and Central Bank Code are required.");
      return;
    }

    setIsSavingBankBranch(true);
    try {
      const response = await fetchApi('/banks/branches', {
        method: 'POST',
        body: JSON.stringify(newBankForm)
      });
      toast.success(response.message || "Bank & Branch details saved to database!");

      const createdBank = newBankForm.bankName.trim();
      const createdBranch = newBankForm.branchName.trim();
      const createdCode = newBankForm.centralBankCode.trim();

      if (onBankBranchAdded) {
        onBankBranchAdded(createdBank, createdBranch, createdCode);
      }

      setNewBankForm({
        bankName: "",
        bankShortCode: "",
        branchName: "",
        centralBankCode: "",
        slpaCode: ""
      });

      await loadDbBranches();
    } catch (error: any) {
      toast.error(error.message || "Failed to save bank branch to database.");
    } finally {
      setIsSavingBankBranch(false);
    }
  };

  const handleDeleteDbBranch = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this bank branch from the database?")) return;
    try {
      await fetchApi(`/banks/branches/${id}`, { method: 'DELETE' });
      toast.success("Bank branch deleted from database.");
      await loadDbBranches();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete bank branch.");
    }
  };

  if (!isOpen) return null;

  const settingsOptions = [
    { 
      id: "bank" as SettingCategory, 
      title: "Bank & Branch Settings", 
      subtitle: "Add bank, branch & Central Bank code", 
      icon: Building 
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl backdrop-blur-md border border-purple-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">System Settings</h2>
              <p className="text-xs text-slate-400">Select a setting category to configure ERP parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Left Selection Sidebar & Right Active Setting Panel */}
        <div className="flex flex-1 min-h-[480px] overflow-hidden">
          
          {/* Left Selection Options List */}
          <div className="w-72 bg-slate-50 border-r border-slate-200/80 p-4 space-y-2 overflow-y-auto shrink-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Select Option
            </p>

            {settingsOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedCategory === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedCategory(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left cursor-pointer ${
                    isSelected 
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                      : "hover:bg-slate-200/60 text-slate-700 bg-white border border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {opt.title}
                      </p>
                      <p className={`text-[10px] ${isSelected ? "text-purple-100" : "text-slate-500"}`}>
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                </button>
              );
            })}
          </div>

          {/* Right Panel: Selected Option Content */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-white">
            {selectedCategory === "bank" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Building className="w-5 h-5 text-purple-600" />
                      Bank & Branch Settings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add custom bank branches and 7-digit Central Bank Codes directly to the database
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs */}
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setBankSettingsTab("add")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bankSettingsTab === "add"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    + Add New Bank / Branch
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankSettingsTab("registry")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bankSettingsTab === "registry"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Database Registry ({dbBranches.length} Entries)
                  </button>
                </div>

                {bankSettingsTab === "add" ? (
                  <form onSubmit={handleSaveNewBankBranch} className="space-y-4">
                    <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
                      <p className="font-semibold mb-0.5">💡 Add Custom Bank Branch</p>
                      <p>Enter the details below to persist a new Bank Name, Branch Name, and Central Bank Code directly to the MySQL database.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name *</label>
                        <input
                          list="existing-banks-settings-list"
                          value={newBankForm.bankName}
                          onChange={(e) => setNewBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                          placeholder="e.g. Bank of Ceylon / Commercial Bank"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all"
                          required
                        />
                        <datalist id="existing-banks-settings-list">
                          {getMergedBankList().map(name => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Short Code (Optional)</label>
                        <input
                          value={newBankForm.bankShortCode}
                          onChange={(e) => setNewBankForm(prev => ({ ...prev, bankShortCode: e.target.value }))}
                          placeholder="e.g. BOC / CB / HNB"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                        <input
                          value={newBankForm.branchName}
                          onChange={(e) => setNewBankForm(prev => ({ ...prev, branchName: e.target.value }))}
                          placeholder="e.g. COLOMBO FORT BRANCH"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all uppercase"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Central Bank Code (7-Digits) *</label>
                        <input
                          value={newBankForm.centralBankCode}
                          onChange={(e) => setNewBankForm(prev => ({ ...prev, centralBankCode: e.target.value }))}
                          placeholder="e.g. 7010060"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-mono font-bold text-purple-700"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">SLPA Code (Optional)</label>
                        <input
                          value={newBankForm.slpaCode}
                          onChange={(e) => setNewBankForm(prev => ({ ...prev, slpaCode: e.target.value }))}
                          placeholder="e.g. 01001"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={isSavingBankBranch}
                        className="flex items-center gap-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-semibold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        {isSavingBankBranch ? "Saving to Database..." : "Save Bank Branch to Database"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        value={bankSearchFilter}
                        onChange={(e) => setBankSearchFilter(e.target.value)}
                        placeholder="Search bank name, branch name, or central bank code..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-2.5 border-b">ID</th>
                            <th className="p-2.5 border-b">Bank Name</th>
                            <th className="p-2.5 border-b">Branch Name</th>
                            <th className="p-2.5 border-b">Central Bank Code</th>
                            <th className="p-2.5 border-b text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dbBranches
                            .filter(br => 
                              !bankSearchFilter ||
                              br.bankName.toLowerCase().includes(bankSearchFilter.toLowerCase()) ||
                              br.branchName.toLowerCase().includes(bankSearchFilter.toLowerCase()) ||
                              br.centralBankCode.toLowerCase().includes(bankSearchFilter.toLowerCase())
                            )
                            .map((br) => (
                              <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 font-mono text-slate-500">{br.id}</td>
                                <td className="p-2.5 font-semibold text-slate-800">{br.bankName}</td>
                                <td className="p-2.5 text-slate-700">{br.branchName}</td>
                                <td className="p-2.5 font-mono font-bold text-purple-700">{br.centralBankCode}</td>
                                <td className="p-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDbBranch(br.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete from database"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {dbBranches.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                                No custom bank branches stored in database yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
