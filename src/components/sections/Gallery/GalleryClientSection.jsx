"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import GalleryStrip from "./GalleryStrip";
import Lightbox from "@/components/shared/Lightbox";

export default function GalleryClientSection({ items = [] }) {
  const stripRef = useRef(null);
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: false });
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handlePrev = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const cardW = 240;
    strip.scrollBy({ left: -cardW, behavior: "smooth" });
  };

  const handleNext = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const cardW = 240;
    strip.scrollBy({ left: cardW, behavior: "smooth" });
  };

  return (
    <section
      id="gallery"
      aria-label="Inside Our Classroom & Celebrations"
      className="relative w-full overflow-hidden text-[#0F172A] py-16 lg:py-24 bg-[#FDF8F1]"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row: Centered with Prev/Next buttons on top right */}
        <div className="relative w-full flex flex-col items-center text-center mb-8 lg:mb-12">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFE6A0] text-[#0B1B3A] text-xs font-extrabold uppercase tracking-wider mb-4 shadow-2xs select-none">
            <span>LIFE AT RD CLASSES</span>
          </div>

          {/* Heading with yellow-to-orange highlight bar */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1B3A] tracking-tight leading-[1.15]">
            Inside Our{" "}
            <span className="relative inline-block px-1 whitespace-nowrap">
              <span
                className="absolute inset-x-0 bottom-1.5 h-[45%] bg-gradient-to-r from-[#FFB800] to-[#FF6B00] -z-10 rounded-xs opacity-90 -rotate-1"
                aria-hidden="true"
              />
              Classroom &amp; Celebrations
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-3.5 text-base sm:text-lg text-slate-600 font-normal max-w-2xl leading-relaxed">
            Real snapshots from daily lecture discussions, whiteboard problem solving, and annual prize distributions.
          </p>

          {/* Prev/Next buttons at the top right on desktop */}
          <div className="hidden lg:flex items-center gap-2.5 absolute right-0 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous gallery photo"
              disabled={scrollState.atStart}
              className={`w-11 h-11 rounded-full flex items-center justify-center bg-[#D6EAF8] text-[#0E7490] transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                scrollState.atStart ? "opacity-40 cursor-not-allowed hover:scale-100" : ""
              }`}
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next gallery photo"
              disabled={scrollState.atEnd}
              className={`w-11 h-11 rounded-full flex items-center justify-center bg-[#0E7490] text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md ${
                scrollState.atEnd ? "opacity-40 cursor-not-allowed hover:scale-100" : ""
              }`}
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Gallery 3D Slider */}
        <div className="w-full">
          <GalleryStrip
            items={items}
            stripRef={stripRef}
            onImageClick={(idx) => setLightboxIndex(idx)}
            onScrollStateChange={setScrollState}
          />
        </div>

        {/* Mobile Prev/Next Arrows */}
        <div className="flex lg:hidden items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D6EAF8] text-[#0E7490] shadow-xs active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0E7490] text-white shadow-xs active:scale-95"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom CTA Row: Teal-blue pill button */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-2.5 rounded-full font-bold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-teal-900/20 px-8 py-3.5 text-sm sm:text-base cursor-pointer bg-[#0E7490] hover:bg-[#095E76]"
          >
            <span>View Full Classroom Gallery</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Shared Lightbox */}
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
