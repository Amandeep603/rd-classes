"use client";

import { useEffect } from "react";

/**
 * Lightweight scroll reveal helper:
 * - Uses standard IntersectionObserver
 * - Zero external animation libraries
 * - Honours prefers-reduced-motion
 * - All content remains visible if JavaScript is disabled
 */
export default function AboutScrollReveal() {
  useEffect(() => {
    // Check for prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const revealElements = document.querySelectorAll("[data-reveal]");
    if (!revealElements.length) return;

    // Mark html with class to enable subtle initial translateY/opacity via CSS
    document.documentElement.classList.add("about-anim-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("about-anim-ready");
    };
  }, []);

  return null;
}

