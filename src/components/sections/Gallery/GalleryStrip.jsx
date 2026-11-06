"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

export default function GalleryStrip({
  items = [],
  stripRef,
  onImageClick,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [isTouch, setIsTouch] = useState(false);
  const [aspects, setAspects] = useState({});

  const rafRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  // Compute 3D tilt per card based on distance to viewport center
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
        card.style.setProperty("--rz", "0deg");
        return;
      }

      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const offset = cardCenter - viewportCenter;
      const norm = Math.max(-1, Math.min(1, offset / maxDelta));

      // Left cards tilt positive Y (+14deg), slight negative Z (-1.5deg)
      // Right cards tilt negative Y (-14deg), slight positive Z (+1.5deg)
      // Center cards about 0deg
      const ry = (-norm * 14).toFixed(2);
      const rz = (norm * 1.5).toFixed(2);

      card.style.setProperty("--ry", `${ry}deg`);
      card.style.setProperty("--rz", `${rz}deg`);
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

  // Listen for scroll & resize to update 3D tilts
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

  // Optional slow autoplay, paused on hover
  useEffect(() => {
    const el = stripRef.current;
    if (!el || hoveredId || isTouch) return;

    const interval = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 200, behavior: "smooth" });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [stripRef, hoveredId, isTouch]);

  // Mouse Drag to scroll
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
    if (hasMovedRef.current) return; // Prevent click on drag release
    onImageClick?.(idx);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const el = stripRef.current;
    if (!el) return;
    const step = 200;
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
      onMouseLeave={() => {
        handleMouseUpOrLeave();
        setHoveredId(null);
      }}
      className="relative w-screen max-w-full overflow-x-auto overflow-y-visible no-scrollbar snap-x snap-mandatory flex items-center select-none outline-none py-3 sm:py-4 px-6 sm:px-10 lg:px-14"
      style={{
        gap: "10px",
        perspective: "1400px",
        cursor: isDraggingRef.current ? "grabbing" : "grab",
      }}
    >
      {items.map((item, idx) => {
        const itemId = item._id || item.id || `gallery-item-${idx}`;
        const itemSrc = item.imageUrl || item.image || item.src;
        const itemCaption = item.caption || item.title || "Classroom moment at RD Classes";
        const isHovered = !isTouch && hoveredId === itemId;
        const isLandscape = aspects[itemId] === "landscape";

        // Desktop widths: 190px normal -> 340px (or 420px for landscape) on hover
        let cardWidth = "w-[150px] sm:w-[170px] lg:w-[190px]";
        let inlineStyleWidth = undefined;

        if (isHovered) {
          cardWidth = isLandscape ? "lg:w-[420px]" : "lg:w-[340px]";
          inlineStyleWidth = isLandscape ? "420px" : "340px";
        }

        return (
          <div
            key={itemId}
            data-gallery-card
            onMouseEnter={() => !isTouch && setHoveredId(itemId)}
            onMouseLeave={() => !isTouch && setHoveredId(null)}
            onClick={() => handleCardClick(idx)}
            role="button"
            tabIndex={0}
            aria-label={`View photo: ${itemCaption}`}
            className={`shrink-0 relative overflow-hidden rounded-[28px] snap-center select-none cursor-pointer bg-slate-900 shadow-[0_14px_30px_rgba(11,27,58,0.18)] ${cardWidth} h-[270px] sm:h-[300px] lg:h-[330px]`}
            style={{
              width: inlineStyleWidth,
              transformStyle: "preserve-3d",
              transform: isHovered
                ? "perspective(1400px) rotateY(0deg) rotateZ(0deg)"
                : "perspective(1400px) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg))",
              zIndex: isHovered ? 20 : 1,
              boxShadow: isHovered
                ? "0 24px 50px rgba(11, 27, 58, 0.35)"
                : "0 14px 30px rgba(11, 27, 58, 0.18)",
              transition:
                "width 400ms ease-out, transform 300ms ease-out, box-shadow 300ms ease-out",
            }}
          >
            {/* Blurred 35%-opacity copy of the SAME photo behind it on hover (no empty bars) */}
            <Image
              src={itemSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 240px, 440px"
              aria-hidden="true"
              className={`object-cover blur-2xl scale-110 select-none pointer-events-none transition-opacity duration-300 ${
                isHovered ? "opacity-35" : "opacity-0"
              }`}
            />

            {/* Foreground image: object-cover normally, switches to object-contain on hover */}
            <Image
              src={itemSrc}
              alt={itemCaption}
              fill
              priority={idx < 8}
              sizes="(max-width: 768px) 240px, 440px"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth > img.naturalHeight * 1.15) {
                  setAspects((prev) => ({ ...prev, [itemId]: "landscape" }));
                }
              }}
              className={`transition-all duration-400 ${
                isHovered
                  ? "object-contain p-2 z-10"
                  : "object-cover object-center"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
