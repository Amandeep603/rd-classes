"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ToppersCarousel from "./ToppersCarousel";

export default function BoardToppersClient({ toppers = [] }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canScrollPrev: true, canScrollNext: true });
  const shouldLoop = toppers.length >= 6;
  const showArrows = toppers.length >= 5;

  return (
    <section
      id="results"
      aria-label="Celebrating Our Board Toppers"
      className="relative w-full overflow-hidden text-white py-10 lg:py-14 [isolation:isolate] bg-gradient-to-b from-[#07142B] via-[#0B1B3A] to-[#07142B]"
    >
      {/* Background decorations matching reference */}
      {/* a) Large soft dark-navy circle at the top right */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-[#0A1A36]/80 blur-2xl z-0"
        aria-hidden="true"
      />
      {/* b) Big curved orange-brown arc/blob on the far left edge */}
      <div
        className="pointer-events-none absolute top-1/3 -left-44 w-[360px] h-[360px] rounded-full bg-gradient-to-r from-[#FF7A00]/25 via-[#D96500]/15 to-transparent blur-3xl z-0"
        aria-hidden="true"
      />
      {/* c) Similar but smaller one on the far right edge */}
      <div
        className="pointer-events-none absolute bottom-6 -right-36 w-[280px] h-[280px] rounded-full bg-gradient-to-l from-[#FF7A00]/20 via-[#D96500]/10 to-transparent blur-3xl z-0"
        aria-hidden="true"
      />
      {/* d) Faint orange radial glow behind the center card */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,122,0,0.12)_0%,transparent_70%)] blur-2xl z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="max-w-2xl text-left">
            {/* Pill: PROVEN HALL OF FAME */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181008] border border-[#FF7A00]/50 text-[#FF9E3B] text-xs font-extrabold uppercase tracking-wider mb-2 shadow-xs select-none">
              <Trophy className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>PROVEN HALL OF FAME</span>
            </div>

            {/* H2 Heading with orange gradient highlight bar only behind Board Toppers */}
            <h2 className="text-2xl sm:text-3xl lg:text-[clamp(1.75rem,2.4vw,2.35rem)] font-extrabold text-white tracking-tight leading-tight lg:whitespace-nowrap">
              Celebrating Our{" "}
              <span className="relative inline-block px-1 whitespace-nowrap">
                <span
                  className="absolute inset-x-0 bottom-1 h-[45%] bg-gradient-to-r from-[#FF9A00] to-[#FF4500] -z-10 rounded-xs opacity-90 -rotate-1"
                  aria-hidden="true"
                />
                Board Toppers
              </span>
            </h2>

            {/* Paragraph in slate-300 */}
            <p className="mt-1.5 text-sm lg:text-base text-slate-300 font-normal leading-relaxed max-w-xl line-clamp-2">
              Consistent 95+ and 100/100 scores produced year after year from Sector 9, Faridabad.
            </p>
          </div>

          {/* Desktop Round Arrow Buttons (Shown for 5+ entries) */}
          {showArrows && (
            <div className="flex items-center gap-2.5 self-start md:self-end mb-1">
              <button
                type="button"
                onClick={() => prevRef.current?.()}
                disabled={!shouldLoop && !scrollState.canScrollPrev}
                aria-label="Previous board topper"
                className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center bg-[#0D1C2E] border border-white/15 text-white shadow-md transition-all duration-300 ${
                  !shouldLoop && !scrollState.canScrollPrev
                    ? "opacity-35 cursor-not-allowed"
                    : "hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => nextRef.current?.()}
                disabled={!shouldLoop && !scrollState.canScrollNext}
                aria-label="Next board topper"
                className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-black font-bold shadow-md shadow-orange-500/25 transition-all duration-300 ${
                  !shouldLoop && !scrollState.canScrollNext
                    ? "opacity-35 cursor-not-allowed"
                    : "hover:scale-105 active:scale-95 cursor-pointer"
                }`}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Area */}
        <div className="mt-4 lg:mt-6 w-full">
          <ToppersCarousel
            toppers={toppers}
            externalPrev={prevRef}
            externalNext={nextRef}
            onCanScrollChange={setScrollState}
          />
        </div>

        {/* Bottom CTA Row: Orange gradient pill button */}
        <div className="mt-4 lg:mt-6 flex justify-center">
          <Link
            href="/results"
            className="group inline-flex items-center gap-2 rounded-full font-extrabold text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 px-6 py-2.5 sm:py-3 text-sm cursor-pointer bg-gradient-to-r from-[#FF9400] via-[#FF7A00] to-[#FF5000]"
          >
            <span>View All Results &amp; Toppers</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
