"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, ChevronDown, User, LogOut } from "lucide-react";
import SearchInput from "../ui/SearchInput";
import { logoutStudentAction } from "@/server/actions/auth.actions.js";

export default function StudentTopbar({ student, subtitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = student?.name ? student.name.split(" ")[0] : "Student";
  const initial = student?.name ? student.name.charAt(0).toUpperCase() : "S";
  const classNameText = student?.className ? `Class ${student.className}` : "Class 12";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pt-2 pb-6">
      {/* Left: Greeting + Class Chip + Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-[#111827]">
            Hi {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <span className="inline-flex items-center rounded-full bg-[#FFE8A3] px-3 py-1 text-[13px] font-bold text-[#78350F] shadow-xs">
            {classNameText}
          </span>
        </div>
        <p className="mt-1 text-[15px] font-medium text-[#6B7280]">
          {subtitle || (student?.className ? `Class ${student.className} Accountancy` : "Accountancy")}
        </p>
      </div>

      {/* Right: Search + Bell + Avatar */}
      <div className="flex items-center gap-3.5 self-end lg:self-center">
        {/* Search Input */}
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full sm:w-[327px]"
        />

        {/* Bell notification button */}
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-[46px] w-[46px] sm:h-[50px] sm:w-[50px] items-center justify-center rounded-full bg-white border border-black/8 text-[#4B5563] hover:text-[#111827] hover:bg-neutral-50 transition-colors shadow-xs shrink-0"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Avatar pill + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-[#FFC21A]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A]"
          >
            <div className="flex h-[46px] w-[46px] sm:h-[50px] sm:w-[50px] items-center justify-center rounded-full bg-[#FFD54A] font-extrabold text-[#111827] text-lg shadow-xs">
              {initial}
            </div>
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white p-2 shadow-xl border border-black/8 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-black/5">
                <p className="text-sm font-bold text-[#111827] truncate">
                  {student?.name || "Student"}
                </p>
                <p className="text-xs text-[#6B7280] truncate">
                  {student?.studentCode || student?.loginId}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/student/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#374151] hover:bg-neutral-50 transition-colors"
                >
                  <User className="h-4 w-4 text-[#6B7280]" />
                  <span>My Profile</span>
                </Link>

                <form action={logoutStudentAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
