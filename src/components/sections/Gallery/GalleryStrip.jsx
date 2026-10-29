"use client";

import React from "react";
import Image from "next/image";

export default function GalleryStrip({ items, stripRef, onScrollStateChange }) {
  // Report scroll bounds for arrow disabled state
  const handleScroll = () => {
    const strip = stripRef.current;
    if (!strip || !onScrollStateChange) return;
    const atStart = strip.scrollLeft <= 10;
    const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 10;
    onScrollStateChange({ atStart, atEnd });
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const strip = stripRef.current;
    if (!strip) return;
    const cardW = strip.firstElementChild?.clientWidth || 200;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      strip.scrollBy({ left: -(cardW * 2), behavior: "smooth" });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      strip.scrollBy({ left: cardW * 2, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={stripRef}
      tabIndex={0}
      role="region"
      aria-label="Classroom and celebration gallery photos"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      className="w-full flex items-center overflow-x-auto snap-x snap-proximity scroll-smooth no-scrollbar custom-scroller outline-none focus-visible:ring-2 focus-visible:ring-[#0F6A8F] [perspective:1200px]"
      style={{
        gap: "clamp(8px, 1.2vw, calc(var(--su, 1px) * 12))",
        paddingTop: "24px",
        paddingBottom: "44px",
        marginTop: "-24px",
        marginBottom: "-44px",
        paddingInline: "clamp(16px, 2.5vw, calc(var(--su, 1px) * 20))",
      }}
    >
      {items.map((item) => {
        const itemId = item._id || item.id;
        const itemSrc = item.imageUrl || item.image || item.src;
        const itemAlt = item.caption || item.alt || "Classroom photo";

        return (
          <div
            key={itemId}
            className="snap-center shrink-0 rounded-[18px] overflow-hidden relative shadow-md transition-all duration-300 hover:scale-[1.04] group [transform-origin:center] [will-change:transform]"
            style={{
              width: "clamp(140px, 42vw, calc(var(--su, 1px) * 188))",
              height: "clamp(240px, 70vw, calc(var(--su, 1px) * 320))",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              "--card-ry": `${item.ry || 0}deg`,
              "--card-skew": `${item.skew || 0}deg`,
              transform: "perspective(1200px) rotateY(var(--card-ry, 0deg)) skewY(var(--card-skew, 0deg))",
            }}
          >
            <Image
              src={itemSrc}
              alt={itemAlt}
              fill
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 180px, 240px"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {/* Subtle gradient vignette */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-50 group-hover:opacity-30 transition-opacity pointer-events-none"
              aria-hidden="true"
            />

            {/* Accessible image alt text for screen readers */}
            <span className="sr-only">{itemAlt}</span>
          </div>
        );
      })}
    </div>
  );
}
