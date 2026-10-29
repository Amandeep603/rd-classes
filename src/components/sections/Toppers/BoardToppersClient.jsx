"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import SectionHeading from "@/components/ui/SectionHeading";
import ToppersCarousel from "./ToppersCarousel";

export default function BoardToppersClient({ toppers = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const n = toppers.length;

  if (n === 0) return null;

  const handlePrev = () => setActiveIdx((prev) => (prev - 1 + n) % n);
  const handleNext = () => setActiveIdx((prev) => (prev + 1) % n);

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
      {/* 1. Subtle Dark Circle Top-Right */}
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

      {/* 2. Amber Arc at Far Left */}
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

      {/* 3. Dark Navy Shape Bottom-Left */}
      <div
        className="hidden lg:block absolute rounded-full pointer-events-none"
        style={{
          width: "calc(var(--su, 1px) * 280)",
          height: "calc(var(--su, 1px) * 280)",
          left: "calc(var(--su, 1px) * 80)",
          top: "calc(var(--su, 1px) * 440)",
          backgroundColor: "#08101E",
          opacity: 0.85,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[calc(var(--su,1px)*1600)] mx-auto px-4 lg:px-0">
        <Reveal>
          {/* Header Area */}
          <div className="flex flex-col items-center text-center mb-8 lg:mb-[calc(var(--su,1px)*45)]">
            <div
              className="inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-wider text-center"
              style={{
                width: "clamp(190px, 20vw, calc(var(--su, 1px) * 210))",
                height: "clamp(30px, 3.2vw, calc(var(--su, 1px) * 33))",
                backgroundColor: "#2E1A08",
                color: "#FFAE34",
                border: "1px solid #753E13",
                fontSize: "clamp(10px, 1.1vw, calc(var(--su, 1px) * 11.5))",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              <Trophy className="w-3.5 h-3.5 fill-[#FFAE34] text-[#FFAE34]" />
              <span>HALL OF FAME</span>
            </div>

            <SectionHeading
              text="Celebrating Our Board Toppers"
              highlight="Board Toppers"
              highlightColor="#F59E0B"
              className="mt-3.5 lg:mt-[calc(var(--su,1px)*14)] text-white text-center leading-[1.12]"
              style={{
                fontSize: "clamp(28px, 4vw, calc(var(--su, 1px) * 48))",
                letterSpacing: "-0.02em",
              }}
            />

            <p
              className="mt-3 text-center text-[#9AA7BA] font-normal"
              style={{
                fontSize: "clamp(13px, 1.5vw, calc(var(--su, 1px) * 16))",
                maxWidth: "calc(var(--su, 1px) * 620)",
                lineHeight: 1.5,
              }}
            >
              Every year our students set benchmarks in CBSE Class 12 &amp; 11 Accountancy. Concept-first teaching delivers proven board excellence.
            </p>
          </div>
        </Reveal>

        {/* Carousel Area */}
        <Reveal delay={0.15}>
          <div className="relative w-full flex items-center justify-center">
            {/* Desktop Left Arrow Button */}
            {n > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous board topper"
                className="hidden lg:flex absolute left-4 xl:left-8 z-30 w-12 h-12 rounded-full items-center justify-center bg-[#0D1C2E] border border-white/10 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="w-full flex justify-center py-4">
              <ToppersCarousel
                toppers={toppers}
                activeIndex={activeIdx}
                onChangeActive={setActiveIdx}
              />
            </div>

            {/* Desktop Right Arrow Button */}
            {n > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next board topper"
                className="hidden lg:flex absolute right-4 xl:right-8 z-30 w-12 h-12 rounded-full items-center justify-center bg-[#0D1C2E] border border-white/10 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </Reveal>

        {/* Bottom CTA Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Mobile Arrows */}
          {n > 1 && (
            <div className="flex lg:hidden items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous board topper"
                className="w-11 h-11 rounded-full flex items-center justify-center bg-[#0D1C2E] border border-white/10 text-white shadow-md active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next board topper"
                className="w-11 h-11 rounded-full flex items-center justify-center bg-[#0D1C2E] border border-white/10 text-white shadow-md active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <Link
            href="/results"
            className="group inline-flex items-center gap-2 rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              padding: "12px 28px",
              backgroundColor: "#E8731A",
              fontSize: "clamp(13px, 1.4vw, 15px)",
              boxShadow: "0 8px 20px -6px rgba(232, 115, 26, 0.5)",
            }}
          >
            <span>View All Board Results &amp; Marksheets</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </InViewSection>
  );
}
