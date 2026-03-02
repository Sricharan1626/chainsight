"use client";

import { useState } from "react";
import {
  Building2,
  Mail,
  Package,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Factory,
} from "lucide-react";
import { createRequest } from "@/lib/firestore";

export default function RequestAccessPage() {
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    monthlyBatches: "",
    contactEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await createRequest({
        companyName: form.companyName,
        industry: form.industry,
        monthlyBatches: Number(form.monthlyBatches),
        contactEmail: form.contactEmail,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Request Submitted!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Thank you, <strong>{form.companyName}</strong>. We&apos;ll review your application and get back to you at <strong>{form.contactEmail}</strong> within 24 hours.
          </p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
            Request <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Access</span>
          </h1>
          <p className="text-slate-500 text-lg">Tell us about your company and we&apos;ll set up your custom supply chain dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Building2 className="w-4 h-4" /> Company Name *
            </label>
            <input
              required type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="e.g. Acme Manufacturing Inc."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Factory className="w-4 h-4" /> Industry *
            </label>
            <select
              required
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none"
            >
              <option value="" disabled>Select your industry</option>
              <option>Electronics Manufacturing</option>
              <option>Automotive Assembly</option>
              <option>Pharmaceuticals</option>
              <option>Food &amp; Beverage</option>
              <option>Textile &amp; Apparel</option>
              <option>Agriculture &amp; Farming</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Package className="w-4 h-4" /> Expected Monthly Batches *
            </label>
            <input
              required type="number" min="1"
              value={form.monthlyBatches}
              onChange={(e) => setForm({ ...form, monthlyBatches: e.target.value })}
              placeholder="e.g. 500"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Mail className="w-4 h-4" /> Contact Email *
            </label>
            <input
              required type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="cto@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-500 hover:to-emerald-500 transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
            ) : (
              <>Submit Request <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
