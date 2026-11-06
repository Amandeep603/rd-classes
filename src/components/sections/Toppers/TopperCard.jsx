"use client";

import React from "react";
import { Trophy } from "lucide-react";
import StudentPhoto from "@/components/shared/StudentPhoto";

export default function TopperCard({ topper, isFeatured, onClick }) {
  const photo = topper.photoUrl || topper.photo || "";
  const score = topper.marks || topper.score || "98";
  const outOf = topper.outOf || 100;
  const examYear = topper.year || topper.examYear || "2025";
  const name = topper.name || "Student Name";
  const school = topper.school || "School Name";

  return (
    <div
      onClick={onClick}
      role="group"
      aria-label={`${name}, scored ${score} out of ${outOf}`}
      className={`relative w-full max-w-[245px] rounded-[26px] p-3 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all duration-500 ease-out bg-gradient-to-b from-[#10244A] to-[#0A1730] ${
        isFeatured
          ? "border-2 border-[#FF7A00] shadow-[0_0_35px_rgba(255,122,0,0.35)] scale-110 z-10"
          : "border-2 border-[#1E3A8A] scale-95 lg:scale-100 z-0 opacity-90 hover:opacity-100"
      }`}
    >
      {/* 1. Exam Pill "CBSE {examYear}" */}
      <div className="flex justify-center items-center pt-0.5">
        <span
          className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider select-none transition-colors ${
            isFeatured
              ? "bg-[#FF7A00] text-black shadow-xs"
              : "bg-[#0B1E36] text-slate-300 border border-slate-700/60"
          }`}
        >
          CBSE {examYear}
        </span>
      </div>

      {/* 2. Photo Frame: Plain rounded-2xl box with aspect-[4/4.4] */}
      <div className="relative w-full aspect-[4/4.4] rounded-2xl overflow-hidden bg-slate-900/60 shadow-inner mt-2.5">
        {topper.isPlaceholder || (!photo && !topper.photoUrl) ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#0D1C30] to-[#071322] p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300 leading-tight">
              Topper photo<br />coming soon
            </span>
          </div>
        ) : (
          <StudentPhoto
            src={photo}
            alt={name}
            aspectRatio="h-full w-full"
            priority={isFeatured}
          />
        )}
      </div>

      {/* 3. ONE Circular Score Badge Overlapping the photo bottom edge */}
      <div className="flex justify-center -mt-6 sm:-mt-7 z-20 pointer-events-none">
        <div
          className={`rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
            isFeatured
              ? "w-[60px] h-[60px] bg-gradient-to-b from-[#FF7A00] to-[#E55300] border-2 border-white text-white shadow-orange-500/40"
              : "w-[52px] h-[52px] bg-gradient-to-b from-[#0F223D] to-[#081526] border-2 border-[#3B82F6] text-white shadow-md"
          }`}
        >
          <span className={`font-black leading-none ${isFeatured ? "text-xl sm:text-2xl" : "text-lg"}`}>
            {score}
          </span>
          <span className="text-[10px] font-bold text-white/80 leading-none mt-0.5">
            /{outOf}
          </span>
        </div>
      </div>

      {/* 4. Student Name & 5. School Name */}
      <div className="mt-2.5 mb-1 px-1 text-center flex flex-col items-center w-full">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-full">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-300 font-normal truncate max-w-full mt-0.5">
          {school}
        </p>
      </div>
    </div>
  );
}
