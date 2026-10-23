"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "",
  size = "md",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white font-semibold text-[#374151] transition-all hover:bg-neutral-50 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] ${
        isSmall ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} text-emerald-600`} />
          <span className="text-emerald-700">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className={`${isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} text-[#6B7280]`} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
