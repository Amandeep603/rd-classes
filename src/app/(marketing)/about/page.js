import Link from "next/link";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import { SITE_CONFIG } from "@/constants/site";
import AboutScrollReveal from "@/components/about/AboutScrollReveal";
import {
  SparkCluster,
  TrophyIcon,
  AwardBadgeIcon,
  PillarStackedBooksIcon,
  PillarNotesIcon,
  PillarTargetIcon,
  CtaBooksIllustration,
  DecorativeArcLeft,
  DecorativeArcRight,
} from "@/components/about/AboutIcons";

// High-contrast bold serif font specifically scoped to Hero H1
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
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
 * EXACT TYPED CONTENT OBJECT:
 * Single source of truth for all About page copy so the owner can edit text easily.
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
        iconType: "trophy",
      },
      {
        value: "10+ Yrs",
        label: "Teaching Excellence",
        iconType: "award",
      },
    ],
  },
  pillars: {
    sectionBar: true,
    titleLines: ["Our 3-Pillar", "Pedagogy"],
    description:
      "How we consistently prepare students to excel without memorizing formulas.",
    cards: [
      {
        id: "01",
        title: "Concept First, Rules Second",
        description:
          "Why is an asset debited? Why does revaluation gain belong to old partners? Every journal entry is grounded in real business transactions before book rules.",
        bgColor: "bg-[#E4EEFC]",
        badgeBg: "bg-[#F3F8FE]",
        rotationDesktop: "-rotate-[4deg]",
        rotationTablet: "-rotate-[1.5deg]",
        desktopOffset: "lg:translate-y-0",
      },
      {
        id: "02",
        title: "Working Notes & Formats",
        description:
          "CBSE awards up to 50% marks to working notes. We train students on exact ledger formats, tabular calculations, and error-free balance sheet tallying.",
        bgColor: "bg-[#FFF0C4]",
        badgeBg: "bg-[#FFF9E6]",
        rotationDesktop: "rotate-[2deg]",
        rotationTablet: "rotate-[1deg]",
        desktopOffset: "lg:translate-y-2",
      },
      {
        id: "03",
        title: "Weekly Sunday Simulations",
        description:
          "Regular 3-hour mock exams with personal handwritten evaluation eradicate exam fear and time pressure well before the actual Board examinations.",
        bgColor: "bg-[#E5F4E9]",
        badgeBg: "bg-[#F0FAF2]",
        rotationDesktop: "rotate-[3deg]",
        rotationTablet: "rotate-[1.5deg]",
        desktopOffset: "lg:-translate-y-1",
      },
    ],
  },
  cta: {
    titlePrefix: "Ready to Start Accountancy ",
    titleHighlight: "Preparation?",
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
    <div className="w-full min-h-screen bg-[#FBF8F3] text-[#0D2240] overflow-x-clip selection:bg-[#FFC629] selection:text-[#0D2240]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <AboutScrollReveal />

      {/* Main Page Container: ~940px wide at 1024px with 40px padding, centered and scaled cleanly up to 1200px */}
      <main
        className="max-w-[1024px] xl:max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-10 pt-6 sm:pt-10 lg:pt-12 pb-16 sm:pb-24"
        aria-labelledby="about-hero-heading"
      >
        {/* ========================================================================= */}
        {/* 1. HERO SECTION (Desktop 2-column layout, Inset Text, Rotated Photo Card) */}
        {/* ========================================================================= */}
        <section
          className="relative flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-8 pt-4 pb-4"
          aria-label="About RD Classes Introduction"
        >
          {/* Left Column: Inset Text Content (~24px more inset than cards below) */}
          <div
            className="w-full lg:max-w-[490px] xl:max-w-[530px] lg:pl-6 text-left shrink-0 z-10"
            data-reveal
          >
            {/* Pale Yellow Chip */}
            <div className="inline-flex items-center rounded-full bg-[#FDEFB8] px-3.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#0D2240] uppercase mb-5 select-none">
              <span>{hero.chip}</span>
            </div>

            {/* High-Contrast Bold Serif H1 */}
            <h1
              id="about-hero-heading"
              className={`${playfair.className} font-bold text-[#0D2240] text-[36px] sm:text-[44px] lg:text-[48px] xl:text-[52px] leading-[1.12] tracking-tight`}
            >
              {hero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="relative inline-block mt-1">
                {/* Yellow Rounded Marker-Highlight Shape (slightly rotated) */}
                <span
                  className="absolute -inset-x-2.5 inset-y-0.5 bg-[#FFD966] rounded-md -rotate-[1.5deg] -z-0"
                  aria-hidden="true"
                />
                <span className="relative z-10 italic">{hero.teacherHighlight}</span>
                {/* Three short yellow spark strokes at top-right corner */}
                <span
                  className="absolute -top-3.5 -right-6.5 z-10 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  <SparkCluster className="w-5 h-5 text-[#FFC629]" />
                </span>
              </span>
            </h1>

            {/* Paragraph with 2px yellow vertical bar on its left */}
            <div className="border-l-2 border-[#FFC629] pl-4 mt-6 sm:mt-7 max-w-[430px]">
              <p className="text-[15.5px] sm:text-[17px] text-[#4A586E] leading-[1.6] font-normal">
                {hero.paragraph}
              </p>
            </div>
          </div>

          {/* Right Column: Large Photo Card with Yellow Backplate & Sparks */}
          <div
            className="w-full lg:w-auto flex justify-center lg:justify-end lg:pr-4 mt-4 lg:mt-0 relative"
            data-reveal
          >
            <div className="relative w-[300px] sm:w-[350px] lg:w-[360px] xl:w-[390px] aspect-[3/4]">
              {/* Bigger Yellow Rounded Rectangle Behind (-8deg rotation, peeking top-right/bottom-right/left) */}
              <div
                className="absolute inset-0 bg-[#FFC629] rounded-[38px] sm:rounded-[42px] -rotate-[8deg] translate-x-2 -translate-y-2 sm:translate-x-3 sm:-translate-y-3 -z-10 shadow-sm"
                aria-hidden="true"
              />

              {/* Cluster of 3 yellow spark strokes above top-right corner */}
              <div
                className="absolute -top-6 -right-6 sm:-top-7 sm:-right-7 z-20 pointer-events-none select-none"
                aria-hidden="true"
              >
                <SparkCluster className="w-8 h-8 sm:w-9 sm:h-9 text-[#FFC629]" />
              </div>

              {/* Main Photo Card (-3deg rotation, big radius, soft shadow) */}
              <div className="relative w-full h-full rounded-[36px] sm:rounded-[40px] overflow-hidden -rotate-[3deg] shadow-[0_20px_45px_rgba(13,34,64,0.14)] bg-[#F0EDE6] border-2 border-white/60">
                <Image
                  src={hero.photoSrc}
                  alt={hero.photoAlt}
                  fill
                  priority
                  sizes="(max-width: 640px) 300px, (max-width: 1024px) 350px, 390px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FOUNDER CARD (Full-width white card, Avatar, Credentials, 2 Stats)     */}
        {/* ========================================================================= */}
        <section
          className="mt-10 sm:mt-12 rounded-[24px] bg-white border border-[#E8ECEF] shadow-[0_8px_30px_rgba(13,34,64,0.06)] px-6 sm:px-8 py-5 sm:py-6"
          aria-label="Founder and Mentor Profile"
          data-reveal
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
            {/* Left group: Navy Avatar circle with yellow ring + Name/Credentials */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Navy circle with 3px yellow ring and "RD" in bold white */}
              <div className="w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full bg-[#0D2240] border-[3px] border-[#FFC629] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-extrabold text-[24px] sm:text-[26px] tracking-tight">
                  {founder.avatarText}
                </span>
              </div>

              {/* Name & Title */}
              <div>
                <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#0D2240]">
                  {founder.roleLabel}
                </span>
                <h2 className="text-[22px] sm:text-[25px] font-extrabold text-[#0D2240] leading-tight mt-0.5">
                  {founder.name}
                </h2>
                <p className="text-[12.5px] sm:text-[13.5px] font-medium text-[#5F6B7A] mt-1">
                  {founder.credentials}
                </p>
              </div>
            </div>

            {/* Middle Divider (Desktop only) */}
            <div
              className="hidden lg:block w-[1px] h-[58px] bg-[#E8ECEF] self-center shrink-0"
              aria-hidden="true"
            />

            {/* Horizontal divider on mobile */}
            <div className="block md:hidden w-full h-[1px] bg-[#E8ECEF]" aria-hidden="true" />

            {/* Right group: Stats (100/100 Century Board Scores & 10+ Yrs Teaching Excellence) */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-center shrink-0">
              {/* Stat 1: 100/100 */}
              <div className="flex items-center gap-3">
                <TrophyIcon className="w-8 h-8 text-[#FFC629] shrink-0" />
                <div>
                  <p className="text-[24px] sm:text-[27px] font-extrabold text-[#0D2240] leading-none">
                    {founder.stats[0].value}
                  </p>
                  <p className="text-[11.5px] sm:text-[12px] font-medium text-[#5F6B7A] mt-1">
                    {founder.stats[0].label}
                  </p>
                </div>
              </div>

              {/* Stat Divider */}
              <div
                className="hidden sm:block w-[1px] h-[48px] bg-[#E8ECEF] -ml-2"
                aria-hidden="true"
              />

              {/* Stat 2: 10+ Yrs */}
              <div className="flex items-center gap-3">
                <AwardBadgeIcon className="w-8 h-8 text-[#FFC629] shrink-0" />
                <div>
                  <p className="text-[24px] sm:text-[27px] font-extrabold text-[#0D2240] leading-none">
                    {founder.stats[1].value}
                  </p>
                  <p className="text-[11.5px] sm:text-[12px] font-medium text-[#5F6B7A] mt-1">
                    {founder.stats[1].label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PILLARS SECTION (Left Heading/Text, Right 3 Overlapping Rotated Cards) */}
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
            <DecorativeArcLeft className="w-28 sm:w-36 h-28 sm:h-36 text-[#FFC629]" />
          </div>

          {/* Decorative Arc at right edge */}
          <div
            className="absolute top-1/2 -right-4 -translate-y-1/2 z-0 pointer-events-none select-none opacity-75 hidden md:block"
            aria-hidden="true"
          >
            <DecorativeArcRight className="w-14 sm:w-16 h-28 sm:h-36 text-[#FFC629]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-8">
            {/* Left Column: Heading & Explanation */}
            <div className="w-full lg:max-w-[260px] xl:max-w-[280px] shrink-0" data-reveal>
              {/* Short yellow bar above heading */}
              <div
                className="w-8 h-1 bg-[#FFC629] rounded-full mb-3.5"
                aria-hidden="true"
              />
              <h2
                id="pillars-heading"
                className="text-[28px] sm:text-[32px] font-extrabold text-[#0D2240] leading-[1.15] tracking-tight"
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

            {/* Right Column: Three overlapping tinted cards with large radius */}
            <div className="w-full lg:flex-1 relative flex flex-col md:flex-row items-stretch justify-end gap-5 md:gap-0">
              {/* Card 01 (Light Blue) */}
              <article
                className={`w-full md:w-[35%] lg:w-[220px] xl:w-[240px] rounded-[28px] p-6 sm:p-7 shadow-[0_12px_30px_rgba(13,34,64,0.06)] border border-[#0D2240]/[0.04] transition-all duration-300 md:hover:rotate-0 md:hover:-translate-y-2 md:hover:z-40 ${pillars.cards[0].bgColor} ${pillars.cards[0].rotationDesktop} md:${pillars.cards[0].rotationTablet} ${pillars.cards[0].desktopOffset} relative z-10`}
                data-reveal
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0D2240] ${pillars.cards[0].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[0].id}
                </div>

                {/* Icon */}
                <div className="mb-4 text-[#0D2240]">
                  <PillarStackedBooksIcon className="w-8 h-8 text-[#0D2240]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0D2240] leading-snug">
                  {pillars.cards[0].title}
                </h3>

                {/* Body */}
                <p className="text-[12.5px] sm:text-[13px] text-[#4A5568] leading-[1.6] mt-2.5">
                  {pillars.cards[0].description}
                </p>
              </article>

              {/* Card 02 (Light Yellow) */}
              <article
                className={`w-full md:w-[35%] lg:w-[220px] xl:w-[240px] rounded-[28px] p-6 sm:p-7 shadow-[0_12px_30px_rgba(13,34,64,0.06)] border border-[#0D2240]/[0.04] transition-all duration-300 md:hover:rotate-0 md:hover:-translate-y-2 md:hover:z-40 ${pillars.cards[1].bgColor} ${pillars.cards[1].rotationDesktop} md:${pillars.cards[1].rotationTablet} ${pillars.cards[1].desktopOffset} md:-ml-3.5 relative z-20`}
                data-reveal
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0D2240] ${pillars.cards[1].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[1].id}
                </div>

                {/* Icon */}
                <div className="mb-4 text-[#0D2240]">
                  <PillarNotesIcon className="w-8 h-8 text-[#0D2240]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0D2240] leading-snug">
                  {pillars.cards[1].title}
                </h3>

                {/* Body */}
                <p className="text-[12.5px] sm:text-[13px] text-[#4A5568] leading-[1.6] mt-2.5">
                  {pillars.cards[1].description}
                </p>
              </article>

              {/* Card 03 (Light Green) */}
              <article
                className={`w-full md:w-[35%] lg:w-[220px] xl:w-[240px] rounded-[28px] p-6 sm:p-7 shadow-[0_12px_30px_rgba(13,34,64,0.06)] border border-[#0D2240]/[0.04] transition-all duration-300 md:hover:rotate-0 md:hover:-translate-y-2 md:hover:z-40 ${pillars.cards[2].bgColor} ${pillars.cards[2].rotationDesktop} md:${pillars.cards[2].rotationTablet} ${pillars.cards[2].desktopOffset} md:-ml-3.5 relative z-30`}
                data-reveal
              >
                {/* Number Badge */}
                <div
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-extrabold text-[#0D2240] ${pillars.cards[2].badgeBg} mb-5 select-none`}
                >
                  {pillars.cards[2].id}
                </div>

                {/* Icon */}
                <div className="mb-4 text-[#0D2240]">
                  <PillarTargetIcon className="w-8 h-8 text-[#0D2240]" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#0D2240] leading-snug">
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
        {/* 4. CTA BANNER (Full-width Navy card, 3D Stacked Books, WhatsApp link, Btn) */}
        {/* ========================================================================= */}
        <section
          className="mt-16 sm:mt-20 lg:mt-24 rounded-[28px] bg-[#0D2240] text-white shadow-[0_20px_50px_rgba(13,34,64,0.18)] relative overflow-hidden p-6 sm:p-8 lg:p-10"
          aria-label="Accountancy Preparation Call to Action"
          data-reveal
        >
          {/* Light diagonal wedge that cuts the banner's bottom-left corner */}
          <div
            className="absolute bottom-0 left-0 w-44 sm:w-56 h-32 sm:h-40 bg-gradient-to-tr from-[#162E52] via-[#1A3660] to-[#204070] opacity-80 pointer-events-none -z-0"
            style={{
              clipPath: "polygon(0 100%, 100% 100%, 0 0)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 sm:gap-8">
            {/* Left section: Stacked Books Illustration + Divider */}
            <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto shrink-0 justify-center lg:justify-start">
              <div className="shrink-0 -mb-2">
                <CtaBooksIllustration className="w-28 sm:w-36 h-20 sm:h-26" />
              </div>

              {/* Vertical divider */}
              <div
                className="hidden lg:block w-[1px] h-[68px] bg-white/20 shrink-0"
                aria-hidden="true"
              />
            </div>

            {/* Center section: Heading & WhatsApp paragraph */}
            <div className="space-y-2 text-center lg:text-left flex-1 max-w-xl">
              <h2 className="text-[21px] sm:text-[25px] font-extrabold tracking-tight text-white leading-tight">
                {cta.titlePrefix}
                <span className="text-[#FFC629]">{cta.titleHighlight}</span>
              </h2>
              <p className="text-[13px] sm:text-[14px] text-slate-300 leading-relaxed">
                {cta.descriptionPrefix}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-semibold underline underline-offset-4 decoration-[#FFC629] hover:text-[#FFC629] transition-colors inline-block"
                >
                  {cta.whatsappText}
                </a>
                {cta.descriptionSuffix}
              </p>
            </div>

            {/* Right section: Yellow Pill Button "Explore Courses ↗" */}
            <div className="shrink-0 w-full sm:w-auto flex justify-center">
              <Link
                href={cta.buttonHref}
                prefetch={true}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FFC629] hover:bg-[#F5B810] active:scale-[0.98] text-[#0D2240] font-bold text-[14px] shadow-[0_4px_14px_rgba(255,198,41,0.35)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D2240] min-h-[44px]"
              >
                <span>{cta.buttonLabel}</span>
                <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-base">
                  ↗
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. BOTTOM DECORATION (Large pale yellow circles bleeding off bottom-right) */}
        {/* ========================================================================= */}
        <div
          className="relative w-full h-16 sm:h-24 pointer-events-none select-none"
          aria-hidden="true"
        >
          {/* Outer soft pale yellow circle */}
          <div className="absolute right-[-80px] top-[-20px] w-[340px] sm:w-[400px] h-[340px] sm:h-[400px] rounded-full bg-[#FCEEB5]/45 -z-0" />
          {/* Inner soft pale yellow circle */}
          <div className="absolute right-[40px] top-[15px] w-[200px] sm:w-[260px] h-[200px] sm:h-[260px] rounded-full bg-[#FDEFB8]/70 -z-0" />
        </div>
      </main>
    </div>
  );
}
