"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  BookOpen,
  Video,
  FileText,
  Award,
  FileCheck,
  Image as ImageIcon,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/constants/adminNav";
import { logoutAdminAction } from "@/server/actions/auth.actions.js";

const ICONS = {
  dashboard: LayoutDashboard,
  students: Users,
  devices: Smartphone,
  courses: BookOpen,
  lectures: Video,
  notes: FileText,
  toppers: Award,
  results: FileCheck,
  gallery: ImageIcon,
  reviews: MessageSquare,
  announcements: Megaphone,
  settings: Settings,
};

export default function AdminSidebar({ initialPendingCount = 0, adminUser }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(initialPendingCount);

  useEffect(() => {
    let timerId = null;

    const fetchPendingCount = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/pending-count");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setPendingCount(data.count);
          }
        }
      } catch {
        // silent fail on network glitch
      }
    };

    timerId = setInterval(fetchPendingCount, 30000);
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchPendingCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerId) clearInterval(timerId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <aside
      className="hidden lg:flex w-[279px] shrink-0 flex-col justify-between p-4 shadow-2xl z-30 select-none text-white"
      style={{
        background: "linear-gradient(180deg, #0F1B2D 0%, #0B1424 100%)",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
      }}
      aria-label="Admin Navigation"
    >
      {/* Top: Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 pt-3">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-950 font-black text-xl shadow-md">
            RD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-black tracking-tight text-white">
                RD CLASSES
              </span>
              <span className="rounded-md bg-[#FFC21A]/20 px-1.5 py-0.5 text-[10px] font-extrabold text-[#FFC21A]">
                ADMIN
              </span>
            </div>
            <div className="text-[13px] font-medium text-slate-400">
              Management Suite
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1" role="navigation">
          {ADMIN_NAV_ITEMS.filter((item) => item.enabled).map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const isDeviceRequests = item.id === "devices";

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between h-[45px] w-[244px] mx-auto rounded-[14px] px-3.5 text-[15.5px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#FFC21A] text-neutral-950 font-bold shadow-[0_4px_16px_rgba(255,194,26,0.35)]"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-[20px] w-[20px] shrink-0 ${
                      isActive ? "text-neutral-950 stroke-[2.3]" : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {isDeviceRequests && pendingCount > 0 && (
                  <span
                    className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#E5432D] px-1 text-[11px] font-extrabold text-white shadow-xs"
                    aria-label={`${pendingCount} pending requests`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Card: User profile + Logout */}
      <div className="rounded-[18px] bg-white/6 p-3 border border-white/8 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-950 font-bold text-sm shrink-0">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="truncate">
            <div className="text-sm font-bold text-white truncate">
              {adminUser?.name || "Administrator"}
            </div>
            <div className="text-xs text-slate-400">
              Administrator
            </div>
          </div>
        </div>

        <form action={logoutAdminAction}>
          <button
            type="submit"
            aria-label="Logout"
            title="Sign out of Admin Portal"
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
