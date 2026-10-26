"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, BookOpen, X, MessageCircle, LogIn } from "lucide-react";
import CourseCard from "./CourseCard";
import { SITE_CONFIG } from "@/constants/site";

const FILTER_CHIPS = [
  { key: "all", label: "All Courses" },
  { key: "class12", label: "Class 12 CBSE" },
  { key: "class11", label: "Class 11 Foundation" },
  { key: "recorded", label: "Recorded Portal" },
  { key: "test-series", label: "Test Series" },
  { key: "crash", label: "Crash Courses" },
];

export default function CoursesCatalogClient({ initialCourses = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "popular";
  const urlSearch = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const chipRefs = useRef({});
  const isInitialMount = useRef(true);

  // Debounced search sync to URL search params
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (searchQuery.trim() !== currentQ) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        } else {
          params.delete("q");
        }
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, pathname, router]);

  // Scroll active chip into view on mobile
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const el = chipRefs.current[category];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [category]);

  const handleCategoryChange = (newCat) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCat && newCat !== "all") {
      params.set("category", newCat);
    } else {
      params.delete("category");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== "popular") {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.replace(pathname, { scroll: false });
  };

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...initialCourses];

    // 1. Category Filter
    if (category !== "all") {
      result = result.filter(
        (c) => c.category === category || c.categories?.includes(category)
      );
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.metaText?.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "alpha") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      // "popular": featured first, then by order asc
      result.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    }

    return result;
  }, [initialCourses, category, searchQuery, sortBy]);

  const hasActiveFilters =
    category !== "all" || searchQuery.trim() !== "" || sortBy !== "popular";

  if (initialCourses.length === 0) {
    const phone = SITE_CONFIG?.contact?.phone || "918368545620";
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      "Hello RD Classes, I want to enquire about upcoming Accountancy courses."
    )}`;

    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 sm:p-14 text-center my-8 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE79A] flex items-center justify-center text-[#D99B00]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
          Courses will be announced soon
        </h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          Comprehensive Class 11 & 12 Accountancy batches are being scheduled. Reach out directly on WhatsApp to receive batch schedules and admission details.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#FFB800] text-[#0A0A0A] hover:bg-[#FFC933] shadow-sm transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Enquire on WhatsApp</span>
          </a>
          <Link
            href="/student/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Student Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        {/* Category Chips Container with mobile scroll & edge fade */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-hidden">
          <div
            role="tablist"
            aria-label="Course categories"
            className="flex items-center gap-2 overflow-x-auto sm:overflow-x-visible sm:flex-wrap no-scrollbar py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {FILTER_CHIPS.map((chip) => {
              const isActive = category === chip.key;
              return (
                <button
                  key={chip.key}
                  ref={(el) => (chipRefs.current[chip.key] = el)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(chip.key)}
                  className={`shrink-0 rounded-full px-4 sm:px-4.5 h-[38px] flex items-center justify-center text-xs sm:text-[13px] font-bold transition-all active:scale-97 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] ${
                    isActive
                      ? "bg-[#FFC21A] text-[#0F172A] shadow-xs"
                      : "bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#0F172A]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Search Box (192px wide on desktop, 38px tall) */}
          <div className="relative sm:w-[192px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[38px] pl-9 pr-7 rounded-full bg-white border border-[#E2E8F0] text-xs sm:text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FFC21A] focus:ring-1 focus:ring-[#FFC21A] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Select (38px tall) */}
          <div className="relative sm:w-[140px]">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort courses"
              className="w-full h-[38px] pl-3.5 pr-7 rounded-full bg-white border border-[#E2E8F0] text-xs sm:text-[12.5px] font-semibold text-slate-700 focus:outline-none focus:border-[#FFC21A] focus:ring-1 focus:ring-[#FFC21A] transition-all appearance-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="alpha">A-Z</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* CATALOG GRID */}
      {filteredAndSortedCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center my-6">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            No courses found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            We couldn’t find any courses matching your current filters. Try searching for something else or clearing filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFC21A] text-slate-900 hover:bg-[#ffd54a] transition-all"
            >
              <span>Clear filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
          {filteredAndSortedCourses.map((course) => (
            <div key={course._id || course.slug} className="h-full flex flex-col">
              <CourseCard course={course} variant="catalog" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
