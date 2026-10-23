import React from "react";

export function ProgressRing({
  percent = 0,
  percentage,
  size = 130,
  strokeWidth = 14,
  ringColor,
  color,
  trackColor = "rgba(255, 255, 255, 0.12)",
  textColor = "#FFFFFF",
  textSize,
  className = "",
}) {
  const actualPercent = percentage !== undefined ? percentage : percent;
  const actualColor = color || ringColor || "#FFC21A";
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = Math.min(100, Math.max(0, Math.round(actualPercent)));
  const offset = circumference - (validPercentage / 100) * circumference;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={actualColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          style={{ color: textColor, fontSize: textSize }}
          className="text-2xl font-extrabold tracking-tight"
        >
          {validPercentage}%
        </span>
      </div>
    </div>
  );
}

export default ProgressRing;
