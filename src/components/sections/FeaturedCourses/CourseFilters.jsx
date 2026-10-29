"use client";

import { createContext, useContext, useState, useRef, useEffect } from "react";

const CourseFilterContext = createContext({
  activeFilter: "all",
  setActiveFilter: () => {},
  count: 6,
  setCount: () => {},
});

export function CourseFilterProvider({ children, initialFilter = "all", initialCount = 6 }) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [count, setCount] = useState(initialCount);

  return (
    <CourseFilterContext.Provider value={{ activeFilter, setActiveFilter, count, setCount }}>
      {children}
    </CourseFilterContext.Provider>
  );
}

export function useCourseFilter() {
  return useContext(CourseFilterContext);
}

/**
 * Filter tabs row for Section B: Featured Batches.
 * Exact visual replica: 46u high, padding-x 34u, gap 12u.
 * Active style lives on the button itself: background #FFC21A, text #0F172A, weight 700, shadow 0 8px 20px -8px rgba(255,194,26,.7).
 * Inactive: white, 1px #EBE6D8 border.
 * Transition background-color, color, box-shadow, transform 250ms; :active scale(.97).
 * aria-pressed mirrors state.
 * On change call scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }).
 */
export default function CourseFilters({ filters }) {
  const { activeFilter, setActiveFilter, count } = useCourseFilter();
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const el = tabRefs.current[activeFilter];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeFilter]);

  const handleTabClick = (key) => {
    setActiveFilter(key);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Screen reader live region for filter announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        Showing {count} {count === 1 ? "course" : "courses"}
      </div>

      {/* Tabs Container */}
      <div className="w-full max-w-full overflow-hidden relative">
        <div
          ref={containerRef}
          role="tablist"
          aria-label="Course batch filters"
          className="relative flex items-center overflow-x-auto lg:overflow-x-visible flex-nowrap justify-start lg:justify-center px-4 sm:px-6 py-2 no-scrollbar snap-x snap-mandatory"
          style={{
            gap: "clamp(8px, 1.2vw, 12px)",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                ref={(el) => (tabRefs.current[filter.key] = el)}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(filter.key)}
                className={`relative z-10 shrink-0 snap-center cursor-pointer rounded-full flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2 whitespace-nowrap active:scale-[0.97] transition-all duration-200 ${
                  isActive
                    ? "bg-[#FFB800] text-[#0F172A] font-bold shadow-[0_6px_20px_-4px_rgba(255,184,0,0.45)] border border-transparent"
                    : "bg-white text-[#1E293B] font-medium border border-[#EBE6D8] shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:border-[#FFB800] hover:text-[#0F172A] hover:-translate-y-0.5"
                }`}
                style={{
                  height: "44px",
                  paddingLeft: "clamp(16px, 2vw, 28px)",
                  paddingRight: "clamp(16px, 2vw, 28px)",
                  fontSize: "14.5px",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
