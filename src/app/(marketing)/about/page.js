import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import "./about.css";
import {
  StatsGradCapIcon,
  StatsPeopleIcon,
  StatsChartIcon,
  RonakCurvedUnderline,
  ApproachLayersIcon,
  ApproachDocIcon,
  ApproachTargetIcon,
  HeroDeskArtwork,
  HeroBooksMobile,
} from "@/components/about/AboutIcons";

/**
 * SAMPLED COLOR & DESIGN TOKENS (Directly extracted from reference mockup):
 */
export const ABOUT_TOKENS = {
  pageBg: "#FDF8F2",             // Soft warm cream page background
  heroBgTop: "#FFFDF9",          // Warm cream hero gradient top
  heroBgPeach: "#FDF3EA",        // Soft peach window-lit hero mid
  heroTableWarm: "#F4EBE1",      // Warm desk base tone
  navy: "#0F233C",               // Core deep navy for headings & primary brand
  navyDark: "#000E1B",           // CTA container & deepest shadow anchor
  navyMuted: "#5F6B7A",          // Secondary slate-navy for body prose
  yellowBrand: "#FFC100",        // Vivid primary brand yellow
  yellowHighlight: "#FFC100",    // Marker highlight behind "Classes"
  chipBg: "#F6E8B9",             // Pale warm yellow pill background
  chipText: "#0F233C",           // Navy text inside chip
  barYellow: "#DEC34E",          // 3px vertical accent bar
  cardBg: "#FFFFFF",             // Pure white card background
  cardRadius: "22px",            // Stats card corner radius
  cardShadow: "0 14px 40px -10px rgba(15, 35, 60, 0.08), 0 2px 10px -2px rgba(15, 35, 60, 0.04)",
  portraitRadius: "36px",        // Founder portrait radius
  portraitYellowPanel: "#FFBF02",// Accent panel peeking out behind founder photo
  approachCardRadius: "20px",    // Approach card radius
  approachIconBoxBg: "#FFF1CC",  // Soft rounded yellow square for approach icons
  ctaRadius: "28px",             // CTA banner corner radius
  ctaNavyCircle: "#1A3252",      // Lighter decorative circles in CTA
};

/**
 * EXACT TYPED CONTENT OBJECT:
 */
export const ABOUT_CONTENT = {
  hero: {
    chip: "ABOUT RD CLASSES",
    h1Line1: "More Than",
    h1Line2Prefix: "Just ",
    h1Highlight: "Classes",
    paragraph:
      "RD Classes is Faridabad’s trusted institute for CBSE Class 11 & 12 Commerce, focused on making Accountancy simple, logical, and exam-ready.",
  },
  stats: [
    {
      id: "years",
      value: "10+ Years",
      label: "Teaching Excellence",
      icon: "cap",
    },
    {
      id: "scores",
      value: "100/100",
      label: "Century Board Scores",
      icon: "people",
    },
    {
      id: "students",
      value: "Hundreds",
      label: "of Successful Students",
      icon: "chart",
    },
  ],
  founder: {
    badge: "FOUNDER & MENTOR",
    name: "Ronak Dugar",
    underlineWord: "Ronak",
    roleLine: "Lead Accountancy Faculty | 10+ Years of Teaching Experience",
    bio: "A passionate educator with a simple belief — Accountancy becomes easy when taught with the right approach. With years of experience and a student-first mindset, Ronak Sir has guided hundreds of students to board success and a deeper understanding of business logic.",
    photoSrc: "/images/about/ronak-sir.jpg",
    photoAlt: "Ronak Dugar, Founder and Lead Accountancy Faculty",
  },
  approach: {
    heading: "Our Approach",
    subtitle: "A focused, practical and student-first learning experience.",
    cards: [
      {
        id: "concept",
        title: "Concept-First Learning",
        description: "Build strong fundamentals before moving to advanced problems.",
        icon: "layers",
      },
      {
        id: "resources",
        title: "Structured Resources",
        description: "Exam-focused notes, formats and practice material for better clarity.",
        icon: "document",
      },
      {
        id: "practice",
        title: "Regular Practice",
        description: "Weekly simulations and personalized evaluation to keep you board-ready.",
        icon: "target",
      },
    ],
  },
  cta: {
    headingLine1: "Ready to Build a",
    headingLine2Prefix: "Strong Foundation in ",
    headingHighlight: "Accountancy?",
    paragraph:
      "Join RD Classes and learn with a structured, result-oriented approach for Class 11 & 12 Commerce.",
    buttonText: "Explore Courses",
    buttonHref: "/courses",
  },
};

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

export default function AboutPage() {
  const { hero, stats, founder, approach, cta } = ABOUT_CONTENT;

  // Server-side check for founder photo existence
  const founderPhotoPath = path.join(process.cwd(), "public", "images", "about", "ronak-sir.jpg");
  const hasFounderPhoto = fs.existsSync(founderPhotoPath);

  // Structured Data (JSON-LD) with real data
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
    <main className="min-h-screen bg-[#FDF8F2] text-[#0F233C] font-sans antialiased overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* =====================================================================
          1. HERO SECTION (Full-width, warm cream-to-peach, window light bands)
          ===================================================================== */}
      <section
        aria-labelledby="about-hero-heading"
        className="relative w-full pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FDF5EB] to-[#F5EBE1]"
        style={{ minHeight: "430px" }}
      >
        {/* Subtle diagonal window-light bands across the background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 select-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-32 -left-40 w-[140%] h-[140%] bg-[linear-gradient(115deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0.6)_35%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.4)_70%,rgba(255,255,255,0)_90%)]" />
        </div>

        {/* Hero Content Container (~1000px centered) */}
        <div className="relative z-10 max-w-[1020px] mx-auto px-5 sm:px-8 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            {/* Left Content (Text) */}
            <div className="lg:col-span-7 xl:col-span-7 text-left space-y-5">
              {/* Pale Yellow Chip */}
              <div>
                <span className="about-hero-chip inline-block px-3.5 py-1.5 rounded-full bg-[#F6E8B9] text-[#0F233C] text-[11px] sm:text-xs font-bold tracking-wider uppercase border border-[#EEDB9D]/60 shadow-sm">
                  {hero.chip}
                </span>
              </div>

              {/* H1 Headline on two lines */}
              <h1
                id="about-hero-heading"
                className="about-hero-h1 text-[#0F233C] font-extrabold tracking-tight leading-[1.08] text-[40px] sm:text-[52px] lg:text-[62px]"
              >
                <span>{hero.h1Line1}</span>
                <br />
                <span>{hero.h1Line2Prefix}</span>
                <span className="relative inline-block whitespace-nowrap">
                  {/* Yellow rounded marker highlight (slightly rotated) */}
                  <span
                    className="about-highlight-sweep absolute inset-0 -inset-x-2 -inset-y-1 bg-[#FFC100] rounded-xl -rotate-1 shadow-sm"
                    aria-hidden="true"
                  />
                  <span className="relative z-10 text-[#0F233C]">{hero.h1Highlight}</span>
                </span>
              </h1>

              {/* Paragraph with 3px yellow vertical bar on left */}
              <div className="about-hero-p flex items-start gap-3.5 pt-1 max-w-lg">
                <div
                  className="w-[3px] self-stretch bg-[#DEC34E] rounded-full shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm sm:text-[15px] text-[#4A5568] leading-relaxed font-normal">
                  {hero.paragraph}
                </p>
              </div>

              {/* Mobile compact book stack below text on smaller viewports */}
              <div className="block lg:hidden pt-4">
                <HeroBooksMobile />
              </div>
            </div>

            {/* Right Side Artwork (Inline SVG/CSS scene, sits behind and beside text, bleeding off edge) */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 relative">
              <div className="w-[125%] -mr-16">
                <HeroDeskArtwork />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. STATS CARD (White rounded card overlapping hero bottom by ~40px)
          ===================================================================== */}
      <section aria-label="Key Statistics" className="relative z-20 max-w-[1000px] mx-auto px-5 sm:px-8 -mt-10 sm:-mt-12">
        <div className="about-scroll-reveal bg-white rounded-[22px] shadow-[0_14px_40px_-10px_rgba(15,35,60,0.08),0_2px_10px_-2px_rgba(15,35,60,0.04)] border border-[#F0EAE1]/80 px-6 sm:px-10 py-6 sm:py-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {stats.map((stat, idx) => (
              <div
                key={stat.id}
                className={`flex items-center gap-4 ${
                  idx === 0
                    ? "pb-4 sm:pb-0 sm:pr-6"
                    : idx === 1
                    ? "py-4 sm:py-0 sm:px-6"
                    : "pt-4 sm:pt-0 sm:pl-6"
                }`}
              >
                {/* Yellow outline icon (2px stroke) */}
                <div className="w-11 h-11 flex items-center justify-center shrink-0">
                  {stat.icon === "cap" && <StatsGradCapIcon className="w-9 h-9 text-[#FFC100]" />}
                  {stat.icon === "people" && <StatsPeopleIcon className="w-9 h-9 text-[#FFC100]" />}
                  {stat.icon === "chart" && <StatsChartIcon className="w-9 h-9 text-[#FFC100]" />}
                </div>
                <div>
                  <div className="text-2xl sm:text-[26px] font-extrabold text-[#0F233C] tracking-tight leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-[13px] text-[#5F6B7A] font-medium leading-tight mt-1.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FOUNDER SECTION (~60px below stats card)
          ===================================================================== */}
      <section
        aria-labelledby="founder-heading"
        className="relative max-w-[1000px] mx-auto px-5 sm:px-8 mt-14 sm:mt-16 lg:mt-20"
      >
        <div className="about-scroll-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Portrait Card with yellow rounded panel peeking out */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[1/1] sm:aspect-[330/310]">
              {/* Yellow rounded panel peeking behind left-bottom edge */}
              <div
                className="absolute -left-3 -bottom-3 sm:-left-4 sm:-bottom-4 w-3/4 h-3/4 bg-[#FFBF02] rounded-[36px] -z-10 shadow-sm"
                aria-hidden="true"
              />

              {/* Main Portrait Card (radius ~36px) */}
              <div className="about-founder-container relative w-full h-full rounded-[36px] overflow-hidden bg-[#0F233C] shadow-[0_16px_36px_-10px_rgba(15,35,60,0.18)] border border-[#EAE3D6]/70">
                {hasFounderPhoto ? (
                  <Image
                    src={founder.photoSrc}
                    alt={founder.photoAlt}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 360px"
                    className="about-founder-photo object-cover object-top"
                  />
                ) : (
                  /* Designed clean placeholder matching exact dimensions & radius */
                  <div className="w-full h-full bg-[#0F233C] flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFC100] to-[#E5AD00] flex items-center justify-center shadow-lg mb-3">
                      <span className="font-extrabold text-[#0F233C] text-3xl tracking-tight">RD</span>
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">Ronak Dugar</p>
                    <p className="text-xs text-[#FFC100] font-medium tracking-wide mt-0.5">
                      Founder & Mentor
                    </p>
                    <span className="mt-3 inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] text-slate-300 font-mono">
                      public/images/about/ronak-sir.jpg
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Founder Content */}
          <div className="lg:col-span-7 space-y-3.5 text-left">
            <div className="text-xs font-bold tracking-widest text-[#5F6B7A] uppercase">
              {founder.badge}
            </div>

            {/* Name with Hand-Drawn Yellow Underline under "Ronak" */}
            <div className="relative inline-block">
              <h2
                id="founder-heading"
                className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F233C] tracking-tight leading-tight"
              >
                <span className="relative inline-block">
                  Ronak
                  <span className="absolute -bottom-2.5 left-0 w-full" aria-hidden="true">
                    <RonakCurvedUnderline className="w-full h-3 text-[#FFC100]" />
                  </span>
                </span>{" "}
                <span>Dugar</span>
              </h2>
            </div>

            {/* Role & Experience */}
            <p className="text-xs sm:text-sm font-semibold text-[#0F233C]/80 pt-1">
              {founder.roleLine}
            </p>

            {/* Bio Paragraph */}
            <p className="text-sm sm:text-[15px] text-[#4A5568] leading-relaxed pt-1 font-normal">
              {founder.bio}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. OUR APPROACH SECTION (~70px below founder section)
          ===================================================================== */}
      <section
        aria-labelledby="approach-heading"
        className="relative max-w-[1000px] mx-auto px-5 sm:px-8 mt-16 sm:mt-20 lg:mt-24 text-center"
      >
        <div className="about-scroll-reveal">
          {/* Centred short yellow bar */}
          <div className="w-12 h-1 bg-[#FFC100] rounded-full mx-auto mb-3" aria-hidden="true" />

          {/* Heading */}
          <h2
            id="approach-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F233C] tracking-tight"
          >
            {approach.heading}
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5F6B7A] mt-2 max-w-xl mx-auto">
            {approach.subtitle}
          </p>
        </div>

        {/* Three Approach Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-8 sm:mt-10 text-left">
          {approach.cards.map((card, idx) => (
            <div
              key={card.id}
              className={`about-approach-card about-scroll-reveal about-card-stagger-${idx + 1} bg-white rounded-[20px] p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,35,60,0.06)] border border-[#F0EAE1]/80`}
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                {/* Soft yellow rounded-square icon box at top-left */}
                <div className="about-icon-box w-11 h-11 rounded-xl bg-[#FFF1CC] flex items-center justify-center shrink-0">
                  {card.icon === "layers" && <ApproachLayersIcon className="w-6 h-6 text-[#0F233C]" />}
                  {card.icon === "document" && <ApproachDocIcon className="w-6 h-6 text-[#0F233C]" />}
                  {card.icon === "target" && <ApproachTargetIcon className="w-6 h-6 text-[#0F233C]" />}
                </div>

                {/* Card Title beside icon */}
                <h3 className="text-base sm:text-[17px] font-bold text-[#0F233C] leading-snug">
                  {card.title}
                </h3>
              </div>

              {/* Body Text */}
              <p className="text-xs sm:text-sm text-[#5F6B7A] leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          5. CTA BANNER SECTION (~60px below approach, navy card, radius ~28px)
          ===================================================================== */}
      <section
        aria-labelledby="cta-heading"
        className="relative max-w-[1000px] mx-auto px-5 sm:px-8 mt-16 sm:mt-20 mb-20 sm:mb-24"
      >
        <div className="about-scroll-reveal relative overflow-hidden rounded-[28px] bg-[#0F233C] p-8 sm:p-10 lg:p-12 shadow-[0_20px_50px_-15px_rgba(15,35,60,0.35)] text-white">
          {/* Decorative Overlapping Circles (Bottom-Right, clipped inside card) */}
          <div
            className="absolute -bottom-24 -right-12 w-64 h-64 rounded-full bg-[#1A3252]/50 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-36 -right-24 w-80 h-80 rounded-full bg-[#1A3252]/30 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left Content */}
            <div className="space-y-3 max-w-xl text-left">
              <div className="flex items-start gap-3.5">
                {/* 3px Yellow Vertical Bar left of heading */}
                <div
                  className="w-[3px] self-stretch bg-[#FFC100] rounded-full shrink-0 mt-1"
                  aria-hidden="true"
                />
                <h2
                  id="cta-heading"
                  className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-white leading-snug"
                >
                  <span>{cta.headingLine1}</span>
                  <br />
                  <span>{cta.headingLine2Prefix}</span>
                  <span className="text-[#FFC100]">{cta.headingHighlight}</span>
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pl-4">
                {cta.paragraph}
              </p>
            </div>

            {/* Right Button */}
            <div className="w-full sm:w-auto shrink-0">
              <Link
                href={cta.buttonHref}
                className="about-cta-btn inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FFC100] hover:bg-[#E5AD00] text-[#0F233C] font-bold text-sm tracking-wide transition shadow-md min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#FFC100] focus:ring-offset-2 focus:ring-offset-[#0F233C]"
              >
                <span>{cta.buttonText}</span>
                <span className="about-cta-arrow ml-1.5 text-base" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
