import { ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";

/**
 * HeroContent component for RD Classes Hero section.
 * Unified responsive layout for both Desktop (>= 1024px) and Mobile (< 1024px).
 * Exactly one H1 for optimal SEO.
 */
export default function HeroContent() {
  const { hero, cta } = SITE_CONFIG;
  const metaItems = hero?.metaItems || ["CLASS 11", "CLASS 12", "ACCOUNTANCY"];
  const wordLetters = "Accountancy.".split("");

  return (
    <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center w-full max-w-[560px] lg:max-w-[680px] mx-auto lg:mx-0">
      {/* 1. Eyebrow */}
      <div className="animate-hero-fade [animation-delay:0ms] flex items-center justify-center lg:justify-start gap-2.5 lg:gap-[calc(var(--u)*12)] mb-[18px] lg:mb-[calc(var(--u)*28)]">
        <span
          className="h-[2px] bg-[#4FC3E8] rounded-full shrink-0 w-[24px] lg:w-[calc(var(--u)*40)]"
          aria-hidden="true"
        />
        <span
          className="font-normal uppercase text-[#D6D6D6] select-none whitespace-nowrap text-[12px] lg:text-[max(12px,calc(var(--u)*14))] tracking-[0.16em] lg:tracking-[0.2em]"
        >
          {hero.eyebrow}
        </span>
        <span
          className="lg:hidden w-[24px] h-[2px] bg-[#4FC3E8] rounded-full shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* 2. Main Headline (Single H1 for entire page) */}
      <h1
        id="hero-heading"
        className="font-extrabold tracking-[-0.02em] leading-[1.02] lg:leading-none text-[clamp(40px,12vw,64px)] lg:text-[max(46px,calc(var(--u)*88))]"
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

      {/* 3. Subtext */}
      <p
        className="animate-hero-fade [animation-delay:360ms] mt-[22px] lg:mt-[calc(var(--u)*38)] text-[clamp(17px,4.8vw,21px)] lg:text-[max(17px,calc(var(--u)*25))] font-light leading-[1.4] text-[#EDEDED] w-full max-w-none lg:max-w-[calc(var(--u)*540)]"
      >
        <span className="block">{hero.subtext.line1}</span>
        <span className="block">{hero.subtext.line2}</span>
      </p>

      {/* 4. Action Buttons */}
      <div className="animate-hero-fade [animation-delay:450ms] mt-[30px] lg:mt-[calc(var(--u)*46)] flex flex-row max-[339px]:flex-col items-center justify-center lg:justify-start gap-3 lg:gap-[calc(var(--u)*24)] w-full max-w-[400px] lg:max-w-none mx-auto lg:mx-0">
        {/* Primary Explore Courses */}
        <a
          href={cta.exploreCourses.href}
          className="group flex-1 lg:flex-none max-[339px]:w-full inline-flex items-center justify-center bg-[#FFB800] hover:bg-[#FFC933] active:bg-[#E5A600] text-[#0A0A0A] font-semibold text-[16px] lg:text-[max(15px,calc(var(--u)*19))] h-[52px] lg:h-[max(46px,calc(var(--u)*60))] px-4 lg:px-[calc(var(--u)*32)] rounded-[10px] lg:rounded-[calc(var(--u)*10)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <span>{cta.exploreCourses.label}</span>
          <ArrowRight
            className="ml-2 w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </a>

        {/* Secondary Get in Touch */}
        <a
          href={cta.getInTouch.href}
          className="flex-1 lg:flex-none max-[339px]:w-full inline-flex items-center justify-center bg-transparent hover:bg-white/[0.08] border border-white/50 hover:border-[#FFB800] text-white hover:text-[#FFB800] font-semibold text-[16px] lg:text-[max(15px,calc(var(--u)*19))] h-[52px] lg:h-[max(46px,calc(var(--u)*60))] px-4 lg:px-[calc(var(--u)*32)] rounded-[10px] lg:rounded-[calc(var(--u)*10)] transition-all duration-200 cursor-pointer whitespace-nowrap"
        >
          <span>{cta.getInTouch.label}</span>
        </a>
      </div>

      {/* 5. Bottom Meta Row (Desktop) */}
      <div
        className="hidden lg:flex animate-hero-fade [animation-delay:540ms] items-center"
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
  );
}
