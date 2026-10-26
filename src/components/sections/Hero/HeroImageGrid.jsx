"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * HeroImageGrid component for RD Classes Hero section.
 * Renders the authentic, high-resolution 5-arch student showcase:
 * - Whole, uncut students with designer-crafted arch capsules
 * - Crisp on all screens, never clipped horizontally or vertically
 * - Gentle floating micro-interaction on desktop
 * - Perfectly responsive on mobile (<1024px) without squashing or disjointed elements
 */
export default function HeroImageGrid({
  isDesktop = false,
  className = "",
  style = {},
}) {
  const [offsetY, setOffsetY] = useState(0);
  const rafId = useRef(null);

  useEffect(() => {
    if (!isDesktop) return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const handleMouseMove = (e) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const ny = e.clientY / window.innerHeight - 0.5; // -0.5 to 0.5
        setOffsetY(ny * 10);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDesktop]);

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        aspectRatio: "407 / 521",
        ...style,
      }}
      aria-label="Student showcase gallery"
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-out"
        style={
          isDesktop && offsetY !== 0
            ? { transform: `translateY(${offsetY}px)` }
            : undefined
        }
      >
        <Image
          src="/images/hero/hero-students-showcase.webp"
          alt="Successful RD Classes Accountancy students preparing for board exams"
          fill
          priority
          sizes="(max-width: 640px) 360px, (max-width: 1024px) 440px, 600px"
          className="object-contain object-bottom select-none pointer-events-none drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        />
      </div>
    </div>
  );
}
