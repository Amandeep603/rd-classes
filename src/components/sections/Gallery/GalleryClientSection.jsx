"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import GalleryStrip from "./GalleryStrip";
import Lightbox from "@/components/shared/Lightbox";

export default function GalleryClientSection({ items = [] }) {
  const stripRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handlePrev = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const step = 200; // one card (190px) + gap (10px)
    strip.scrollBy({ left: -step, behavior: "smooth" });
  };

  const handleNext = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const step = 200; // one card (190px) + gap (10px)
    strip.scrollBy({ left: step, behavior: "smooth" });
  };

  return (
    <section
      id="gallery"
      aria-label="Inside Our Classroom & Celebrations"
      className="relative overflow-hidden bg-[#FDFAF3] py-8 lg:py-10"
    >
      {/* 1. Header (tight, centered, like the reference) */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        {/* Pill */}
        <div className="inline-flex rounded-full border border-amber-200 bg-[#FDF0CF] px-4 py-1.5 text-xs font-bold tracking-wider text-[#0B1B3A] select-none shadow-2xs">
          LIFE AT RD CLASSES
        </div>

        {/* H2 Heading with warm gradient highlight bar */}
        <h2 className="mt-3.5 text-3xl sm:text-4xl lg:text-[clamp(1.9rem,3.4vw,3.1rem)] font-extrabold text-[#0B1B3A] tracking-tight leading-tight lg:whitespace-nowrap">
          Inside Our{" "}
          <span className="relative inline-block z-0">
            Classroom &amp; Celebrations
            <span
              className="absolute inset-x-[-4px] bottom-0 h-[55%] -z-10 bg-gradient-to-r from-[#FFD54A] via-[#FFC93C] to-[#FF8A1F] rounded-xs"
              aria-hidden="true"
            />
          </span>
        </h2>

        {/* Paragraph (mt-3, 2 lines) */}
        <p className="mt-2.5 mx-auto max-w-[620px] text-sm lg:text-base leading-relaxed text-slate-500">
          Real snapshots from daily lecture discussions, whiteboard problem solving, and annual prize distributions.
        </p>
      </div>

      {/* 2. Arrows Row: Aligned to the right edge of max-w-7xl, directly above slider */}
      <div className="mx-auto max-w-7xl px-6 flex justify-end gap-3 mt-1 -mb-9 lg:-mb-11 relative z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous classroom moments"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-[#DCEEFA] text-[#0B1B3A] hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-xs select-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next classroom moments"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-[#0E6E8C] text-white shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Slider Track: Edge-to-edge full width of viewport */}
      <div className="w-full mt-8">
        <GalleryStrip
          items={items}
          stripRef={stripRef}
          onImageClick={(idx) => setLightboxIndex(idx)}
        />
      </div>

      {/* 4. CTA Button: Centered below */}
      <div className="mt-6 lg:mt-7 flex justify-center">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 rounded-full bg-[#0E6E8C] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(14,110,140,0.3)] hover:-translate-y-0.5 transition cursor-pointer"
        >
          <span>View Full Classroom Gallery</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 5. Shared Lightbox */}
      <Lightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        items={items}
        currentIndex={lightboxIndex || 0}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}
