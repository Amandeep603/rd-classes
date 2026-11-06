"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function GalleryStrip({
  items = [],
  stripRef,
  onImageClick,
  onScrollStateChange,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [isTouch, setIsTouch] = useState(false);
  const pointerStartRef = useRef(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  // Report scroll bounds for header arrows
  const handleScroll = () => {
    const strip = stripRef.current;
    if (!strip || !onScrollStateChange) return;
    const atStart = strip.scrollLeft <= 15;
    const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 15;
    onScrollStateChange({ atStart, atEnd });
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const strip = stripRef.current;
    if (!strip) return;
    const step = 260;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      strip.scrollBy({ left: -step, behavior: "smooth" });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      strip.scrollBy({ left: step, behavior: "smooth" });
    }
  };

  // Drag to scroll for mouse
  const handleMouseDown = (e) => {
    pointerStartRef.current = {
      startX: e.pageX - stripRef.current.offsetLeft,
      scrollLeft: stripRef.current.scrollLeft,
      isDown: true,
    };
  };

  const handleMouseMove = (e) => {
    if (!pointerStartRef.current?.isDown) return;
    e.preventDefault();
    const x = e.pageX - stripRef.current.offsetLeft;
    const walk = (x - pointerStartRef.current.startX) * 1.5;
    stripRef.current.scrollLeft = pointerStartRef.current.scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (pointerStartRef.current) {
      pointerStartRef.current.isDown = false;
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={() => {
        handleMouseUpOrLeave();
        setHoveredId(null);
      }}
      className="w-full flex items-center overflow-x-auto scroll-smooth no-scrollbar custom-scroller outline-none py-10 px-4 sm:px-8 [perspective:1200px]"
      style={{
        gap: "18px",
        cursor: pointerStartRef.current?.isDown ? "grabbing" : "grab",
      }}
    >
      {items.map((item, idx) => {
        const itemId = item._id || item.id || `gallery-${idx}`;
        const itemSrc = item.imageUrl || item.image || item.src;
        const itemCaption = item.caption || item.title || "Classroom celebration snapshot";
        const isHovered = !isTouch && hoveredId === itemId;

        // Base 3D tilt: cards slant gently (left ones slightly positive, right ones negative or constant -8deg)
        const baseRotateY = idx % 2 === 0 ? -7 : -5;
        const rotateY = isHovered ? 0 : baseRotateY;

        return (
          <div
            key={itemId}
            onMouseEnter={() => !isTouch && setHoveredId(itemId)}
            onMouseLeave={() => !isTouch && setHoveredId(null)}
            onClick={() => onImageClick?.(idx)}
            role="button"
            tabIndex={0}
            aria-label={`View photo: ${itemCaption}`}
            className="shrink-0 relative overflow-hidden rounded-[26px] bg-slate-200 shadow-md cursor-pointer select-none transition-all duration-400 ease-out"
            style={{
              width: isHovered ? "clamp(300px, 32vw, 360px)" : "clamp(170px, 16vw, 210px)",
              height: isHovered ? "clamp(340px, 34vw, 380px)" : "clamp(300px, 30vw, 330px)",
              transform: `perspective(1200px) rotateY(${rotateY}deg)`,
              zIndex: isHovered ? 30 : 10,
              boxShadow: isHovered
                ? "0 25px 50px -12px rgba(11, 27, 58, 0.45)"
                : "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Blurred background copy of photo when hovered or for safe framing */}
            <Image
              src={itemSrc}
              alt=""
              fill
              priority={idx < 6}
              sizes="(max-width: 768px) 240px, 400px"
              aria-hidden="true"
              className={`object-cover blur-xl scale-110 select-none pointer-events-none transition-opacity duration-300 ${
                isHovered ? "opacity-45" : "opacity-0"
              }`}
            />

            {/* Foreground image: object-cover by default, switches to object-contain on hover to show FULL photo */}
            <Image
              src={itemSrc}
              alt={itemCaption}
              fill
              priority={idx < 6}
              sizes="(max-width: 768px) 240px, 400px"
              className={`transition-all duration-400 ${
                isHovered ? "object-contain p-2 z-10" : "object-cover group-hover:scale-105"
              }`}
            />

            {/* Subtle bottom vignette with caption on hover */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 transition-opacity duration-300 z-20 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                {itemCaption}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
