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
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pt-24 sm:pt-28 pb-24 overflow-x-clip">
      {/* JSON-LD Catalog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* HERO SECTION */}
        <section className="relative pt-6 sm:pt-10 pb-12 lg:pb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
          {/* Left Column: Eyebrow + H1 + Subtitle */}
          <div className="max-w-2xl flex-1 z-10">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-0.5 rounded-full bg-[#FFC21A]" />
              <span className="text-[12px] sm:text-[13px] font-extrabold uppercase tracking-widest text-[#64748B]">
                OUR COURSES
              </span>
            </div>

            {/* H1 Headline */}
            <h1 className="text-[34px] sm:text-[46px] lg:text-[54px] font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
              Structured Courses for{" "}
              <span className="text-[#FFB800]">Class 11 & 12</span>{" "}
              Accountancy.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-[18px] text-[#5B6676] leading-relaxed max-w-xl">
              Learn with concept clarity, practice, and personalised guidance from Ronak Sir.
              Choose the course that fits your preparation goals.
            </p>
          </div>

          {/* Right Column: Hero Illustration Cluster */}
          <div className="w-full lg:w-auto lg:shrink-0 flex justify-center lg:justify-end z-10">
            <CoursesHeroCluster />
          </div>
        </section>

        {/* CATALOG TOOLBAR & GRID */}
        <section className="pt-4">
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
