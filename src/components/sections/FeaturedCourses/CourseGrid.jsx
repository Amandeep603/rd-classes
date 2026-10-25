"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import { useCourseFilter } from "./CourseFilters";

/**
 * Responsive grid of course cards using CourseCard variant="home".
 * Subscribes to active filter, filters courses, updates live announcement count,
 * and handles staggered fade-in animations.
 * Layout: 3 cols >=1024px, 2 cols 640-1023px, 1 col <640px (max-w 480px).
 * Column gap: 16u, row gap: 24u.
 */
export default function CourseGrid({ courses = [] }) {
  const { activeFilter, setCount } = useCourseFilter();

  const filteredCourses = useMemo(() => {
    if (activeFilter === "all") return courses;
    return courses.filter(
      (c) => c.category === activeFilter || c.categories?.includes(activeFilter)
    );
  }, [courses, activeFilter]);

  useEffect(() => {
    setCount(filteredCourses.length);
  }, [filteredCourses.length, setCount]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-[480px] sm:max-w-none mx-auto items-stretch"
        style={{
          columnGap: "clamp(16px, 2vw, calc(var(--su, 1px) * 22))",
          rowGap: "clamp(20px, 2.8vw, calc(var(--su, 1px) * 28))",
        }}
      >
        {filteredCourses.map((course, idx) => (
          <div
            key={`${activeFilter}-${course._id || course.slug || idx}`}
            className="animate-filter-card h-full flex flex-col"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <CourseCard course={course} variant="home" />
          </div>
        ))}
      </div>

      {/* Centered "View all courses ->" link */}
      <div className="w-full flex justify-center mt-10 sm:mt-12">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm sm:text-base font-extrabold text-[#0B2A47] bg-white border border-[#E2E8F0] shadow-sm hover:border-[#FFC21A] hover:bg-[#FFFDF5] hover:shadow-md transition-all active:scale-98"
        >
          <span>View all courses</span>
          <ArrowRight className="w-4 h-4 text-[#0B2A47]" />
        </Link>
      </div>
    </div>
  );
}
