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
  Activity,
  LogOut,
} from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/constants/adminNav";
import { logoutAdminAction } from "@/server/actions/auth.actions.js";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

const ICONS = {
  dashboard: LayoutDashboard,
  students: Users,
  enquiries: MessageSquare,
  devices: Smartphone,
  courses: BookOpen,
  lectures: Video,
  tests: FileCheck,
  announcements: Megaphone,
  settings: Settings,
  activity: Activity,
  notes: FileText,
  toppers: Award,
  results: FileCheck,
  gallery: ImageIcon,
  reviews: MessageSquare,
  media: ImageIcon,
};

export default function AdminSidebar({
  initialPendingCount = 0,
  adminUser: initialAdminUser,
  isMobile = false,
}) {
  const pathname = usePathname();
  const { pendingDeviceCount } = useAdminNotifications();
  const pendingCount =
    typeof pendingDeviceCount === "number" ? pendingDeviceCount : initialPendingCount;

  const [adminUser, setAdminUser] = useState(
    initialAdminUser || { name: "Ronak Dugar", role: "admin" }
  );

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.user) {
          setAdminUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async (e) => {
    e?.preventDefault();
    if (window.confirm("Log out of the admin panel?")) {
      try {
        await fetch("/api/auth/admin-logout", { method: "POST" });
      } catch (err) {}
      window.location.href = "/admin-login";
    }
  };

  const displayName = adminUser?.name || "Ronak Dugar";
  const avatarInitial = displayName.charAt(0).toUpperCase() || "R";

  return (
    <aside
      className={`${
        isMobile ? "flex w-full" : "hidden lg:flex w-[280px]"
      } shrink-0 h-screen sticky top-0 flex-col justify-between p-4 shadow-2xl z-30 select-none text-white overflow-hidden`}
      style={{
        background: "linear-gradient(180deg, #0F1B2D 0%, #0B1424 100%)",
      }}
      aria-label="Admin Navigation"
    >
      {/* Top: Brand Header */}
      <div className="shrink-0 space-y-4 pt-1 px-1">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-950 font-black text-xl shadow-md shrink-0">
            RD
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-black tracking-tight text-white truncate">
                RD CLASSES
              </span>
              <span className="rounded-md bg-[#FFC21A]/20 px-1.5 py-0.5 text-[10px] font-extrabold text-[#FFC21A]">
                ADMIN
              </span>
            </div>
            <div className="text-[12px] font-medium text-slate-400 truncate">
              Management Suite
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Scrollable Navigation List (fits screen, settings never cut off) */}
      <div
        className="flex-1 overflow-y-auto pr-1 my-3 space-y-1"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
        }}
      >
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
                className={`group flex items-center justify-between h-[44px] w-full rounded-[14px] px-3.5 text-[15px] font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#FFC21A] text-neutral-950 font-bold shadow-[0_4px_16px_rgba(255,194,26,0.35)]"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 ${
                      isActive
                        ? "text-neutral-950 stroke-[2.3]"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {isDeviceRequests && pendingCount > 0 && (
                  <span
                    className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#E5432D] px-1 text-[11px] font-extrabold text-white shadow-xs ml-2 shrink-0"
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

      {/* Bottom Profile Card: Yellow-ring avatar "R", "Ronak Dugar", "Administrator", and Logout */}
      <div className="shrink-0 pt-2">
        <div className="rounded-[18px] bg-white/6 p-3 border border-white/8 backdrop-blur-xs flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            {/* Yellow circle avatar matching reference */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-950 font-black text-sm shrink-0 shadow-xs">
              RD
            </div>
            <div className="truncate min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {displayName}
              </div>
              <div className="text-xs text-slate-400 truncate">
                Administrator
              </div>
            </div>
          </div>

          {/* Visible Logout icon button with confirmation dialog */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Sign out of Admin Portal"
            className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
