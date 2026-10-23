import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "yellow",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
  }[size] || "px-4 py-2 text-sm rounded-xl gap-2";

  const variantClasses = {
    yellow:
      "bg-[#FFC21A] hover:bg-[#F0B30E] text-[#0A0A0B] shadow-sm hover:shadow active:scale-[0.99] focus-visible:ring-[#FFC21A]",
    outline:
      "bg-white hover:bg-gray-50 text-[#1F2937] border border-[#E5E7EB] shadow-xs active:scale-[0.99] focus-visible:ring-gray-300",
    "soft-green":
      "bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] focus-visible:ring-emerald-400",
    "soft-red":
      "bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] focus-visible:ring-red-400",
    ghost:
      "bg-transparent hover:bg-black/5 text-[#4B5563] hover:text-[#111827] focus-visible:ring-gray-200",
  }[variant] || "bg-[#FFC21A] text-[#0A0A0B]";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
