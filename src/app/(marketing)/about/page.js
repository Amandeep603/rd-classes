import Link from "next/link";
import { ChevronLeft, ChevronRight, Award, CheckCircle2, BookOpen, Users, Clock, ArrowRight, Sparkles } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

export const metadata = {
  title: "About Ronak Sir & RD Classes | Faridabad",
  description:
    "Learn about Ronak Dugar and the proven 3-pillar Accountancy pedagogy behind consistent 100/100 CBSE Class 11 & 12 board scores at RD Classes Sector 9, Faridabad.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pb-14 overflow-x-clip">
      {/* 1. HERO SECTION (Exact 24px desktop / 16px mobile top offset) */}
      <section className="w-full relative overflow-hidden bg-[#FBF7F0] border-b border-[#E8ECEF] pt-4 sm:pt-6 pb-7">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          {/* Breadcrumb: 13px */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[13px] text-[#556987]">
              <li className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-[#556987]" />
                <Link
                  href="/"
                  className="font-semibold text-[#556987] hover:text-[#0B1B3D] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
              </li>
              <li className="font-semibold text-[#0B1B3D]">About Us</li>
            </ol>
          </nav>

          {/* Pill */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>ABOUT RD CLASSES</span>
            </span>
          </div>

          {/* Heading */}
          <h1
            className="font-extrabold text-[#0B1B3D] tracking-tight line-clamp-2 max-w-2xl"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            Concept-First Accountancy Coaching by{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10 text-[#0B1B3D]">Ronak Sir.</span>
              <span
                className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-3.5 sm:h-4 bg-[#FFC93C] -z-0 rounded-xs"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-[620px]">
            Faridabad&apos;s premier institute for CBSE Class 11 &amp; 12 Commerce students. Founded with a single mission: turning complex accountancy rules into natural business logic.
          </p>
        </div>
      </section>

      {/* 2. MAIN CONTENT (40px desktop / 28px mobile section gap) */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 sm:pt-10 space-y-7 sm:space-y-10">
        {/* FACULTY PROFILE CARD */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#FFB800] to-[#FFE27A] p-1 shadow-sm shrink-0">
              <div className="w-full h-full rounded-full bg-[#0B2545] flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl">
                RD
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">
                Founder &amp; Mentor
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mt-0.5">
                Ronak Dugar
              </h2>
              <p className="text-sm text-[#556987] font-medium mt-1">
                Lead Accountancy Faculty · 10+ Years Teaching Experience
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto text-center shrink-0">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-xl sm:text-2xl font-black text-[#0B1B3D]">100/100</p>
              <p className="text-xs text-[#556987] font-medium mt-0.5">Century Board Scores</p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-xl sm:text-2xl font-black text-[#D97706]">10+ Yrs</p>
              <p className="text-xs text-[#556987] font-medium mt-0.5">Teaching Excellence</p>
            </div>
          </div>
        </section>

        {/* 3-PILLAR METHODOLOGY */}
        <section className="space-y-4">
          <div>
            <div className="w-8 h-1 bg-[#FFB800] rounded-full mb-2" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B1B3D]">Our 3-Pillar Pedagogy</h2>
            <p className="text-xs sm:text-sm text-[#556987] mt-1">
              How we consistently prepare students to excel without memorizing formulas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8ECEF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF5FF] text-[#0066FF] flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-[#0B1B3D]">Concept First, Rules Second</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Why is an asset debited? Why does revaluation gain belong to old partners? Every journal entry is grounded in real business transactions before book rules.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8ECEF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-[#0B1B3D]">Working Notes &amp; Formats</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                CBSE awards up to 50% marks to working notes. We train students on exact ledger formats, tabular calculations, and error-free balance sheet tallying.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E8ECEF] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-[#0B1B3D]">Weekly Sunday Simulations</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Regular 3-hour mock exams with personal handwritten evaluation eradicate exam fear and time pressure well before the actual Board examinations.
              </p>
            </div>
          </div>
        </section>

        {/* CTA CARD */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0B1B3D] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">Ready to Start Accountancy Preparation?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Explore our structured batches for Class 11 and Class 12 or connect with us on WhatsApp for fee and schedule details.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/courses"
              className="px-5 py-2.5 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0A] font-bold text-xs sm:text-sm transition-colors inline-flex items-center gap-2"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

