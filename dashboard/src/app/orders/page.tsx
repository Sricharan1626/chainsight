"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  X,
  Clock,
  Package,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getOrdersByCompany,
  createOrder,
  getBatchesByCompany,
  type Order,
  type Batch,
} from "@/lib/firestore";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function OrdersPage() {
  const { user, appUser } = useAuth();
  const [orders, setOrders] = useState<(Order & { batches: Batch[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ description: "", quantity: "100", expectedIntervalMinutes: "120" });
  const [creating, setCreating] = useState(false);

  const companyId = appUser?.companyId || "";

  const fetchOrders = async () => {
    if (!companyId) return;
    try {
      const [ordersData, batchesData] = await Promise.all([
        getOrdersByCompany(companyId),
        getBatchesByCompany(companyId),
      ]);
      const ordersWithBatches = ordersData.map((o) => ({
        ...o,
        batches: batchesData.filter((b) => b.orderId === o.id),
      }));
      setOrders(ordersWithBatches);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [companyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createOrder({
        description: form.description,
        quantity: Number(form.quantity),
        expectedIntervalMinutes: Number(form.expectedIntervalMinutes),
        status: "Active",
        companyId,
      });
      setShowCreate(false);
      setForm({ description: "", quantity: "100", expectedIntervalMinutes: "120" });
      await fetchOrders();
    } catch (err) {
      console.error("Error creating order:", err);
    } finally {
      setCreating(false);
    }
  };

  const totalBatches = orders.reduce((a, o) => a + o.batches.length, 0);
  const activeBatches = orders.reduce((a, o) => a + o.batches.filter((b) => b.status === "in-progress").length, 0);
  const completedBatches = orders.reduce((a, o) => a + o.batches.filter((b) => b.status === "complete").length, 0);

  return (
    <div className="p-8 pb-20 animate-fade-in w-full max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
            Orders <span className="neon-text">Management</span>
          </h1>
          <p className="text-slate-500">Manage production orders and track batch progress in real-time.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: orders.length, color: "text-blue-600", border: "border-blue-100" },
          { label: "Active Batches", value: activeBatches, color: "text-amber-600", border: "border-amber-100" },
          { label: "Completed Batches", value: completedBatches, color: "text-emerald-600", border: "border-emerald-100" },
          { label: "Total Batches", value: totalBatches, color: "text-slate-700", border: "border-slate-200" },
        ].map((s) => (
          <div key={s.label} className={`glass-card p-5 flex flex-col border ${s.border}`}>
            <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-6">Create your first order to start tracking production batches.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-bold shadow-md"
          >
            <Plus className="w-4 h-4 inline mr-2" /> Create First Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="glass-card p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{order.description}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {order.quantity.toLocaleString()} units</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {order.expectedIntervalMinutes}min/stage</span>
                    <span>{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : ""}</span>
                  </div>
                </div>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shrink-0"
                >
                  View Batches <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Batch mini-chips */}
              <div className="flex flex-wrap gap-2">
                {order.batches.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No batches yet</span>
                ) : (
                  order.batches.slice(0, 6).map((b) => (
                    <span
                      key={b.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusColors[b.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      {b.status === "complete" ? <CheckCircle2 className="w-3 h-3" /> : b.status === "in-progress" ? <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                      {b.batchNumber}
                    </span>
                  ))
                )}
                {order.batches.length > 6 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500">
                    +{order.batches.length - 6} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create New Order</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order Description *</label>
                <input
                  required
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Order #999 — 10,000 Laptops"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quantity (units)</label>
                  <input
                    type="number" min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expected min/stage</label>
                  <input
                    type="number" min="1"
                    value={form.expectedIntervalMinutes}
                    onChange={(e) => setForm({ ...form, expectedIntervalMinutes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={creating}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:from-blue-500 hover:to-emerald-500 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
