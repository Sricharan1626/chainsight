"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRiskEventsByCompany, type RiskEvent } from "@/lib/firestore";

export default function AlertsPage() {
  const { user, appUser } = useAuth();
  const companyId = appUser?.companyId || "";
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    getRiskEventsByCompany(companyId)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const highRisk = events.filter((e) => e.confidenceScore > 0.7).length;
  const onChain = events.filter((e) => e.algorandTxId).length;

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          AI Risk <span className="neon-text">Alerts</span>
        </h1>
        <p className="text-slate-500">
          Real-time anomaly detection logs from the AI risk engine. High-confidence events are permanently recorded on the Algorand blockchain.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Events", value: events.length, color: "text-slate-900", border: "border-slate-200" },
          { label: "High Risk", value: highRisk, color: "text-red-600", border: "border-red-100" },
          { label: "On Blockchain", value: onChain, color: "text-indigo-600", border: "border-indigo-100" },
          { label: "Safe Batches", value: events.length - highRisk, color: "text-emerald-600", border: "border-emerald-100" },
        ].map((s) => (
          <div key={s.label} className={`glass-card p-5 flex flex-col border ${s.border}`}>
            <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">All clear!</h2>
          <p className="text-slate-500">No risk events detected yet. Events will appear here when the AI engine flags anomalies.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const isHigh = ev.confidenceScore > 0.7;
            const isMed = ev.confidenceScore > 0.4;
            const barColor = isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-500";
            const bgColor = isHigh ? "border-red-200 bg-red-50/50" : isMed ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50";
            return (
              <div key={ev.id} className={`glass-card p-6 border-l-4 ${bgColor} transition-all`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isHigh ? "text-red-600" : isMed ? "text-amber-600" : "text-emerald-600"}`} />
                    <div>
                      <p className="font-bold text-slate-900">{ev.riskType}</p>
                      <p className="text-sm text-slate-500">
                        Stage: {ev.stage} · Batch: {ev.batchNumber || ev.batchId.slice(0, 8)}
                        {ev.createdAt && ` · ${new Date(ev.createdAt.seconds * 1000).toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ev.algorandTxId && (
                      <a
                        href={`https://explorer.perawallet.app/tx/${ev.algorandTxId}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> ON-CHAIN
                      </a>
                    )}
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium shrink-0 w-24">Confidence</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 relative overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${ev.confidenceScore * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-12 text-right">{Math.round(ev.confidenceScore * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
