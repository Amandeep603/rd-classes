"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  BookOpen,
  Activity,
  LogOut,
} from "lucide-react";
import { logoutAdminAction } from "@/server/actions/auth.actions.js";

export default function AdminHeader({ admin, pendingCount = 0 }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/device-requests",
      label: "Device Requests",
      icon: Smartphone,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/courses", label: "Courses", icon: BookOpen },
    { href: "/admin/activity", label: "Audit Log", icon: Activity },
  ];

  return (
    <header className="bg-[#111114] border-b border-[#222227] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-md">
              <Image
                src="/images/logo-rd.png"
                alt="RD Classes"
                width={32}
                height={20}
                className="h-5 w-auto"
              />
            </div>
            <span className="font-extrabold text-white text-sm tracking-tight hidden sm:inline">
              RD Classes <span className="text-[#FFB800] text-xs font-semibold ml-1">ADMIN</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#FFB800] text-[#0A0A0B]"
                      : "text-gray-300 hover:text-white hover:bg-[#1C1C22]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-[#0A0A0B] text-[#FFB800]"
                          : "bg-amber-500 text-black"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {admin && (
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-white">{admin.name || "Administrator"}</p>
              <p className="text-[10px] text-gray-400 font-mono">{admin.loginId}</p>
            </div>
          )}

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-red-400 hover:bg-[#1F1717] rounded-lg transition border border-transparent hover:border-red-950/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
