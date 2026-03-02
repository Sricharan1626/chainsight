"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Boxes, Loader2, ShieldX } from "lucide-react";

export default function LoginPage() {
  const { user, appUser, loading, noAccess, loginWithGoogle, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.email === "24070722013@sithyd.siu.edu.in") {
        router.replace("/admin");
        return;
      }
      if (appUser) {
        // Route based on role
        if (appUser.role === "Owner") {
          router.replace("/company-admin");
        } else {
          router.replace("/supply-chain");
        }
      }
    }
  }, [user, appUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // No access state — user logged in but not recognized
  if (noAccess && user && user.email !== "24070722013@sithyd.siu.edu.in") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-amber-100 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg mx-auto mb-4">
              <ShieldX className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">No Access</h1>
            <p className="text-slate-500 mt-2">Your Google account is not registered with any company.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
            <p className="text-sm text-slate-600 mb-2">Signed in as</p>
            <p className="font-semibold text-slate-900 mb-1">{user.displayName}</p>
            <p className="text-sm text-slate-500 mb-6">{user.email}</p>
            <p className="text-sm text-slate-500 mb-6">
              Ask your company admin to add your email as a role, or{" "}
              <a href="/request-access" className="text-blue-600 hover:underline font-semibold">request access</a> for your company.
            </p>
            <button
              onClick={logout}
              className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-all"
            >
              Sign Out & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 overflow-hidden bg-white/10">
            <img src="/logo.png" alt="ChainSight Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Chain<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Sight</span>
          </h1>
          <p className="text-slate-500 mt-2">AI-Powered Supply Chain Intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8 text-center">Sign in to access your supply chain dashboard</p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-slate-900 font-semibold shadow-sm group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="group-hover:text-blue-700 transition-colors">Continue with Google</span>
          </button>

          <p className="text-xs text-slate-400 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <a href="/request-access" className="font-semibold text-blue-600 hover:underline">Request Access</a>
        </p>
      </div>
    </div>
  );
}
