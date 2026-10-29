import { Suspense } from "react";
import { getCachedPublicCourses } from "@/server/services/courseService";
import CoursesHeroCluster from "@/components/courses/CoursesHeroCluster";
import CoursesCatalogClient from "@/components/courses/CoursesCatalogClient";

export const metadata = {
  title: "Structured Courses for Class 11 & 12 Accountancy | RD Classes",
  description:
    "Explore comprehensive CBSE Accountancy courses for Class 11 & 12 by Ronak Dugar in Sector 9, Faridabad. Full year batches, recorded lectures, test series and crash courses.",
  alternates: {
    canonical: "/courses",
  },
  openGraph: {
    title: "Structured Courses for Class 11 & 12 Accountancy | RD Classes",
    description:
      "Learn Accountancy with concept clarity, practice, and personalised guidance from Ronak Sir.",
    url: "/courses",
  },
};

export default async function CoursesPage() {
  const courses = await getCachedPublicCourses();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: course.title,
        description: course.description,
        provider: {
          "@type": "EducationalOrganization",
          name: "RD Classes",
        },
      },
    })),
  };

  return (
    <div
      className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pb-14 overflow-x-clip"
      style={{
        "--su-c": "min(100vw / 1536, 1px)",
      }}
    >
      {/* JSON-LD Catalog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION (min-height 340px, max-height 400px on desktop, padding 32px 0, content vertically centered) */}
      <section className="relative w-full overflow-hidden bg-[#FBF7F0] border-b border-[#F0E6D5]/80 py-8 min-h-[340px] lg:max-h-[400px] flex items-center">
        {/* Soft Peach/Yellow Blobs (Strictly decorative, overflow-hidden, pointer-events-none, never overlaps filter row) */}
        <div
          className="absolute right-[-40px] top-[15px] w-[460px] h-[460px] rounded-full pointer-events-none -z-0 opacity-65"
          style={{
            background: "radial-gradient(circle, #FDE68A 0%, #FEF3C7 50%, rgba(254, 243, 199, 0) 75%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute left-[-60px] top-[30px] w-[260px] h-[260px] rounded-full pointer-events-none -z-0 opacity-40"
          style={{
            background: "radial-gradient(circle, #FEF3C7 0%, rgba(254, 243, 199, 0) 70%)",
          }}
          aria-hidden="true"
        />

        <div className="w-full max-w-[1380px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col min-[900px]:flex-row items-center justify-between gap-8 min-[900px]:gap-10">
          {/* Left Column: Eyebrow + H1 + Subtitle (max-width 640px) */}
          <div className="w-full max-w-[650px] flex-1">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-0.5 rounded-full bg-[#FFB800]" />
              <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#64748B]">
                OUR COURSES
              </span>
            </div>

            {/* H1 Headline: clamp(30px, 3.6vw, 52px), line-height 1.05, max-width 760px, text-wrap: balance, 2 lines */}
            <h1
              className="font-extrabold tracking-tight text-[#0F172A] leading-[1.05] max-w-[760px] [text-wrap:balance] text-[clamp(28px,4vw,40px)] min-[1100px]:text-[clamp(30px,3.6vw,52px)]"
            >
              <span className="whitespace-nowrap">Structured Courses for</span><br className="hidden sm:inline" />{" "}
              <span className="text-[#FFB800] whitespace-nowrap">Class 11 &amp; 12</span>{" "}
              Accountancy.
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 text-[15px] sm:text-[17px] leading-[24px] sm:leading-[26px] text-[#5F6A7A] max-w-[560px]">
              Learn with concept clarity, practice, and personalised guidance from Ronak Sir.
              Choose the course that fits your preparation goals.
            </p>
          </div>

          {/* Right Column: Hero Illustration Cluster (Restored big size, vertically centered, >=40px gap) */}
          <div className="w-full min-[900px]:w-auto shrink-0 flex justify-center min-[900px]:justify-end items-center">
            <CoursesHeroCluster />
          </div>
        </div>
      </section>

      {/* CATALOG TOOLBAR & CARDS GRID */}
      <main className="w-full max-w-[1330px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Suspense
          fallback={
            <div className="w-full py-16 text-center text-sm font-semibold text-slate-400">
              Loading courses...
            </div>
          }
        >
          <CoursesCatalogClient initialCourses={courses} />
        </Suspense>
      </main>
    </div>
  );
}
