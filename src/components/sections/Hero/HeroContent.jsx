import { ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

/**
 * HeroContent component for RD Classes Hero section.
 * - Desktop (>= 1024px): 1600x900 canvas fluid scaling via --u token with strict floors.
 * - Mobile (< 1024px): Plain Tailwind and clamp() styling; ZERO --u tokens used.
 * - Accountancy: Plain #FFB800 letters with transform+opacity reveal, overlay shimmer mask, pulsing glow, unclipped full stop, NO underline.
 */
export default function HeroContent() {
  const { hero, cta } = SITE_CONFIG;
  const metaItems = hero?.metaItems || ["CLASS 11", "CLASS 12", "ACCOUNTANCY"];
  const wordLetters = "Accountancy.".split("");

  return (
    <>
      {/* ================= DESKTOP LAYOUT (>= 1024px) ================= */}
      <div className="hidden lg:flex flex-col items-start text-left justify-center w-full max-w-[680px]">
        {/* 1. Eyebrow: 14u (floor 12px), tracking 0.2em, line 40x2u, gap to H1 28u */}
        <div
          className="animate-hero-fade [animation-delay:0ms] flex items-center"
          style={{
            gap: "calc(var(--u) * 12)",
            marginBottom: "calc(var(--u) * 28)",
          }}
        >
          <span
            className="bg-[#4FC3E8] rounded-full shrink-0"
            style={{ width: "calc(var(--u) * 40)", height: "2px" }}
            aria-hidden="true"
          />
          <span
            className="font-normal uppercase text-[#D6D6D6] select-none whitespace-nowrap"
            style={{
              fontSize: "max(12px, calc(var(--u) * 14))",
              letterSpacing: "0.2em",
            }}
          >
            {hero.eyebrow}
          </span>
        </div>

        {/* 2. Main Headline (H1): 88u (floor 46px), line-height 1.0, weight 800, tracking -0.02em */}
        <h1
          id="hero-heading"
          className="font-extrabold tracking-[-0.02em]"
          style={{
            fontSize: "max(46px, calc(var(--u) * 88))",
            lineHeight: 1.0,
          }}
        >
          <span className="block text-white animate-hero-fade [animation-delay:90ms]">
            {hero.headline.line1}
          </span>
          <span className="block text-white animate-hero-fade [animation-delay:180ms]">
            {hero.headline.line2}
          </span>

          {/* Animated "Accountancy." with letter reveal and continuous gold shimmer + glow pulse */}
          <span
            className="accountancy-word relative inline-block text-[#FFB800]"
            data-text="Accountancy."
          >
            {/* Accessible text for screen readers */}
            <span className="sr-only">Accountancy.</span>

            {/* Letter by letter reveal in base yellow (50ms stagger, 700ms) */}
            <span aria-hidden="true" className="inline-flex">
              {wordLetters.map((char, index) => (
                <span
                  key={index}
                  className="animate-letter text-[#FFB800]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </h1>

        {/* 3. Subtext: 25u (floor 17px), weight 300, line-height 1.4, gap from H1 38u */}
        <p
          className="animate-hero-fade [animation-delay:360ms] font-light text-[#EDEDED]"
          style={{
            fontSize: "max(17px, calc(var(--u) * 25))",
            lineHeight: 1.4,
            marginTop: "calc(var(--u) * 38)",
            maxWidth: "calc(var(--u) * 540)",
          }}
        >
          <span className="block">{hero.subtext.line1}</span>
          <span className="block">{hero.subtext.line2}</span>
        </p>

        {/* 4. Action Buttons: height 60u (floor 46px), label 19u (floor 15px), px 32u, radius 10u, gap 24u, gap from subtext 46u */}
        <div
          className="animate-hero-fade [animation-delay:450ms] flex items-center"
          style={{
            gap: "calc(var(--u) * 24)",
            marginTop: "calc(var(--u) * 46)",
          }}
        >
          {/* Primary Explore Courses */}
          <a
            href={cta.exploreCourses.href}
            className="group inline-flex items-center justify-center bg-[#FFB800] hover:bg-[#FFC933] active:bg-[#E5A600] text-[#0A0A0A] font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] whitespace-nowrap"
            style={{
              height: "max(46px, calc(var(--u) * 60))",
              fontSize: "max(15px, calc(var(--u) * 19))",
              paddingLeft: "calc(var(--u) * 32)",
              paddingRight: "calc(var(--u) * 32)",
              borderRadius: "calc(var(--u) * 10)",
            }}
          >
            <span>{cta.exploreCourses.label}</span>
            <ArrowRight
              className="ml-2.5 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>

          {/* Secondary Get in Touch */}
          <a
            href={cta.getInTouch.href}
            className="inline-flex items-center justify-center bg-transparent hover:bg-white/[0.08] border border-white/50 hover:border-[#FFB800] text-white hover:text-[#FFB800] font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] whitespace-nowrap"
            style={{
              height: "max(46px, calc(var(--u) * 60))",
              fontSize: "max(15px, calc(var(--u) * 19))",
              paddingLeft: "calc(var(--u) * 32)",
              paddingRight: "calc(var(--u) * 32)",
              borderRadius: "calc(var(--u) * 10)",
            }}
          >
            <span>{cta.getInTouch.label}</span>
          </a>
        </div>

        {/* 5. Bottom Meta Row: 13u (floor 11px), near bottom (~88% of hero height) */}
        <div
          className="animate-hero-fade [animation-delay:540ms] flex items-center"
          style={{
            marginTop: "calc(var(--u) * 104)",
            gap: "calc(var(--u) * 14)",
          }}
        >
          <span
            className="bg-[#4FC3E8] rounded-full shrink-0"
            style={{ width: "calc(var(--u) * 38)", height: "2px" }}
            aria-hidden="true"
          />
          <div
            className="tracking-[0.2em] font-normal uppercase text-[#D6D6D6] select-none flex items-center gap-2"
            style={{ fontSize: "max(11px, calc(var(--u) * 13))" }}
          >
            <span>{metaItems[0]}</span>
            <span className="text-white/50" aria-hidden="true">/</span>
            <span>{metaItems[1]}</span>
            <span className="text-white/50" aria-hidden="true">/</span>
            <span>{metaItems[2]}</span>
          </div>
        </div>
      </div>

      {/* ================= MOBILE & TABLET LAYOUT (< 1024px) ================= */}
      <div className="flex lg:hidden flex-col items-center text-center justify-center w-full">
        {/* 1. Eyebrow: single line with cyan lines on both sides, 12px, letter-spacing 0.16em */}
        <div className="animate-hero-fade [animation-delay:0ms] flex items-center justify-center gap-2.5 mb-[18px]">
          <span
            className="w-[24px] h-[2px] bg-[#4FC3E8] rounded-full shrink-0"
            aria-hidden="true"
          />
          <span className="text-[12px] font-normal tracking-[0.16em] uppercase text-[#D6D6D6] select-none whitespace-nowrap">
            {hero.eyebrow}
          </span>
          <span
            className="w-[24px] h-[2px] bg-[#4FC3E8] rounded-full shrink-0"
            aria-hidden="true"
          />
        </div>

        {/* 2. Main Headline (H1): clamp(40px, 12vw, 64px), line-height 1.02, centered, 3 lines */}
        <h1 className="font-extrabold tracking-[-0.02em] leading-[1.02] text-[clamp(40px,12vw,64px)] text-center">
          <span className="block text-white animate-hero-fade [animation-delay:90ms]">
            {hero.headline.line1}
          </span>
          <span className="block text-white animate-hero-fade [animation-delay:180ms]">
            {hero.headline.line2}
          </span>

          {/* Animated "Accountancy." with letter reveal and continuous gold shimmer + glow pulse */}
          <span
            className="accountancy-word relative inline-block text-[#FFB800]"
            data-text="Accountancy."
          >
            <span className="sr-only">Accountancy.</span>
            <span aria-hidden="true" className="inline-flex">
              {wordLetters.map((char, index) => (
                <span
                  key={index}
                  className="animate-letter text-[#FFB800]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {char}
                </span>
              ))}
            </span>
          </span>
        </h1>

        {/* 3. Subtext: EXACTLY two lines using two block spans, clamp(17px, 4.8vw, 21px), no max-width */}
        <p className="animate-hero-fade [animation-delay:360ms] mt-[22px] text-[clamp(17px,4.8vw,21px)] font-light leading-[1.4] text-[#EDEDED] w-full text-center">
          <span className="block">{hero.subtext.line1}</span>
          <span className="block">{hero.subtext.line2}</span>
        </p>

        {/* 4. Mobile Buttons: height 52px, font 16px weight 600, one row with gap 12px, stack under 340px */}
        <div className="animate-hero-fade [animation-delay:450ms] mt-[30px] flex flex-row max-[339px]:flex-col items-center justify-center gap-3 w-full max-w-[400px] mx-auto">
          {/* Primary Explore Courses */}
          <a
            href={cta.exploreCourses.href}
            className="flex-1 max-[339px]:w-full h-[52px] px-4 rounded-[10px] bg-[#FFB800] hover:bg-[#FFC933] active:bg-[#E5A600] text-[#0A0A0A] font-semibold text-[16px] flex items-center justify-center text-center shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>{cta.exploreCourses.label}</span>
            <ArrowRight className="ml-2 w-4 h-4 shrink-0" aria-hidden="true" />
          </a>

          {/* Secondary Get in Touch */}
          <a
            href={cta.getInTouch.href}
            className="flex-1 max-[339px]:w-full h-[52px] px-4 rounded-[10px] bg-transparent hover:bg-white/[0.08] border border-white/50 text-white font-semibold text-[16px] flex items-center justify-center text-center transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>{cta.getInTouch.label}</span>
          </a>
        </div>
      </div>
    </>
  );
}
