"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Plus, Upload, User } from "lucide-react";

export default function AdminWelcomeBanner({
  adminName = "Ronak Sir",
}) {
  // Extract first name and add "Sir" if admin role / name format
  const rawClean = (adminName || "Ronak").replace(/Sir/gi, "").trim();
  const firstName = rawClean.split(" ")[0] || "Ronak";
  const titleName = `${firstName} Sir`;

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-[#F6DFA0] p-6 sm:p-8 lg:px-10 lg:py-6 shadow-xs mb-6"
      style={{
        background: "linear-gradient(90deg, #FFF7EB 0%, #FFEED9 100%)",
        minHeight: "200px",
      }}
    >
      {/* MIDDLE-RIGHT Photo: desk, books, and pen cup (fading into banner on left) */}
      <div
        className="absolute right-[216px] top-0 bottom-0 w-[280px] xl:w-[350px] pointer-events-none hidden md:block overflow-hidden"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 20%, rgba(0, 0, 0, 1) 75%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 20%, rgba(0, 0, 0, 1) 75%)",
        }}
      >
        <Image
          src="/images/admin/banner-desk.webp"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 h-full">
        {/* LEFT: Management Console Pill, Heading, Paragraph */}
        <div className="space-y-2.5 max-w-[560px]">
          {/* Small pill with sparkle */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>RD Classes Management Console</span>
          </div>

          {/* Heading on ONE line with amber/gold color */}
          <h1
            className="font-extrabold tracking-tight text-[#111827] leading-tight whitespace-nowrap"
            style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}
          >
            Welcome back,{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {titleName}
            </span>
          </h1>

          {/* Subtitle / Paragraph */}
          <p className="text-sm sm:text-[15px] text-[#4B5563] leading-relaxed max-w-[560px]">
            Monitor enrolled toppers, approve device clearance requests, and manage public syllabus updates in real time.
          </p>
        </div>

        {/* FAR RIGHT: THREE buttons stacked vertically (190px equal width, 12px gap, vertically centered) */}
        <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-3 shrink-0 self-start lg:self-center z-10 w-full sm:w-auto">
          {/* 1. Add Student */}
          <Link
            href="/admin/students?add=1"
            className="flex h-[42px] w-full sm:w-[190px] items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-sm font-bold text-[#111827] shadow-xs hover:bg-[#F0AD00] transition-all active:scale-98 cursor-pointer select-none"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Student</span>
          </Link>

          {/* 2. Upload Photo */}
          <Link
            href="/admin/gallery?upload=1"
            className="flex h-[42px] w-full sm:w-[190px] items-center justify-center gap-2 rounded-xl bg-white border border-[#E5E7EB] text-sm font-bold text-[#111827] shadow-xs hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all active:scale-98 cursor-pointer select-none"
          >
            <Upload className="h-4 w-4 stroke-[2.2]" />
            <span>Upload Photo</span>
          </Link>

          {/* 3. Add Topper */}
          <Link
            href="/admin/toppers?add=1"
            className="flex h-[42px] w-full sm:w-[190px] items-center justify-center gap-2 rounded-xl bg-white border border-[#E5E7EB] text-sm font-bold text-[#111827] shadow-xs hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all active:scale-98 cursor-pointer select-none"
          >
            <User className="h-4 w-4 stroke-[2.2]" />
            <span>Add Topper</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
