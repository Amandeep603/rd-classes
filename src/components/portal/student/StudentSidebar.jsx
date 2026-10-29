"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Video,
  FileText,
  CalendarCheck,
  User,
  MessageCircle,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/student", icon: LayoutGrid },
  { id: "lectures", label: "Lectures", href: "/student/lectures", icon: Video },
  { id: "notes", label: "Notes", href: "/student/notes", icon: FileText },
  { id: "tests", label: "Tests", href: "/student/tests", icon: CalendarCheck },
  { id: "profile", label: "Profile", href: "/student/profile", icon: User },
];

export default function StudentSidebar({ whatsappNumber, onClose, isDrawer = false }) {
  const pathname = usePathname();

  const cleanPhone = (whatsappNumber || "").replace(/\D/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        "Hello Sir, I have a doubt regarding my RD Classes studies."
      )}`
    : null;

  return (
    <aside
      className={`flex w-[260px] shrink-0 flex-col justify-between p-0 border-r border-[#E2EEF8] relative select-none overflow-y-auto no-scrollbar ${
        isDrawer ? "h-full rounded-r-[20px]" : "h-screen max-h-screen sticky top-0 rounded-none"
      }`}
      style={{
        background: "linear-gradient(180deg, #E6F3FD 0%, #F3F9FE 55%, #FFFFFF 100%)",
        boxShadow: "4px 0 20px rgba(20,60,110,0.04)",
      }}
      aria-label="Student navigation"
    >
      {/* Decorative faint background leaf shapes in light blue near the bottom */}
      <div className="pointer-events-none absolute bottom-0 right-0 w-[180px] h-[220px] overflow-hidden z-0 select-none opacity-40">
        <svg
          viewBox="0 0 180 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <path
            d="M190 220C150 200 130 140 160 80C170 120 185 160 190 220Z"
            fill="#BAE6FD"
          />
          <path
            d="M170 220C130 180 110 110 135 50C150 95 165 150 170 220Z"
            fill="#CFE8FC"
          />
          <path
            d="M130 220C100 195 80 145 105 100C115 135 125 175 130 220Z"
            fill="#E0F2FE"
          />
        </svg>
      </div>

      {/* Top section: Logo block + Menu + WhatsApp */}
      <div className="relative z-10 flex flex-col">
        {/* Logo block with optional drawer close button */}
        <div className="flex items-center justify-between" style={{ padding: "20px 18px 0 18px" }}>
          <Link
            href="/student"
            onClick={() => onClose?.()}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="relative h-[50px] w-[50px] flex items-center justify-center shrink-0">
              <Image
                src="/images/logo-rd.png"
                alt="RD Classes"
                width={50}
                height={50}
                priority
                className="h-[50px] w-auto object-contain select-none"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[19px] font-bold leading-tight tracking-tight text-[#1F2A44]">
                RD Classes
              </div>
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[#6B7A99] mt-0.5">
                STUDENT PORTAL
              </div>
            </div>
          </Link>
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-1.5 rounded-lg text-[#1F2A44] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Menu (margin-top 24px) */}
        <nav
          className="flex flex-col gap-[6px] px-[16px]"
          style={{ marginTop: "24px" }}
          role="navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/student"
                ? pathname === "/student"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onClose?.()}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-[12px] h-[46px] w-full rounded-[14px] px-[16px] text-[15px] transition-all duration-150 ${
                  isActive
                    ? "bg-[#FFC93C] text-[#1F2A44] font-bold shadow-[0_6px_14px_rgba(255,185,0,0.35)]"
                    : "text-[#1F2A44] font-medium hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`h-[20px] w-[20px] shrink-0 transition-colors ${
                    isActive
                      ? "text-[#1F2A44] stroke-[2.4]"
                      : "text-[#1F2A44] stroke-[2] group-hover:text-[#111827]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 1px divider (rgba(31,42,68,0.12)) with 24px margins */}
        <div
          className="mx-[24px]"
          style={{
            margin: "24px 24px 16px 24px",
            borderTop: "1px solid rgba(31,42,68,0.12)",
          }}
        />

        {/* Ask Sir on WhatsApp: green WhatsApp icon 22px and dark slate text (#1F2A44) */}
        {whatsappUrl && (
          <div className="px-[16px]">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onClose?.()}
              className="flex items-center gap-[12px] h-[46px] rounded-[14px] px-[16px] text-[15px] font-medium text-[#1F2A44] hover:bg-white/60 transition-colors"
            >
              <div className="flex h-[24px] w-[24px] items-center justify-center shrink-0">
                <MessageCircle className="h-[22px] w-[22px] text-[#25D366] fill-[#25D366]" />
              </div>
              <span>Ask Sir on WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Bottom card (margin-top auto, margin 16px): white card, radius 24px, height about 220px */}
      <div
        className="relative z-10 rounded-[24px] bg-white p-[20px] shadow-sm overflow-hidden"
        style={{
          margin: "16px",
          height: "220px",
          minHeight: "220px",
        }}
      >
        {/* Soft subtle curved background inside card */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[140px] h-[140px] rounded-full blur-xl opacity-20"
          style={{ background: "#BAE6FD" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="text-[18px] font-semibold leading-[1.3] text-[#1F2A44]">
            Consistent<br />
            Learning<br />
            Brighter<br />
            Results
          </div>
          {/* Yellow underline dash (28px x 3px) */}
          <div
            className="rounded-full mt-[10px]"
            style={{
              width: "28px",
              height: "3px",
              backgroundColor: "#FFC93C",
            }}
          />
        </div>

        {/* Illustration anchored bottom-right, about 120px wide and 110px tall, FULLY visible */}
        <div
          className="absolute z-20 pointer-events-none select-none"
          style={{
            right: "12px",
            bottom: "12px",
            width: "120px",
            height: "110px",
          }}
        >
          <svg
            width="120"
            height="110"
            viewBox="0 0 120 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Two dark navy leaf shapes behind books */}
            <path
              d="M106 18C92 30 94 56 108 66C112 46 122 28 106 18Z"
              fill="#0B2A4A"
            />
            <path
              d="M86 28C76 40 80 62 94 70C96 52 104 38 86 28Z"
              fill="#103B64"
            />
            <path
              d="M112 46C104 54 106 68 116 76C118 62 122 52 112 46Z"
              fill="#1D4E89"
              opacity="0.8"
            />

            {/* Bottom Book (Navy #0B2A4A) */}
            <g transform="translate(14, 60)">
              {/* Base shadow */}
              <rect x="6" y="24" width="90" height="15" rx="3" fill="#06182B" />
              {/* Pages */}
              <rect x="8" y="22" width="87" height="13" rx="2" fill="#F8FAFC" />
              {/* Cover spine & top */}
              <rect x="4" y="18" width="92" height="19" rx="3.5" fill="#0B2A4A" />
              {/* Pages line texture */}
              <line x1="93" y1="22" x2="93" y2="34" stroke="#E2E8F0" strokeWidth="1.5" />
            </g>

            {/* Middle Book (Sky/White) */}
            <g transform="translate(22, 44)">
              <rect x="6" y="19" width="78" height="13" rx="2" fill="#CBD5E1" />
              <rect x="8" y="17" width="75" height="12" rx="2" fill="#FFFFFF" />
              <rect x="4" y="14" width="80" height="16" rx="3" fill="#E2E8F0" />
              <rect x="4" y="14" width="14" height="16" rx="3" fill="#38BDF8" />
            </g>

            {/* Top Book (Yellow/Gold #FFC93C) */}
            <g transform="translate(26, 28)">
              <rect x="6" y="19" width="70" height="13" rx="2" fill="#D97706" />
              <rect x="8" y="17" width="67" height="12" rx="2" fill="#FFFBEB" />
              <rect x="4" y="14" width="72" height="15" rx="3" fill="#FFC93C" />
              <rect x="4" y="14" width="12" height="15" rx="3" fill="#E0A812" />
              {/* Red ribbon bookmark */}
              <path
                d="M44 28L48 38L52 28V14H44V28Z"
                fill="#EF4444"
              />
            </g>
          </svg>
        </div>
      </div>
    </aside>
  );
}
