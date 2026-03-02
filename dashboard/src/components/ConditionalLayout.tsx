"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Boxes, ArrowRight, Loader2, ShieldX } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

// Routes that show the marketing navbar + footer (no sidebar, no auth)
const MARKETING_PATHS = ["/", "/pricing", "/request-access"];

// Routes where NOTHING wraps (standalone pages — no nav, no sidebar)
const STANDALONE_PREFIXES = ["/verify", "/admin", "/login"];

// --- Marketing Navbar ---
function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white/10">
            <img src="/logo.png" alt="ChainSight Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Chain<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Sight</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          <Link href="/verify/demo" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Verify Product</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors">
            Log in
          </Link>
          <Link href="/request-access" className="text-sm font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md hover:shadow-lg hover:from-blue-500 hover:to-emerald-500 transition-all flex items-center gap-1.5">
            Request Access <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// --- Marketing Footer ---
function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden bg-white/10">
            <img src="/logo.png" alt="ChainSight Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold">ChainSight</span>
        </div>
        <p className="text-sm text-slate-500">© 2026 ChainSight. Supply chain integrity, powered by AI + Algorand.</p>
        <div className="flex gap-6 text-sm">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/request-access" className="hover:text-white transition-colors">Request Access</Link>
          <Link href="/verify/demo" className="hover:text-white transition-colors">Verify</Link>
        </div>
      </div>
    </footer>
  );
}

// --- No Access Page ---
function NoAccessPage() {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg mx-auto mb-6">
          <ShieldX className="text-white w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Access</h2>
        <p className="text-slate-500 mb-2">Signed in as <strong>{user?.email}</strong></p>
        <p className="text-sm text-slate-500 mb-8">
          Your account is not associated with any company. Ask your company admin to add your email as a role.
        </p>
        <button
          onClick={logout}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// --- Auth Gate for Dashboard ---
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, noAccess } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (noAccess) {
    if (user?.email === "24070722013@sithyd.siu.edu.in") {
      router.replace("/admin");
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      );
    }
    return <NoAccessPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 h-full overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        {children}
      </main>
    </div>
  );
}

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isMarketing = MARKETING_PATHS.includes(pathname);
  const isStandalone = STANDALONE_PREFIXES.some((p) => pathname.startsWith(p));

  // Standalone pages (verify, admin, login) — no nav, no sidebar
  if (isStandalone) {
    return <>{children}</>;
  }

  // Marketing pages (/, /pricing, /request-access) — marketing nav + footer, no auth
  if (isMarketing) {
    return (
      <>
        <MarketingNav />
        <main className="pt-16">{children}</main>
        <MarketingFooter />
      </>
    );
  }

  // Dashboard pages — require authentication, show sidebar
  return <AuthGate>{children}</AuthGate>;
}
