"use client";

import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        {isDestructive && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDF2F2] text-[#DC2626]">
            <AlertTriangle className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-[#374151] hover:bg-black/5 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-colors disabled:opacity-50 ${
            isDestructive
              ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              : "bg-[#FFC21A] text-neutral-900 hover:bg-[#E5AE17]"
          }`}
        >
          {isLoading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
