"use client";

import { useState } from "react";
import {
  Building2,
  Bell,
  Shield,
  Palette,
  ChevronRight,
  CheckCircle2,
  Globe,
  Database,
  Key,
  AlertTriangle,
  Save,
  Trash2,
} from "lucide-react";

const tabs = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [saved, setSaved] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: "Acme Manufacturing Inc.",
    industry: "Electronics Manufacturing",
    website: "https://acme.com",
    timezone: "UTC+05:30",
  });
  const [notifications, setNotifications] = useState({
    highRiskAlerts: true,
    blockchainConfirmations: true,
    weeklyDigest: false,
    batchCompletions: true,
    teamInvites: true,
  });
  const [theme, setTheme] = useState("light");

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          System <span className="neon-text">Settings</span>
        </h1>
        <p className="text-slate-500">Manage your company profile, notifications, and security preferences.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="glass-card p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {/* Company Tab */}
          {activeTab === "company" && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Company Profile</h2>
                  <p className="text-sm text-slate-500">Update your company information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Industry</label>
                  <select
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
                  >
                    <option>Electronics Manufacturing</option>
                    <option>Automotive Assembly</option>
                    <option>Pharmaceuticals</option>
                    <option>Food &amp; Beverage</option>
                    <option>Textile &amp; Apparel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Globe className="w-3 h-3 inline mr-1" />Website
                  </label>
                  <input
                    type="url"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Database className="w-3 h-3 inline mr-1" />Timezone
                  </label>
                  <select
                    value={companyForm.timezone}
                    onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
                  >
                    <option>UTC+05:30 (India)</option>
                    <option>UTC+00:00 (London)</option>
                    <option>UTC-05:00 (New York)</option>
                    <option>UTC-08:00 (Los Angeles)</option>
                    <option>UTC+08:00 (Singapore)</option>
                  </select>
                </div>
              </div>

              {/* Algorand Config Info */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <h3 className="font-semibold text-indigo-900 text-sm mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Algorand Testnet Connection
                </h3>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Your platform wallet is configured and connected to the Algorand Testnet. High-risk events are automatically recorded. To change wallet settings, update the <code className="bg-indigo-100 px-1 rounded">ALGORAND_WALLET_MNEMONIC</code> in your environment variables.
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Choose what alerts you receive</p>
                </div>
              </div>

              {[
                { key: "highRiskAlerts", label: "High Risk AI Alerts", desc: "Receive alerts when the AI detects high-confidence supply chain risks", color: "text-red-600" },
                { key: "blockchainConfirmations", label: "Blockchain Confirmations", desc: "Get notified when a risk event is confirmed on the Algorand blockchain", color: "text-indigo-600" },
                { key: "batchCompletions", label: "Batch Completions", desc: "Alert when any batch completes all supply chain stages", color: "text-emerald-600" },
                { key: "teamInvites", label: "Team Activity", desc: "Notifications when new team members join or roles change", color: "text-blue-600" },
                { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary email every Monday with production metrics", color: "text-slate-600" },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1 pr-4">
                    <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${notifications[item.key as keyof typeof notifications] ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500">Manage authentication and access control</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Firebase Authentication", status: "Active", desc: "Google OAuth provider connected", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                  { label: "Multi-Tenant Isolation", status: "Enforced", desc: "All database queries scoped to company ID", icon: Shield, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
                  { label: "Role-Based Access", status: "Enabled", desc: "Admin, Manager, Employee roles configured", icon: Key, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={`flex items-center gap-4 p-4 rounded-xl border ${item.bg} ${item.border}`}>
                      <Icon className={`w-5 h-5 shrink-0 ${item.color}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${item.bg} ${item.border} ${item.color}`}>{item.status}</span>
                    </div>
                  );
                })}
              </div>

              {/* Danger Zone */}
              <div className="border border-red-200 rounded-xl p-5 bg-red-50">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">These actions are irreversible. Proceed with caution.</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete All Company Data
                </button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Appearance</h2>
                  <p className="text-sm text-slate-500">Choose your dashboard theme</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "light", label: "Light", preview: "bg-white border-slate-200" },
                  { id: "dark", label: "Dark", preview: "bg-slate-900 border-slate-700" },
                  { id: "system", label: "System", preview: "bg-gradient-to-r from-white to-slate-900 border-slate-400" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${theme === t.id ? "border-blue-500 shadow-lg shadow-blue-100" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className={`w-full h-16 rounded-lg border mb-3 ${t.preview}`} />
                    <p className="text-sm font-semibold text-slate-700">{t.label}</p>
                    {theme === t.id && <CheckCircle2 className="w-4 h-4 text-blue-600 mx-auto mt-1.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-emerald-500 transition-all shadow-md"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
