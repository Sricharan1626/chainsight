"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Loader2,
} from "lucide-react";
import {
  getRequests,
  updateRequestStatus,
  createCompany,
  type PendingRequest,
} from "@/lib/firestore";

export default function AdminPage() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (req: PendingRequest) => {
    setProcessing(req.id!);
    try {
      // Create company in Firestore with ownerEmail for auto-detection at login
      await createCompany({
        name: req.companyName,
        stages: ["Raw Materials", "Assembly", "Quality Assurance", "Packaging"],
        industry: req.industry,
        ownerEmail: req.contactEmail,
      });
      // Update request status
      await updateRequestStatus(req.id!, "APPROVED");
      await fetchRequests();
    } catch (err) {
      console.error("Error approving:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req: PendingRequest) => {
    setProcessing(req.id!);
    try {
      await updateRequestStatus(req.id!, "REJECTED");
      await fetchRequests();
    } catch (err) {
      console.error("Error rejecting:", err);
    } finally {
      setProcessing(null);
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 pb-20">
      <div className="max-w-5xl mx-auto animate-fade-in">
        <header className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Platform-wide request management</p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pending Review", value: pending.length, icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
            { label: "Approved", value: approved.length, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
            { label: "Total Requests", value: requests.length, icon: Building2, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl border p-5 ${s.color.split(" ").slice(1).join(" ")}`}>
                <Icon className={`w-5 h-5 mb-2 ${s.color.split(" ")[0]}`} />
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No requests yet</h2>
            <p className="text-slate-500">Access requests from the marketing site will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" /> Pending Requests ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((req) => (
                    <div key={req.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{req.companyName}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-400 mt-1">
                            <span>{req.industry}</span>
                            <span>·</span>
                            <span>{req.monthlyBatches} batches/mo</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {req.contactEmail}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={processing === req.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-70"
                          >
                            {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={processing === req.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-bold transition-all disabled:opacity-70"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Approved ({approved.length})
                </h2>
                <div className="space-y-2">
                  {approved.map((req) => (
                    <div key={req.id} className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{req.companyName}</span>
                        <span className="text-slate-500 text-sm ml-3">{req.industry}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">Approved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" /> Rejected ({rejected.length})
                </h2>
                <div className="space-y-2">
                  {rejected.map((req) => (
                    <div key={req.id} className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{req.companyName}</span>
                        <span className="text-slate-500 text-sm ml-3">{req.industry}</span>
                      </div>
                      <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/30">Rejected</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
