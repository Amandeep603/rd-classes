import React from "react";

export default function IconButton({
  children,
  size = "md",
  variant = "ghost",
  className = "",
  type = "button",
  onClick,
  label,
  ...props
}) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
    circle: "w-12 h-12 rounded-full",
  }[size] || "w-10 h-10 rounded-xl";

  const variantClasses = {
    ghost: "text-gray-500 hover:text-gray-900 hover:bg-black/5",
    white: "bg-white text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-gray-900",
    yellow: "bg-[#FFC21A] text-[#0B0C0E] hover:bg-[#F0B30E]",
    dark: "bg-[#1E293B] text-white hover:bg-[#334155]",
  }[variant] || "text-gray-500 hover:text-gray-900";

  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
