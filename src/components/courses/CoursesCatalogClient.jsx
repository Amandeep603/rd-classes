"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, BookOpen, X, ChevronDown, MessageCircle, LogIn } from "lucide-react";
import CourseCard from "./CourseCard";
import { SITE_CONFIG } from "@/constants/site";

const BASE_FILTER_CHIPS = [
  { key: "all", label: "All Courses" },
  { key: "Class 12 CBSE", label: "Class 12 CBSE" },
  { key: "Class 11 Foundation", label: "Class 11 Foundation" },
  { key: "Recorded Portal", label: "Recorded Portal" },
  { key: "Test Series", label: "Test Series" },
  { key: "Crash Courses", label: "Crash Courses" },
];

export default function CoursesCatalogClient({ initialCourses = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterChips = useMemo(() => {
    const existing = new Set(BASE_FILTER_CHIPS.map((f) => f.key.toLowerCase()));
    const chips = [...BASE_FILTER_CHIPS];
    initialCourses.forEach((c) => {
      if (Array.isArray(c.categories)) {
        c.categories.forEach((cat) => {
          const clean = (cat || "").trim();
          if (clean && !existing.has(clean.toLowerCase())) {
            existing.add(clean.toLowerCase());
            chips.push({ key: clean, label: clean });
          }
        });
      }
    });
    return chips;
  }, [initialCourses]);

  const category = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "popular";
  const urlSearch = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const chipRefs = useRef({});
  const isInitialMount = useRef(true);

  // Debounced search sync to URL search params (200ms)
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
    }, 200);

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

    // 1. Category Filter (Combined with search)
    if (category !== "all") {
      const target = category.toLowerCase().trim();
      result = result.filter((c) => {
        if (Array.isArray(c.categories) && c.categories.some((t) => t.toLowerCase().trim() === target)) {
          return true;
        }
        if (target === "class 12 cbse" || target === "class12") {
          return c.categories?.some((t) => t.toLowerCase().includes("12")) || c.classLabel?.includes("12") || c.category === "class12";
        }
        if (target === "class 11 foundation" || target === "class11") {
          return c.categories?.some((t) => t.toLowerCase().includes("11")) || c.classLabel?.includes("11") || c.category === "class11";
        }
        if (target === "recorded portal" || target === "recorded") {
          return c.categories?.some((t) => t.toLowerCase().includes("recorded")) || c.category === "recorded" || c.slug?.includes("recorded");
        }
        if (target === "test series" || target === "test") {
          return c.categories?.some((t) => t.toLowerCase().includes("test")) || c.category === "test-series" || c.slug?.includes("test");
        }
        if (target === "crash courses" || target === "crash") {
          return c.categories?.some((t) => t.toLowerCase().includes("crash")) || c.category === "crash" || c.slug?.includes("crash");
        }
        return c.category?.toLowerCase() === target;
      });
    }

    // 2. Search Query Filter (Title, Subtitle, Description)
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
    } else if (sortBy === "class11") {
      result.sort((a, b) => {
        const a11 = a.classLabel?.includes("11") || a.category === "class11" ? 0 : 1;
        const b11 = b.classLabel?.includes("11") || b.category === "class11" ? 0 : 1;
        if (a11 !== b11) return a11 - b11;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    } else if (sortBy === "class12") {
      result.sort((a, b) => {
        const a12 = a.classLabel?.includes("12") || a.category === "class12" ? 0 : 1;
        const b12 = b.classLabel?.includes("12") || b.category === "class12" ? 0 : 1;
        if (a12 !== b12) return a12 - b12;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    } else {
      // "popular" (default, uses admin-set order and popularity field)
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
          Comprehensive Class 11 &amp; 12 Accountancy batches are being scheduled. Reach out directly on WhatsApp to receive batch schedules and admission details.
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
      {/* FILTER ROW (One line on desktop, directly below hero, no overlap) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        {/* Left: Pill Tabs (Horizontal scroll on tablet/mobile with no wrap) */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
          <div
            role="tablist"
            aria-label="Course categories"
            className="flex items-center gap-2 whitespace-nowrap flex-nowrap py-1"
          >
            {filterChips.map((chip) => {
              const isActive = category === chip.key;
              return (
                <button
                  key={chip.key}
                  ref={(el) => (chipRefs.current[chip.key] = el)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(chip.key)}
                  className={`shrink-0 rounded-full px-4 sm:px-4.5 h-[38px] flex items-center justify-center text-xs sm:text-[13px] transition-all active:scale-97 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] ${
                    isActive
                      ? "bg-[#FFB800] text-[#0A0A0A] font-bold shadow-xs"
                      : "bg-white text-[#475569] font-medium border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] hover:text-[#0B1B3B]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Search & Sort Controls (One row on desktop) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Box with Search Icon */}
          <div className="relative w-full sm:w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[38px] pl-9 pr-7 rounded-full bg-white border border-[#E2E8F0] text-xs sm:text-[12.5px] text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#64748B] whitespace-nowrap hidden sm:inline">
              Sort by
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sort courses"
                className="h-[38px] pl-3.5 pr-8 rounded-full bg-white border border-[#E2E8F0] text-xs sm:text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all appearance-none cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="alpha">Title A to Z</option>
                <option value="class11">Class 11 first</option>
                <option value="class12">Class 12 first</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* CARDS GRID */}
      {filteredAndSortedCourses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center my-6">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            No courses match
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            We couldn’t find any courses matching your selected filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFB800] text-[#0A0A0A] hover:bg-[#FFC933] transition-all cursor-pointer shadow-xs"
            >
              <span>Clear filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200">
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
