"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  FileText,
  CalendarCheck,
  User,
} from "lucide-react";
import { STUDENT_NAV_ITEMS } from "@/constants/portalNav";

const ICONS = {
  dashboard: LayoutDashboard,
  lectures: Video,
  notes: FileText,
  tests: CalendarCheck,
  profile: User,
};

export default function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/8 px-4 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      aria-label="Mobile Navigation"
    >
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
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? "text-neutral-900 font-bold"
                : "text-[#6B7280] font-medium hover:text-[#111827]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                isActive ? "bg-[#FFC21A]" : ""
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
