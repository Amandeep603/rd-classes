"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, Play } from "lucide-react";
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
  const [visibleCount, setVisibleCount] = useState(14);

  const hasItems = initialItems.length > 0;
  // If no items in database, display the 7 pastel placeholder tiles from Reference Image 2
  const displayItems = hasItems ? initialItems.slice(0, visibleCount) : MOSAIC_PATTERN;

  return (
    <div className="w-full">
      {/* Mosaic Grid */}
      <div className="grid grid-cols-12 gap-4 sm:gap-5 w-full">
        {displayItems.map((item, index) => {
          const patternConfig = MOSAIC_PATTERN[index % MOSAIC_PATTERN.length];
          const isVideo =
            item.type === "video" ||
            item.mediaType === "video" ||
            Boolean((item.url || item.imageUrl)?.match(/\.(mp4|mov|m4v|webm)$/i));

          const imgSrc =
            item.posterUrl ||
            item.imageUrl ||
            item.image ||
            item.src ||
            (isVideo && item.url ? item.url.replace(/\.[^/.]+$/, ".jpg") : item.url);

          const hasMedia = Boolean(imgSrc || item.url);
          const caption = item.caption || item.title || "";

          return (
            <div
              key={item._id || item.id || `tile-${index}`}
              role={hasMedia ? "button" : undefined}
              tabIndex={hasMedia ? 0 : undefined}
              aria-label={hasMedia ? (caption || `View classroom moment ${index + 1}`) : undefined}
              onClick={() => hasMedia && setLightboxIndex(index)}
              onKeyDown={(e) => {
                if (hasMedia && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setLightboxIndex(index);
                }
              }}
              className={`group relative overflow-hidden rounded-3xl transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 ${
                patternConfig.span
              } ${patternConfig.height} ${
                hasMedia
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl shadow-xs"
                  : "cursor-default"
              }`}
              style={{
                backgroundColor: patternConfig.defaultBg,
              }}
            >
              {hasMedia ? (
                <>
                  <Image
                    src={imgSrc}
                    alt={caption || `Classroom moment ${index + 1}`}
                    fill
                    priority={index < 4}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                    className="object-cover object-center"
                  />

                  {/* If video: small play icon badge in the center */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/25 shadow-lg group-hover:scale-110 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* If video: badge in bottom-left */}
                  {isVideo && (
                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs border border-white/20 shadow-md">
                      <Play className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Video</span>
                    </div>
                  )}

                  {/* Dark gradient and caption on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 sm:p-6 z-20">
                    <div className="flex items-center justify-between text-white">
                      <p className="text-sm sm:text-base font-bold line-clamp-2 drop-shadow-sm">
                        {caption || (isVideo ? "Classroom Video" : "Classroom moments & celebrations")}
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
            onClick={() => setVisibleCount((prev) => prev + 14)}
            className="px-8 py-3.5 rounded-full bg-white border border-[#E2E8F0] text-[#0B1B3A] font-extrabold text-sm shadow-sm hover:shadow-md hover:bg-slate-50 transition-all cursor-pointer"
          >
            Load More Photos &amp; Videos ({initialItems.length - visibleCount} remaining)
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
