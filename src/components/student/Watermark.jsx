"use client";

import { useEffect, useState } from "react";
import { STUDENT_CONFIG } from "@/constants/student.js";

export default function Watermark({ studentName, loginId, text }) {
  const [position, setPosition] = useState({ top: "20%", left: "20%" });

  useEffect(() => {
    if (!STUDENT_CONFIG.watermarkEnabled) return;

    const moveWatermark = () => {
      // Keep within 10% to 80% to ensure watermark stays visible in player canvas
      const top = Math.floor(10 + Math.random() * 70);
      const left = Math.floor(10 + Math.random() * 70);
      setPosition({ top: `${top}%`, left: `${left}%` });
    };

    const interval = setInterval(
      moveWatermark,
      STUDENT_CONFIG.watermarkIntervalMs || 8000
    );

    return () => clearInterval(interval);
  }, []);

  if (!STUDENT_CONFIG.watermarkEnabled) return null;

  const displayText =
    text ||
    (studentName && loginId
      ? `${studentName} · ${loginId}`
      : studentName || loginId || "RD Classes Preview");

  return (
    <div
      aria-hidden="true"
      style={{
        top: position.top,
        left: position.left,
        opacity: STUDENT_CONFIG.watermarkOpacity || 0.14,
        transition: "top 1s ease-in-out, left 1s ease-in-out",
      }}
      className="absolute pointer-events-none select-none z-30 font-mono text-xs sm:text-sm font-bold text-white tracking-wider whitespace-nowrap drop-shadow"
    >
      {displayText}
    </div>
  );
}
