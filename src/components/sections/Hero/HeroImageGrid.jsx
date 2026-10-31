"use client";

/**
 * HeroImageGrid - 5-Capsule Staggered Student Collage for RD Classes Hero.
 *
 * Requirements:
 * - Exactly 5 capsule cards across 3 columns matching reference design.
 * - Every card: border-radius: 999px; overflow: hidden; position: relative; solid bg; soft shadow: 0 14px 34px rgba(0,0,0,0.38).
 * - Column 1:
 *   - Card 1 (Top): Tall sky-blue (#7CCBE8) capsule, aspect-ratio 1 / 2.4, cut-out height 84%.
 *   - Card 2 (Bottom): Short orange (#FF7A00) capsule, aspect-ratio 1 / 1.45, cut-out height 78%.
 *   - Offset: starts 55px lower than column 2 (28px on mobile).
 * - Column 2:
 *   - Card 3 (Top): Medium yellow (#FFB800) capsule, aspect-ratio 1 / 1.95, cut-out height 82%.
 *   - Card 4 (Bottom): Tall teal (#12A4C4) capsule, aspect-ratio 1 / 2.4, cut-out height 84%.
 *   - Offset: 0.
 * - Column 3:
 *   - Card 5: Extra-tall orange (#FF7A00) capsule, aspect-ratio 1 / 2.7, cut-out height 84%.
 *   - Offset: starts 50px lower than column 2 (24px on mobile).
 * - Background-removed cutouts positioned absolute bottom-0 left-1/2 -translate-x-1/2 with clear colored space above each head.
 * - Fade-up entrance staggered by 80ms per card, honoring prefers-reduced-motion.
 */
export default function HeroImageGrid({ className = "" }) {
  return (
    <div
      className={`grid grid-cols-3 gap-[10px] md:gap-[20px] w-full max-w-[640px] items-start select-none ${className}`}
      aria-label="Student showcase gallery"
    >
      {/* ================= COLUMN 1 ================= */}
      {/* Starts 55px lower than column 2 (28px on mobile) */}
      <div className="flex flex-col gap-[10px] md:gap-[20px] w-full mt-[28px] md:mt-[55px]">
        {/* Card 1: Tall Sky-Blue Capsule */}
        <div
          className="hero-capsule-card relative w-full overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.38)] [animation-delay:0ms]"
          style={{
            backgroundColor: "#7CCBE8",
            aspectRatio: "1 / 2.4",
            borderRadius: "999px",
          }}
        >
          <img
            src="/images/hero/cutouts/student-1-cutout.webp"
            alt="RD Classes Accountancy student smiling with notebook"
            width={896}
            height={1200}
            loading="eager"
            decoding="async"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-none pointer-events-none select-none block"
            style={{ height: "84%" }}
          />
        </div>

        {/* Card 2: Short Orange Capsule */}
        <div
          className="hero-capsule-card relative w-full overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.38)] [animation-delay:80ms]"
          style={{
            backgroundColor: "#FF7A00",
            aspectRatio: "1 / 1.45",
            borderRadius: "999px",
          }}
        >
          <img
            src="/images/hero/cutouts/student-2-cutout.webp"
            alt="Accountancy student in blue hoodie holding economics notebook"
            width={896}
            height={1200}
            loading="lazy"
            decoding="async"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-none pointer-events-none select-none block"
            style={{ height: "78%" }}
          />
        </div>
      </div>

      {/* ================= COLUMN 2 ================= */}
      {/* Highest column (offset 0) */}
      <div className="flex flex-col gap-[10px] md:gap-[20px] w-full mt-0">
        {/* Card 3: Medium Yellow Capsule */}
        <div
          className="hero-capsule-card relative w-full overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.38)] [animation-delay:160ms]"
          style={{
            backgroundColor: "#FFB800",
            aspectRatio: "1 / 1.95",
            borderRadius: "999px",
          }}
        >
          <img
            src="/images/hero/cutouts/student-3-cutout.webp"
            alt="Confident CBSE Accountancy student holding yellow book"
            width={896}
            height={1200}
            loading="eager"
            decoding="async"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-none pointer-events-none select-none block"
            style={{ height: "82%" }}
          />
        </div>

        {/* Card 4: Tall Teal Capsule */}
        <div
          className="hero-capsule-card relative w-full overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.38)] [animation-delay:240ms]"
          style={{
            backgroundColor: "#12A4C4",
            aspectRatio: "1 / 2.4",
            borderRadius: "999px",
          }}
        >
          <img
            src="/images/hero/cutouts/student-4-cutout.webp"
            alt="Commerce student with glasses holding notes"
            width={896}
            height={1200}
            loading="lazy"
            decoding="async"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-none pointer-events-none select-none block"
            style={{ height: "84%" }}
          />
        </div>
      </div>

      {/* ================= COLUMN 3 ================= */}
      {/* Starts 50px lower than column 2 (24px on mobile) */}
      <div className="flex flex-col gap-[10px] md:gap-[20px] w-full mt-[24px] md:mt-[50px]">
        {/* Card 5: Extra-Tall Orange Capsule */}
        <div
          className="hero-capsule-card relative w-full overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.38)] [animation-delay:320ms]"
          style={{
            backgroundColor: "#FF7A00",
            aspectRatio: "1 / 2.7",
            borderRadius: "999px",
          }}
        >
          <img
            src="/images/hero/cutouts/student-5-cutout.webp"
            alt="Successful Class 12 Accountancy student in denim jacket"
            width={896}
            height={1200}
            loading="lazy"
            decoding="async"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-auto max-w-none pointer-events-none select-none block"
            style={{ height: "84%" }}
          />
        </div>
      </div>
    </div>
  );
}
