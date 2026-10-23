"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ExternalLink,
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";
import Button from "../ui/Button";

export default function AdminTopbar({
  workspaceName = "Ronak Sir Workspace",
  adminUser,
  onOpenMobileMenu,
}) {
  const initial = adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "R";

  return (
    <header
      className="flex h-[78px] w-full items-center justify-between border-b border-black/6 bg-[#FBF8F1]/80 px-6 backdrop-blur-md sticky top-0 z-20"
      role="banner"
    >
      {/* Left side: Hamburger (mobile) + ADMIN PORTAL + Workspace pill */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden rounded-xl p-2 text-[#4B5563] hover:bg-black/5"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[13px] font-extrabold tracking-[0.14em] text-[#6B7280]">
            ADMIN PORTAL
          </span>
        </div>

        {/* Workspace pill */}
        <div className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3.5 py-1.5 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-[#1F2937]">
            {workspaceName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </div>
      </div>

      {/* Right side: View Public Website + Bell + Avatar */}
      <div className="flex items-center gap-3.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs transition-colors"
        >
          <span>View Public Website</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#6B7280]" />
        </a>

        {/* Bell with notification dot */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/8 text-[#4B5563] hover:text-[#111827] shadow-2xs transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {/* Admin Avatar */}
        <div className="flex items-center gap-1.5 rounded-full p-1 hover:ring-2 hover:ring-[#FFC21A]/30 transition-all">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-sm font-black text-neutral-900 shadow-2xs">
            {initial}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
        </div>
      </div>
    </header>
  );
}
