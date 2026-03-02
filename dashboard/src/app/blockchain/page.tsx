"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Link as LinkIcon,
  Boxes,
  Clock,
  Tag,
  User,
  FileText,
  Hash,
  CalendarDays,
  Package,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getCompany,
  getBatchEntriesByCompany,
  getBatchesByCompany,
  type Company,
  type BatchEntry,
  type Batch,
} from "@/lib/firestore";

export default function BlockchainEntriesPage() {
  const { appUser } = useAuth();
  const companyId = appUser?.companyId || "";

  const [company, setCompany] = useState<Company | null>(null);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      getCompany(companyId),
      getBatchEntriesByCompany(companyId),
      getBatchesByCompany(companyId),
    ])
      .then(([c, e, b]) => {
        setCompany(c);
        setEntries(e);
        setBatches(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const stages = company?.stages || [];

  // Get unique role names from entries
  const roleNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach((e) => names.add(e.roleName));
    return Array.from(names);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Only show entries with blockchain records
    if (stageFilter !== "all") {
      result = result.filter((e) => e.stage === stageFilter);
    }
    if (roleFilter !== "all") {
      result = result.filter((e) => e.roleName === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.batchNumber || "").toLowerCase().includes(q) ||
          e.submittedBy.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          (e.algorandTxId || "").toLowerCase().includes(q) ||
          e.stage.toLowerCase().includes(q)
      );
    }

    // Sort by creation date descending
    return [...result].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [entries, stageFilter, roleFilter, searchQuery]);

  const onChainEntries = entries.filter((e) => e.algorandTxId);
  const totalEntries = entries.length;
  const onChainBatches = batches.filter((b) => b.algorandTxId);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
          Blockchain <span className="neon-text">Ledger</span>
        </h1>
        <p className="text-slate-500">
          All supply chain data entries recorded on the Algorand blockchain for <strong>{company?.name}</strong>.
          Every entry is immutable and publicly verifiable.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Entries", value: totalEntries, icon: FileText, color: "text-slate-900", bg: "bg-slate-50", border: "border-slate-200" },
          { label: "On-Chain Entries", value: onChainEntries.length, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { label: "On-Chain Batches", value: onChainBatches.length, icon: LinkIcon, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
          { label: "Supply Stages", value: stages.length, icon: Boxes, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`glass-card p-5 border ${stat.border}`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by batch, submitter, notes, or TxID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              showFilters || stageFilter !== "all" || roleFilter !== "all"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
            {(stageFilter !== "all" || roleFilter !== "all") && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {(stageFilter !== "all" ? 1 : 0) + (roleFilter !== "all" ? 1 : 0)}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Stages</option>
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Roles</option>
                {roleNames.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {(stageFilter !== "all" || roleFilter !== "all") && (
              <button
                onClick={() => { setStageFilter("all"); setRoleFilter("all"); }}
                className="self-end px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Showing <strong className="text-slate-900">{filteredEntries.length}</strong> of {totalEntries} entries
        </p>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No entries found</h2>
          <p className="text-slate-500">
            {searchQuery || stageFilter !== "all" || roleFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Supply chain entries will appear here as your team submits data at each stage."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const hasChainRecord = !!entry.algorandTxId;
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className={`glass-card overflow-hidden transition-all ${
                  hasChainRecord ? "border-l-4 border-emerald-400" : "border-l-4 border-slate-300"
                }`}
              >
                <div className="p-5">
                  {/* Top row: batch, stage, role, time */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                      <Package className="w-3 h-3" /> {entry.batchNumber || entry.batchId.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
                      <Boxes className="w-3 h-3" /> {entry.stage}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                      <User className="w-3 h-3" /> {entry.roleName}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                      <CalendarDays className="w-3 h-3" />
                      {entry.createdAt
                        ? new Date(entry.createdAt.seconds * 1000).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>

                  {/* Submitter */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                      {entry.submittedBy[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{entry.submittedBy}</span>
                    <span className="text-xs text-slate-400">{entry.submittedByEmail}</span>
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <p className="text-sm text-slate-700 mb-3">{entry.notes}</p>
                  )}

                  {/* Stage Data */}
                  {entry.stageData && Object.keys(entry.stageData).filter((k) => !k.startsWith("_")).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                      {Object.entries(entry.stageData)
                        .filter(([k]) => !k.startsWith("_"))
                        .map(([k, v]) => (
                          <div key={k} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                            <p className="text-xs text-slate-400 font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                            <p className="text-sm font-semibold text-slate-800 truncate">{String(v)}</p>
                          </div>
                        ))}
                      {entry.stageData._daysAtStage != null && (
                        <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                          <p className="text-xs text-amber-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Days at Stage</p>
                          <p className="text-sm font-semibold text-amber-800">{String(entry.stageData._daysAtStage)} day(s)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blockchain Record */}
                  {hasChainRecord ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 mb-0.5">Recorded on Algorand Testnet</p>
                        <p className="text-xs font-mono text-emerald-600 truncate">{entry.algorandTxId}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => copyToClipboard(entry.algorandTxId!, entry.id!)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Copy TxID"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                        <a
                          href={`https://testnet.explorer.perawallet.app/tx/${entry.algorandTxId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Verify
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-500">Pending blockchain recording</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
