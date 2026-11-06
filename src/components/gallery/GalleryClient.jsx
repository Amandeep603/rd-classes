"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import Lightbox from "@/components/shared/Lightbox";

// Repeating 7-tile mosaic pattern from Reference Image 2:
// Row 1: span 8 + span 4 (height ~380px)
// Row 2: span 4 + span 4 + span 4 (height ~300px)
// Row 3: span 4 + span 8 (height ~260px)
const MOSAIC_PATTERN = [
  { span: "col-span-12 md:col-span-8", height: "h-[280px] sm:h-[340px] md:h-[380px]", defaultBg: "#DCE6F0" },
  { span: "col-span-12 md:col-span-4", height: "h-[280px] sm:h-[340px] md:h-[380px]", defaultBg: "#F5EBDD" },
  { span: "col-span-12 sm:col-span-6 md:col-span-4", height: "h-[240px] sm:h-[280px] md:h-[300px]", defaultBg: "#F5EBDD" },
  { span: "col-span-12 sm:col-span-6 md:col-span-4", height: "h-[240px] sm:h-[280px] md:h-[300px]", defaultBg: "#DCE6F0" },
  { span: "col-span-12 sm:col-span-6 md:col-span-4", height: "h-[240px] sm:h-[280px] md:h-[300px]", defaultBg: "#DCE6F0" },
  { span: "col-span-12 md:col-span-4", height: "h-[220px] sm:h-[250px] md:h-[260px]", defaultBg: "#DCE6F0" },
  { span: "col-span-12 md:col-span-8", height: "h-[220px] sm:h-[250px] md:h-[260px]", defaultBg: "#F5EBDD" },
];

export default function GalleryClient({ initialItems = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const hasItems = initialItems.length > 0;
  // If no items in database, display the 7 pastel placeholder tiles from Reference Image 2
  const displayItems = hasItems ? initialItems.slice(0, visibleCount) : MOSAIC_PATTERN;

  return (
    <div className="w-full">
      {/* Mosaic Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-5 w-full">
        {displayItems.map((item, index) => {
          const patternConfig = MOSAIC_PATTERN[index % MOSAIC_PATTERN.length];
          const hasImage = Boolean(item.imageUrl || item.image || item.src);
          const imgSrc = item.imageUrl || item.image || item.src;
          const caption = item.caption || item.title || "";

          return (
            <div
              key={item._id || item.id || `tile-${index}`}
              role={hasImage ? "button" : undefined}
              tabIndex={hasImage ? 0 : undefined}
              aria-label={hasImage ? (caption || `View classroom moment ${index + 1}`) : undefined}
              onClick={() => hasImage && setLightboxIndex(index)}
              onKeyDown={(e) => {
                if (hasImage && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setLightboxIndex(index);
                }
              }}
              className={`group relative overflow-hidden rounded-3xl transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                patternConfig.span
              } ${patternConfig.height} ${
                hasImage ? "cursor-zoom-in hover:shadow-xl" : "cursor-default animate-pulse"
              }`}
              style={{
                backgroundColor: patternConfig.defaultBg,
              }}
            >
              {hasImage ? (
                <>
                  <Image
                    src={imgSrc}
                    alt={caption || `Classroom moment ${index + 1}`}
                    fill
                    priority={index < 4}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-106"
                  />

                  {/* Dark gradient and caption on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 sm:p-6">
                    <div className="flex items-center justify-between text-white">
                      <p className="text-sm sm:text-base font-bold line-clamp-2 drop-shadow-sm">
                        {caption || "Classroom moments & celebrations"}
                      </p>
                      <span className="p-2 rounded-full bg-white/20 backdrop-blur-xs shrink-0 ml-3">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Pastel Placeholder tile with subtle shimmer */
                <div
                  className="w-full h-full flex items-center justify-center select-none"
                  style={{ backgroundColor: patternConfig.defaultBg }}
                >
                  <span className="sr-only">Gallery tile placeholder</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination / Load More */}
      {hasItems && initialItems.length > visibleCount && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="px-8 py-3.5 rounded-full bg-white border border-[#E2E8F0] text-[#0B1B3A] font-extrabold text-sm shadow-sm hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
          >
            Load More Photos ({initialItems.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Shared Lightbox */}
      <Lightbox
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        items={initialItems}
        currentIndex={lightboxIndex || 0}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
