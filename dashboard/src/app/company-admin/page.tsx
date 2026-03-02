"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Shield,
  UserPlus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Package,
  Eye,
  ShoppingCart,
  AlertTriangle,
  Boxes,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getCompany,
  getRolesByCompany,
  createCompanyRole,
  deleteCompanyRole,
  type Company,
  type CompanyRole,
} from "@/lib/firestore";

const ACCESS_OPTIONS = [
  { key: "view_dashboard", label: "View Dashboard", icon: Eye, desc: "Can see overview stats and charts" },
  { key: "update_batches", label: "Update Batches", icon: Package, desc: "Can advance supply chain stages" },
  { key: "manage_orders", label: "Manage Orders", icon: ShoppingCart, desc: "Can create and manage orders" },
  { key: "view_alerts", label: "View Alerts", icon: AlertTriangle, desc: "Can view AI risk alerts" },
];

export default function CompanyAdminPage() {
  const { appUser } = useAuth();
  const companyId = appUser?.companyId || "";

  const [company, setCompany] = useState<Company | null>(null);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formRoleName, setFormRoleName] = useState("");
  const [formAccess, setFormAccess] = useState<string[]>([]);
  const [formStage, setFormStage] = useState("");

  const stages = company?.stages || [];

  const fetchData = async () => {
    if (!companyId) return;
    try {
      const [companyData, rolesData] = await Promise.all([
        getCompany(companyId),
        getRolesByCompany(companyId),
      ]);
      setCompany(companyData);
      setRoles(rolesData);
    } catch (err) {
      console.error("Error fetching company data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCompanyRole({
        email: formEmail,
        roleName: formRoleName,
        access: formAccess,
        assignedStage: formStage,
        companyId,
      });
      setShowModal(false);
      setFormEmail("");
      setFormRoleName("");
      setFormAccess([]);
      setFormStage("");
      await fetchData();
    } catch (err) {
      console.error("Error creating role:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    setDeleting(roleId);
    try {
      await deleteCompanyRole(roleId);
      await fetchData();
    } catch (err) {
      console.error("Error deleting role:", err);
    } finally {
      setDeleting(null);
    }
  };

  const toggleAccess = (key: string) => {
    setFormAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Group roles by stage for the pipeline view
  const stageRoleMap: Record<string, CompanyRole[]> = {};
  stages.forEach((s) => { stageRoleMap[s] = []; });
  roles.forEach((r) => {
    if (r.assignedStage && stageRoleMap[r.assignedStage]) {
      stageRoleMap[r.assignedStage].push(r);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          Company <span className="neon-text">Admin</span>
        </h1>
        <p className="text-slate-500">
          Manage your company info, assign roles to stages, and control access.
        </p>
      </header>

      {/* Company Info Card */}
      {company && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shrink-0">
              <Building2 className="text-white w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{company.name}</h2>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                {company.industry && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                    {company.industry}
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
                  {stages.length} stages
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage → Role Pipeline */}
      {stages.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Stage → Role Pipeline
          </h3>
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const assignedRoles = stageRoleMap[stage] || [];
              return (
                <div key={i} className="flex items-center gap-3">
                  {/* Stage number */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {/* Stage name */}
                  <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl text-sm font-semibold text-slate-700 min-w-[140px]">
                    {stage}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                  {/* Assigned roles */}
                  {assignedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {assignedRoles.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {r.email[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-indigo-700">{r.roleName}</span>
                            <span className="text-xs text-indigo-500 ml-1">({r.email})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No role assigned</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roles Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Team Roles
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Each role is assigned to a supply chain stage. Only that role can enter data at their stage.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No roles created yet</h2>
          <p className="text-slate-500 mb-6">
            Create roles and assign each to a supply chain stage. They&apos;ll log in with Google and see only their stage.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold shadow-md"
          >
            <UserPlus className="w-4 h-4 inline mr-2" /> Create First Role
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-900">{roles.length} Roles Configured</span>
          </div>
          <div className="divide-y divide-slate-200">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center text-sm font-bold text-indigo-700">
                  {role.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{role.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                      {role.roleName}
                    </span>
                    {role.assignedStage && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                        <Boxes className="w-3 h-3" /> {role.assignedStage}
                      </span>
                    )}
                    <div className="flex gap-1">
                      {role.access.map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs">
                          {a.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(role.id!)}
                  disabled={deleting === role.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting === role.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add New Role</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddRole} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="employee@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">
                  This person logs in with this Google account automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role Name *
                </label>
                <input
                  required
                  type="text"
                  value={formRoleName}
                  onChange={(e) => setFormRoleName(e.target.value)}
                  placeholder="e.g. Manufacturer, Supplier, QA Inspector"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>

              {/* Assigned Stage — NEW */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Assigned Stage *
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  This role can only enter data when a batch is at this stage.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {stages.map((stage, i) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setFormStage(stage)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        formStage === stage
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        formStage === stage
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {i + 1}
                      </div>
                      <span className={`text-sm font-semibold ${
                        formStage === stage ? "text-emerald-700" : "text-slate-700"
                      }`}>
                        {stage}
                      </span>
                      {formStage === stage && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Access Permissions
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ACCESS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formAccess.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleAccess(opt.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-blue-100" : "bg-slate-100"
                        }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !formStage}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:from-blue-500 hover:to-emerald-500 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Role"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
