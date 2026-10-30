"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  PlaySquare,
  FileText,
  CalendarCheck,
  User,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/student", icon: LayoutGrid },
  { id: "lectures", label: "Lectures", href: "/student/lectures", icon: PlaySquare },
  { id: "notes", label: "Notes", href: "/student/notes", icon: FileText },
  { id: "tests", label: "Tests", href: "/student/tests", icon: CalendarCheck },
  { id: "profile", label: "Profile", href: "/student/profile", icon: User },
];

export default function StudentSidebar({
  whatsappNumber,
  courseProgress = null,
  onClose,
  isDrawer = false,
}) {
  const pathname = usePathname();
  const [progressData, setProgressData] = useState(courseProgress || null);

  useEffect(() => {
    if (courseProgress) {
      setProgressData(courseProgress);
    }
  }, [courseProgress]);

  useEffect(() => {
    const handleProgressUpdate = (e) => {
      if (e.detail && typeof e.detail.percent === "number") {
        setProgressData((prev) => ({
          ...prev,
          ...e.detail,
        }));
      } else {
        fetch("/api/student/progress/summary")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setProgressData(data);
          })
          .catch(() => {});
      }
    };

    window.addEventListener("rd:progress_updated", handleProgressUpdate);
    window.addEventListener("rd:lecture_completed", handleProgressUpdate);

    return () => {
      window.removeEventListener("rd:progress_updated", handleProgressUpdate);
      window.removeEventListener("rd:lecture_completed", handleProgressUpdate);
    };
  }, []);

  return (
    <aside
      className={`flex w-[260px] shrink-0 flex-col justify-between p-0 border-r border-[#E2EEF8] relative select-none no-scrollbar ${
        isDrawer
          ? "h-full rounded-r-[20px] overflow-y-auto"
          : "h-screen max-h-screen sticky top-0 rounded-none overflow-hidden"
      }`}
      style={{
        background: "linear-gradient(180deg, #E6F3FD 0%, #F1F8FE 50%, #FFFFFF 100%)",
        boxShadow: "4px 0 20px rgba(20,60,110,0.03)",
      }}
      aria-label="Student navigation"
    >
      {/* Decorative faint background leaf shapes in light blue near the bottom */}
      <div className="pointer-events-none absolute bottom-0 right-0 w-[200px] h-[260px] overflow-hidden z-0 select-none opacity-35">
        <svg
          viewBox="0 0 200 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          <path
            d="M200 120C140 130 110 180 120 260H200V120Z"
            fill="#D4EAFB"
            fillOpacity="0.7"
          />
          <path
            d="M170 80C130 100 100 160 110 240C150 210 180 150 170 80Z"
            fill="#BAE0FD"
            fillOpacity="0.5"
          />
          <path
            d="M200 180C160 185 130 220 140 260H200V180Z"
            fill="#9FD4FB"
            fillOpacity="0.4"
          />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Top Header / Brand Row */}
        <div className="flex items-center justify-between px-[22px] pt-[20px] pb-[16px]">
          <Link
            href="/student"
            onClick={() => onClose?.()}
            className="flex items-center gap-[12px] group"
          >
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-white border border-[#CBD5E1]/60 p-1 shadow-2xs group-hover:scale-102 transition-transform">
              <Image
                src="/images/logo/logo-cropped.png"
                alt="RD Classes Logo"
                width={32}
                height={32}
                className="h-auto w-auto object-contain"
                priority
              />
            </div>
            <div className="leading-[1.15]">
              <span className="block text-[15px] font-extrabold tracking-tight text-[#1F2A44]">
                RD Classes
              </span>
              <span className="block text-[9.5px] font-bold tracking-[0.16em] uppercase text-[#6B7385] mt-0.5">
                STUDENT PORTAL
              </span>
            </div>
          </Link>

          {/* Close button for Mobile/Tablet Drawer */}
          {isDrawer && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7385] hover:bg-white/60 hover:text-[#1F2A44] transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items (gap 4px, height 44px, active yellow #FFC93C pill) */}
        <nav className="flex flex-col gap-[4px] px-[16px] mt-[10px]">
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
                className={`group flex items-center gap-[12px] h-[44px] rounded-[14px] px-[16px] text-[15px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#FFC93C] text-[#1F2A44] shadow-xs"
                    : "text-[#1F2A44] hover:bg-white/65 hover:text-[#0B1528]"
                }`}
              >
                <Icon
                  className={`h-[20px] w-[20px] shrink-0 transition-colors ${
                    isActive
                      ? "text-[#1F2A44] stroke-[2.2]"
                      : "text-[#1F2A44] stroke-[1.8] group-hover:text-[#111827]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 1px divider */}
        <div
          className="mx-[24px]"
          style={{
            margin: "18px 24px 14px 24px",
            borderTop: "1px solid rgba(31,42,68,0.12)",
          }}
        />

        {/* Your Progress Card for the SELECTED course */}
        {progressData && (
          <div className="px-[16px]">
            <Link
              href="/student/lectures"
              onClick={() => onClose?.()}
              className="block rounded-[16px] bg-white border border-[#E8ECF2] p-3.5 shadow-xs hover:border-[#FFC93C] transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7791F] truncate">
                  {progressData.courseTitle || "Your Progress"}
                </span>
                <span className="text-[13px] font-extrabold text-[#1F2A44]">
                  {progressData.percent || 0}%
                </span>
              </div>

              {/* Yellow Progress Bar */}
              <div className="mt-2 w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                <div
                  className="h-full bg-[#FFC93C] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, progressData.percent || 0))}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[12px] font-semibold text-[#5B6577] group-hover:text-[#1F2A44] transition-colors truncate">
                {progressData.completedCount || 0} of {progressData.totalCurriculumLectures || progressData.totalWithVideo || 67} lectures completed
              </p>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom block: Text directly on gradient + yellow underline + illustration bottom-right */}
      <div className="relative z-10 mt-auto px-[22px] pb-[16px] pt-4 select-none">
        <div className="text-[20px] font-semibold leading-[1.25] text-[#1F2A44] select-none">
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

        {/* Books-and-plant illustration anchored bottom-right, fully inside panel */}
        <div
          className="absolute z-20 pointer-events-none select-none right-3 bottom-1.5 w-[124px] h-[112px]"
          aria-hidden="true"
        >
          <svg
            width="124"
            height="112"
            viewBox="0 0 120 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Dark navy leaves / plant behind books */}
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
              opacity="0.85"
            />

            {/* Bottom Book (Navy #0B2A4A) */}
            <g transform="translate(10, 68) rotate(-4)">
              <rect x="0" y="0" width="76" height="15" rx="3" fill="#0B2A4A" />
              <rect x="5" y="2" width="69" height="11" rx="2" fill="#F8FAFC" />
              <rect x="0" y="0" width="8" height="15" rx="2" fill="#0B2A4A" />
              <line x1="2" y1="3" x2="2" y2="12" stroke="#FFC93C" strokeWidth="1.5" />
            </g>

            {/* Middle Book (Sky/Teal #2A6E96) */}
            <g transform="translate(14, 52) rotate(2)">
              <rect x="0" y="0" width="70" height="14" rx="3" fill="#1E5A8A" />
              <rect x="5" y="2" width="63" height="10" rx="2" fill="#FFFFFF" />
              <rect x="0" y="0" width="8" height="14" rx="2" fill="#1E5A8A" />
              <line x1="2" y1="3" x2="2" y2="11" stroke="#FFD875" strokeWidth="1.2" />
            </g>

            {/* Top Book (Yellow/Gold #FFC93C) */}
            <g transform="translate(18, 38) rotate(-1)">
              <rect x="0" y="0" width="62" height="13" rx="3" fill="#FFC93C" />
              <rect x="4" y="2" width="56" height="9" rx="1.5" fill="#FFFDF5" />
              <rect x="0" y="0" width="7" height="13" rx="2" fill="#FFC93C" />
              <line x1="2" y1="2.5" x2="2" y2="10.5" stroke="#0B2A4A" strokeWidth="1" />
            </g>

            {/* Bookmark ribbon coming down from top book */}
            <path
              d="M32 44V60L36 57L40 60V44H32Z"
              fill="#E11D48"
            />
          </svg>
        </div>
      </div>
    </aside>
  );
}
