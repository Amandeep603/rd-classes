"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import MobileMenu from "./MobileMenu";
import NavbarAuthPill from "./NavbarAuthPill";

/**
 * Primary fixed navigation header:
 * - Position: fixed at top: 0, width: 100%, z-index: 1000 on ALL pages.
 * - Solid dark background (#0A0A0A / rgba(10,10,10,0.96) with backdrop blur) at all times.
 * - Scroll polish beyond 20px: subtle border, shadow, height transitions from 84px to 72px.
 * - Left: White rounded tile with original brand logo.
 * - Center: Dynamic nav items with active yellow (#FFB800) underline + solid dark More dropdown.
 * - Right: Student Login link + yellow (#FFB800) Enquire Now button.
 * - Mobile: Dark header bar + solid dark slide-down menu.
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [enquireHref, setEnquireHref] = useState(SITE_CONFIG.cta.enquire.href);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.whatsapp) {
          const num = data.settings.whatsapp.replace(/\D/g, "");
          if (num) {
            setEnquireHref(
              `https://wa.me/${num}?text=${encodeURIComponent(
                SITE_CONFIG.contact.enquiryMessage
              )}`
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ticking = false;
    let wasScrolled = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[1000] w-full flex items-center px-5 lg:px-[6.25vw] transition-all duration-300 ease-in-out ${
          isScrolled
            ? "h-[72px] border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
            : "h-[84px] border-b border-white/[0.08] shadow-none"
        }`}
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.96)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="w-full flex items-center justify-between">
          {/* Left: Original Logo Tile */}
          <Link
            href="/"
            className={`inline-flex items-center justify-center bg-white px-[6px] py-[3px] rounded-[12px] shadow-md hover:opacity-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] shrink-0 ${
              isScrolled ? "h-[46px] lg:h-[50px]" : "h-[50px] lg:h-[56px]"
            }`}
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
              gap: "clamp(18px, 1.8vw, 36px)",
            }}
          >
            {SITE_CONFIG.navLinks.map((link) => {
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
                    fontSize: "15px",
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
              gap: "clamp(16px, 1.5vw, 28px)",
            }}
          >
            <Suspense
              fallback={
                <div className="w-[98px] h-[34px] rounded-lg bg-white/5 animate-pulse shrink-0" />
              }
            >
              <NavbarAuthPill />
            </Suspense>

            <a
              href={enquireHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center bg-[#FFB800] hover:bg-[#FFC933] active:bg-[#E5A600] text-[#0A0A0A] font-bold shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] whitespace-nowrap px-6 rounded-lg text-[15px]"
              style={{
                height: isScrolled ? "44px" : "48px",
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
              href={enquireHref}
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
        isScrolled={isScrolled}
        enquireHref={enquireHref}
      />
    </>
  );
}
