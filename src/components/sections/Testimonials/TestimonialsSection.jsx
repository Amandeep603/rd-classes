import React from "react";
import { MessageSquare, Star } from "lucide-react";
import InViewSection from "@/components/ui/InViewSection";
import Reveal from "@/components/ui/Reveal";
import TestimonialsCarousel from "./TestimonialsCarousel";
import { getCachedPublishedReviews } from "@/server/services/reviewService";

export default async function TestimonialsSection() {
  const reviews = await getCachedPublishedReviews();

  if (!reviews || reviews.length === 0) {
    return null; // Requirement: "Do NOT prefill any review. If fewer reviews exist, the carousel still works. Only published reviews."
  }

  const serialized = JSON.parse(JSON.stringify(reviews)).map((r, idx) => ({
    ...r,
    id: r._id.toString(),
    quote: r.quote || r.text || "",
    name: r.name || r.studentName || "Anonymous",
    school: r.school || r.meta || "",
    role: r.role || "student",
    rating: r.rating || 5,
  }));

  return (
    <InViewSection
      id="reviews"
      aria-label="Parent and student testimonials"
      className="relative w-full overflow-hidden text-[#0F172A] scroll-mt-20 py-12 sm:py-16 lg:py-20"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          {/* Header Area (Centered) */}
          <div className="flex flex-col items-center text-center mb-10 lg:mb-14">
            {/* Small Pill: PARENT & STUDENT FEEDBACK */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9EB] border border-[#FDE68A] text-[#1E293B] text-[11px] sm:text-[12px] font-bold tracking-wider uppercase mb-3.5 shadow-2xs">
              <MessageSquare className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>PARENT &amp; STUDENT FEEDBACK</span>
            </div>

            {/* Title */}
            <h2
              className="font-extrabold text-[#0B1B3B] tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(28px, 3.4vw, 44px)" }}
            >
              What Students &amp; Parents{" "}
              <span className="relative inline-block px-1">
                <span
                  className="absolute inset-x-0 bottom-1 h-[42%] bg-[#FFB800] -z-10 rounded-xs"
                  aria-hidden="true"
                />
                Say
              </span>
            </h2>

            {/* Subtitle */}
            <p
              className="mt-3 text-[15px] sm:text-[17px] text-[#5F6A7A] font-normal leading-[1.6] text-center mx-auto max-w-[92%] sm:max-w-[760px]"
              style={{ textWrap: "balance" }}
            >
              Real experiences from Class 11 and 12 Commerce students and parents who trusted Ronak Sir&apos;s concept-first methodology.
            </p>

            {/* Rating Stat Row */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-[13px] font-semibold text-[#0F172A]">
              <span className="font-bold text-[#0B1B3B]">4.9 / 5.0</span>
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800]" />
                ))}
              </div>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#64748B] font-medium">
                {serialized.length} Verified Review{serialized.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Reveal>

        {/* Carousel */}
        <Reveal delay={0.1}>
          <TestimonialsCarousel testimonials={serialized} />
        </Reveal>
      </div>
    </InViewSection>
  );
}
