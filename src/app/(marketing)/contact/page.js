import { GraduationCap, FileText, MessageSquare } from "lucide-react";
import ContactFormClient from "@/components/contact/ContactFormClient";
import ContactLocationCard from "@/components/contact/ContactLocationCard";
import ContactDecoration from "@/components/contact/ContactDecoration";
import { getCachedSettings } from "@/server/services/settingService.js";

export const metadata = {
  title: "Contact Us | R.D. Classes For Accountancy Sector 9, Faridabad",
  description:
    "Have a question about courses, admissions, or fees? Send us a message or visit our centre at Sector 9 Market, Faridabad.",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const dbSetting = await getCachedSettings();

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#0F172A] relative overflow-x-hidden pt-6 sm:pt-10 pb-16 sm:pb-24">
      {/* Decorative Background Glows */}
      {/* Soft yellow glow on far left */}
      <div
        aria-hidden="true"
        className="w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#FEF3C7]/45 blur-3xl absolute top-36 -left-20 pointer-events-none -z-10"
      />

      {/* Main Container */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* TOP HERO SECTION: 3-Element Layout (Left Info, Center Form, Right Decoration) */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 xl:gap-10 relative">
          {/* 1. LEFT COLUMN: Headings, intro & contact points */}
          <div className="w-full lg:w-[38%] xl:w-[35%] shrink-0 relative pt-2 sm:pt-4">
            {/* Subtle Yellow Dot Grid Pattern */}
            <div
              aria-hidden="true"
              className="absolute -top-3 -left-5 grid grid-cols-4 gap-3.5 opacity-40 pointer-events-none select-none -z-10"
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

            {/* Main Heading with Typographic Apostrophe: We’re Here */}
            <h1 className="text-4xl sm:text-5xl lg:text-[48px] xl:text-[50px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.12]">
              We&rsquo;re Here{" "}
              <span className="text-[#FFB800] block sm:inline lg:block">
                to Help You.
              </span>
            </h1>

            {/* Intro Paragraph */}
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed mt-4 sm:mt-5 max-w-lg">
              Have a question about our courses, admissions, results, or anything
              else? Reach out to us — we&apos;ll be happy to assist you.
            </p>

            {/* 3 Contact Support Highlights with soft circular icons */}
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

          {/* 2. CENTER: Form Card (Narrower, zero overlap) */}
          <div className="w-full lg:w-[42%] xl:w-[41%] max-w-[490px] shrink-0">
            <ContactFormClient />
          </div>

          {/* 3. RIGHT: Decoration Column (Plant, books, handwritten note, blue circles OUTSIDE the card) */}
          <ContactDecoration />
        </div>

        {/* BOTTOM SECTION: Our Location Card with Map and Full Contact Details */}
        <ContactLocationCard settings={dbSetting} />
      </div>
    </div>
  );
}
