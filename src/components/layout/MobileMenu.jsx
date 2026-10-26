"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import Button from "@/components/ui/Button";

/**
 * Mobile navigation full-screen slide-down menu for viewports < 1200px.
 * Locks body scroll when open, closes on Escape or link click, and provides touch targets >= 48px.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Menu open state.
 * @param {() => void} props.onClose - Function to close the mobile menu.
 * @param {string} props.currentPath - Current pathname for active styling.
 */
export default function MobileMenu({ isOpen, onClose, currentPath }) {
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
      className="fixed inset-0 top-[64px] z-40 bg-[#0A0A0A] border-t border-white/10 flex flex-col justify-between p-6 overflow-y-auto min-[1200px]:hidden transition-all duration-300"
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

      {/* Bottom CTA Group */}
      <div className="pt-6 pb-4 border-t border-white/10 mt-auto flex flex-col gap-3">
        <Button
          variant="outline"
          href={SITE_CONFIG.cta.studentLogin.href}
          icon={<LogIn className="w-4 h-4" />}
          className="w-full h-[48px] text-[15px] font-semibold rounded-[8px]"
          onClick={onClose}
        >
          {SITE_CONFIG.cta.studentLogin.label}
        </Button>
        <a
          href={SITE_CONFIG.cta.enquire.href}
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
