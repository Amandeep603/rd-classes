"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Trophy,
  ArrowRight,
  Phone,
  MapPin,
  IndianRupee,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { SITE_CONFIG } from "@/constants/site";

export default function CtaBannerSection() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello RD Classes, I would like to book a free demo class."
  );

  return (
    <InViewSection
      id="demo"
      aria-label="Book a free demo class"
      className="u-scope relative w-full overflow-hidden text-[#0F172A] scroll-mt-20 [isolation:isolate]"
      style={{
        paddingTop: "clamp(32px, 4vw, calc(var(--su, 1px) * 40))",
        paddingBottom: "clamp(56px, 7vw, calc(var(--su, 1px) * 88))",
      }}
    >
      <div className="relative z-10 w-full max-w-[calc(var(--su,1px)*1600)] mx-auto px-4 lg:px-0 flex justify-center">
        <Reveal className="w-full flex justify-center">
          {/* Main Card (1475u x 620u, radius 36u) */}
          <div
            data-cta-card="true"
            className="relative w-full max-w-[calc(var(--su,1px)*1475)] rounded-[28px] lg:rounded-[calc(var(--su,1px)*36)] overflow-hidden"
            style={{
              minHeight: "calc(var(--su, 1px) * 620)",
              background: "#FFFDF8",
              border: "1px solid rgba(15, 23, 42, 0.06)",
              boxShadow: "0 30px 60px -30px rgba(120, 90, 20, 0.15)",
              padding:
                "clamp(28px, 3.5vw, calc(var(--su, 1px) * 48)) clamp(20px, 4vw, calc(var(--su, 1px) * 64))",
            }}
          >
            {/* ================= RIGHT VISUAL (cropped from cta.png, 497u wide, fade mask) ================= */}
            <div
              className="hidden lg:block absolute right-0 top-0 bottom-0 pointer-events-none z-10 overflow-hidden"
              style={{
                width: "calc(var(--su, 1px) * 497)",
                maskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
              }}
              aria-hidden="true"
            >
              <Image
                src="/images/cta/cta-visual.webp"
                alt=""
                fill
                sizes="497px"
                className="object-cover object-left"
                priority
              />
            </div>

            {/* ================= LEFT CONTENT COLUMN (max 800u so text never runs over visual) ================= */}
            <div className="relative z-20 max-w-full lg:max-w-[calc(var(--su,1px)*800)] flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Row 1: Logo Tile (129u x 90u) + 2 Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 lg:gap-[calc(var(--su,1px)*20)] mb-6 lg:mb-[calc(var(--su,1px)*32)]">
                {/* Logo Tile (White, 129u x 90u, radius 18u) */}
                <div
                  className="rounded-[18px] bg-white flex items-center justify-center shrink-0 shadow-md p-1.5"
                  style={{
                    width: "clamp(90px, 10vw, calc(var(--su, 1px) * 129))",
                    height: "clamp(60px, 6.8vw, calc(var(--su, 1px) * 90))",
                    boxShadow: "0 8px 20px -10px rgba(15, 23, 42, 0.25)",
                  }}
                >
                  <Image
                    src="/images/logo-rd.png"
                    alt="RD Classes Logo"
                    width={110}
                    height={75}
                    style={{ width: "auto", height: "auto", maxHeight: "100%" }}
                    className="object-contain"
                  />
                </div>

                {/* Pill 1: Limited Batch Seats */}
                <div
                  className="rounded-full flex items-center justify-center gap-2 font-extrabold uppercase px-4 whitespace-nowrap shadow-2xs"
                  style={{
                    height: "clamp(38px, 4.2vw, calc(var(--su, 1px) * 50))",
                    backgroundColor: "#FFEFC2",
                    color: "#1F2937",
                    fontSize: "clamp(12px, 1.3vw, calc(var(--su, 1px) * 14.5))",
                  }}
                >
                  <Users className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>LIMITED BATCH SEATS</span>
                </div>

                {/* Pill 2: ₹5,100 Cash for 100/100 */}
                <div
                  className="rounded-full flex items-center justify-center gap-2 font-bold px-4 whitespace-nowrap shadow-2xs"
                  style={{
                    height: "clamp(38px, 4.2vw, calc(var(--su, 1px) * 50))",
                    backgroundColor: "#F3F3F5",
                    color: "#1F2937",
                    fontSize: "clamp(12px, 1.3vw, calc(var(--su, 1px) * 14.5))",
                  }}
                >
                  <Trophy className="w-4 h-4 text-[#F5B400] shrink-0" />
                  <span>₹5,100 Cash for 100/100</span>
                </div>
              </div>

              {/* H2 Heading: 72u / 800 / line-height 0.98, ANCHOR line 1 761u */}
              <h2
                className="font-extrabold tracking-[-0.02em] text-[#0B1630] text-balance mb-4 lg:mb-[calc(var(--su,1px)*20)]"
                style={{
                  fontSize: "clamp(30px, 9vw, calc(var(--su, 1px) * 72))",
                  lineHeight: 0.98,
                }}
              >
                <span className="lg:inline-block">Take a demo for free;</span>
                <span className="lg:block mt-1">
                  <span
                    className="inline-block bg-gradient-to-r from-[#FFC21A] to-[#F97316] bg-clip-text text-transparent pb-[0.12em]"
                  >
                    you won’t regret it
                  </span>
                  <span className="text-[#5B5B5B]">.</span>
                </span>
              </h2>

              {/* Paragraph (gap 22u, 2 lines desktop, ANCHOR line 2 794u at 20u) */}
              <p
                className="text-[#4B5563] font-normal leading-[1.55] text-balance max-w-full lg:max-w-[calc(var(--su,1px)*800)] mb-6 lg:mb-[calc(var(--su,1px)*34)]"
                style={{
                  fontSize: "clamp(15px, 1.8vw, calc(var(--su, 1px) * 20))",
                }}
              >
                <span className="lg:block">
                  Sit in an ongoing Accountancy class with Ronak Sir in Sector 9, Faridabad.
                </span>
                <span className="lg:block">
                  See the concepts live, ask your doubts, and decide with complete peace of mind.
                </span>
              </p>

              {/* Buttons Row (Primary 437u x 61u, Secondary 295u x 61u) */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-[calc(var(--su,1px)*22)] mb-8 lg:mb-[calc(var(--su,1px)*36)]">
                {/* Primary: WhatsApp Button (437u x 61u) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full font-bold text-[#111111] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  style={{
                    width: "clamp(260px, 100%, calc(var(--su, 1px) * 437))",
                    height: "clamp(52px, 5.5vw, calc(var(--su, 1px) * 61))",
                    background: "linear-gradient(90deg, #FFCB2E 0%, #FFB800 100%)",
                    fontSize: "clamp(16px, 1.8vw, calc(var(--su, 1px) * 19))",
                    boxShadow: "0 14px 28px -12px rgba(255, 184, 0, 0.55)",
                  }}
                >
                  <WhatsAppIcon className="w-5 h-5 text-[#111111]" />
                  <span>Book Free Demo on WhatsApp</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                {/* Secondary: Phone Call Button (295u x 61u) */}
                <a
                  href={`tel:${SITE_CONFIG.contact.phone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full font-bold text-[#111827] bg-transparent transition-colors duration-200 hover:bg-black/5 active:scale-[0.98] cursor-pointer border border-[#111827]"
                  style={{
                    width: "clamp(240px, 100%, calc(var(--su, 1px) * 295))",
                    height: "clamp(52px, 5.5vw, calc(var(--su, 1px) * 61))",
                    fontSize: "clamp(15px, 1.7vw, calc(var(--su, 1px) * 18))",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {SITE_CONFIG.contact.phone}</span>
                </a>
              </div>

              {/* Info Row: 3 Items with Dividers */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-[calc(var(--su,1px)*32)] pt-2 border-t border-black/8 text-[#4B5563] text-sm lg:text-[calc(var(--su,1px)*14.5)] font-medium">
                {/* Item 1 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#0284C7]" />
                  </div>
                  <span>{SITE_CONFIG.address}</span>
                </div>

                <div className="hidden sm:block w-[1px] h-6 bg-black/10" aria-hidden="true" />

                {/* Item 2 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
                    <IndianRupee className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <span>No advance payment needed</span>
                </div>

                <div className="hidden sm:block w-[1px] h-6 bg-black/10" aria-hidden="true" />

                {/* Item 3 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FFEDD5] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#EA580C]" />
                  </div>
                  <span>Ongoing live class experience</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </InViewSection>
  );
}
