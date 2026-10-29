"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  Video,
  FileText,
  User,
  LogOut,
} from "lucide-react";

// In-memory cache for current browser session to prevent unnecessary flashes
let memoryAuth = undefined;

export default function NavbarAuthPill({ className = "" }) {
  const [auth, setAuth] = useState(memoryAuth);
  const [loading, setLoading] = useState(memoryAuth === undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          memoryAuth = data;
          setAuth(data);
        } else {
          memoryAuth = null;
          setAuth(null);
        }
      } catch {
        if (!cancelled) {
          memoryAuth = null;
          setAuth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAuth();
    const handleFocus = () => {
      fetchAuth();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/student-logout", { method: "POST" });
      memoryAuth = null;
      setAuth(null);
      window.location.href = "/student-login";
    } catch {
      window.location.reload();
    }
  };

  // 1. Initial Loading Skeleton (exact same dimensions as "Student Login" link to prevent CLS)
  if (loading) {
    return (
      <div
        className={`w-[98px] h-[34px] rounded-lg bg-white/5 animate-pulse shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  // 2. Logged out state: Original Student Login link
  if (!auth) {
    return (
      <Link
        href="/student-login"
        className={`font-medium text-white/90 hover:text-[#FFB800] transition-colors whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-sm text-[15px] ${className}`}
      >
        Student Login
      </Link>
    );
  }

  // 3. Student user logged in: Yellow Avatar Pill with Dropdown
  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] cursor-pointer"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label="Student Account Menu"
      >
        {/* Yellow Avatar Circle with Initial */}
        <div className="w-6 h-6 rounded-full bg-[#FFB800] text-[#0A0A0A] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
          {auth.initial || auth.firstName?.charAt(0) || "S"}
        </div>

        {/* First Name */}
        <span className="text-xs sm:text-sm font-bold text-white tracking-tight max-w-[100px] truncate">
          {auth.firstName}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180 text-[#FFB800]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-2.5 w-52 py-2 bg-[#0A0A0A] border border-white/15 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col z-[1050] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-xs font-bold text-white truncate">{auth.name}</p>
            <p className="text-[10px] text-[#FFB800] font-semibold uppercase tracking-wider mt-0.5">
              Student Portal
            </p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/student"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/student/lectures"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>My Lectures</span>
            </Link>

            <Link
              href="/student/notes"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>My Notes</span>
            </Link>

            <Link
              href="/student/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#9333EA]" />
              <span>Profile</span>
            </Link>
          </div>

          {/* Divider & Logout */}
          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

