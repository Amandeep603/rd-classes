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
 *
 * Requirements:
 * - "All Batches": shows the featured courses with showOnHome=true (max 6).
 * - Specific tag clicked: shows ALL published courses matching that tag (even if not featured, even if >6).
 * - "View all courses →" link under the grid.
 */
export default function CourseGrid({
  featuredCourses = [],
  allCourses = [],
  courses = [], // backwards compatibility
}) {
  const { activeFilter, setCount } = useCourseFilter();

  const effectiveFeatured = featuredCourses.length > 0 ? featuredCourses : courses;
  const effectiveAll = allCourses.length > 0 ? allCourses : (courses.length > 0 ? courses : featuredCourses);

  const filteredCourses = useMemo(() => {
    if (activeFilter === "all") {
      // Default home shows max 6 featured courses
      return effectiveFeatured.slice(0, 6);
    }

    const target = activeFilter.toLowerCase().trim();

    return effectiveAll.filter((c) => {
      // 1. Direct tag in categories array
      if (Array.isArray(c.categories)) {
        if (c.categories.some((cat) => cat.toLowerCase().trim() === target)) {
          return true;
        }
      }

      // 2. Class 12 CBSE
      if (target === "class 12 cbse" || target === "class12") {
        return (
          c.categories?.some((t) => t.toLowerCase().includes("12")) ||
          c.classLabel?.includes("12") ||
          c.category === "class12" ||
          c.slug?.includes("class-12")
        );
      }

      // 3. Class 11 Foundation
      if (target === "class 11 foundation" || target === "class11") {
        return (
          c.categories?.some((t) => t.toLowerCase().includes("11")) ||
          c.classLabel?.includes("11") ||
          c.category === "class11" ||
          c.slug?.includes("class-11")
        );
      }

      // 4. Recorded Portal
      if (target === "recorded portal" || target === "recorded") {
        return (
          c.categories?.some((t) => t.toLowerCase().includes("recorded")) ||
          c.category === "recorded" ||
          c.slug?.includes("recorded")
        );
      }

      // 5. Crash Courses
      if (target === "crash courses" || target === "crash") {
        return (
          c.categories?.some((t) => t.toLowerCase().includes("crash")) ||
          c.category === "crash" ||
          c.slug?.includes("crash")
        );
      }

      // 6. Direct category match
      if (c.category && c.category.toLowerCase().trim() === target) {
        return true;
      }

      return false;
    });
  }, [activeFilter, effectiveFeatured, effectiveAll]);

  useEffect(() => {
    setCount(filteredCourses.length);
  }, [filteredCourses.length, setCount]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-[480px] sm:max-w-none mx-auto items-stretch gap-[20px] md:gap-[24px] lg:gap-[28px]"
      >
        {filteredCourses.map((course, idx) => (
          <div
            key={`${activeFilter}-${course._id || course.slug || idx}`}
            className="animate-filter-card h-full flex flex-col transition-opacity duration-300"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <CourseCard course={course} variant="home" />
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="py-12 text-center text-sm font-semibold text-slate-500">
          No courses found for this category.
        </div>
      )}

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
