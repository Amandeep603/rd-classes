"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button";

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  showClose = true,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className={`relative w-full ${maxWidth} rounded-[22px] bg-white p-6 shadow-2xl border border-black/10 transition-all duration-200 sm:p-8 z-10`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 id="dialog-title" className="text-xl font-bold text-[#111827]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
            )}
          </div>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-full p-1.5 text-[#9CA3AF] hover:bg-neutral-100 hover:text-[#111827] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "red", // "red" | "yellow"
  loading = false,
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-[#4B5563]">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "red" ? "soft-red" : "yellow"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export default Dialog;
