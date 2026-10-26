"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to target value once when 40% visible.
 * Preserves SSR final value for SEO and no-JS.
 * Respects document.documentElement.dataset.motion.
 */
export default function CountUp({ value, suffix = "", className = "" }) {
  const containerRef = useRef(null);
  
  const numValue =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;

  const formattedFinal =
    (numValue > 0 ? numValue.toLocaleString("en-US") : String(value || "0")) +
    (suffix || "");

  const [displayValue, setDisplayValue] = useState(formattedFinal);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Check for reduced motion mode from document dataset
    const isReducedMotion =
      document.documentElement.dataset.motion === "reduce" ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        process.env.NEXT_PUBLIC_FORCE_MOTION !== "1");

    if (isReducedMotion || numValue <= 0) {
      setDisplayValue(formattedFinal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const startTime = performance.now();
          const duration = 1400; // 1400ms easeOutCubic

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(ease * numValue);

            setDisplayValue(currentCount.toLocaleString("en-US") + suffix);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(formattedFinal);
            }
          };

          // Start from 0
          setDisplayValue("0" + suffix);
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [value, suffix, formattedFinal]);

  return (
    <span ref={containerRef} className={`tabular-nums ${className}`}>
      {displayValue}
    </span>
  );
}
