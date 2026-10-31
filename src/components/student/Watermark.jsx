"use client";

import { useEffect, useRef, memo } from "react";

function Watermark({
  studentName,
  loginId,
  phone,
  text,
  isFreePreview = false,
}) {
  const elRef = useRef(null);

  useEffect(() => {
    const moveWatermark = () => {
      if (!elRef.current) return;
      // Keep within 12% to 75% to ensure watermark stays well within video viewable area
      const top = Math.floor(12 + Math.random() * 60);
      const left = Math.floor(10 + Math.random() * 60);
      elRef.current.style.top = `${top}%`;
      elRef.current.style.left = `${left}%`;
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
      ref={elRef}
      aria-hidden="true"
      style={{
        top: "25%",
        left: "25%",
        opacity: 0.16,
        transition: "top 1.2s ease-in-out, left 1.2s ease-in-out",
      }}
      className="absolute pointer-events-none select-none z-30 font-mono text-xs sm:text-sm font-extrabold text-white tracking-widest whitespace-nowrap drop-shadow"
    >
      {displayText}
    </div>
  );
}

export default memo(Watermark);
