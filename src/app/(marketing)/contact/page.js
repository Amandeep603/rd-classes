import { GraduationCap, FileText, MessageSquare } from "lucide-react";
import ContactFormClient from "@/components/contact/ContactFormClient";
import ContactLocationCard from "@/components/contact/ContactLocationCard";
import ContactDecoration from "@/components/contact/ContactDecoration";

export const metadata = {
  title: "Contact Us | RD Classes Sector 9, Faridabad",
  description:
    "Have a question about courses, admissions, or fees? Send us a message or visit our centre at Sector 9 Market, Faridabad.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#0F172A] relative overflow-x-hidden pt-6 sm:pt-10 pb-16 sm:pb-24">
      {/* Decorative Background Elements */}
      {/* Soft yellow glow on far left */}
      <div
        aria-hidden="true"
        className="w-72 h-72 rounded-full bg-[#FEF3C7]/40 blur-3xl absolute top-32 -left-20 pointer-events-none -z-10"
      />

      {/* Soft light-blue glow on right */}
      <div
        aria-hidden="true"
        className="w-96 h-96 rounded-full bg-[#E0F2FE]/50 blur-3xl absolute top-20 right-0 pointer-events-none -z-10"
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* TOP SECTION: Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start relative">
          {/* LEFT COLUMN: Headings, intro & contact points */}
          <div className="lg:col-span-5 relative pt-2 sm:pt-4">
            {/* Subtle Yellow Dot Grid Pattern */}
            <div
              aria-hidden="true"
              className="absolute -top-3 -left-6 grid grid-cols-4 gap-3.5 opacity-40 pointer-events-none select-none -z-10"
            >
              {[...Array(20)].map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              ))}
            </div>

            {/* Top Label with Yellow Line */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-8 h-[3px] bg-[#FFB800] rounded-full inline-block" />
              <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#64748B] uppercase">
                Contact Us
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.12]">
              We&apos;re Here{" "}
              <span className="text-[#FFB800] block sm:inline lg:block">
                to Help You.
              </span>
            </h1>

            {/* Intro Paragraph */}
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mt-4 sm:mt-5 max-w-lg">
              Have a question about our courses, admissions, results, or anything
              else? Reach out to us — we&apos;ll be happy to assist you.
            </p>

            {/* 3 Contact Support Highlights */}
            <div className="mt-8 sm:mt-10 space-y-5 sm:space-y-6">
              {/* Highlight 1: Academic Guidance */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3D]">
                    Academic Guidance
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    Get help choosing the right course for your goals.
                  </p>
                </div>
              </div>

              {/* Highlight 2: Admissions Support */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3D]">
                    Admissions Support
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    Information about batches, fees, and enrollment.
                  </p>
                </div>
              </div>

              {/* Highlight 3: General Queries */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3D]">
                    General Queries
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                    We&apos;re just a message away.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Form card, handwritten note, and plant/books decoration */}
          <div className="lg:col-span-7 relative">
            {/* Soft decorative light blue circle behind right card */}
            <div
              aria-hidden="true"
              className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#E0F2FE]/70 absolute -top-8 -right-6 pointer-events-none -z-10"
            />

            {/* Handwritten Sticky Note (Top-Right of card on desktop) */}
            <div
              aria-hidden="true"
              className="hidden md:flex flex-col items-start absolute -top-8 sm:-top-10 right-4 sm:right-6 lg:-right-4 rotate-[-4deg] select-none z-20 pointer-events-none"
            >
              <div className="font-[family-name:var(--font-caveat)] text-2xl sm:text-[28px] font-bold text-[#1E293B] leading-[1.05]">
                Learn
                <br />
                Practice
                <br />
                Score Higher
              </div>
              {/* Yellow brush stroke underline */}
              <svg
                className="w-24 h-3.5 text-[#FFB800] -mt-1 ml-2"
                viewBox="0 0 100 14"
                fill="none"
              >
                <path
                  d="M3 10C28 3 72 2 97 9"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Plant & Books Illustration (Right corner on wide screens) */}
            <ContactDecoration />

            {/* The Contact Form */}
            <ContactFormClient />
          </div>
        </div>

        {/* BOTTOM SECTION: Our Location Card with Map */}
        <ContactLocationCard />
      </div>
    </div>
  );
}
