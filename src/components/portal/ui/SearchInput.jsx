"use client";

import { Search, X } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search lectures, notes, tests...",
  className = "",
  id = "portal-search",
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-4 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-[46px] w-full rounded-[23px] bg-white border border-black/8 pl-11 pr-10 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] transition-all duration-150 focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 shadow-xs"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.({ target: { value: "" } })}
          aria-label="Clear search"
          className="absolute right-3.5 flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
