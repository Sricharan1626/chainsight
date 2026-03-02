"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Package,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { QRCodeGenerator } from "@/components/ui/QRCodeGenerator";
import { useAuth } from "@/context/AuthContext";
import {
  getOrder,
  getCompany,
  getBatchesByOrder,
  getRiskEventsByBatch,
  getBatchEntriesByBatch,
  createBatch,
  updateBatch,
  type Order,
  type Batch,
  type RiskEvent,
  type Company,
  type BatchEntry,
} from "@/lib/firestore";

const riskBadge = (score: number) => {
  if (score > 0.7) return "bg-red-100 text-red-700 border-red-200";
  if (score > 0.4) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, appUser, companyRole } = useAuth();
  const companyId = appUser?.companyId || "";
  const isOwner = appUser?.role === "Owner";
  const assignedStage = companyRole?.assignedStage || "";
  const canManage = isOwner || (companyRole?.access || []).includes("manage_orders");

  const [order, setOrder] = useState<Order | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [batches, setBatches] = useState<(Batch & { riskEvents: RiskEvent[]; entries: BatchEntry[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBatch, setAddingBatch] = useState(false);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const stages = company?.stages || [];

  const fetchData = async () => {
    if (!id || !companyId) return;
    try {
      const [orderData, companyData] = await Promise.all([
        getOrder(id),
        getCompany(companyId),
      ]);
      setOrder(orderData);
      setCompany(companyData);

      const batchesData = await getBatchesByOrder(id);
      const batchesWithData = await Promise.all(
        batchesData.map(async (b) => {
          const [riskEvents, entries] = await Promise.all([
            getRiskEventsByBatch(b.id!),
            getBatchEntriesByBatch(b.id!),
          ]);
          return { ...b, riskEvents, entries };
        })
      );
      setBatches(batchesWithData);
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, companyId]);

  const handleAddBatch = async () => {
    if (!order || !canManage) return;
    setAddingBatch(true);
    try {
      await createBatch({
        batchNumber: `B-${Date.now().toString().slice(-6)}`,
        currentStage: stages.length > 0 ? stages[0] : "",
        status: "pending",
        orderId: id,
        companyId,
      });
      await fetchData();
    } catch (err) {
      console.error("Error creating batch:", err);
    } finally {
      setAddingBatch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!order) return <div className="p-8 text-slate-500">Order not found.</div>;

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-6xl mx-auto">
      <Link href="/orders" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{order.description}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {order.quantity.toLocaleString()} units</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {order.expectedIntervalMinutes} min per stage</span>
            <span>{batches.length} batches</span>
          </div>
        </div>
        {canManage && (
          <button
            onClick={handleAddBatch}
            disabled={addingBatch}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-70"
          >
            {addingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Batch
          </button>
        )}
      </header>

      {/* Stage Pipeline */}
      {stages.length > 0 && (
        <div className="glass-card p-5 mb-8 overflow-x-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {company?.name} Supply Chain Stages
          </p>
          <div className="flex items-center gap-1 min-w-max">
            {stages.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap">
                  {i + 1}. {stage}
                </span>
                {i < stages.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Cards */}
      {batches.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No batches yet</h3>
          <p className="text-slate-500 text-sm">
            {canManage
              ? 'Click "Add Batch" to start tracking production.'
              : "Batches will appear once your company admin creates them."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const stageIdx = stages.indexOf(batch.currentStage);
            const isComplete = batch.status === "complete";
            const isInProgress = batch.status === "in-progress";
            const isExpanded = expandedBatch === batch.id;

            return (
              <div
                key={batch.id}
                className={`glass-card overflow-hidden transition-all border-l-4 ${
                  isComplete ? "border-emerald-500" : isInProgress ? "border-blue-500" : "border-slate-300"
                }`}
              >
                {/* Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.id!)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? "bg-emerald-100" : isInProgress ? "bg-blue-100" : "bg-slate-100"}`}>
                        {isComplete ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : isInProgress ? <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" /> : <div className="w-3 h-3 rounded-full bg-slate-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {batch.batchNumber}
                          {!isComplete && (isOwner || assignedStage === batch.currentStage) && (
                            <Link href="/supply-chain" onClick={(e) => e.stopPropagation()} className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors rounded-full text-xs font-bold border border-emerald-300">
                              Enter Data →
                            </Link>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {isComplete ? "✓ All stages completed" : batch.currentStage ? `Stage ${stageIdx + 1}/${stages.length}: ${batch.currentStage}` : "Not started"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{batch.entries.length} entries</span>
                      {batch.algorandTxId && (
                        <a href={`https://testnet.explorer.perawallet.app/tx/${batch.algorandTxId}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          <ShieldCheck className="w-3 h-3" /> On-chain
                        </a>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1">
                    {stages.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= stageIdx
                            ? isComplete
                              ? "bg-emerald-400"
                              : "bg-gradient-to-r from-blue-500 to-emerald-500"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Expanded: Full Audit Trail */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {/* Stage-by-stage entries */}
                    <div className="p-6">
                      <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" /> Full Supply Chain Audit Trail
                      </h4>

                      {batch.entries.length === 0 && batch.riskEvents.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">
                          No entries recorded yet. Data will appear as each stage processes this batch.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {/* Group entries by stage */}
                          {stages.map((stage, si) => {
                            const stageEntries = batch.entries.filter((e) => e.stage === stage);
                            const stageRisks = batch.riskEvents.filter((e) => e.stage === stage);
                            if (stageEntries.length === 0 && stageRisks.length === 0) return null;

                            return (
                              <div key={stage} className="relative pl-6 border-l-2 border-slate-200">
                                {/* Stage indicator */}
                                <div className={`absolute left-0 top-0 w-4 h-4 -ml-2 rounded-full border-2 border-white ${
                                  si <= stageIdx ? "bg-emerald-500" : "bg-slate-300"
                                }`} />

                                <div className="mb-3">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Stage {si + 1}: {stage}
                                  </span>
                                </div>

                                {stageEntries.map((entry) => (
                                  <div key={entry.id} className="mb-3 p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                                        {entry.submittedBy[0]?.toUpperCase() || "?"}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-900">{entry.submittedBy}</span>
                                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                        {entry.roleName}
                                      </span>
                                      {entry.algorandTxId && (
                                        <a
                                          href={`https://testnet.explorer.perawallet.app/tx/${entry.algorandTxId}`}
                                          target="_blank" rel="noreferrer"
                                          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                                        >
                                          <ShieldCheck className="w-3 h-3" /> On-chain
                                        </a>
                                      )}
                                      {entry.createdAt && (
                                        <span className="text-xs text-slate-400 ml-auto">
                                          {new Date(entry.createdAt.seconds * 1000).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    {entry.notes && <p className="text-sm text-slate-700 mb-2">{entry.notes}</p>}
                                    {entry.stageData && Object.keys(entry.stageData).length > 0 && (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.entries(entry.stageData).map(([k, v]) => (
                                          <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                                            <p className="text-xs text-slate-400 font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                                            <p className="text-sm font-semibold text-slate-800">{String(v)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {/* Risk events for this stage */}
                                {stageRisks.map((ev) => (
                                  <div key={ev.id} className={`mb-3 flex items-start gap-3 p-3 rounded-xl border text-sm ${riskBadge(ev.confidenceScore)}`}>
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <span className="font-semibold">{ev.riskType}</span>
                                      <span className="mx-2 opacity-60">·</span>
                                      <span>Confidence: {Math.round(ev.confidenceScore * 100)}%</span>
                                    </div>
                                    {ev.algorandTxId && (
                                      <a href={`https://testnet.explorer.perawallet.app/tx/${ev.algorandTxId}`} target="_blank" rel="noreferrer" className="shrink-0">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isComplete && (
                      <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Public Certificate Ready
                          </h4>
                          <p className="text-sm text-slate-600 mb-4 max-w-md">
                            This batch has completed all stages. A verifiable public certificate is now available. Print this QR label to attach to your physical packaging.
                          </p>
                          <Link href={`/verify/${batch.id}`} target="_blank"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm">
                            View Public Certificate <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                        <div className="shrink-0 w-full md:w-64">
                          <QRCodeGenerator batchId={batch.id!} status="Complete" theme="light" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
