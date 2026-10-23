"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Plus, Upload, Award } from "lucide-react";
import AddStudentWizard from "./AddStudentWizard";

export default function AdminWelcomeBanner({
  adminName = "Ronak Sir",
  courses = [],
}) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[22px] border border-[#F6DFA0] p-6 sm:p-8 lg:p-10 shadow-xs mb-6"
        style={{
          background: "linear-gradient(90deg, #FFF6DE 0%, #FFF1CE 100%)",
          minHeight: "195px",
        }}
      >
        {/* Background Desk Illustration / Photo on the right */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none hidden md:block"
          aria-hidden="true"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.9) 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.9) 100%)",
          }}
        >
          <Image
            src="/images/admin/banner-desk.webp"
            alt=""
            fill
            className="object-cover object-right"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            {/* Sparkle Chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>RD Classes Management Console</span>
            </div>

            {/* H1 Title with Gold Gradient Name */}
            <h1 className="text-3xl sm:text-[42px] lg:text-[46px] font-extrabold tracking-tight text-[#111827] leading-tight">
              Welcome back,{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #B7791F 0%, #E8A317 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {adminName}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-[16px] text-[#4B5563] leading-relaxed max-w-lg">
              Monitor enrolled toppers, approve device clearance requests, and manage public syllabus updates in real time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="flex h-[44px] w-[186px] items-center justify-center gap-2 rounded-2xl bg-[#FFC21A] text-sm font-extrabold text-neutral-950 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] hover:shadow-[0_6px_20px_rgba(255,194,26,0.45)] transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Wizard Modal */}
      <AddStudentWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        courses={courses}
      />
    </>
  );
}
