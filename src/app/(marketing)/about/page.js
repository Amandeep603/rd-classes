import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import "./about.css";
import {
  SparkCluster,
  PillarBooksIcon,
  PillarNotepadIcon,
  PillarTargetIcon,
  FounderTrophyIcon,
  FounderAwardIcon,
  CtaBooksIllustration,
  DecorativeArcLeft,
  DecorativeArcRight,
} from "@/components/about/AboutIcons";

// Site-consistent Plus Jakarta Sans font loaded with bold and bold italic
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: "About R.D. Classes | Accountancy Coaching in Faridabad",
  description:
    "Learn about Ronak Dugar and the proven concept-first Accountancy pedagogy behind consistent 100/100 board scores at R.D. Classes in Sector 9, Faridabad.",
  alternates: {
    canonical: "https://www.rd-classes.in/about",
  },
  openGraph: {
    title: "About R.D. Classes | Accountancy Coaching in Faridabad",
    description:
      "Learn about Ronak Dugar and the proven concept-first Accountancy pedagogy behind consistent 100/100 board scores at R.D. Classes in Sector 9, Faridabad.",
    url: "https://www.rd-classes.in/about",
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

/**
 * PAGE DESIGN TOKENS (Sampled directly from reference mockup):
 */
export const ABOUT_TOKENS = {
  navy: "#0F2342",
  pageBg: "#FDF8F4",
  yellowBrand: "#FFC83A",
  yellowHighlight: "#FFE08A",
  chipBg: "#F5E9BD",
  bodyText: "#5F6B7A",
  bodyTextDark: "#4A5568",
  founderCardBg: "#FFFFFF",
  borderLight: "#E8ECEF",
  pillar1Bg: "bg-gradient-to-br from-[#DFEEFA] via-[#ECF5FC] to-[#F8FAFD]",
  pillar2Bg: "bg-gradient-to-br from-[#FFF0C6] via-[#FFF7DE] to-[#FFFAEE]",
  pillar3Bg: "bg-gradient-to-br from-[#E2F5E6] via-[#EDF9F0] to-[#F7FCF8]",
  ctaNavy: "#0F2342",
  ctaWedgeCream: "#F6EFE3",
};

/**
 * EXACT TYPED CONTENT OBJECT:
 */
export const ABOUT_CONTENT = {
  hero: {
    chip: "ABOUT RD CLASSES",
    titleLines: ["Concept-First", "Accountancy", "Coaching by"],
    teacherHighlight: "Ronak Sir.",
    paragraph:
      "Faridabad’s premier institute for CBSE Class 11 & 12 Commerce students. Founded with a single mission: turning complex accountancy rules into natural business logic.",
    photoSrc: "/images/about/ronak-teaching.jpg",
    photoAlt: "Ronak Sir teaching accountancy on the whiteboard",
  },
  founder: {
    avatarText: "RD",
    roleLabel: "FOUNDER & MENTOR",
    name: "Ronak Dugar",
    credentials: "Lead Accountancy Faculty • 10+ Years Teaching Experience",
    stats: [
      {
        value: "100/100",
        label: "Century Board Scores",
      },
      {
        value: "10+ Yrs",
        label: "Teaching Excellence",
      },
    ],
  },
  pillars: {
    titleLines: ["Our 3-Pillar", "Pedagogy"],
    description:
      "How we consistently prepare students to excel without memorizing formulas.",
    cards: [
      {
        id: "01",
        title: "Concept First, Rules Second",
        description:
          "Why is an asset debited? Why does revaluation gain belong to old partners? Every journal entry is grounded in real business transactions before book rules.",
        bgColor: ABOUT_TOKENS.pillar1Bg,
        badgeBg: "bg-[#EBF4FC]",
        rotationDesktop: "-rotate-[4deg] lg:-rotate-[4deg]",
        desktopOffset: "lg:translate-y-0",
      },
      {
        id: "02",
        title: "Working Notes & Formats",
        description:
          "CBSE awards up to 50% marks to working notes. We train students on exact ledger formats, tabular calculations, and error-free balance sheet tallying.",
        bgColor: ABOUT_TOKENS.pillar2Bg,
        badgeBg: "bg-[#FFF8E6]",
        rotationDesktop: "rotate-[2deg] lg:rotate-[2deg]",
        desktopOffset: "lg:translate-y-3",
      },
      {
        id: "03",
        title: "Weekly Sunday Simulations",
        description:
          "Regular 3-hour mock exams with personal handwritten evaluation eradicate exam fear and time pressure well before the actual Board examinations.",
        bgColor: ABOUT_TOKENS.pillar3Bg,
        badgeBg: "bg-[#EFF9F2]",
        rotationDesktop: "rotate-[3deg] lg:rotate-[3deg]",
        desktopOffset: "lg:-translate-y-1",
      },
    ],
  },
  cta: {
    headingLine1: "Ready to Start",
    headingLine2: "Accountancy",
    headingLine3: "Preparation?",
    descriptionPrefix:
      "Explore our structured batches for Class 11 and Class 12 or connect with us on ",
    whatsappText: "WhatsApp",
    descriptionSuffix: " for fee and schedule details.",
    buttonLabel: "Explore Courses",
    buttonHref: "/courses",
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": "https://www.rd-classes.in/about#webpage",
      url: "https://www.rd-classes.in/about",
      name: "About R.D. Classes | Accountancy Coaching in Faridabad",
      description:
        "Learn about Ronak Dugar and the proven concept-first Accountancy pedagogy behind consistent 100/100 board scores at R.D. Classes in Sector 9, Faridabad.",
      isPartOf: {
        "@id": "https://www.rd-classes.in/#website",
      },
      about: {
        "@id": "https://www.rd-classes.in/about#founder",
      },
    },
    {
      "@type": "Person",
      "@id": "https://www.rd-classes.in/about#founder",
      name: "Ronak Dugar",
      jobTitle: "Founder & Lead Accountancy Faculty",
      worksFor: {
        "@id": "https://www.rd-classes.in/#organization",
      },
      description:
        "Lead Accountancy Faculty with 10+ years of teaching experience preparing CBSE Class 11 & 12 students in Sector 9, Faridabad.",
      knowsAbout: [
        "Accountancy",
        "CBSE Commerce",
        "Partnership Accounts",
        "Company Accounts",
        "Financial Statement Analysis",
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.rd-classes.in",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "About Us",
          item: "https://www.rd-classes.in/about",
        },
      ],
    },
  ],
};

export default function AboutPage() {
  const { hero, founder, pillars, cta } = ABOUT_CONTENT;
  const whatsappUrl = SITE_CONFIG.contact.whatsappUrl;

  return (
    <div className="w-full min-h-screen bg-[#FDF8F4] text-[#0F2342] overflow-x-clip selection:bg-[#FFC83A] selection:text-[#0F2342]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <noscript>
        <style>{`
          .about-hero-chip,
          .about-hero-h1,
          .about-hero-p,
          .about-hero-photo-card,
          .about-hero-photo-img,
          .about-highlight-sweep,
          .about-spark-cluster,
          .about-founder-scroll,
          .about-founder-stats-scroll,
          .about-heading-bar-scroll,
          .about-heading-text-scroll,
          .about-pillar-1-scroll,
          .about-pillar-2-scroll,
          .about-pillar-3-scroll,
          .about-cta-scroll,
          .about-cta-books-float,
          .about-circles-drift,
          .about-arc-draw,
          .about-cta-btn,
          .about-wa-link,
          .about-pillar-card,
          .about-founder-card,
          .about-founder-icon,
          .about-pillar-icon {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
          }
          .about-highlight-sweep { transform: scaleX(1) !important; }
          .about-spark-cluster { opacity: 1 !important; transform: scale(1) !important; }
          .about-wa-link { background-size: 100% 2px !important; }
          .about-pillar-1 { transform: rotate(-4deg) !important; }
          .about-pillar-2 { transform: rotate(2deg) !important; }
          .about-pillar-3 { transform: rotate(3deg) !important; }
        `}</style>
      </noscript>

      {/* Main Page Container: centered and scaled cleanly up to 1200px */}
      <main
        className="max-w-[1024px] xl:max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-10 pt-10 sm:pt-12 lg:pt-[60px] pb-20 sm:pb-28"
        aria-labelledby="about-hero-heading"
      >
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Landscape 5:4 Straight Photo Card + Clean Spacing)        */}
        {/* ========================================================================= */}
        <section
          className="relative flex flex-col lg:flex-row items-center lg:items-center justify-between gap-10 lg:gap-8 pb-4"
          aria-label="About RD Classes Introduction"
        >
          {/* Left Column: Inset Text Content (~440px wide on desktop) */}
          <div className="w-full lg:max-w-[450px] xl:max-w-[480px] lg:pl-4 xl:pl-6 text-left shrink-0 z-10">
            {/* Pale Yellow Chip */}
            <div className="about-hero-chip inline-flex items-center rounded-full bg-[#F5E9BD] px-3.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#0F2342] uppercase mb-4 sm:mb-5 select-none">
              <span>{hero.chip}</span>
            </div>

            {/* Plus Jakarta Sans Bold/Extra-Bold H1 (Transform-only entrance animation) */}
            <h1
              id="about-hero-heading"
              className={`about-hero-h1 ${jakarta.className} font-extrabold text-[#0F2342] text-[38px] sm:text-[48px] lg:text-[54px] xl:text-[58px] leading-[1.08] tracking-[-0.03em]`}
            >
              {hero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              {/* Teacher Highlight Row with Spark Cluster */}
              <span className="inline-flex items-center gap-2 mt-1">
                <span className="relative inline-block">
                  {/* Pale yellow highlight (#FFE08A) sweeps in from left */}
                  <span
                    className="about-highlight-sweep absolute -inset-x-2.5 inset-y-0.5 bg-[#FFE08A] rounded-md -rotate-[1.5deg] -z-0"
                    aria-hidden="true"
                  />
                  <span className={`${jakarta.className} relative z-10 italic font-extrabold`}>
                    {hero.teacherHighlight}
                  </span>
                </span>
                {/* 3 yellow spark strokes placed cleanly to the right of highlight with entrance + soft pulse */}
                <span
                  className="about-spark-cluster inline-block select-none pointer-events-none ml-1.5"
                  aria-hidden="true"
                >
                  <SparkCluster className="w-5 h-5 text-[#FFC83A]" />
                </span>
              </span>
            </h1>

            {/* Paragraph with 2px yellow vertical bar on its left */}
            <div className="about-hero-p border-l-2 border-[#FFC83A] pl-4 mt-5 sm:mt-6 max-w-[430px]">
              <p className="text-[15px] sm:text-[16.5px] text-[#4A5568] leading-[1.6] font-normal">
                {hero.paragraph}
              </p>
            </div>
          </div>

          {/* Right Column: Clean Straight Photo Card (~50% container, vertically centered, no backdrop/rotation) */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <div className="about-hero-photo-card relative w-full max-w-[480px] sm:max-w-[520px] aspect-[5/4] rounded-[24px] lg:rounded-[28px] overflow-hidden shadow-[0_20px_45px_rgba(15,35,66,0.12)] bg-[#F0EDE6]">
              <Image
                src={hero.photoSrc}
                alt={hero.photoAlt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 520px, 540px"
                className="about-hero-photo-img object-cover object-[70%_40%]"
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FOUNDER CARD: Single Horizontal Row with 1px Hairline Dividers         */}
        {/* ========================================================================= */}
        <section
          className="about-founder-scroll about-founder-card mt-10 sm:mt-12 lg:mt-12 rounded-[24px] bg-white border border-[#E8ECEF] shadow-[0_8px_30px_rgba(15,35,66,0.06)] p-6 lg:p-7"
          aria-label="Founder and Mentor Profile"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-6">
            {/* Avatar Block */}
            <div className="flex items-center gap-4 sm:gap-5 lg:gap-0 shrink-0">
              <div className="w-[76px] h-[76px] lg:w-[84px] lg:h-[84px] rounded-full bg-[#0F2342] border-[3px] border-[#FFC83A] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-extrabold text-[24px] lg:text-[26px] tracking-tight">
                  {founder.avatarText}
                </span>
              </div>

              {/* Name/Credentials displayed next to avatar below 1024px */}
              <div className="block lg:hidden">
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#0F2342]">
                  {founder.roleLabel}
                </span>
                <h2 className="text-[22px] sm:text-[25px] font-extrabold text-[#0F2342] leading-tight mt-0.5">
                  {founder.name}
                </h2>
                <p className="text-[12.5px] sm:text-[13.5px] font-medium text-[#5F6B7A] mt-1">
                  {founder.credentials}
                </p>
              </div>
            </div>

            {/* 1px Vertical Divider (Desktop min 1024px) */}
            <div
              className="hidden lg:block w-[1px] h-[72px] bg-[#E8ECEF] shrink-0"
              aria-hidden="true"
            />

            {/* Founder & Mentor Info (Desktop only, takes flex-1) */}
            <div className="hidden lg:block flex-1 min-w-[240px]">
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#0F2342]">
                {founder.roleLabel}
              </span>
              <h2 className="text-[24px] xl:text-[26px] font-extrabold text-[#0F2342] leading-tight mt-0.5">
                {founder.name}
              </h2>
              <p className="text-[13px] font-medium text-[#5F6B7A] mt-1">
                {founder.credentials}
              </p>
            </div>

            {/* 1px Vertical Divider (Desktop min 1024px) */}
            <div
              className="hidden lg:block w-[1px] h-[72px] bg-[#E8ECEF] shrink-0"
              aria-hidden="true"
            />

            {/* Horizontal divider on mobile/tablet */}
            <div className="block lg:hidden w-full h-[1px] bg-[#E8ECEF]" aria-hidden="true" />

            {/* Two Stats in Single Row on Desktop (Side by side with equal widths) */}
            <div className="about-founder-stats-scroll grid grid-cols-2 lg:flex lg:items-center gap-4 sm:gap-6 lg:gap-6 shrink-0">
              {/* Stat 1: 100/100 */}
              <div className="flex items-center gap-3 lg:min-w-[170px] xl:min-w-[190px]">
                {/* Custom inline SVG yellow trophy */}
                <FounderTrophyIcon className="about-founder-icon w-9 h-9 text-[#FFC83A] shrink-0" />
                <div>
                  <p className="text-[24px] lg:text-[26px] font-extrabold text-[#0F2342] leading-none">
                    {founder.stats[0].value}
                  </p>
                  <p className="text-[11.5px] lg:text-[12px] font-medium text-[#5F6B7A] mt-1 whitespace-nowrap">
                    {founder.stats[0].label}
                  </p>
                </div>
              </div>

              {/* 1px Vertical Divider between Stat 1 and Stat 2 */}
              <div
                className="hidden sm:block w-[1px] h-[52px] lg:h-[72px] bg-[#E8ECEF] shrink-0"
                aria-hidden="true"
              />

              {/* Stat 2: 10+ Yrs */}
              <div className="flex items-center gap-3 lg:min-w-[160px] xl:min-w-[180px]">
                {/* Custom inline SVG yellow award rosette */}
                <FounderAwardIcon className="about-founder-icon w-9 h-9 text-[#FFC83A] shrink-0" />
                <div>
                  <p className="text-[24px] lg:text-[26px] font-extrabold text-[#0F2342] leading-none">
                    {founder.stats[1].value}
                  </p>
                  <p className="text-[11.5px] lg:text-[12px] font-medium text-[#5F6B7A] mt-1 whitespace-nowrap">
                    {founder.stats[1].label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PILLARS SECTION (Left Heading/Text, Right 3 Rotated Cards with Text)   */}
        {/* ========================================================================= */}
        <section
          className="mt-16 sm:mt-20 lg:mt-24 relative"
          aria-labelledby="pillars-heading"
        >
          {/* Decorative Arc at bottom-left */}
          <div
            className="absolute -bottom-8 -left-6 z-0 pointer-events-none select-none opacity-80"
            aria-hidden="true"
          >
            <DecorativeArcLeft className="about-arc-draw w-28 sm:w-36 h-28 sm:h-36 text-[#FFC83A]" />
          </div>

          {/* Decorative Arc at right edge */}
          <div
            className="absolute top-1/2 -right-4 -translate-y-1/2 z-0 pointer-events-none select-none opacity-75 hidden md:block"
            aria-hidden="true"
          >
            <DecorativeArcRight className="about-arc-draw w-14 sm:w-16 h-28 sm:h-36 text-[#FFC83A]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-8">
            {/* Left Column: Heading & Explanation */}
            <div className="about-heading-text-scroll w-full lg:max-w-[260px] xl:max-w-[280px] shrink-0">
              {/* Short yellow bar above heading */}
              <div
                className="about-heading-bar-scroll w-8 h-1 bg-[#FFC83A] rounded-full mb-3.5"
                aria-hidden="true"
              />
              <h2
                id="pillars-heading"
                className="text-[28px] sm:text-[32px] font-extrabold text-[#0F2342] leading-[1.15] tracking-tight"
              >
                {pillars.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="text-[13.5px] sm:text-[14px] text-[#5F6B7A] leading-relaxed mt-3.5 max-w-[230px]">
                {pillars.description}
              </p>
            </div>

            {/* Right Column: Three overlapping tinted cards with diagonal gradients & rotations */}
            <div className="w-full lg:flex-1 relative flex flex-col md:flex-row items-stretch justify-end gap-5 md:gap-0">
              {/* Card 01 (-4deg rotation, text rotates with card) */}
              <article
                className={`about-pillar-card about-pillar-1 about-pillar-1-scroll w-full md:w-[35%] lg:w-[215px] xl:w-[245px] min-h-[365px] lg:min-h-[370px] rounded-[28px] p-6 lg:p-7 shadow-[0_12px_30px_rgba(15,35,66,0.06)] border border-[#0F2342]/[0.04] ${pillars.cards[0].bgColor} ${pillars.cards[0].desktopOffset} relative z-10 origin-center`}
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0F2342] ${pillars.cards[0].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[0].id}
                </div>

                {/* Three flat stacked books custom SVG (2.5px navy stroke) */}
                <div className="mb-4 text-[#0F2342]">
                  <PillarBooksIcon className="about-pillar-icon w-12 h-12 text-[#0F2342]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F2342] leading-snug">
                  {pillars.cards[0].title}
                </h3>

                {/* Body */}
                <p className="text-[12.5px] sm:text-[13px] text-[#4A5568] leading-[1.6] mt-2.5">
                  {pillars.cards[0].description}
                </p>
              </article>

              {/* Card 02 (+2deg rotation, 12px overlap, text rotates with card) */}
              <article
                className={`about-pillar-card about-pillar-2 about-pillar-2-scroll w-full md:w-[35%] lg:w-[215px] xl:w-[245px] min-h-[365px] lg:min-h-[370px] rounded-[28px] p-6 lg:p-7 shadow-[0_12px_30px_rgba(15,35,66,0.06)] border border-[#0F2342]/[0.04] ${pillars.cards[1].bgColor} ${pillars.cards[1].desktopOffset} lg:-ml-3 relative z-20 origin-center`}
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0F2342] ${pillars.cards[1].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[1].id}
                </div>

                {/* Notepad with spiral edge and pencil crossing on soft yellow circle */}
                <div className="mb-4 text-[#0F2342]">
                  <PillarNotepadIcon className="about-pillar-icon w-12 h-12 text-[#0F2342]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F2342] leading-snug">
                  {pillars.cards[1].title}
                </h3>

                {/* Body */}
                <p className="text-[12.5px] sm:text-[13px] text-[#4A5568] leading-[1.6] mt-2.5">
                  {pillars.cards[1].description}
                </p>
              </article>

              {/* Card 03 (+3deg rotation, 12px overlap, text rotates with card) */}
              <article
                className={`about-pillar-card about-pillar-3 about-pillar-3-scroll w-full md:w-[35%] lg:w-[215px] xl:w-[245px] min-h-[365px] lg:min-h-[370px] rounded-[28px] p-6 lg:p-7 shadow-[0_12px_30px_rgba(15,35,66,0.06)] border border-[#0F2342]/[0.04] ${pillars.cards[2].bgColor} ${pillars.cards[2].desktopOffset} lg:-ml-3 relative z-30 origin-center`}
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0F2342] ${pillars.cards[2].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[2].id}
                </div>

                {/* Target with 3 rings and arrow piercing center */}
                <div className="mb-4 text-[#0F2342]">
                  <PillarTargetIcon className="about-pillar-icon w-12 h-12 text-[#0F2342]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0F2342] leading-snug">
                  {pillars.cards[2].title}
                </h3>

                {/* Body */}
                <p className="text-[12.5px] sm:text-[13px] text-[#4A5568] leading-[1.6] mt-2.5">
                  {pillars.cards[2].description}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CTA BANNER + BOTTOM CIRCLES BEHIND                                     */}
        {/* ========================================================================= */}
        <div className="relative mt-16 sm:mt-20 lg:mt-24">
          {/* Large Pale Yellow Circles BEHIND CTA BANNER ONLY (slow subtle drift) */}
          <div
            className="about-circles-drift absolute -right-16 sm:-right-24 top-[calc(100%-50px)] w-[340px] sm:w-[420px] lg:w-[460px] h-[340px] sm:h-[420px] lg:h-[460px] pointer-events-none select-none -z-0"
            aria-hidden="true"
          >
            {/* Outer soft pale yellow circle */}
            <div className="absolute inset-0 rounded-full bg-[#FFE5A2]/50" />
            {/* Inner soft pale yellow circle */}
            <div className="absolute top-[40px] right-[30px] w-[220px] sm:w-[280px] h-[220px] sm:h-[280px] rounded-full bg-[#FEECC2]/80" />
          </div>

          {/* CTA BANNER (z-10, fully opaque navy #0F2342) */}
          <section
            className="about-cta-scroll relative z-10 rounded-[28px] bg-[#0F2342] text-white shadow-[0_20px_50px_rgba(15,35,66,0.18)] overflow-hidden p-6 sm:p-8 lg:px-8 lg:py-6"
            aria-label="Accountancy Preparation Call to Action"
          >
            {/* Light CREAM (#F6EFE3) diagonal wedge at bottom-left corner */}
            <div
              className="absolute bottom-0 left-0 w-[240px] sm:w-[280px] h-[150px] sm:h-[175px] bg-[#F6EFE3] pointer-events-none z-0"
              style={{
                clipPath: "polygon(0 0, 100% 100%, 0 100%)",
              }}
              aria-hidden="true"
            />

            {/* Desktop 4-column Grid + Button (>1024px), Stacked on Tablet/Mobile */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              {/* Column 1: Books Illustration (~24% on desktop, gentle floating) */}
              <div className="about-cta-books-float w-full lg:w-[22%] xl:w-[24%] shrink-0 flex items-center justify-center lg:justify-start -mb-2 lg:-my-3">
                <CtaBooksIllustration className="w-40 sm:w-48 lg:w-44 xl:w-50 h-28 sm:h-34" />
              </div>

              {/* 1px Vertical Divider (Desktop only) */}
              <div
                className="hidden lg:block w-[1px] h-[90px] xl:h-[105px] bg-white/20 shrink-0"
                aria-hidden="true"
              />

              {/* Column 2: Heading in 3 lines (~28% on desktop) */}
              <div className="w-full lg:w-[26%] xl:w-[28%] shrink-0 text-center lg:text-left">
                <h2 className="text-[26px] sm:text-[30px] lg:text-[28px] xl:text-[33px] font-extrabold tracking-tight text-white leading-[1.15]">
                  <span className="block">{cta.headingLine1}</span>
                  <span className="block">{cta.headingLine2}</span>
                  <span className="block text-[#FFC83A]">{cta.headingLine3}</span>
                </h2>
              </div>

              {/* Column 3: Paragraph in its own column (~28% on desktop, to the right of heading) */}
              <div className="w-full lg:w-[26%] xl:w-[28%] text-center lg:text-left flex-1">
                <p className="text-[14px] sm:text-[14.5px] lg:text-[14px] xl:text-[15px] text-slate-300 leading-[1.6]">
                  {cta.descriptionPrefix}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-wa-link text-white font-semibold no-underline inline-block pb-0.5"
                  >
                    {cta.whatsappText}
                  </a>
                  {cta.descriptionSuffix}
                </p>
              </div>

              {/* Column 4: Yellow Pill Button "Explore Courses ↗" */}
              <div className="shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
                <Link
                  href={cta.buttonHref}
                  prefetch={true}
                  className="about-cta-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-[#FFC83A] text-[#0F2342] font-bold text-[14px] shadow-[0_4px_14px_rgba(255,200,58,0.35)] min-h-[44px] whitespace-nowrap"
                >
                  <span>{cta.buttonLabel}</span>
                  <ArrowUpRight
                    className="about-cta-btn-arrow w-4 h-4"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
