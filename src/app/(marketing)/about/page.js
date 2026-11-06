import Link from "next/link";
import Image from "next/image";
import "./about.css";
import {
  Layers,
  FileText,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { RonakCurvedUnderline } from "@/components/about/AboutIcons";
import AboutStatsCard from "@/components/about/AboutStatsCard";

/**
 * EXACT BRAND PALETTE
 * Navy: #0B1B3A
 * Yellow: #FFC107
 * Cream Background: #FFF8F2
 */

export const metadata = {
  title: "About RD Classes | Class 11 & 12 Accountancy Faridabad",
  description:
    "CBSE Class 11 & 12 Commerce coaching in Sector 9, Faridabad by Ronak Dugar. Concept-first Accountancy pedagogy for consistent 100/100 board scores.",
  alternates: {
    canonical: "https://www.rd-classes.in/about",
  },
  openGraph: {
    title: "About RD Classes | Class 11 & 12 Accountancy Faridabad",
    description:
      "CBSE Class 11 & 12 Commerce coaching in Sector 9, Faridabad by Ronak Dugar. Concept-first Accountancy pedagogy for consistent 100/100 board scores.",
    url: "https://www.rd-classes.in/about",
    siteName: "R.D. Classes for Accountancy",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "R.D. Classes for Accountancy - Sector 9, Faridabad",
      },
    ],
  },
};

// Reusable Approach Cards Data (matching reference design: yellow icon box with dark navy icon, side-by-side title)
const approachData = [
  {
    titleLine1: "Concept-First",
    titleLine2: "Learning",
    description: "Build strong fundamentals before moving to advanced problems.",
    icon: Layers,
  },
  {
    titleLine1: "Structured",
    titleLine2: "Resources",
    description: "Exam-focused notes, formats and practice material for better clarity.",
    icon: FileText,
  },
  {
    titleLine1: "Regular",
    titleLine2: "Practice",
    description: "Weekly simulations and personalized evaluation to keep you board-ready.",
    icon: Target,
  },
];

export default function AboutPage() {
  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://www.rd-classes.in/about#webpage",
        url: "https://www.rd-classes.in/about",
        name: "About RD Classes",
        description: metadata.description,
        mainEntity: {
          "@type": "Person",
          name: "Ronak Dugar",
          jobTitle: "Founder & Lead Accountancy Faculty",
          worksFor: {
            "@type": "EducationalOrganization",
            name: "R.D. Classes for Accountancy",
            url: "https://www.rd-classes.in/",
            address: {
              "@type": "PostalAddress",
              streetAddress: "SCF 59-60, 2nd Floor, Sector 9",
              addressLocality: "Faridabad",
              addressRegion: "Haryana",
              postalCode: "121006",
              addressCountry: "IN",
            },
          },
        },
      },
    ],
  };

  return (
    <main className="about-page min-h-screen bg-[#FFF8F2] text-[#0B1B3A] font-sans antialiased overflow-x-hidden selection:bg-[#FFE6A0] selection:text-[#0B1B3A]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* =====================================================================
          1. HERO SECTION
          Compact fixed height on desktop (lg:h-[520px] xl:h-[560px]), vertically
          centered text via flex wrapper, right image with object-contain (no cropping),
          fading softly on left. Mobile image below text in aspect-[4/3] block.
          ===================================================================== */}
      <section
        aria-labelledby="about-hero-heading"
        className="relative overflow-hidden bg-[#FFF8F2] h-auto lg:h-[520px] xl:h-[560px] py-12 lg:py-0"
      >
        {/* Desktop background image: fills right side with exact aspect ratio, eliminating all box edges */}
        <div className="about-hero-image-container">
          <Image
            src="/images/about/hero-right.jpg"
            alt="Accountancy, Business Studies and Economics books"
            fill
            priority
            sizes="(min-width: 1280px) 664px, 616px"
            className="object-cover object-right about-hero-image-mask"
          />
        </div>

        {/* Flex container: vertically centers content on desktop */}
        <div className="relative mx-auto flex flex-col lg:flex-row h-full max-w-7xl items-center px-6 lg:px-12">
          {/* Left Column: Badge, Heading, Paragraph */}
          <div className="max-w-xl text-left space-y-6 relative z-10 w-full lg:w-auto">
            {/* Pill badge: ABOUT RD CLASSES */}
            <div>
              <span className="about-hero-badge inline-block px-4 py-1.5 rounded-full bg-[#FFE6A0] text-[#0B1B3A] text-xs sm:text-[13px] font-bold tracking-wider uppercase shadow-sm">
                ABOUT RD CLASSES
              </span>
            </div>

            {/* H1 Heading: More Than Just [Classes] */}
            <h1
              id="about-hero-heading"
              className="about-hero-h1 text-[#0B1B3A] font-extrabold leading-[1.05] text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span>More Than</span>
              <br />
              <span>Just</span>{" "}
              <span className="inline-block bg-[#FFC107] text-[#0B1B3A] rounded-2xl px-3.5 py-0.5 -rotate-2 transform shadow-sm">
                Classes
              </span>
            </h1>

            {/* Paragraph with 4px yellow left border and max-w-[480px] */}
            <div className="about-hero-p border-l-4 border-[#FFC107] pl-5 max-w-[480px]">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                RD Classes is Faridabad&apos;s trusted institute for CBSE Class 11 &amp; 12 Commerce, focused on making Accountancy simple, logical, and exam-ready.
              </p>
            </div>
          </div>

          {/* Mobile/Tablet image: normal block below text (below lg) */}
          <div className="relative mx-auto mt-8 aspect-[4/3] w-full max-w-md lg:hidden">
            <Image
              src="/images/about/hero-right.jpg"
              alt="Accountancy, Business Studies and Economics books"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 448px"
              className="object-contain object-center"
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. STATS CARD SECTION
          Clean separation below hero (mt-6 lg:mt-8 pb-16), no overlap, 24-32px gap.
          Interactive animated stats card with count-up & hover effects.
          ===================================================================== */}
      <section
        aria-label="Key Statistics"
        className="relative z-10 px-6 mt-6 lg:mt-8 pb-16"
      >
        <AboutStatsCard />
      </section>

      {/* =====================================================================
          3. FOUNDER SECTION (Ronak Dugar)
          Photo on LEFT, content on RIGHT, clear breathing room from center.
          Grid: md:grid-cols-[minmax(0,420px)_1fr], gap-12 lg:gap-20, items-center, max-w-6xl.
          Photo: max-w-[420px], aspect ratio 4/4.7, rounded-3xl, object-cover, shadow-xl.
          Yellow accent shape: -left-5, top-10, h-3/5, w-10, rounded-l-3xl, bg-[#FFC107].
          Padding: py-20 lg:py-28.
          ===================================================================== */}
      <section
        aria-labelledby="founder-heading"
        className="mx-auto w-full max-w-6xl px-6 lg:px-12 py-20 lg:py-28"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_1fr] gap-12 lg:gap-20 items-center">
          {/* Photo Column on LEFT */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-full max-w-[420px]">
              {/* Yellow accent shape behind photo's left side: -left-5, top-10, h-3/5, w-10, rounded-l-3xl, bg-[#FFC107] */}
              <div
                className="absolute -left-5 top-10 h-3/5 w-10 rounded-l-3xl bg-[#FFC107] z-0"
                aria-hidden="true"
              />
              {/* Photo Card: max-w-[420px], aspect-[4/4.7], rounded-3xl, object-cover, shadow-xl */}
              <div className="relative z-10 w-full aspect-[4/4.7] rounded-3xl overflow-hidden shadow-xl bg-slate-100">
                <Image
                  src="/images/about/ronak-sir.jpg"
                  alt="Ronak Dugar, Founder & Mentor"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Content Column on RIGHT */}
          <div className="w-full text-left space-y-4">
            {/* FOUNDER & MENTOR Label */}
            <div className="text-xs sm:text-sm font-bold tracking-wider text-[#0B1B3A] uppercase">
              FOUNDER &amp; MENTOR
            </div>

            {/* Name: text-5xl font-extrabold navy with yellow underline swoosh */}
            <h2
              id="founder-heading"
              className="text-4xl sm:text-5xl font-extrabold text-[#0B1B3A] leading-[1.08] tracking-tight"
            >
              <span className="relative inline-block">
                Ronak
                <span className="absolute -bottom-2 left-0 w-full" aria-hidden="true">
                  <RonakCurvedUnderline className="w-28 sm:w-32 h-3 text-[#FFC107]" />
                </span>
              </span>{" "}
              <span>Dugar</span>
            </h2>

            {/* Subline with thin divider */}
            <div className="text-base sm:text-lg text-[#3A4559] font-medium flex items-center flex-wrap gap-2.5 pt-1">
              <span>Lead Accountancy Faculty</span>
              <span className="text-slate-300 font-light" aria-hidden="true">
                |
              </span>
              <span>10+ Years of Teaching Experience</span>
            </div>

            {/* Paragraph */}
            <p className="text-base sm:text-lg leading-relaxed text-[#2B3548] font-normal pt-2">
              A passionate educator with a simple belief — Accountancy becomes easy when taught with the right approach. With years of experience and a student-first mindset, Ronak Sir has guided hundreds of students to board success and a deeper understanding of business logic.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. OUR APPROACH SECTION
          Centered header with yellow bar.
          3 cards, grid md:grid-cols-3, gap-6, rounded-3xl, p-7, soft shadow,
          hover:-translate-y-1 with bigger shadow, smooth transition.
          Light gradient background + 56px gradient icon box with white icon:
          - Concept-First: warm yellow gradient (from-[#FFF4D6] to-white), icon from-[#FFD54F] to-[#FFA000]
          - Structured: soft blue gradient (from-[#E6EEFF] to-white), icon from-[#5B8DEF] to-[#1E3A8A]
          - Regular: soft orange gradient (from-[#FFE9DC] to-white), icon from-[#FF9A62] to-[#E8590C]
          ===================================================================== */}
      <section
        aria-labelledby="approach-heading"
        className="mx-auto w-full max-w-7xl px-6 lg:px-12 py-10 lg:py-16 text-center"
      >
        {/* 40x4px yellow bar centered */}
        <div className="w-10 h-1 bg-[#FFC107] rounded-full mx-auto mb-3.5" aria-hidden="true" />

        {/* Heading */}
        <h2
          id="approach-heading"
          className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight"
        >
          Our Approach
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#2B3548] font-normal mt-2.5 max-w-xl mx-auto">
          A focused, practical and student-first learning experience.
        </p>

        {/* 3 Approach Cards matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
          {approachData.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl p-7 bg-[#FFFAF4] border border-black/[0.04] shadow-[0_4px_20px_rgba(11,27,58,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(11,27,58,0.08)] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Horizontal Header: Pale Yellow Icon Box + 2-line Title */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFE6A0] flex items-center justify-center shrink-0 shadow-xs">
                    <IconComp className="w-7 h-7 text-[#0B1B3A]" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0B1B3A] leading-tight">
                    {item.titleLine1}
                    <br />
                    {item.titleLine2}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-[15px] leading-relaxed mt-4 font-normal">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. CTA BANNER
          Navy rounded banner, proper padding, yellow left bar, "Accountancy?"
          in yellow, "Explore Courses" button vertically centered on right.
          Clean mobile stack.
          ===================================================================== */}
      <section
        aria-labelledby="cta-heading"
        className="mx-auto w-full max-w-7xl px-6 lg:px-12 py-16 lg:py-24"
      >
        <div
          className="relative overflow-hidden rounded-3xl py-10 px-8 sm:px-12 lg:px-16 text-white shadow-xl"
          style={{
            background: "linear-gradient(110deg, #0C223A 0%, #0D233B 55%, #172F47 100%)",
          }}
        >
          {/* Decorative Circles: only bottom-right arcs */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "420px",
              height: "420px",
              right: "-120px",
              bottom: "-240px",
              backgroundColor: "#1D3752",
              opacity: 0.85,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "340px",
              height: "340px",
              right: "190px",
              bottom: "-250px",
              backgroundColor: "#172F47",
              opacity: 1,
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left Content: Yellow Left Bar beside heading + text */}
            <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
              {/* Yellow vertical bar */}
              <div
                className="w-1.5 h-14 sm:h-16 bg-[#FFC107] rounded-full shrink-0 mt-1"
                aria-hidden="true"
              />
              <div>
                <h2
                  id="cta-heading"
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  <span>Ready to Build a</span>
                  <br />
                  <span>Strong Foundation in</span>{" "}
                  <span className="text-[#FFC107]">Accountancy?</span>
                </h2>
                <p className="text-white/90 text-base sm:text-lg leading-relaxed mt-3 max-w-xl">
                  Join RD Classes and learn with a structured, result-oriented approach for Class 11 &amp; 12 Commerce.
                </p>
              </div>
            </div>

            {/* Right Button: Aligned vertically centered on desktop, stacks cleanly on mobile */}
            <div className="w-full lg:w-auto shrink-0 flex items-center justify-start lg:justify-end">
              <Link
                href="/courses"
                className="about-cta-btn inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-full bg-[#FFC107] hover:bg-[#FFB300] text-[#0B1B3A] font-bold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:ring-offset-2 focus:ring-offset-[#0C223A]"
              >
                <span>Explore Courses</span>
                <ArrowUpRight className="w-5 h-5 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
