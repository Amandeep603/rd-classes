import React from "react";

export default function SectionHeader({
  pillText,
  pillIcon: PillIcon,
  pillClassName = "",
  title,
  highlight,
  subtitle,
  theme = "light", // "light" | "dark"
  align = "center", // "center" | "left"
  sparkRays = false,
  actions,
  className = "",
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`w-full ${
        align === "center"
          ? "flex flex-col items-center text-center"
          : "flex flex-col md:flex-row md:items-end justify-between gap-6"
      } ${className}`}
    >
      <div className={`flex flex-col ${align === "center" ? "items-center" : "items-start"} max-w-3xl`}>
        {/* Pill Badge */}
        {pillText && (
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 shadow-2xs select-none ${
              pillClassName ||
              (isDark
                ? "bg-[#181008] border border-[#FF7A00]/40 text-[#FF9E3B]"
                : "bg-[#FFF9EB] border border-[#FDE68A] text-[#92400E]")
            }`}
          >
            {PillIcon && <PillIcon className="w-3.5 h-3.5" />}
            <span>{pillText}</span>
          </div>
        )}

        {/* Title with Gradient Highlight Bar */}
        <h2
          className={`font-black tracking-tight leading-[1.12] text-3xl sm:text-4xl lg:text-[44px] relative ${
            isDark ? "text-white" : "text-[#0B1B3A]"
          }`}
        >
          {title}{" "}
          {highlight && (
            <span className="relative inline-block px-1 whitespace-nowrap">
              {/* Highlight Background Bar */}
              <span
                className="absolute inset-x-0 bottom-1.5 h-[42%] bg-gradient-to-r from-[#FFB800] to-[#FF6B00] -z-10 rounded-xs opacity-90 -rotate-1"
                aria-hidden="true"
              />
              {highlight}
            </span>
          )}

          {/* Spark rays decoration near top right of heading */}
          {sparkRays && (
            <span
              className="absolute -top-3.5 -right-6 hidden sm:inline-flex items-center gap-1 select-none pointer-events-none"
              aria-hidden="true"
            >
              <span className="w-1 h-3 rounded-full bg-[#FF7A00] rotate-[-25deg] block" />
              <span className="w-1 h-4 rounded-full bg-[#FFB800] rotate-[5deg] block" />
              <span className="w-1 h-3 rounded-full bg-[#FF7A00] rotate-[35deg] block" />
            </span>
          )}
        </h2>

        {/* Subtitle / Paragraph */}
        {subtitle && (
          <p
            className={`mt-3.5 text-base sm:text-lg leading-relaxed font-normal max-w-2xl ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Optional right-side actions (e.g. arrow buttons) */}
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

