"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Zap, ShieldCheck, AlertTriangle, ExternalLink, Package, Clock, Loader2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getOrdersByCompany,
  getBatchesByCompany,
  getRiskEventsByCompany,
  type Order,
  type Batch,
  type RiskEvent,
} from "@/lib/firestore";

export default function DashboardPage() {
  const { user, appUser } = useAuth();
  const companyId = appUser?.companyId || "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      getOrdersByCompany(companyId),
      getBatchesByCompany(companyId),
      getRiskEventsByCompany(companyId),
    ])
      .then(([o, b, r]) => { setOrders(o); setBatches(b); setRiskEvents(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const activeBatches = batches.filter((b) => b.status === "in-progress").length;
  const completedBatches = batches.filter((b) => b.status === "complete").length;
  const highRiskCount = riskEvents.filter((e) => e.confidenceScore > 0.7).length;
  const onChainEvents = riskEvents.filter((e) => e.algorandTxId);
  const onChainBatches = batches.filter((b) => b.algorandTxId).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
            Dashboard <span className="neon-text">Overview</span>
          </h1>
          <p className="text-slate-500">
            Welcome back, <strong>{user?.displayName || "there"}</strong>. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/orders" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-md">
            View Orders
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {[
          { label: "Active Batches", value: activeBatches, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Completed", value: completedBatches, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
          { label: "On-Chain Records", value: onChainBatches, icon: LinkIcon, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
          { label: "Risk Alerts", value: highRiskCount, icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl border ${stat.bg} ${stat.border}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Batches */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Active Batches</h3>
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
          </div>

          {batches.filter(b => b.status !== 'complete').length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No active batches. Create an order to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.filter(b => b.status !== 'complete').slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className={`w-2 h-8 rounded-full shrink-0 ${b.status === "in-progress" ? "bg-blue-500" : "bg-slate-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{b.batchNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{b.currentStage || "Not started"}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Blockchain Records */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Blockchain Records</h3>
          {onChainEvents.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No blockchain records yet. High-risk events will be recorded on Algorand.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {onChainEvents.slice(0, 5).map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className={`w-2 h-8 rounded-full shrink-0 ${ev.confidenceScore > 0.7 ? "bg-red-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{ev.riskType}</span>
                      <span className="text-xs text-slate-400">{ev.stage}</span>
                    </div>
                    <p className="font-mono text-xs text-slate-400 truncate">{ev.algorandTxId}</p>
                  </div>
                  <a
                    href={`https://testnet.explorer.perawallet.app/tx/${ev.algorandTxId}`}
                    target="_blank" rel="noreferrer"
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />{Math.round(ev.confidenceScore * 100)}%
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Risk Events Feed */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-bold text-slate-900">Recent Risk Alerts</h3>
        </div>
        {riskEvents.length === 0 ? (
          <div className="text-center py-8">
            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No risk events detected yet. Your supply chain is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {riskEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className={`p-4 rounded-xl border ${ev.confidenceScore > 0.7 ? "bg-red-50/50 border-red-200" : ev.confidenceScore > 0.4 ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/50 border-emerald-200"}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${ev.confidenceScore > 0.7 ? "text-red-500" : ev.confidenceScore > 0.4 ? "text-amber-500" : "text-emerald-500"}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{ev.riskType}</p>
                    <p className="text-xs text-slate-500">
                      Stage: {ev.stage} · Confidence: {Math.round(ev.confidenceScore * 100)}%
                      {ev.createdAt && ` · ${new Date(ev.createdAt.seconds * 1000).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/alerts" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2">
              View All Alerts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
