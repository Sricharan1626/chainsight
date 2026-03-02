import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — ChainSight",
  description: "Choose a plan that fits your supply chain complexity.",
};

const plans = [
  {
    name: "Basic Tracking",
    price: "$299",
    period: "/month",
    description:
      "Everything you need to digitize and track your supply chain workflows. No AI or blockchain.",
    color: "border-slate-200",
    badgeColor: "bg-slate-100 text-slate-700",
    buttonStyle:
      "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    popular: false,
    features: [
      "Up to 5 supply chain stages",
      "Up to 10 team members",
      "Order & batch management",
      "Real-time stage updates",
      "Role-based access (Admin, Manager, Employee)",
      "Basic analytics dashboard",
      "Email support",
    ],
    missing: [
      "AI Risk Engine",
      "Algorand blockchain recording",
      "QR code verification",
      "Public certificate page",
    ],
  },
  {
    name: "Enterprise AI + Algorand",
    price: "$899",
    period: "/month",
    description:
      "The full platform. AI-powered risk detection and immutable blockchain records for enterprise-grade supply chain integrity.",
    color: "border-blue-500 ring-4 ring-blue-100 shadow-2xl",
    badgeColor: "bg-blue-600 text-white",
    buttonStyle:
      "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-500 hover:to-emerald-500 shadow-lg",
    popular: true,
    features: [
      "Unlimited supply chain stages",
      "Unlimited team members",
      "Order & batch management",
      "Real-time stage updates",
      "Role-based access (Admin, Manager, Employee)",
      "Advanced analytics & production charts",
      "AI Risk Engine (Python microservice)",
      "Algorand blockchain recording for high-risk events",
      "QR code generation per batch",
      "Public Certificate of Authenticity page",
      "Pera Explorer TxID verification links",
      "Priority support + dedicated onboarding",
    ],
    missing: [],
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-16 px-6 text-center relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Simple, transparent pricing
          </span>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              Plan
            </span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Start with basic supply chain tracking or unlock the full AI + blockchain
            intelligence layer.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border-2 p-8 flex flex-col ${plan.color} transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-5 py-1.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${plan.badgeColor}`}
                >
                  {plan.name}
                </span>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-5xl font-black text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 mb-2">{plan.period}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <Link
                href="/request-access"
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold transition-all mb-8 ${plan.buttonStyle}`}
              >
                Request Access <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-3 opacity-40">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5 flex items-center justify-center">
                      <span className="text-slate-400 text-xs font-bold">—</span>
                    </div>
                    <span className="text-sm text-slate-500 line-through">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ blurb */}
        <div className="mx-auto max-w-2xl mt-16 text-center">
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200">
            <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              All plans include
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Free onboarding, 99.9% uptime SLA, Firebase authentication, multi-tenant
              data isolation, and a dedicated tenant dashboard — from day one.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
