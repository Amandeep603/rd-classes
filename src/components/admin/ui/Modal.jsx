"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidth} rounded-[24px] bg-white p-6 shadow-2xl border border-black/5 z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-[#111827]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#9CA3AF] hover:bg-black/5 hover:text-[#111827] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
