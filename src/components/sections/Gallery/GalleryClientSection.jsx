"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import SectionBadge from "@/components/ui/SectionBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import GalleryStrip from "./GalleryStrip";

export default function GalleryClientSection({ items = [] }) {
  const stripRef = useRef(null);
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: false });

  if (items.length === 0) return null;

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
          {/* Header Row */}
          <div className="relative w-full flex items-center justify-between mb-8 lg:mb-[calc(var(--su,1px)*35)]">
            <div className="hidden lg:block w-[calc(var(--su,1px)*162)] shrink-0" aria-hidden="true" />

            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <SectionBadge
                text="LIFE AT RD CLASSES"
                icon={null}
                className="mb-4"
                style={{
                  width: "clamp(160px, 18vw, calc(var(--su, 1px) * 184))",
                  height: "clamp(30px, 3.2vw, calc(var(--su, 1px) * 33))",
                  backgroundColor: "#EBF5FA",
                  color: "#0F6A8F",
                  border: "1px solid #B8DFEE",
                  fontSize: "clamp(10px, 1.1vw, calc(var(--su, 1px) * 11.5))",
                }}
              />

              <SectionHeading
                text="Inside Our Offline Classroom &amp; Celebrations"
                highlight="Celebrations"
                highlightColor="#F59E0B"
                className="text-[#0B1528] text-center leading-[1.12]"
                style={{
                  fontSize: "clamp(28px, 4vw, calc(var(--su, 1px) * 48))",
                  letterSpacing: "-0.02em",
                }}
              />

              <p
                className="mt-3 text-center text-[#556477] font-normal"
                style={{
                  fontSize: "clamp(13px, 1.5vw, calc(var(--su, 1px) * 16))",
                  maxWidth: "calc(var(--su, 1px) * 620)",
                  lineHeight: 1.5,
                }}
              >
                Intense problem-solving workshops, festive batch felicitations, and the joyful journey toward academic excellence.
              </p>
            </div>

            {/* Desktop Navigation Arrows */}
            <div
              className="hidden lg:flex items-center gap-3 shrink-0"
              style={{
                paddingRight: "clamp(16px, 2.5vw, calc(var(--su, 1px) * 20))",
              }}
            >
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous gallery snapshots"
                disabled={scrollState.atStart}
                className={`w-11 h-11 rounded-full flex items-center justify-center bg-[#0F6A8F] text-white shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  scrollState.atStart ? "opacity-40 cursor-not-allowed hover:scale-100" : ""
                }`}
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next gallery snapshots"
                disabled={scrollState.atEnd}
                className={`w-11 h-11 rounded-full flex items-center justify-center bg-[#0F6A8F] text-white shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  scrollState.atEnd ? "opacity-40 cursor-not-allowed hover:scale-100" : ""
                }`}
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Gallery Strip with 3D Perspective and smooth scroll */}
        <Reveal delay={0.15}>
          <div className="w-full relative">
            <GalleryStrip
              items={items}
              stripRef={stripRef}
              onScrollStateChange={setScrollState}
            />
          </div>
        </Reveal>

        {/* Bottom Actions Row */}
        <div className="mt-8 lg:mt-[calc(var(--su,1px)*45)] flex flex-col items-center justify-center gap-4">
          {/* Mobile Arrows */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous gallery snapshots"
              disabled={scrollState.atStart}
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#0F6A8F] text-white shadow-md active:scale-95 ${
                scrollState.atStart ? "opacity-40" : ""
              }`}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
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

          <Link
            href="/gallery"
            className="group inline-flex items-center justify-center gap-2 rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{
              padding: "12px 28px",
              backgroundColor: "#0F6A8F",
              fontSize: "clamp(13px, 1.4vw, 15px)",
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
