"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import MobileMenu from "./MobileMenu";

/**
 * Primary fixed navigation header replicating the design specification.
 * - Fixed overlay over hero at y=0
 * - Transitions to solid #0A0A0A with blur and border after 80px scroll
 * - Left: White rounded tile with original brand logo
 * - Center: Dynamic nav items including 'More' dropdown
 * - Right: 'Student Login' ghost link + yellow WhatsApp 'Enquire Now ->' button
 * - Breakpoint: < 1200px shows compact Enquire + hamburger drawer
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    let wasScrolled = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 80;
          if (scrolled !== wasScrolled) {
            wasScrolled = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  const isSolid = pathname !== "/" || isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200 flex items-center px-5 lg:px-[6.25vw] h-[64px] lg:h-[clamp(64px,calc(var(--u)*88),96px)] ${
          isSolid
            ? "bg-[#0A0A0A] border-b border-white/[0.08]"
            : "bg-transparent border-none"
        }`}
        style={
          isSolid
            ? {
                backgroundColor: "#0A0A0A",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "none",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              }
            : {
                backgroundColor: "transparent",
                border: "none",
                boxShadow: "none",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
                backgroundImage: "none",
              }
        }
      >
        <div className="w-full flex items-center justify-between">
          {/* Left: Original Logo Tile */}
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white px-[6px] py-[3px] rounded-[12px] shadow-md hover:opacity-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] shrink-0 h-[44px] lg:h-[clamp(44px,calc(var(--u)*62),62px)]"
            aria-label="RD Classes Home"
          >
            <div className="relative h-full flex items-center">
              <Image
                src="/images/logo-rd.png"
                alt="RD Classes - Classes for Accountancy"
                width={130}
                height={79}
                priority
                style={{ width: "auto", height: "100%" }}
                className="object-contain select-none"
              />
            </div>
          </Link>

          {/* Center: Desktop Nav Links (>=1200px) */}
          <nav
            aria-label="Primary"
            className="hidden min-[1200px]:flex items-center"
            style={{
              gap: "clamp(18px, calc(var(--u) * 28), 36px)",
            }}
          >
            {SITE_CONFIG.navLinks.map((link) => {
              if (link.children && link.children.length > 0) {
                // Dropdown link (e.g., 'More')
                return (
                  <div key={link.label} className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-1 font-medium text-white/90 hover:text-[#FFB800] transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-sm cursor-pointer"
                      style={{
                        fontSize: "max(13px, calc(var(--u) * 16))",
                      }}
                      aria-expanded={dropdownOpen}
                      aria-haspopup="true"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180 text-[#FFB800]" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-36 py-2 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl flex flex-col z-50">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setDropdownOpen(false)}
                            className="px-4 py-2 text-sm text-white/80 hover:text-[#FFB800] hover:bg-white/5 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-sm whitespace-nowrap ${
                    isActive
                      ? "text-white"
                      : "text-white/90 hover:text-[#FFB800]"
                  }`}

                  style={{
                    fontSize: "max(13px, calc(var(--u) * 16))",
                  }}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-[-6px] left-0 right-0 h-[3px] bg-[#FFB800] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Group: Student Login + WhatsApp Enquire Now (>=1200px) */}
          <div
            className="hidden min-[1200px]:flex items-center"
            style={{
              gap: "clamp(16px, calc(var(--u) * 24), 32px)",
            }}
          >
            <Link
              href={SITE_CONFIG.cta.studentLogin.href}
              className="font-medium text-white/90 hover:text-[#FFB800] transition-colors whitespace-nowrap py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] rounded-sm"
              style={{
                fontSize: "max(13px, calc(var(--u) * 16))",
              }}
            >
              {SITE_CONFIG.cta.studentLogin.label}
            </Link>

            <a
              href={SITE_CONFIG.cta.enquire.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center bg-[#FFB800] hover:bg-[#FFC933] active:bg-[#E5A600] text-[#0A0A0A] font-bold shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] whitespace-nowrap"
              style={{
                height: "clamp(42px, calc(var(--u) * 48), 54px)",
                paddingLeft: "calc(var(--u) * 26)",
                paddingRight: "calc(var(--u) * 26)",
                borderRadius: "calc(var(--u) * 8)",
                fontSize: "max(14px, calc(var(--u) * 16))",
              }}
            >
              <span>{SITE_CONFIG.cta.enquire.label}</span>
              <ArrowRight
                className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          {/* Tablet & Mobile Right Bar (<1200px) */}
          <div className="min-[1200px]:hidden flex items-center gap-3">
            <a
              href={SITE_CONFIG.cta.enquire.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0A] font-bold text-xs sm:text-sm h-10 px-3.5 sm:px-4 rounded-md shadow-sm transition-colors"
            >
              <span>Enquire</span>
              <ArrowRight className="ml-1 w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              type="button"
              className="p-2 rounded-lg text-white hover:text-[#FFB800] hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={pathname}
      />
    </>
  );
}
