"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  FileText,
  CalendarCheck,
  User,
  MessageCircle,
  GraduationCap,
} from "lucide-react";
import { STUDENT_NAV_ITEMS } from "@/constants/portalNav";
import { BookStackIllustration, LeavesIllustration } from "../illustrations/PortalIllustrations";
import { SITE_CONFIG } from "@/constants/site";

const ICONS = {
  dashboard: LayoutDashboard,
  lectures: Video,
  notes: FileText,
  tests: CalendarCheck,
  profile: User,
};

export default function StudentSidebar() {
  const pathname = usePathname();

  const whatsappUrl = `https://wa.me/${SITE_CONFIG?.contact?.whatsapp?.replace(/\D/g, "") || "919999999999"}?text=${encodeURIComponent("Hello RD Classes, I have a doubt regarding my studies.")}`;

  return (
    <aside
      className="hidden lg:flex w-[256px] shrink-0 flex-col justify-between rounded-[32px] p-5 border border-black/4 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.18)]"
      style={{
        background: "linear-gradient(180deg, #E6F3FD 0%, #F8FAF7 45%, #FBF8EF 100%)",
        height: "calc(100vh - 40px)",
        position: "sticky",
        top: "20px",
      }}
      aria-label="Student navigation"
    >
      {/* Top section: Brand + Nav */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-900 shadow-sm font-black text-xl">
            <span className="font-extrabold tracking-tight">RD</span>
          </div>
          <div>
            <div className="text-[20px] font-black leading-tight tracking-tight text-[#111827]">
              RD Classes
            </div>
            <div className="text-[11px] font-bold tracking-[0.14em] text-[#6B7280]">
              STUDENT PORTAL
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1.5" role="navigation">
          {STUDENT_NAV_ITEMS.filter((item) => item.enabled).map((item) => {
            const Icon = ICONS[item.icon] || LayoutDashboard;
            const isActive =
              item.href === "/student"
                ? pathname === "/student"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3.5 h-[49px] w-[226px] mx-auto rounded-[14px] px-4 text-[16px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-[#FFD54A] to-[#FFC21A] text-neutral-900 font-bold shadow-[0_4px_14px_rgba(255,194,26,0.35)]"
                    : "text-[#4B5563] hover:bg-black/5 hover:text-[#111827]"
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] shrink-0 transition-colors ${
                    isActive ? "text-neutral-900 stroke-[2.4]" : "text-[#6B7280] group-hover:text-[#111827]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Ask Sir on WhatsApp */}
        <div className="px-2 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-bold text-[#059669] hover:bg-emerald-50/70 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
              <MessageCircle className="h-4 w-4 fill-emerald-600" />
            </div>
            <span>Ask Sir on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Bottom decorative card */}
      <div className="relative overflow-hidden rounded-[24px] bg-white/70 p-4 border border-black/4 shadow-xs backdrop-blur-xs">
        <LeavesIllustration className="absolute -top-3 -right-3 h-20 w-20 text-sky-200/40 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="text-[14px] font-extrabold leading-snug text-[#1F2937]">
            Consistent<br />Learning<br />Brighter Results
          </div>
          <div className="h-0.5 w-7 bg-[#FFC21A] rounded-full" />
          <div className="flex justify-end pt-1">
            <BookStackIllustration className="h-14 w-20" />
          </div>
        </div>
      </div>
    </aside>
  );
}
