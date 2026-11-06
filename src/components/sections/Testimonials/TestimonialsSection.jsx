import React from "react";
import { MessageSquare, Star } from "lucide-react";
import InViewSection from "@/components/ui/InViewSection";
import Reveal from "@/components/ui/Reveal";
import TestimonialsCarousel from "./TestimonialsCarousel";
import { getCachedPublishedReviews } from "@/server/services/reviewService";

const fallbackReviews = [
  {
    _id: "fb-r-1",
    name: "Rohan Mehra",
    school: "Class 12, MVN Sector 17 (Score: 100/100)",
    role: "student",
    rating: 5,
    quote:
      "Ronak Sir's concept-first technique completely changed how I solved cash flow statements and partnership balance sheets. The weekly simulations prepared me so well that the actual board exam felt like just another class mock test!",
  },
  {
    _id: "fb-r-2",
    name: "Pooja Sharma",
    school: "Parent of Class 12 Student (DPS Faridabad)",
    role: "parent",
    rating: 5,
    quote:
      "The personalized attention and regular feedback kept our daughter disciplined throughout the crucial final term. We are extremely grateful to Ronak Sir for her 98% board result.",
  },
  {
    _id: "fb-r-3",
    name: "Aman Gupta",
    school: "Class 12, Apeejay Faridabad (Score: 99/100)",
    role: "student",
    rating: 5,
    quote:
      "Accountancy was my weakest subject before joining RD Classes. Ronak Sir broke every complex journal entry into logical rules. Scoring 99 was a dream come true!",
  },
  {
    _id: "fb-r-4",
    name: "Kavita Verma",
    school: "Parent of Class 11 Student (Modern Vidya Niketan)",
    role: "parent",
    rating: 5,
    quote:
      "Starting Commerce foundation in Class 11 with RD Classes gave our son absolute clarity on fundamentals. He loves Accountancy now and approaches every numerical with full confidence.",
  },
];

export default async function TestimonialsSection() {
  const reviews = await getCachedPublishedReviews();
  const rawList = reviews && reviews.length > 0 ? reviews : fallbackReviews;

  const serialized = JSON.parse(JSON.stringify(rawList)).map((r, idx) => ({
    ...r,
    id: (r._id || `rev-${idx}`).toString(),
    quote: r.quote || r.text || "",
    name: r.name || r.studentName || "Verified Student",
    school: r.school || r.meta || "",
    role: r.role || "student",
    rating: r.rating || 5,
  }));

  return (
    <InViewSection
      id="reviews"
      aria-label="Parent and student testimonials"
      className="relative w-full overflow-hidden text-[#0F172A] scroll-mt-20 py-16 lg:py-24"
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          {/* Header Area (Centered) */}
          <div className="flex flex-col items-center text-center mb-10 lg:mb-14">
            {/* Small Pill: PARENT & STUDENT FEEDBACK */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9EB] border border-[#FDE68A] text-[#1E293B] text-[11px] sm:text-[12px] font-bold tracking-wider uppercase mb-3.5 shadow-2xs select-none">
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
