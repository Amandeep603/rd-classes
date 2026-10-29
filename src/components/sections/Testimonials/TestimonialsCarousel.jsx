"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TestimonialCard from "./TestimonialCard";

/**
 * TestimonialsCarousel Component
 * - Two-part row: Left block (about 22% width) + Right block (horizontal carousel)
 * - 3 cards on desktop, 2 on tablet, 1.15 cards on mobile (peeking)
 * - Drag-to-scroll with inertia, grab/grabbing cursor, click-prevention on drag
 * - Auto-play every 4s, pauses on hover/drag/focus, resumes 2s later
 * - Respects prefers-reduced-motion
 * - Two 36px circular arrow buttons, no dots
 * - 2px scroll progress line beneath carousel
 */
export default function TestimonialsCarousel({ testimonials = [] }) {
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);

  // Drag interaction refs
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeDash, setActiveDash] = useState(0);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  const n = testimonials.length;

  // Track entry intersection for 80ms staggered fade-in
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update scroll metrics and arrow button states
  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < maxScroll - 6);

    // Sync 3-dash indicator with scroll position
    if (maxScroll > 10) {
      const ratio = scrollLeft / maxScroll;
      const currentDash = Math.min(2, Math.max(0, Math.round(ratio * 2)));
      setActiveDash(currentDash);
    } else {
      setActiveDash(0);
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    const handleScroll = () => updateScrollState();
    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollState, n]);

  // Auto-play setup
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  // Scroll by 1 card width
  const scrollByCard = useCallback((direction = 1) => {
    const track = trackRef.current;
    if (!track) return;

    const firstCard = track.querySelector("[data-testimonial-card]");
    const cardWidth = firstCard?.parentElement?.clientWidth || track.clientWidth * 0.33;
    const gap = 20;
    const distance = cardWidth + gap;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;

    if (direction === -1 && scrollLeft <= 6) {
      return;
    }

    // Loop back to start if at the end and moving right
    if (direction === 1 && scrollLeft >= maxScroll - 10) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    track.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || n <= 1) return;

    autoPlayTimerRef.current = setInterval(() => {
      scrollByCard(1);
    }, 4000);
  }, [n, scrollByCard, stopAutoPlay]);

  const scheduleAutoPlayResume = useCallback(() => {
    stopAutoPlay();
    resumeTimerRef.current = setTimeout(() => {
      startAutoPlay();
    }, 2000);
  }, [startAutoPlay, stopAutoPlay]);

  // Scroll to slide group (synced with dashes)
  const scrollToGroup = useCallback(
    (dashIndex) => {
      const track = trackRef.current;
      if (!track) return;
      stopAutoPlay();

      const { scrollWidth, clientWidth } = track;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll > 10) {
        const targetScroll = (dashIndex / 2) * maxScroll;
        track.scrollTo({ left: targetScroll, behavior: "smooth" });
      } else {
        const cards = track.querySelectorAll("[data-testimonial-card]");
        if (cards[dashIndex]?.parentElement) {
          track.scrollTo({
            left: cards[dashIndex].parentElement.offsetLeft - track.offsetLeft,
            behavior: "smooth",
          });
        }
      }
      setActiveDash(dashIndex);
      scheduleAutoPlayResume();
    },
    [scheduleAutoPlayResume, stopAutoPlay]
  );

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // Pointer drag events for mouse & touch
  const handlePointerDown = (e) => {
    // Only respond to main button
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const track = trackRef.current;
    if (!track) return;

    stopAutoPlay();
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimeRef.current = Date.now();
    startScrollLeftRef.current = track.scrollLeft;
    velocityRef.current = 0;
    hasDraggedRef.current = false;

    // Capture pointer
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    const track = trackRef.current;
    if (!track) return;

    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 5) {
      hasDraggedRef.current = true;
      if (!isDragging) setIsDragging(true);
    }

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (e.clientX - lastXRef.current) / dt;
    }
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;

    track.scrollLeft = startScrollLeftRef.current - deltaX;
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    const track = trackRef.current;
    if (track) {
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        // fallback
      }

      // Apply light inertia glide if dragging fast
      const v = velocityRef.current;
      if (Math.abs(v) > 0.4) {
        const momentumDistance = -v * 160;
        track.scrollBy({ left: momentumDistance, behavior: "smooth" });
      }
    }

    scheduleAutoPlayResume();
  };

  const handlePointerCancel = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    scheduleAutoPlayResume();
  };

  // Prevent click triggering if user was dragging
  const handleCaptureClick = (e) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={scheduleAutoPlayResume}
      onFocus={stopAutoPlay}
      onBlur={scheduleAutoPlayResume}
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
        {/* LEFT BLOCK: about 22% width on desktop */}
        <div className="w-full lg:w-[280px] lg:min-w-[270px] shrink-0 flex flex-col justify-between py-1">
          <div>
            {/* Big Quote Glyph (light-blue #9ED3F0) */}
            <div className="mb-3 lg:mb-4">
              <svg
                viewBox="0 0 24 24"
                className="w-12 h-12 lg:w-14 lg:h-14 fill-[#9ED3F0]"
                aria-hidden="true"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>
            </div>

            {/* Heading: clamp(26px, 2.6vw, 36px), 'saying' in orange */}
            <h3 className="font-extrabold text-[#0B1B3B] leading-[1.08] tracking-tight text-[26px] sm:text-[30px] lg:text-[clamp(26px,2.6vw,36px)]">
              What our <br className="hidden sm:inline" />
              students &amp; <br className="hidden sm:inline" />
              parents are{" "}
              <span className="text-[#F97316]">
                saying
              </span>
            </h3>
          </div>

          {/* Restored Controls: [ ‹ arrow button ] [ dash dash dash progress indicator ] [ › arrow button ] */}
          <div className="flex items-center gap-[14px] mt-6 lg:mt-8">
            {/* Left arrow: 40px circle, white/very light background, thin border, grey chevron icon */}
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous review"
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#DDE8F0] shadow-xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0 ${
                !canScrollLeft
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-[#526071] stroke-[2.2]" />
            </button>

            {/* 3 short rounded dashes: width 48px, height 4px, radius 4px, gap 8px */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Review page navigation">
              {[...Array(3)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={activeDash === i}
                  aria-label={`Go to slide group ${i + 1}`}
                  onClick={() => scrollToGroup(i)}
                  className="transition-colors duration-300 cursor-pointer p-0 border-0 focus:outline-none"
                  style={{
                    width: "48px",
                    height: "4px",
                    borderRadius: "4px",
                    backgroundColor: activeDash === i ? "#1593C9" : "#D9DEE5",
                  }}
                />
              ))}
            </div>

            {/* Right arrow: 40px circle, solid blue #1593C9, white chevron icon */}
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next review"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1593C9] text-white shadow-xs transition-all duration-200 cursor-pointer hover:bg-[#1281B0] active:scale-95 shrink-0"
            >
              <ChevronRight className="w-5 h-5 text-white stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* RIGHT BLOCK: horizontal carousel of review cards */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div
            ref={trackRef}
            role="region"
            aria-label="Testimonials slider"
            tabIndex={0}
            onClickCapture={handleCaptureClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`flex items-stretch gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory focus:outline-none select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingTop: "6px",
              paddingBottom: "8px",
            }}
          >
            {testimonials.map((item, index) => (
              <div
                key={item.id || index}
                className="shrink-0 snap-start flex flex-col"
                style={{
                  /* 3 cards on desktop, 2 on tablet, 1.15 cards on mobile */
                  width:
                    "var(--card-width, clamp(280px, 82vw, calc((100% - 40px) / 3)))",
                }}
              >
                <TestimonialCard
                  item={item}
                  index={index}
                  isVisible={hasEnteredView}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Card Width Rules */}
      <style jsx>{`
        /* Mobile: 1.15 cards so next card peeks */
        @media (max-width: 639px) {
          :global([data-testimonial-card]) {
            width: 100%;
          }
          div :global(.shrink-0.snap-start) {
            width: calc((100% - 20px) / 1.15) !important;
            min-width: 260px;
          }
        }
        /* Tablet: 2 cards */
        @media (min-width: 640px) and (max-width: 1023px) {
          div :global(.shrink-0.snap-start) {
            width: calc((100% - 20px) / 2) !important;
          }
        }
        /* Desktop: 3 cards */
        @media (min-width: 1024px) {
          div :global(.shrink-0.snap-start) {
            width: calc((100% - 40px) / 3) !important;
          }
        }
      `}</style>
    </div>
  );
}
