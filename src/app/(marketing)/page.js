import Hero from "@/components/sections/Hero/Hero";
import ProgramsSection from "@/components/sections/Programs/ProgramsSection";
import FeaturedCoursesSection from "@/components/sections/FeaturedCourses/FeaturedCoursesSection";
import StatsSection from "@/components/sections/Stats/StatsSection";
import LightFlow from "@/components/ui/LightFlow";
import HowItWorksSection from "@/components/sections/HowItWorks/HowItWorksSection";
import SyllabusSection from "@/components/sections/Syllabus/SyllabusSection";
import PortalSection from "@/components/sections/Portal/PortalSection";
import BoardToppersSection from "@/components/sections/Toppers/BoardToppersSection";
import TestimonialsSection from "@/components/sections/Testimonials/TestimonialsSection";
import GallerySection from "@/components/sections/Gallery/GallerySection";
import FaqSection from "@/components/sections/FAQ/FaqSection";
import CtaBannerSection from "@/components/sections/CtaBanner/CtaBannerSection";

/**
 * RD Classes Home page.
 * Exact section order:
 * 1. Hero
 * 2. Programs (Section A)
 * 3. Featured Courses (Section B)
 * 4. Stats (Section C: Achievements)
 * 5. How It Works (Section D)
 * 6. Syllabus (Section E)
 * 7. Student Portal (Section F)
 * 8. Board Toppers (Section G: Results)
 * 9. Testimonials (Section H: Reviews)
 * 10. Gallery (Section I: Life at RD Classes)
 * 11. FAQ (Section J: Common Doubts Answered)
 * 12. CTA Banner (Section K: Free Demo)
 * (Footer mounted site-wide in app/layout.js)
 */
export default function Home() {
  return (
    <main className="w-full overflow-x-clip">
      {/* 1. Hero */}
      <Hero />

      {/* 2 & 3. Continuous Cream Panel rising over dark hero */}
      <div
        className="relative z-20 w-full rounded-t-[clamp(24px,2.5vw,40px)] shadow-[0_-12px_36px_rgba(0,0,0,0.18)]"
        style={{
          backgroundColor: "var(--bg-cream-panel, #F7F0E0)",
          "--su": "min(100vw / 1600, 1px)",
        }}
      >
        <ProgramsSection />
        <FeaturedCoursesSection />
      </div>

      {/* 4. Stats Band (Achievements) */}
      <StatsSection />

      {/* 5, 6, 7. Continuous light background wrapper for Sections D, E, and F */}
      <LightFlow>
        <HowItWorksSection />
        <SyllabusSection />
        <PortalSection />
      </LightFlow>

      {/* 8. Board Toppers (Section G, Dark Band, id="results") */}
      <BoardToppersSection />

      {/* 9, 10, 11, 12. Continuous light background wrapper for Sections H, I, J, K */}
      <LightFlow>
        <TestimonialsSection />
        <GallerySection />
        <FaqSection />
        <CtaBannerSection />
      </LightFlow>
    </main>
  );
}
