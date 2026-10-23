import React from "react";

export function ProgressBar({
  value = 0,
  max = 100,
  color = "#FFC21A",
  trackColor = "#F1F3F5",
  height = 8,
  className = "",
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div
      style={{
        height: `${height}px`,
        backgroundColor: trackColor,
      }}
      className={`w-full rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
        className="h-full rounded-full transition-all duration-700 ease-out"
      />
    </div>
  );
}

export function ProgressRing({
  percentage = 0,
  size = 130,
  strokeWidth = 14,
  ringColor = "#FFC21A",
  trackColor = "rgba(255, 255, 255, 0.12)",
  textColor = "#FFFFFF",
  className = "",
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
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
          stroke={ringColor}
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
          style={{ color: textColor }}
          className="text-2xl font-extrabold tracking-tight"
        >
          {validPercentage}%
        </span>
      </div>
    </div>
  );
}
