"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

export default function GalleryStrip({
  items = [],
  stripRef,
  onImageClick,
}) {
  const rafRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Compute 3D tilt per card based on distance to viewport center:
  // Cards on left tilt outward: rotateY(+12deg)
  // Cards on right tilt outward: rotateY(-12deg)
  // Center cards: 0deg
  const updateTilts = useCallback(() => {
    const container = stripRef.current;
    if (!container) return;

    const cards = container.querySelectorAll("[data-gallery-card]");
    const viewportCenter = window.innerWidth / 2;
    const maxDelta = window.innerWidth / 2;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    cards.forEach((card) => {
      if (prefersReduced) {
        card.style.setProperty("--ry", "0deg");
        return;
      }

      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const offset = cardCenter - viewportCenter;
      const norm = Math.max(-1, Math.min(1, offset / maxDelta));

      const ry = (-norm * 12).toFixed(2);
      card.style.setProperty("--ry", `${ry}deg`);
    });
  }, [stripRef]);

  // Center initial scroll so edge cards are partly cut on both sides
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const initialTimer = setTimeout(() => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      }
      updateTilts();
    }, 150);

    return () => clearTimeout(initialTimer);
  }, [stripRef, updateTilts]);

  // Listen for scroll & resize to update 3D tilts smoothly
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTilts);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stripRef, updateTilts]);

  // Mouse drag to scroll
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - stripRef.current.offsetLeft;
    scrollLeftRef.current = stripRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - stripRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    stripRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleCardClick = (idx) => {
    if (hasMovedRef.current) return; // Prevent opening lightbox if user was dragging
    onImageClick?.(idx);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const el = stripRef.current;
    if (!el) return;
    const step = 200; // 1 card + gap
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollBy({ left: -step, behavior: "smooth" });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={stripRef}
      tabIndex={0}
      role="region"
      aria-label="Classroom and celebration gallery slider"
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      className="relative w-screen max-w-full overflow-x-auto overflow-y-visible no-scrollbar snap-x snap-mandatory flex items-center select-none outline-none py-8 px-6 sm:px-10 lg:px-14"
      style={{
        gap: "10px",
        perspective: "1400px",
        cursor: isDraggingRef.current ? "grabbing" : "grab",
      }}
    >
      {items.map((item, idx) => {
        const itemId = item._id || item.id || `gallery-item-${idx}`;
        const isVideo =
          item.type === "video" ||
          item.mediaType === "video" ||
          Boolean((item.url || item.imageUrl)?.match(/\.(mp4|mov|m4v|webm)$/i));

        // Use posterUrl for video if available, or generate/fallback thumbnail
        const itemThumb =
          item.posterUrl ||
          item.imageUrl ||
          item.image ||
          item.src ||
          (isVideo && item.url ? item.url.replace(/\.[^/.]+$/, ".jpg") : item.url);

        const itemCaption = item.caption || item.title || "Classroom moment at RD Classes";

        return (
          <div
            key={itemId}
            data-gallery-card
            onClick={() => handleCardClick(idx)}
            role="button"
            tabIndex={0}
            aria-label={`View ${isVideo ? "video" : "photo"}: ${itemCaption}`}
            className="group shrink-0 relative overflow-hidden rounded-[28px] snap-center select-none cursor-pointer bg-slate-900 shadow-[0_14px_30px_rgba(11,27,58,0.18)] hover:shadow-[0_24px_50px_rgba(11,27,58,0.35)] w-[150px] lg:w-[190px] h-[270px] lg:h-[330px] [--hover-y:0px] hover:[--hover-y:-4px] transition-shadow duration-300"
            style={{
              transformStyle: "preserve-3d",
              transform:
                "perspective(1400px) rotateY(var(--ry, 0deg)) translateY(var(--hover-y, 0px))",
              transition:
                "transform 300ms ease-out, box-shadow 300ms ease-out",
            }}
          >
            {/* Image / Thumbnail - uniform object-cover */}
            {itemThumb ? (
              <Image
                src={itemThumb}
                alt={itemCaption}
                fill
                priority={idx < 8}
                sizes="(max-width: 768px) 150px, 190px"
                className="object-cover object-center select-none pointer-events-none"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                Classroom
              </div>
            )}

            {/* If video: small semi-transparent play icon in the center */}
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/25 shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
