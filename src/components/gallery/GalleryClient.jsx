"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, X, Camera, Sparkles } from "lucide-react";

export default function GalleryClient({ items = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-14 text-center max-w-lg mx-auto">
        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-800">Gallery Updating Soon</h3>
        <p className="text-xs text-gray-500 mt-1">
          Classroom memories, seminar snapshots and felicitation ceremonies will be uploaded shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, idx) => (
          <div
            key={item._id.toString()}
            onClick={() => setSelectedImage(item)}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-black/8 bg-white shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
              <Image
                src={item.imageUrl || item.image}
                alt={item.caption || item.title || "Classroom moment"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>View</span>
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-extrabold text-[#0B1B3B] group-hover:text-[#1593C9] transition-colors line-clamp-2">
                {item.caption || item.title || "Classroom & Seminar Moments"}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-gray-400 pt-2 border-t border-gray-100">
                <span className="inline-flex items-center gap-1 text-[#F59E0B]">
                  <Sparkles className="h-3 w-3" />
                  <span>RD Classes</span>
                </span>
                <span>#{idx + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors z-20"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.imageUrl || selectedImage.image}
              alt={selectedImage.caption || "Classroom enlarged"}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl"
            />
            {selectedImage.caption && (
              <div className="p-4 text-center bg-black/70 backdrop-blur-xs text-white text-xs sm:text-sm font-semibold">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
