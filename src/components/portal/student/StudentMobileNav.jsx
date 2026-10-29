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

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { id: "lectures", label: "Lectures", href: "/student/lectures", icon: Video },
  { id: "notes", label: "Notes", href: "/student/notes", icon: FileText },
  { id: "tests", label: "Tests", href: "/student/tests", icon: CalendarCheck },
  { id: "profile", label: "Profile", href: "/student/profile", icon: User },
];

export default function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/8 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Mobile Navigation"
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
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? "text-[#111827] font-bold"
                : "text-[#6B7280] font-medium hover:text-[#111827]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                isActive ? "bg-[#FDB813] text-[#111827]" : "text-[#6B7280]"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10.5px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
