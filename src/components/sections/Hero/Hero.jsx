import HeroContent from "./HeroContent";
import HeroImageGrid from "./HeroImageGrid";
import InViewSection from "@/components/ui/InViewSection";

/**
 * Hero Section for RD Classes home page (Hero v3.3).
 * - Exact calibrated background radial gradients painted directly on section background over #0A0A0A.
 * - Noise overlay completely removed across all breakpoints.
 * - All background layers: background-repeat: no-repeat, sized to cover hero.
 * - [isolation: isolate], content relative z-10, no negative z-index, no filter:blur.
 * - Desktop: 1600x900 basis, strictly fits one screen, capped at 1.1px.
 * - Mobile (< 1024px): Scrollable, height auto, pb-7 (28px), all 5 cards fully visible with no dead gap.
 * - Glow drift: desktop only (hidden lg:block).
 */
export default function Hero() {
  return (
    <InViewSection
      id="hero"
      aria-labelledby="hero-heading"
      style={{
        "--u": "min(min(100vw / 1600, max(100svh, 560px) / 900), 1.1px)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundColor: "#0A0A0A",
        backgroundImage: `
          radial-gradient(circle 35vw at 0% 0%, rgba(175, 112, 14, 0.35) 0%, transparent 68%),
          radial-gradient(circle 25vw at 0% 28%, rgba(30, 80, 85, 0.44) 0%, transparent 68%),
          radial-gradient(circle 27vw at 0% 55%, rgba(16, 66, 78, 0.48) 0%, transparent 70%),
          radial-gradient(circle 48vw at 90% 100%, rgba(215, 125, 0, 0.50) 0%, transparent 72%),
          radial-gradient(circle 38vw at 58% 105%, rgba(190, 110, 10, 0.42) 0%, transparent 68%),
          radial-gradient(circle 24vw at 100% 12%, rgba(175, 110, 10, 0.22) 0%, transparent 70%)
        `,
      }}
      className="relative w-full min-h-[calc(100svh-var(--nav-h,84px))] h-auto overflow-x-clip select-none [isolation:isolate]"
    >
      {/* ================= DESKTOP LIGHTWEIGHT GLOW DRIFT OVERLAY (Transform-only, Desktop only) ================= */}
      <div
        className="hidden lg:block absolute inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
        style={{ backgroundRepeat: "no-repeat" }}
      >
        <div
          className="animate-glow-drift absolute -top-[5%] -left-[5%] w-[42vw] h-[42vw] rounded-full bg-[radial-gradient(circle,rgba(184,115,10,0.18)_0%,transparent_70%)] pointer-events-none"
          style={{ backgroundRepeat: "no-repeat" }}
        />
        <div
          className="animate-glow-drift-rev absolute -bottom-[10%] -right-[5%] w-[48vw] h-[48vw] rounded-full bg-[radial-gradient(circle,rgba(217,130,0,0.22)_0%,transparent_70%)] pointer-events-none"
          style={{ backgroundRepeat: "no-repeat" }}
        />
      </div>

      {/* ================= DESKTOP & LAPTOP LAYOUT (>= 1024px) ================= */}
      <div className="hidden lg:flex w-full min-h-[calc(100svh-var(--nav-h,84px))] items-center justify-between px-[6.25vw] pt-6 pb-10 relative z-20">
        {/* Left Content */}
        <div className="w-[48%] max-w-[620px] shrink-0">
          <HeroContent />
        </div>

        {/* Right Capsule Collage: aligned right, max-w 640px */}
        <div className="w-[48%] max-w-[640px] flex justify-end shrink-0 pointer-events-auto">
          <HeroImageGrid className="w-full" />
        </div>
      </div>

      {/* ================= MOBILE & TABLET LAYOUT (< 1024px) ================= */}
      <div className="flex lg:hidden flex-col items-center justify-start w-full pt-4 pb-8 px-4 z-20 relative">
        {/* Centered Content */}
        <HeroContent />

        {/* Scaled Capsule Cluster: 3 cols, tablet 90% width, mobile max-w-[420px] */}
        <div className="w-full max-w-[420px] md:max-w-none md:w-[90%] mx-auto mt-8 shrink-0">
          <HeroImageGrid className="w-full" />
        </div>
      </div>
    </InViewSection>
  );
}
