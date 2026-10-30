"use client";

import { useEffect, useState } from "react";

export default function Watermark({
  studentName,
  loginId,
  phone,
  text,
  isFreePreview = false,
}) {
  const [position, setPosition] = useState({ top: "25%", left: "25%" });

  useEffect(() => {
    const moveWatermark = () => {
      // Keep within 12% to 75% to ensure watermark stays well within video viewable area
      const top = Math.floor(12 + Math.random() * 60);
      const left = Math.floor(10 + Math.random() * 60);
      setPosition({ top: `${top}%`, left: `${left}%` });
    };

    const interval = setInterval(moveWatermark, 8000);
    return () => clearInterval(interval);
  }, []);

  let displayText = "RD Classes Preview";
  if (!isFreePreview && (studentName || loginId)) {
    const phoneDigits = (phone || "").replace(/\D/g, "");
    const last4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "";
    const phonePart = last4 ? ` · ****${last4}` : "";
    displayText = `${studentName || "Student"} · ${loginId || ""}${phonePart}`;
  } else if (text) {
    displayText = text;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        top: position.top,
        left: position.left,
        opacity: 0.16,
        transition: "top 1.2s ease-in-out, left 1.2s ease-in-out",
      }}
      className="absolute pointer-events-none select-none z-30 font-mono text-xs sm:text-sm font-extrabold text-white tracking-widest whitespace-nowrap drop-shadow"
    >
      {displayText}
    </div>
  );
}
