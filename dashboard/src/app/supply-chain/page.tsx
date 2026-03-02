"use client";

import { useState, useEffect } from "react";
import {
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Activity,
  Boxes,
  FileText,
  MapPin,
  Thermometer,
  Hash,
  Send,
  ChevronDown,
  ChevronUp,
  Shield,
  Link as LinkIcon,
  ShieldCheck,
  ExternalLink,
  CalendarDays,
  Truck,
  ClipboardCheck,
  Factory,
  Tag,
  Weight,
  Timer,
} from "lucide-react";
import { QRCodeGenerator } from "@/components/ui/QRCodeGenerator";
import { useAuth } from "@/context/AuthContext";
import {
  getCompany,
  getBatchesByCompany,
  getOrdersByCompany,
  updateBatch,
  createBatchEntry,
  updateBatchEntry,
  getBatchEntriesByBatch,
  getRolesByCompany,
  type Company,
  type Batch,
  type Order,
  type BatchEntry,
  type CompanyRole,
} from "@/lib/firestore";

// ─── Stage-specific field definitions ───

interface StageField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  placeholder: string;
  icon: React.ElementType;
  options?: string[];
  required?: boolean;
}

function getStageFields(stageName: string): StageField[] {
  const lower = stageName.toLowerCase();

  if (lower.includes("manufactur") || lower.includes("production") || lower.includes("raw")) {
    return [
      { key: "productName", label: "Product Name", type: "text", placeholder: "e.g. Organic Milk Batch", icon: Tag, required: true },
      { key: "productType", label: "Product Type", type: "text", placeholder: "e.g. Dairy, Electronics", icon: Package },
      { key: "quantityProduced", label: "Quantity Produced", type: "number", placeholder: "e.g. 5000", icon: Hash, required: true },
      { key: "productionDate", label: "Production Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "expiryDate", label: "Expiry Date", type: "date", placeholder: "", icon: CalendarDays },
      { key: "temperature", label: "Production Temp (°C)", type: "number", placeholder: "e.g. 4", icon: Thermometer },
      { key: "location", label: "Factory Location", type: "text", placeholder: "e.g. Plant A, Mumbai", icon: Factory },
    ];
  }

  if (lower.includes("supplier") || lower.includes("sourc")) {
    return [
      { key: "receivedDate", label: "Received Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "supplierName", label: "Supplier Name", type: "text", placeholder: "e.g. ABC Raw Materials", icon: Tag },
      { key: "storageCondition", label: "Storage Condition", type: "select", placeholder: "", icon: Thermometer, options: ["Cold Storage (0-4°C)", "Frozen (-18°C)", "Room Temperature", "Climate Controlled", "Dry Storage"] },
      { key: "storageTemp", label: "Storage Temp (°C)", type: "number", placeholder: "e.g. 4", icon: Thermometer },
      { key: "batchQuality", label: "Batch Quality", type: "select", placeholder: "", icon: ClipboardCheck, options: ["Excellent", "Good", "Acceptable", "Below Standard", "Rejected"] },
      { key: "quantityReceived", label: "Quantity Received", type: "number", placeholder: "e.g. 4950", icon: Hash },
      { key: "location", label: "Warehouse Location", type: "text", placeholder: "e.g. Warehouse B2", icon: MapPin },
    ];
  }

  if (lower.includes("distribut") || lower.includes("logistics") || lower.includes("transport")) {
    return [
      { key: "pickupDate", label: "Pickup Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "transportMode", label: "Transport Mode", type: "select", placeholder: "", icon: Truck, options: ["Refrigerated Truck", "Standard Truck", "Air Freight", "Ship", "Rail", "Courier"] },
      { key: "vehicleId", label: "Vehicle / Tracking ID", type: "text", placeholder: "e.g. TRK-2847", icon: Truck },
      { key: "estimatedArrival", label: "Estimated Arrival", type: "date", placeholder: "", icon: CalendarDays },
      { key: "temperature", label: "Transport Temp (°C)", type: "number", placeholder: "e.g. 2", icon: Thermometer },
      { key: "destination", label: "Destination", type: "text", placeholder: "e.g. Delhi Distribution Center", icon: MapPin },
    ];
  }

  if (lower.includes("quality") || lower.includes("qa") || lower.includes("inspection")) {
    return [
      { key: "inspectionDate", label: "Inspection Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "inspectionResult", label: "Result", type: "select", placeholder: "", icon: ClipboardCheck, options: ["Pass", "Pass with Notes", "Conditional Pass", "Fail", "Needs Re-inspection"], required: true },
      { key: "defectCount", label: "Defect Count", type: "number", placeholder: "e.g. 0", icon: Hash },
      { key: "temperature", label: "Product Temp (°C)", type: "number", placeholder: "e.g. 3", icon: Thermometer },
      { key: "sampleSize", label: "Sample Size", type: "number", placeholder: "e.g. 50", icon: Hash },
      { key: "location", label: "Inspection Location", type: "text", placeholder: "e.g. QA Lab 3", icon: MapPin },
    ];
  }

  if (lower.includes("packag") || lower.includes("warehouse")) {
    return [
      { key: "packageType", label: "Package Type", type: "select", placeholder: "", icon: Package, options: ["Box", "Pallet", "Crate", "Bag", "Container", "Vacuum Sealed"] },
      { key: "totalWeight", label: "Total Weight (kg)", type: "number", placeholder: "e.g. 500", icon: Weight },
      { key: "storageTemp", label: "Storage Temp (°C)", type: "number", placeholder: "e.g. 4", icon: Thermometer },
      { key: "warehouseLocation", label: "Warehouse Location", type: "text", placeholder: "e.g. Bay C-12", icon: MapPin },
      { key: "packagingDate", label: "Packaging Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "quantity", label: "Package Count", type: "number", placeholder: "e.g. 100", icon: Hash },
    ];
  }

  if (lower.includes("retail") || lower.includes("final") || lower.includes("delivery")) {
    return [
      { key: "receivedDate", label: "Received Date", type: "date", placeholder: "", icon: CalendarDays, required: true },
      { key: "shelfLocation", label: "Shelf / Bay Location", type: "text", placeholder: "e.g. Aisle 4, Shelf B", icon: MapPin },
      { key: "condition", label: "Condition on Arrival", type: "select", placeholder: "", icon: ClipboardCheck, options: ["Excellent", "Good", "Minor Damage", "Significant Damage", "Rejected"] },
      { key: "temperature", label: "Arrival Temp (°C)", type: "number", placeholder: "e.g. 5", icon: Thermometer },
      { key: "retailPrice", label: "Retail Price", type: "number", placeholder: "e.g. 299", icon: Tag },
      { key: "quantity", label: "Quantity Received", type: "number", placeholder: "e.g. 500", icon: Hash },
    ];
  }

  // Generic fallback
  return [
    { key: "notes_field", label: "Details", type: "text", placeholder: "Enter details for this stage...", icon: FileText, required: true },
    { key: "quantity", label: "Quantity", type: "number", placeholder: "e.g. 100", icon: Hash },
    { key: "temperature", label: "Temperature (°C)", type: "number", placeholder: "e.g. 25", icon: Thermometer },
    { key: "location", label: "Location", type: "text", placeholder: "e.g. Building A", icon: MapPin },
  ];
}

function computeStageDays(batch: Batch): number {
  if (!batch.stageStartedAt) {
    // Fall back to createdAt
    const started = batch.createdAt || batch.stageStartedAt;
    if (!started) return 0;
    return Math.max(0, Math.round((Date.now() / 1000 - started.seconds) / 86400));
  }
  return Math.max(0, Math.round((Date.now() / 1000 - batch.stageStartedAt.seconds) / 86400));
}

export default function SupplyChainPage() {
  const { user, appUser, companyRole } = useAuth();
  const companyId = appUser?.companyId || "";
  const roleName = appUser?.role || companyRole?.roleName || "Employee";
  const isOwner = appUser?.role === "Owner";
  const assignedStage = companyRole?.assignedStage || "";

  const [company, setCompany] = useState<Company | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allRoles, setAllRoles] = useState<CompanyRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Data entry state
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, BatchEntry[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<Record<string, { txId: string; explorerUrl: string }>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stageFormData, setStageFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      getCompany(companyId),
      getBatchesByCompany(companyId),
      getOrdersByCompany(companyId),
      getRolesByCompany(companyId),
    ])
      .then(([c, b, o, r]) => {
        setCompany(c);
        setBatches(b);
        setOrders(o);
        setAllRoles(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const stages = company?.stages || [];

  const myBatches = isOwner
    ? batches.filter((b) => b.status !== "complete")
    : batches.filter((b) => {
        if (assignedStage && b.currentStage === assignedStage && b.status !== "complete") return true;
        return false;
      });

  const upcomingBatches = !isOwner && assignedStage
    ? batches.filter((b) => {
        if (b.status === "complete") return false;
        const bIdx = stages.indexOf(b.currentStage);
        const myIdx = stages.indexOf(assignedStage);
        return bIdx >= 0 && myIdx >= 0 && bIdx < myIdx;
      })
    : [];

  const completedBatches = batches.filter((b) => b.status === "complete");

  const toggleBatch = async (batchId: string) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }
    setExpandedBatch(batchId);
    setLoadingEntries(batchId);
    try {
      const data = await getBatchEntriesByBatch(batchId);
      setEntries((prev) => ({ ...prev, [batchId]: data }));
    } catch (err) {
      console.error("Error loading entries:", err);
    } finally {
      setLoadingEntries(null);
    }
  };

  // Record a single entry on Algorand and return the result
  const recordOnAlgorand = async (
    batch: Batch,
    entryId: string,
    stageData: Record<string, string | number | boolean>,
    stageName: string,
    daysAtStage: number,
    isFinal: boolean
  ): Promise<{ txId: string; explorerUrl: string }> => {
    const res = await fetch("/api/algorand/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: batch.id!,
        batchNumber: batch.batchNumber,
        companyName: company?.name || "Unknown",
        currentStage: stageName,
        status: isFinal ? "complete" : "in-progress",
        entryId,
        entries: [{
          entryType: isFinal ? "final_completion" : "stage_completion",
          stage: stageName,
          submittedBy: user?.displayName || "Unknown",
          roleName,
          stageData,
          daysAtStage,
        }],
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.txId) {
      throw new Error(data.error || "Blockchain recording failed — please check your Algorand wallet funding.");
    }
    return { txId: data.txId, explorerUrl: data.explorerUrl };
  };

  const handleSubmitAndAdvance = async (batch: Batch) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const currentStageIdx = stages.indexOf(batch.currentStage);
      const stageFields = getStageFields(batch.currentStage);
      const isFinalStage = currentStageIdx + 1 >= stages.length;

      // Build stageData from form
      const stageData: Record<string, string | number | boolean> = {};
      stageFields.forEach((f) => {
        const val = stageFormData[f.key];
        if (val !== undefined && val !== "") {
          stageData[f.key] = f.type === "number" ? Number(val) : val;
        }
      });

      // Compute days spent at this stage
      const daysAtStage = computeStageDays(batch);
      stageData._daysAtStage = daysAtStage;

      // 1. Save entry to Firestore
      const entryRef = await createBatchEntry({
        batchId: batch.id!,
        batchNumber: batch.batchNumber,
        orderId: batch.orderId,
        companyId,
        stage: batch.currentStage,
        entryType: "stage_completion",
        notes: notes || `${batch.currentStage} completed by ${roleName}`,
        stageData,
        submittedBy: user?.displayName || "Unknown",
        submittedByEmail: user?.email || "",
        roleName,
      });

      // 2. Record THIS stage entry on Algorand blockchain
      const txResult = await recordOnAlgorand(
        batch, entryRef.id, stageData, batch.currentStage, daysAtStage, isFinalStage
      );
      setSubmitResult((prev) => ({ ...prev, [batch.id!]: txResult }));

      // Save TxID back to the entry in Firestore
      await updateBatchEntry(entryRef.id, { algorandTxId: txResult.txId });

      // 3. If this is the FINAL stage, also create a summary "complete" record
      if (isFinalStage) {
        // Load all entries for a full summary
        const allEntries = await getBatchEntriesByBatch(batch.id!);
        const summaryData: Record<string, string | number | boolean> = {
          totalStages: stages.length,
          totalEntries: allEntries.length,
          completedAt: new Date().toISOString(),
        };
        // Add duration per stage
        const allDurations = { ...(batch.stageDurations || {}), [batch.currentStage]: daysAtStage };
        Object.entries(allDurations).forEach(([stage, days]) => {
          summaryData[`duration_${stage}`] = days;
        });

        const summaryRef = await createBatchEntry({
          batchId: batch.id!,
          batchNumber: batch.batchNumber,
          orderId: batch.orderId,
          companyId,
          stage: "Complete",
          entryType: "batch_complete",
          notes: `Batch ${batch.batchNumber} completed all ${stages.length} stages. Total entries: ${allEntries.length}.`,
          stageData: summaryData,
          submittedBy: "System",
          submittedByEmail: user?.email || "",
          roleName: "System",
        });

        // Record the summary on Algorand too
        try {
          const summaryTx = await recordOnAlgorand(batch, summaryRef.id, summaryData, "Complete", 0, true);
          await updateBatchEntry(summaryRef.id, { algorandTxId: summaryTx.txId });
        } catch (err) {
          // Summary record is optional — stage record already succeeded
          console.warn("Summary blockchain record failed:", err);
        }
      }

      // 4. Advance batch to next stage with time tracking
      const newDurations = { ...(batch.stageDurations || {}), [batch.currentStage]: daysAtStage };

      if (isFinalStage) {
        await updateBatch(batch.id!, {
          currentStage: stages[stages.length - 1],
          status: "complete",
          stageDurations: newDurations,
          algorandTxId: txResult.txId,
        });
      } else {
        await updateBatch(batch.id!, {
          currentStage: stages[currentStageIdx + 1],
          status: "in-progress",
          resetStageTimer: true,
          stageDurations: newDurations,
          algorandTxId: txResult.txId,
        });
      }

      // Reset form
      setStageFormData({});
      setNotes("");

      // Refresh
      const updated = await getBatchesByCompany(companyId);
      setBatches(updated);
      const newEntries = await getBatchEntriesByBatch(batch.id!);
      setEntries((prev) => ({ ...prev, [batch.id!]: newEntries }));
    } catch (err) {
      console.error("Error submitting entry:", err);
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Find which role is assigned to each stage
  const stageRoleMap: Record<string, string> = {};
  allRoles.forEach((r) => {
    if (r.assignedStage) stageRoleMap[r.assignedStage] = r.roleName;
  });

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          Supply Chain <span className="neon-text">Data Entry</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-slate-500">
          <span>Welcome, <strong>{user?.displayName || appUser?.email}</strong></span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            {roleName}
          </span>
          {assignedStage && !isOwner && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100 flex items-center gap-1">
              <Boxes className="w-3 h-3" /> Stage: {assignedStage}
            </span>
          )}
          {company && (
            <span className="text-slate-400">
              at <strong className="text-slate-600">{company.name}</strong>
            </span>
          )}
        </div>
      </header>

      {/* Pipeline Stages */}
      {stages.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Boxes className="w-4 h-4" /> Supply Chain Pipeline
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, i) => {
              const isMyStage = stage === assignedStage && !isOwner;
              const roleForStage = stageRoleMap[stage];
              return (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                    isMyStage
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400 shadow-sm"
                      : "bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-100 text-slate-700"
                  }`}>
                    <div>{i + 1}. {stage} {isMyStage && "← You"}</div>
                    {roleForStage && (
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{roleForStage}</div>
                    )}
                  </div>
                  {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Batches */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          {isOwner ? "All Active Batches" : `Batches at Your Stage: ${assignedStage}`}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {isOwner
            ? "Monitor all active batches. Each stage's assigned role will fill in data."
            : "Fill in the form and submit — data is recorded on blockchain and batch advances to the next stage."}
        </p>

        {myBatches.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No batches waiting</h3>
            <p className="text-slate-500 text-sm">
              {isOwner
                ? "No active batches. Create an order and add batches to start."
                : !assignedStage
                ? "Your role has no stage assigned. Ask your company admin to assign one."
                : `No batches at the "${assignedStage}" stage right now. They'll appear when the previous stage completes.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myBatches.map((batch) => {
              const currentStageIdx = stages.indexOf(batch.currentStage);
              const isExpanded = expandedBatch === batch.id;
              const batchEntries = entries[batch.id!] || [];
              const isLoadingEntriesForBatch = loadingEntries === batch.id;
              const stageFields = getStageFields(batch.currentStage);
              const previousEntries = batchEntries.filter((e) => e.stage !== batch.currentStage);
              const daysAtStage = computeStageDays(batch);
              const txResult = submitResult[batch.id!];

              return (
                <div
                  key={batch.id}
                  className={`glass-card overflow-hidden transition-all ${
                    txResult ? "ring-2 ring-emerald-400" : ""
                  } ${isExpanded ? "shadow-lg" : ""}`}
                >
                  {/* Batch Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => toggleBatch(batch.id!)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{batch.batchNumber}</p>
                          <p className="text-sm text-slate-500">
                            Stage {currentStageIdx + 1}/{stages.length}: <strong className="text-slate-700">{batch.currentStage}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Timer className="w-3 h-3" /> {daysAtStage} day{daysAtStage !== 1 ? "s" : ""} at stage
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-1 mb-2">
                      {stages.map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            i <= currentStageIdx
                              ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Stage durations summary */}
                    {batch.stageDurations && Object.keys(batch.stageDurations).length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(batch.stageDurations).map(([stage, days]) => (
                          <span key={stage} className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                            {stage}: {days}d
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SUCCESS: Blockchain Link after submit */}
                  {txResult && (
                    <div className="px-5 pb-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-emerald-800">Recorded on Algorand Blockchain!</p>
                          <p className="text-xs text-emerald-600 font-mono truncate">{txResult.txId}</p>
                        </div>
                        <a
                          href={txResult.explorerUrl}
                          target="_blank" rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View on Explorer
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Expanded: Data Entry Form + History */}
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      {/* Loading */}
                      {isLoadingEntriesForBatch && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        </div>
                      )}

                      {/* Previous Stage Entries (Audit Trail) */}
                      {previousEntries.length > 0 && (
                        <div className="p-5 bg-slate-50/50 border-b border-slate-200">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-600" />
                            Previous Stage Data (Read-Only Audit Trail)
                          </h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {previousEntries.map((entry) => (
                              <div key={entry.id} className="p-3 bg-white rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                                    {entry.stage}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                                    {entry.roleName}
                                  </span>
                                  <span className="text-xs text-slate-500">{entry.submittedBy}</span>
                                  {entry.algorandTxId && (
                                    <a
                                      href={`https://testnet.explorer.perawallet.app/tx/${entry.algorandTxId}`}
                                      target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                                    >
                                      <ShieldCheck className="w-3 h-3" /> On-chain ↗
                                    </a>
                                  )}
                                  {entry.createdAt && (
                                    <span className="text-xs text-slate-400 ml-auto">
                                      {new Date(entry.createdAt.seconds * 1000).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {entry.notes && <p className="text-sm text-slate-700 mb-1">{entry.notes}</p>}
                                {entry.stageData && Object.keys(entry.stageData).length > 0 && (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                                    {Object.entries(entry.stageData).filter(([k]) => !k.startsWith("_")).map(([k, v]) => (
                                      <div key={k} className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                                        <p className="text-xs text-slate-400 font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                                        <p className="text-sm font-semibold text-slate-800">{String(v)}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stage-Specific Data Entry Form */}
                      {!txResult && (
                        <div className="p-5 bg-gradient-to-b from-blue-50/30 to-white">
                          <h4 className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              Enter Data for: <span className="text-blue-600">{batch.currentStage}</span>
                            </div>
                            {isOwner && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 ml-0 sm:ml-2">
                                Admin Override (Testing)
                              </span>
                            )}
                            <span className="sm:ml-auto text-xs text-slate-400 font-normal flex items-center gap-1 mt-2 sm:mt-0">
                              <Timer className="w-3 h-3" /> {daysAtStage} day(s) at this stage
                            </span>
                          </h4>

                          <div className="space-y-3">
                            {/* Stage-specific fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {stageFields.map((field) => {
                                const Icon = field.icon;
                                return (
                                  <div key={field.key} className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </label>
                                    {field.type === "select" ? (
                                      <select
                                        value={stageFormData[field.key] || ""}
                                        onChange={(e) => setStageFormData({ ...stageFormData, [field.key]: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                      >
                                        <option value="">Select...</option>
                                        {field.options?.map((o) => (
                                          <option key={o} value={o}>{o}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={field.type}
                                        value={stageFormData[field.key] || ""}
                                        onChange={(e) => setStageFormData({ ...stageFormData, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes */}
                            <div>
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" /> Additional Notes
                              </label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any additional observations..."
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                              />
                            </div>

                            {/* Error Message */}
                            {submitError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-red-700">
                                  <p className="font-bold">Submission Failed</p>
                                  <p>{submitError}</p>
                                </div>
                              </div>
                            )}

                            {/* Submit */}
                            <button
                              onClick={() => handleSubmitAndAdvance(batch)}
                              disabled={submitting}
                              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                              {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Recording on Blockchain &amp; Advancing...</>
                              ) : (
                                <><Send className="w-4 h-4" /> Submit, Record on Chain &amp; Advance</>
                              )}
                            </button>
                            <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                              <LinkIcon className="w-3 h-3" /> All data is permanently recorded on the Algorand blockchain
                            </p>
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

      {/* Upcoming Batches */}
      {upcomingBatches.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" /> Upcoming Batches
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            These batches are currently at an earlier stage in the supply chain and will arrive at your stage soon.
          </p>
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-slate-200">
              {upcomingBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleBatch(batch.id!)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-8 rounded-full bg-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{batch.batchNumber}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        Currently at <strong className="text-slate-700">{batch.currentStage}</strong> (Waiting on {stageRoleMap[batch.currentStage] || "assigned role"})
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 whitespace-nowrap">
                    In Pipeline
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed Batches */}
      {completedBatches.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Completed Batches
          </h3>
          <div className="glass-card overflow-hidden">
            <div className="divide-y divide-slate-200">
              {completedBatches.slice(0, 10).map((batch) => (
                <div key={batch.id} className="flex flex-col">
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => toggleBatch(batch.id!)}
                  >
                    <div className="w-2 h-8 rounded-full bg-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{batch.batchNumber}</p>
                      <div className="flex gap-2 flex-wrap mt-0.5">
                        {batch.stageDurations && Object.entries(batch.stageDurations).map(([stage, days]) => (
                          <span key={stage} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            {stage}: {days}d
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hide-mobile">
                      Complete
                    </span>
                    {batch.algorandTxId && (
                      <a
                        href={`https://testnet.explorer.perawallet.app/tx/${batch.algorandTxId}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> On-chain ↗
                      </a>
                    )}
                    {expandedBatch === batch.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>

                  {expandedBatch === batch.id && (
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Public Certificate Ready
                        </h4>
                        <p className="text-sm text-slate-600 mb-4 max-w-md">
                          This batch has completed all stages. A verifiable public certificate is now available. Print this QR label to attach to your physical packaging.
                        </p>
                        <a href={`/verify/${batch.id}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm">
                          View Public Certificate <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="shrink-0 w-full md:w-64">
                        <QRCodeGenerator batchId={batch.id!} status="Complete" theme="light" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No stage assigned warning */}
      {!isOwner && !assignedStage && (
        <div className="glass-card p-6 mt-6 border-amber-100 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">No Stage Assigned</p>
              <p className="text-sm text-slate-600">
                Your company admin has not assigned a supply chain stage to your role. Contact your admin to get assigned.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
