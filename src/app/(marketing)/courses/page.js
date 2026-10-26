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
      className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pt-[86px] pb-20 overflow-x-clip"
      style={{
        "--su-c": "min(100vw / 1536, 1px)",
      }}
    >
      {/* JSON-LD Catalog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-[1330px] mx-auto px-4 lg:px-0">
        {/* HERO SECTION (Height ~ 238px, y: 66 to 304) */}
        <section className="relative pt-4 sm:pt-6 pb-6 lg:pb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 min-h-[220px]">
          {/* Left Column: Eyebrow + H1 + Subtitle (starts at x128 = container x105 + 23px) */}
          <div className="max-w-2xl flex-1 z-10 pl-0 lg:pl-[23px]">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-0.5 rounded-full bg-[#FFC21A]" />
              <span className="text-[12px] font-extrabold uppercase tracking-widest text-[#64748B]">
                OUR COURSES
              </span>
            </div>

            {/* H1 Headline (52px / line pitch 52px) */}
            <h1 className="text-[32px] sm:text-[42px] lg:text-[52px] font-extrabold tracking-tight text-[#0F172A] leading-[1.05] lg:leading-[52px]">
              Structured Courses for<br className="hidden sm:inline" />{" "}
              <span className="text-[#FFB800]">Class 11 & 12</span>{" "}
              Accountancy.
            </h1>

            {/* Subtitle (18px / line pitch 26px) */}
            <p className="mt-3 text-sm sm:text-[18px] leading-[22px] sm:leading-[26px] text-[#5B6676] max-w-[530px]">
              Learn with concept clarity, practice, and personalised guidance from Ronak Sir.
              Choose the course that fits your preparation goals.
            </p>
          </div>

          {/* Right Column: Hero Illustration Cluster (~500px wide + note separated on right) */}
          <div className="w-full lg:w-auto lg:shrink-0 flex justify-center lg:justify-end z-10">
            <CoursesHeroCluster />
          </div>
        </section>

        {/* CATALOG TOOLBAR & GRID */}
        <section className="pt-2">
          <Suspense
            fallback={
              <div className="w-full py-16 text-center text-sm font-semibold text-slate-400">
                Loading courses...
              </div>
            }
          >
            <CoursesCatalogClient initialCourses={courses} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
