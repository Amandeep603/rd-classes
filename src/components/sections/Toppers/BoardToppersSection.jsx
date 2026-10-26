"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import SectionHeading from "@/components/ui/SectionHeading";
import ToppersCarousel from "./ToppersCarousel";
import { TOPPERS, DEFAULT_ACTIVE_TOPPER_INDEX } from "@/constants/toppers";

export default function BoardToppersSection() {
  const [activeIdx, setActiveIdx] = useState(DEFAULT_ACTIVE_TOPPER_INDEX);
  const n = TOPPERS?.length || 0;

  const handlePrev = () => setActiveIdx((prev) => (prev - 1 + n) % n);
  const handleNext = () => setActiveIdx((prev) => (prev + 1) % n);

  if (!TOPPERS || TOPPERS.length === 0) {
    return null;
  }

  return (
    <InViewSection
      id="results"
      aria-label="Celebrating Our Board Toppers"
      className="u-scope relative w-full overflow-hidden text-white scroll-mt-20 [isolation:isolate]"
      style={{
        backgroundColor: "#0A1424",
        paddingTop: "clamp(48px, 5.5vw, calc(var(--su, 1px) * 64))",
        paddingBottom: "clamp(52px, 6vw, calc(var(--su, 1px) * 72))",
      }}
    >
      {/* ================= HARD-EDGED DECORATIVE LAYERS (Measured from toppers.png, No Blur) ================= */}

      {/* 1. Subtle Dark Circle Top-Right (x1130-1500, y0-130, ~4% lighter than bg) */}
      <div
        className="hidden lg:block absolute rounded-full pointer-events-none"
        style={{
          width: "calc(var(--su, 1px) * 370)",
          height: "calc(var(--su, 1px) * 370)",
          left: "calc(var(--su, 1px) * 1130)",
          top: "calc(var(--su, 1px) * -120)",
          backgroundColor: "#0D1B2E",
          opacity: 0.55,
        }}
        aria-hidden="true"
      />

      {/* 2. Amber Arc at Far Left (visible area about x0-170 / y185-310) */}
      <div
        className="hidden lg:block absolute rounded-full pointer-events-none"
        style={{
          width: "calc(var(--su, 1px) * 340)",
          height: "calc(var(--su, 1px) * 340)",
          left: "calc(var(--su, 1px) * -170)",
          top: "calc(var(--su, 1px) * 185)",
          backgroundColor: "#3A200B",
          opacity: 0.45,
        }}
        aria-hidden="true"
      />

      {/* 3. Orange Arc at Far Right (visible area about x1480-1600 / y330-420) */}
      <div
        className="hidden lg:block absolute rounded-full pointer-events-none"
        style={{
          width: "calc(var(--su, 1px) * 240)",
          height: "calc(var(--su, 1px) * 240)",
          left: "calc(var(--su, 1px) * 1480)",
          top: "calc(var(--su, 1px) * 330)",
          backgroundColor: "#3A1A08",
          opacity: 0.45,
        }}
        aria-hidden="true"
      />

      {/* ================= CONTAINER ================= */}
      <div
        className="relative z-10 w-full max-w-[calc(var(--su,1px)*1600)] mx-auto px-4 lg:px-0"
        style={{
          paddingLeft: "clamp(16px, 4vw, calc(var(--su, 1px) * 101))",
          paddingRight: "clamp(16px, 4vw, calc(var(--su, 1px) * 101))",
        }}
      >
        <Reveal>
          {/* Header Row: Left-Aligned on Desktop with Top-Right Nav Controls */}
          <div className="relative w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-[calc(var(--su,1px)*44)]">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Badge (Trophy icon, orange border) */}
              <div
                className="inline-flex items-center gap-2 rounded-full border border-[#F97316] bg-[rgba(249,115,22,0.08)] mb-3"
                style={{
                  width: "clamp(180px, 20vw, calc(var(--su, 1px) * 220))",
                  height: "clamp(30px, 3.5vw, calc(var(--su, 1px) * 34))",
                  paddingLeft: "calc(var(--su, 1px) * 14)",
                  paddingRight: "calc(var(--su, 1px) * 14)",
                }}
              >
                <Trophy className="w-4 h-4 text-[#FF8A1F] shrink-0" />
                <span
                  className="font-extrabold tracking-wider uppercase text-[#FF8A1F] whitespace-nowrap"
                  style={{ fontSize: "calc(var(--su, 1px) * 13.5)" }}
                >
                  PROVEN HALL OF FAME
                </span>
              </div>

              {/* H2 */}
              <SectionHeading
                text="Celebrating Our"
                highlight="Board Toppers"
                highlightTone="orange"
                markerHeight="48%"
                fontSize={52}
                textColor="#FFFFFF"
                align="left"
              />

              {/* Paragraph (gap 16u, explicit break: Line 1 ANCHOR 502u at 18-19u) */}
              <p
                className="mt-3 lg:mt-[calc(var(--su,1px)*16)] text-[#A8B3C5] font-normal leading-[1.38] text-balance max-w-full lg:max-w-[calc(var(--su,1px)*640)]"
                style={{
                  fontSize: "clamp(15px, 2vw, calc(var(--su, 1px) * 18))",
                  letterSpacing: "-0.01em",
                }}
              >
                <span className="lg:inline-block">
                  Consistent 95+ and 100/100 scores produced year after year
                </span>
                <span className="lg:block">from Sector 9, Faridabad.</span>
              </p>
            </div>

            {/* Desktop Navigation Arrows (y-centered on the paragraph) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 mb-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous topper"
                className="rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{
                  width: "calc(var(--su, 1px) * 58)",
                  height: "calc(var(--su, 1px) * 58)",
                  backgroundColor: "#16233A",
                  border: "1px solid #2A3A55",
                }}
              >
                <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next topper"
                className="rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md"
                style={{
                  width: "calc(var(--su, 1px) * 58)",
                  height: "calc(var(--su, 1px) * 58)",
                  background: "linear-gradient(135deg, #FF9A2E 0%, #F26A0A 100%)",
                }}
              >
                <ChevronRight className="w-6 h-6 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* 3D Transform Toppers Carousel */}
        <ToppersCarousel
          toppers={TOPPERS}
          activeIndex={activeIdx}
          onChangeActive={setActiveIdx}
        />

        {/* Mobile Controls & CTA Area */}
        <div className="mt-6 lg:mt-[calc(var(--su,1px)*28)] flex flex-col items-center justify-center gap-4">
          {/* Mobile Navigation Arrows (Visible only on mobile/tablet) */}
          <div className="flex lg:hidden items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous topper"
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-[#16233A] border border-[#2A3A55] active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next topper"
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-r from-[#FF9A2E] to-[#F26A0A] active:scale-95 shadow-md"
            >
              <ChevronRight className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </div>

          {/* CTA Button: View All Results & Toppers (310u x 55u) */}
          <Link
            href="/results"
            className="group inline-flex items-center justify-center gap-2 rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              width: "clamp(260px, 80vw, calc(var(--su, 1px) * 310))",
              height: "clamp(48px, 5.5vw, calc(var(--su, 1px) * 55))",
              background: "linear-gradient(90deg, #FF9A2E 0%, #F26A0A 100%)",
              fontSize: "clamp(14px, 1.8vw, calc(var(--su, 1px) * 15.5))",
              boxShadow: "0 14px 30px -10px rgba(249, 115, 22, 0.5)",
            }}
          >
            <span>View All Results &amp; Toppers</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </InViewSection>
  );
}
