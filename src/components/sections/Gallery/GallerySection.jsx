"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import SectionBadge from "@/components/ui/SectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import GalleryStrip from "./GalleryStrip";
import { GALLERY_ITEMS } from "@/constants/gallery";

export default function GallerySection() {
  const stripRef = useRef(null);
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: false });

  const handlePrev = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const cardW = strip.firstElementChild?.clientWidth || 200;
    strip.scrollBy({ left: -(cardW * 2), behavior: "smooth" });
  };

  const handleNext = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const cardW = strip.firstElementChild?.clientWidth || 200;
    strip.scrollBy({ left: cardW * 2, behavior: "smooth" });
  };

  if (!GALLERY_ITEMS || GALLERY_ITEMS.length === 0) {
    return null;
  }

  return (
    <InViewSection
      id="gallery"
      aria-label="Classroom and celebrations gallery"
      className="u-scope relative w-full overflow-hidden text-[#0F172A] scroll-mt-20 [isolation:isolate]"
      style={{
        paddingTop: "clamp(48px, 5.5vw, calc(var(--su, 1px) * 64))",
        paddingBottom: "clamp(52px, 6vw, calc(var(--su, 1px) * 72))",
      }}
    >
      <div className="relative z-10 w-full max-w-[calc(var(--su,1px)*1600)] mx-auto px-4 lg:px-0">
        <Reveal>
          {/* Header Row: Centered title with desktop right-aligned arrow buttons inside 1600u */}
          <div className="relative w-full flex items-center justify-between mb-8 lg:mb-[calc(var(--su,1px)*35)]">
            {/* Symmetrical Left Spacer on Desktop */}
            <div className="hidden lg:block w-[calc(var(--su,1px)*162)] shrink-0" aria-hidden="true" />

            {/* Centered Heading Content */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              {/* Badge without icon */}
              <SectionBadge
                text="LIFE AT RD CLASSES"
                icon={null}
                className="mb-4"
                style={{
                  width: "clamp(160px, 18vw, calc(var(--su, 1px) * 184))",
                  height: "clamp(30px, 3.5vw, calc(var(--su, 1px) * 35))",
                }}
              />

              <SectionHeading
                text="Inside Our"
                highlight="Classroom & Celebrations"
                highlightTone="warm"
                markerHeight="55%"
                fontSize={52}
                align="center"
              />

              {/* Subtext (gap 18u, 2 lines desktop) */}
              <p
                className="mt-3 lg:mt-[calc(var(--su,1px)*18)] text-[#6B7686] font-normal leading-[1.4] text-balance max-w-full lg:max-w-[calc(var(--su,1px)*820)]"
                style={{ fontSize: "clamp(15px, 2vw, calc(var(--su, 1px) * 19))" }}
              >
                <span className="lg:inline-block">
                  Real snapshots from daily lecture discussions, whiteboard problem solving, and annual
                </span>
                <span className="lg:block">prize distributions.</span>
              </p>
            </div>

            {/* Desktop Navigation Arrows (inside 1600u container aligned to right edge, x1438-1484 and x1502-1555) */}
            <div className="hidden lg:flex items-center gap-[calc(var(--su,1px)*18)] shrink-0 self-end mb-2 w-[calc(var(--su,1px)*162)] justify-end pr-[calc(var(--su,1px)*45)]">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous gallery snapshots"
                disabled={scrollState.atStart}
                className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  scrollState.atStart ? "opacity-40 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                }`}
                style={{
                  width: "calc(var(--su, 1px) * 48)",
                  height: "calc(var(--su, 1px) * 48)",
                  backgroundColor: "#D6ECFA",
                }}
              >
                <ChevronLeft className="w-5 h-5 text-[#0F172A] stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next gallery snapshots"
                disabled={scrollState.atEnd}
                className={`rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
                  scrollState.atEnd ? "opacity-40 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                }`}
                style={{
                  width: "calc(var(--su, 1px) * 54)",
                  height: "calc(var(--su, 1px) * 54)",
                  backgroundColor: "#0F6A8F",
                }}
              >
                <ChevronRight className="w-6 h-6 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Gallery Strip (card 188u x 320u, gap 12u, radius 18u) */}
        <div className="w-full">
          <GalleryStrip
            items={GALLERY_ITEMS}
            stripRef={stripRef}
            onScrollStateChange={setScrollState}
          />
        </div>

        {/* CTA Area & Mobile Arrows */}
        <div className="mt-8 lg:mt-[calc(var(--su,1px)*30)] flex flex-col items-center justify-center gap-6">
          {/* Mobile Arrows: centered below the strip on mobile */}
          <div className="flex lg:hidden items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous gallery snapshots"
              disabled={scrollState.atStart}
              className={`w-11 h-11 rounded-full flex items-center justify-center bg-[#D6ECFA] active:scale-95 ${
                scrollState.atStart ? "opacity-40" : ""
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-[#0F172A] stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next gallery snapshots"
              disabled={scrollState.atEnd}
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#0F6A8F] text-white shadow-md active:scale-95 ${
                scrollState.atEnd ? "opacity-40" : ""
              }`}
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* View Full Classroom Gallery Button (294u x 49u) */}
          <Link
            href="/gallery"
            className="group inline-flex items-center justify-center gap-2 rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              width: "clamp(240px, 80vw, calc(var(--su, 1px) * 294))",
              height: "clamp(44px, 5vw, calc(var(--su, 1px) * 49))",
              backgroundColor: "#0F6A8F",
              fontSize: "clamp(13px, 1.6vw, calc(var(--su, 1px) * 15))",
              boxShadow: "0 10px 24px -8px rgba(15, 106, 143, 0.45)",
            }}
          >
            <span>View Full Classroom Gallery</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </InViewSection>
  );
}
