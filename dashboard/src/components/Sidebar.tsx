"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  AlertTriangle,
  Settings,
  Boxes,
  Users,
  LogOut,
  Shield,
  Package,
  Link as LinkIcon,
  Bot,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, appUser, companyRole } = useAuth();

  const isOwner = appUser?.role === "Owner";
  const access = companyRole?.access || [];

  // Build nav items based on role
  const navItems = [];

  if (isOwner) {
    navItems.push(
      { name: "Company Admin", href: "/company-admin", icon: Shield },
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "AI Agents", href: "/agents", icon: Bot },
      { name: "Blockchain Ledger", href: "/blockchain", icon: LinkIcon },
      { name: "AI Risk Alerts", href: "/alerts", icon: AlertTriangle },
      { name: "Team", href: "/team", icon: Users },
      { name: "Onboarding", href: "/onboarding", icon: Boxes },
      { name: "Settings", href: "/settings", icon: Settings }
    );
  } else {
    // Role-based employee nav
    navItems.push({ name: "Supply Chain", href: "/supply-chain", icon: Package });

    if (access.includes("view_dashboard")) {
      navItems.push({ name: "Overview", href: "/dashboard", icon: LayoutDashboard });
    }
    if (access.includes("manage_orders")) {
      navItems.push({ name: "Orders", href: "/orders", icon: ShoppingCart });
    }
    if (access.includes("view_dashboard")) {
      navItems.push({ name: "AI Agents", href: "/agents", icon: Bot });
    }
    if (access.includes("view_alerts")) {
      navItems.push({ name: "AI Risk Alerts", href: "/alerts", icon: AlertTriangle });
    }
  }

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const { logout } = useAuth();

  const doLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="w-64 h-screen fixed top-0 left-0 flex flex-col glass border-r border-slate-200 z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md premium-glow overflow-hidden bg-white/10">
          <img src="/logo.png" alt="ChainSight Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Chain<span className="neon-text">Sight</span>
        </span>
      </div>

      {/* Role badge */}
      {appUser && (
        <div className="px-6 pb-3">
          <span
            className={clsx(
              "px-2.5 py-1 rounded-full text-xs font-semibold",
              isOwner
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            )}
          >
            {appUser.role}
          </span>
        </div>
      )}

      {/* Nav items */}
      <div className="px-4 py-2 flex-1 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider px-2">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/company-admin" &&
              item.href !== "/supply-chain" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-r-md" />
              )}
              <Icon
                className={clsx(
                  "w-5 h-5 transition-transform duration-200",
                  isActive ? "text-blue-600" : "group-hover:scale-110"
                )}
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom user strip */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-emerald-200 flex items-center justify-center text-xs font-bold text-slate-700">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {user?.displayName || "User"}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {user?.email || ""}
            </span>
          </div>
        </div>
        <button
          onClick={doLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
