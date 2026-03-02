"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  UserPlus,
  X,
  Loader2,
  Building,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUsersByCompany, createAppUser, type AppUser } from "@/lib/firestore";

const roleIcons: Record<string, string> = {
  Admin: "text-blue-600 bg-blue-50 border-blue-200",
  Manager: "text-indigo-600 bg-indigo-50 border-indigo-200",
  Employee: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function TeamPage() {
  const { user, appUser } = useAuth();
  const companyId = appUser?.companyId || "";
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Employee" as AppUser["role"] });
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    if (!companyId) return;
    try {
      const data = await getUsersByCompany(companyId);
      setMembers(data);
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [companyId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await createAppUser({
        email: inviteForm.email,
        displayName: inviteForm.email.split("@")[0],
        photoURL: "",
        role: inviteForm.role,
        companyId,
        firebaseUid: "", // Will be linked when they sign in
      });
      setShowInvite(false);
      setInviteForm({ email: "", role: "Employee" });
      await fetchMembers();
    } catch (err) {
      console.error("Error inviting:", err);
    } finally {
      setInviting(false);
    }
  };

  const admins = members.filter((m) => m.role === "Admin").length;
  const managers = members.filter((m) => m.role === "Manager").length;
  const employees = members.filter((m) => m.role === "Employee").length;

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
            Team <span className="neon-text">Management</span>
          </h1>
          <p className="text-slate-500">Invite staff and assign roles to control their access level.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </header>

      {/* Role Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Admins", value: admins, desc: "Full access to all features and settings", icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Managers", value: managers, desc: "Can view analytics and manage orders", icon: Building, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Employees", value: employees, desc: "Can update batch stages only", icon: Users, color: "text-slate-600 bg-slate-50 border-slate-200" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`glass-card p-5 border ${s.color.split(" ")[2]}`}>
              <div className={`w-10 h-10 rounded-xl ${s.color.split(" ").slice(1, 3).join(" ")} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color.split(" ")[0]}`} />
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{s.value}</div>
              <div className="text-sm font-medium text-slate-900">{s.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No team members yet</h2>
          <p className="text-slate-500 mb-6">Invite your first team member to get started.</p>
          <button onClick={() => setShowInvite(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold shadow-md">
            <UserPlus className="w-4 h-4 inline mr-2" /> Invite First Member
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-900">{members.length} Members</span>
          </div>
          <div className="divide-y divide-slate-200">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                {m.photoURL ? (
                  <img src={m.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-emerald-200 flex items-center justify-center text-sm font-bold text-slate-700">
                    {(m.displayName || m.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{m.displayName || m.email}</p>
                  <p className="text-sm text-slate-500 truncate">{m.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${roleIcons[m.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                <input required type="email" value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                <select value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AppUser["role"] })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={inviting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:from-blue-500 hover:to-emerald-500 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Inviting...</> : "Send Invite"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
