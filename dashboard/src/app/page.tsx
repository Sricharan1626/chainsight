import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Boxes,
  QrCode,
  Brain,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChainSight — AI-Powered Supply Chain Intelligence",
  description: "Monitor your supply chain with AI risk detection and immutable Algorand blockchain audits.",
};

const features = [
  {
    icon: Brain,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "AI Risk Engine",
    desc: "Our Python microservice analyzes batch timing in real-time. Delays, bottlenecks, and anomalies are flagged instantly — before they become crises.",
  },
  {
    icon: ShieldCheck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    title: "Algorand Blockchain Lock",
    desc: "When a critical risk is detected, a transaction is minted to the Algorand Testnet — permanently and immutably sealing the AI's findings on-chain.",
  },
  {
    icon: Boxes,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Multi-Tenant SaaS",
    desc: "Every company gets its own isolated tenant with custom supply chain stages. Role-based access: Admin, Manager, Employee.",
  },
  {
    icon: QrCode,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    title: "Consumer Verification",
    desc: "A QR code on every completed batch links to a beautiful public certificate — no login needed. Customers verify authenticity in seconds.",
  },
  {
    icon: BarChart3,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Real-Time Analytics",
    desc: "Production efficiency charts, timeline views, and anomaly dashboards give managers a live window into operational health.",
  },
  {
    icon: Zap,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    title: "Instant Stage Updates",
    desc: "Employees update batch progress from any device. The system auto-calculates delays vs. expected timelines and triggers AI analysis instantly.",
  },
];

const trustedBy = ["Acme Manufacturing", "QuantumLogistics", "PharmaChain", "EcoPackage Co.", "NexGen Electronics"];

export default function MarketingHomePage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-blue-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-8">
            <ShieldCheck className="w-4 h-4" />
            Powered by AI + Algorand Blockchain
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            AI-Powered Supply Chain{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Monitoring</span>{" "}
            with Immutable{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Blockchain Audits</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            ChainSight detects delays, scores risk with AI, and permanently seals critical events on the Algorand blockchain — giving every product a verifiable, tamper-proof journey from factory to customer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/request-access"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-500 hover:to-emerald-500 transition-all text-lg"
            >
              Request Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all text-lg"
            >
              View Plans
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["✓ No credit card required", "✓ 5-minute setup", "✓ GDPR compliant", "✓ SOC 2 ready"].map((t) => (
              <span key={t} className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-600 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="py-12 border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by forward-thinking manufacturers</p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {trustedBy.map((name) => (
              <span key={name} className="text-slate-400 font-semibold text-lg">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Everything your supply chain needs,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">nothing it doesn&apos;t</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">From factory floor to end-customer verification — one platform, end-to-end.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-xl border ${f.bg} ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            From request to verified product in{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">5 steps</span>
          </h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-6">
          {[
            { n: "01", title: "Request Access", desc: "An executive fills out a short form. We review and approve within 24 hours." },
            { n: "02", title: "Onboard Your Company", desc: "Admin logs in, defines custom supply chain stages (e.g. Raw Materials → Assembly → QA → Packaging), invites the team." },
            { n: "03", title: "Create Orders & Track Batches", desc: "Managers create orders. Employees update batches in real-time from any device." },
            { n: "04", title: "AI Risk Detection", desc: "If a batch takes longer than expected, AI instantly scores the delay and triggers a permanent Algorand audit record." },
            { n: "05", title: "Customer Scans QR", desc: "The product ships with a QR code. Anyone scans it to see the full, verified journey — no account needed." },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                {step.n}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          <CheckCircle2 className="w-12 h-12 text-white/60 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white mb-4">Ready to bring trust to your supply chain?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Join leading manufacturers who use ChainSight to detect risk before it costs them — and prove integrity to every customer.
          </p>
          <Link href="/request-access" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-lg">
            Request Access Today <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
