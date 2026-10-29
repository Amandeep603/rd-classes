"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Video,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import Button from "@/components/ui/Button";

export default function MobileMenu({
  isOpen,
  onClose,
  currentPath,
  isScrolled = false,
  enquireHref = SITE_CONFIG.cta.enquire.href,
}) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setAuth(data);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/student-logout", { method: "POST" });
      onClose();
      window.location.href = "/student-login";
    } catch {
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  // Flatten navLinks for the mobile menu drawer
  const flattenedLinks = [];
  SITE_CONFIG.navLinks.forEach((link) => {
    if (link.children && link.children.length > 0) {
      link.children.forEach((child) => flattenedLinks.push(child));
    } else {
      flattenedLinks.push(link);
    }
  });

  return (
    <div
      id="mobile-navigation"
      className="fixed inset-x-0 bottom-0 z-[999] bg-[#0A0A0A] border-t border-white/10 flex flex-col justify-between p-6 overflow-y-auto min-[1200px]:hidden transition-all duration-300"
      style={{
        top: isScrolled ? "72px" : "84px",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      <nav aria-label="Mobile Nav" className="flex flex-col gap-1.5 pt-2">
        {flattenedLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? currentPath === "/"
              : currentPath?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center min-h-[48px] px-4 rounded-lg text-lg font-medium transition-colors ${
                isActive
                  ? "text-[#FFB800] bg-white/5 font-semibold"
                  : "text-white hover:text-[#FFB800] hover:bg-white/5"
              }`}
            >
              {link.label}
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[#FFB800]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User / CTA Group */}
      <div className="pt-6 pb-4 border-t border-white/10 mt-auto flex flex-col gap-3">
        {auth?.role === "student" ? (
          // Logged-in Student Options
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#FFB800] text-[#0A0A0A] font-extrabold text-sm flex items-center justify-center shrink-0">
                {auth.initial || auth.firstName?.charAt(0) || "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{auth.name}</p>
                <p className="text-[10px] text-[#FFB800] uppercase font-semibold">
                  Student Portal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/student"
                onClick={onClose}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#FFB800]" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/student/lectures"
                onClick={onClose}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
              >
                <Video className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>My Lectures</span>
              </Link>

              <Link
                href="/student/notes"
                onClick={onClose}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>My Notes</span>
              </Link>

              <Link
                href="/student/profile"
                onClick={onClose}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium"
              >
                <User className="w-3.5 h-3.5 text-[#9333EA]" />
                <span>Profile</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          // Logged-out Student Login Button
          <Button
            variant="outline"
            href={SITE_CONFIG.cta.studentLogin.href}
            icon={<LogIn className="w-4 h-4" />}
            className="w-full h-[48px] text-[15px] font-semibold rounded-[8px]"
            onClick={onClose}
          >
            {SITE_CONFIG.cta.studentLogin.label}
          </Button>
        )}

        {/* Unchanged Enquire Now Button */}
        <a
          href={enquireHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full h-[48px] flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0A] font-bold text-[15px] rounded-[8px] shadow-sm transition-colors"
        >
          <span>{SITE_CONFIG.cta.enquire.label}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
