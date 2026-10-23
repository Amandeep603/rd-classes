import React from "react";

export default function Badge({
  children,
  tone = "yellow",
  size = "md",
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-bold rounded-md gap-1",
    md: "px-2.5 py-1 text-xs font-bold rounded-lg gap-1.5",
    pill: "px-3 py-1 text-xs font-bold rounded-full gap-1.5",
  }[size] || "px-2.5 py-1 text-xs font-bold rounded-lg gap-1.5";

  const toneClasses = {
    yellow: "bg-[#FFF5D6] text-[#92400E] border border-[#FDE68A]",
    gold: "bg-[#FFE8A3] text-[#784D00] border border-[#FCD34D]",
    blue: "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]",
    green: "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]",
    red: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]",
    gray: "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]",
    dark: "bg-[#1E293B] text-gray-200 border border-[#334155]",
  }[tone] || "bg-[#FFF5D6] text-[#92400E]";

  return (
    <span
      className={`inline-flex items-center tracking-tight select-none ${sizeClasses} ${toneClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
