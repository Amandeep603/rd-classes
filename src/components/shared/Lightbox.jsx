"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({
  isOpen,
  onClose,
  items = [],
  currentIndex = 0,
  onIndexChange,
}) {
  const n = items.length;
  const currentItem = items[currentIndex] || items[0] || null;

  const handlePrev = useCallback(() => {
    if (n <= 1) return;
    onIndexChange?.((currentIndex - 1 + n) % n);
  }, [currentIndex, n, onIndexChange]);

  const handleNext = useCallback(() => {
    if (n <= 1) return;
    onIndexChange?.((currentIndex + 1) % n);
  }, [currentIndex, n, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentItem) return null;

  const imageSrc =
    currentItem.imageUrl || currentItem.image || currentItem.src || currentItem.url;
  const caption = currentItem.caption || currentItem.title || "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {n > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image container */}
      <div
        className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-[85vw] max-w-5xl h-[75vh]">
          <Image
            src={imageSrc}
            alt={caption || "Classroom moment enlarged"}
            fill
            priority
            sizes="90vw"
            className="object-contain"
          />
        </div>

        {/* Caption */}
        {caption && (
          <div className="mt-3 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm text-center text-sm font-medium text-slate-200 max-w-xl">
            {caption}
          </div>
        )}

        {/* Counter */}
        {n > 1 && (
          <div className="mt-1 text-xs text-slate-400 font-mono">
            {currentIndex + 1} / {n}
          </div>
        )}
      </div>

      {/* Next button */}
      {n > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
