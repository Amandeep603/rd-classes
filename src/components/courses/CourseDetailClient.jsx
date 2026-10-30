"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Lock,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Video,
  FileText,
  FileCheck,
  ClipboardList,
  FileClock,
  Bookmark,
  X,
  Globe,
  ArrowRight,
  Infinity as InfinityIcon,
  BookOpen,
} from "lucide-react";
import AccessDialog from "./AccessDialog";
import NoteCard from "@/components/notes/NoteCard";
import PdfViewerModal from "@/components/notes/PdfViewerModal";
import VimeoPlayer from "@/components/student/VimeoPlayer";
import CourseSyllabus from "@/components/course/CourseSyllabus";

const SECTION_TONE_CYCLE = [
  { bg: "#E8F1FD", text: "#1E5BD8" }, // 01 blue
  { bg: "#FFF1DB", text: "#E8870E" }, // 02 orange
  { bg: "#FDE8E8", text: "#E5484D" }, // 03 rose
  { bg: "#E3F6EC", text: "#1F9D63" }, // 04 green
  { bg: "#EFE9FD", text: "#7C4DDB" }, // 05 violet
];

const RELATED_TONE_CYCLE = [
  { bg: "#E3F6EC", text: "#1F9D63" }, // green
  { bg: "#EFE9FD", text: "#7C4DDB" }, // violet
  { bg: "#FFF1DB", text: "#E8870E" }, // orange
];

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTotalTime(items) {
  const totalSec = items.reduce(
    (acc, l) => acc + (l.durationSec || l.durationSeconds || l.duration || 0),
    0
  );
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function renderCourseIncludeIcon(iconKey, text = "") {
  const iconClass = "w-5 h-5 text-[#1B2B4B] shrink-0";
  const lower = (text || iconKey || "").toLowerCase();

  if (iconKey === "video" || lower.includes("video") || lower.includes("lecture")) {
    return <Video className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "notes" || lower.includes("note") || lower.includes("pdf")) {
    return <FileText className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "practice" || lower.includes("practice") || lower.includes("solution")) {
    return <FileCheck className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "tests" || lower.includes("test") || lower.includes("mock") || lower.includes("board")) {
    return <ClipboardList className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "papers" || lower.includes("paper") || lower.includes("previous") || lower.includes("year")) {
    return <FileClock className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "globe" || lower.includes("bilingual") || lower.includes("english") || lower.includes("hindi")) {
    return <Globe className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (iconKey === "infinity" || lower.includes("lifetime") || lower.includes("access")) {
    return <InfinityIcon className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  return <CheckCircle2 className={iconClass} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />;
}

export default function CourseDetailClient({
  course,
  lectures = [],
  initialNotes = [],
  relatedCourses = [],
  siteWhatsapp = "918368545620",
  whatsappDefaultMessage = "",
}) {
  const [activeTab, setActiveTab] = useState("lectures");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewLecture, setPreviewLecture] = useState(null);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedLockedLecture, setSelectedLockedLecture] = useState(null);
  const [viewingPdfNote, setViewingPdfNote] = useState(null);

  // Accordion state: map of chapterName -> boolean
  const [toggledChapters, setToggledChapters] = useState({});

  // Personalized student data
  const [userData, setUserData] = useState(null);
  const [, setUserLoading] = useState(true);
  const [isSavedForLater, setIsSavedForLater] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const savedList = JSON.parse(localStorage.getItem("rd_saved_courses") || "[]");
      return Array.isArray(savedList) && savedList.includes(course.slug);
    } catch {
      return false;
    }
  });

  // Related courses carousel index
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Measure if sidebar fits in viewport to enable sticky without internal scrolling
  const sidebarRef = useRef(null);
  const [canStick, setCanStick] = useState(false);

  useEffect(() => {
    function checkStickability() {
      if (!sidebarRef.current) return;
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      // top offset: navbar (~72px) + tabs (~64px) + gaps (~24px) = ~160px
      const availableHeight = viewportHeight - 160;
      setCanStick(sidebarHeight > 0 && sidebarHeight <= availableHeight);
    }

    checkStickability();
    window.addEventListener("resize", checkStickability);
    let observer;
    if (typeof ResizeObserver !== "undefined" && sidebarRef.current) {
      observer = new ResizeObserver(checkStickability);
      observer.observe(sidebarRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkStickability);
      if (observer) observer.disconnect();
    };
  }, []);

  // Filter notes into general notes vs practice questions
  const effectiveNotes =
    userData?.enrolledNotes && userData.enrolledNotes.length > 0
      ? userData.enrolledNotes
      : initialNotes;

  const practiceNotes = useMemo(() => {
    return effectiveNotes.filter(
      (n) => n.kind === "practice" || n.category === "practice-questions"
    );
  }, [effectiveNotes]);

  const conceptNotes = useMemo(() => {
    return effectiveNotes.filter(
      (n) => n.kind !== "practice" && n.category !== "practice-questions"
    );
  }, [effectiveNotes]);

  // Fetch student access status & saved state
  useEffect(() => {
    let cancelled = false;
    async function fetchCourseAccess() {
      try {
        const res = await fetch(`/api/me/course-access?slug=${encodeURIComponent(course.slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setUserData(data);
            if (typeof data.saved === "boolean") {
              setIsSavedForLater(data.saved);
            }
          }
        }
      } catch {
        // Fallback to visitor mode
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    }
    fetchCourseAccess();

    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  // Handle Save for Later
  const handleToggleSave = async () => {
    const nextSaved = !isSavedForLater;
    setIsSavedForLater(nextSaved);

    try {
      const savedList = JSON.parse(localStorage.getItem("rd_saved_courses") || "[]");
      let updated;
      if (nextSaved) {
        updated = Array.from(new Set([...savedList, course.slug]));
      } else {
        updated = savedList.filter((s) => s !== course.slug);
      }
      localStorage.setItem("rd_saved_courses", JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (userData?.student) {
      try {
        await fetch("/api/me/course-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: course.slug,
            action: nextSaved ? "save" : "unsave",
          }),
        });
      } catch {
        // ignore
      }
    }
  };

  // Group lectures into Books > Chapters
  const booksList = useMemo(() => {
    const booksMap = new Map();

    for (const lec of lectures) {
      const bookKey = lec.bookId || lec.book || "Book 1";
      const bookTitle = lec.book || "Book 1: Accountancy";
      const bookPosition = typeof lec.bookPosition === "number" ? lec.bookPosition : 0;

      if (!booksMap.has(bookKey)) {
        booksMap.set(bookKey, {
          key: String(bookKey),
          id: lec.bookId || bookKey,
          title: bookTitle,
          position: bookPosition,
          chaptersMap: new Map(),
        });
      }
      const bObj = booksMap.get(bookKey);

      const chapterKey = lec.chapterId || `${bookKey}:::${lec.chapter || lec.section || "General"}`;
      const chapterTitle = lec.chapter || lec.section || "General";
      const chapterPosition = typeof lec.chapterPosition === "number" ? lec.chapterPosition : 0;

      if (!bObj.chaptersMap.has(chapterKey)) {
        bObj.chaptersMap.set(chapterKey, {
          key: String(chapterKey),
          id: lec.chapterId || chapterKey,
          title: chapterTitle,
          book: bookTitle,
          position: chapterPosition,
          items: [],
        });
      }
      bObj.chaptersMap.get(chapterKey).items.push(lec);
    }

    const result = Array.from(booksMap.values()).map((b) => {
      const chapters = Array.from(b.chaptersMap.values()).map((ch) => {
        const items = [...ch.items].sort((x, y) => {
          if (x.position !== undefined && y.position !== undefined && x.position !== y.position) {
            return x.position - y.position;
          }
          return (x.partNumber || 0) - (y.partNumber || 0);
        });

        const freeCount = items.filter((l) =>
          Boolean(l.isFree || l.freePreview || l.isFreePreview || l.isPreview)
        ).length;

        return {
          ...ch,
          items,
          count: items.length,
          freeCount,
          totalTime: formatTotalTime(items),
        };
      });

      chapters.sort((x, y) => (x.position ?? 0) - (y.position ?? 0));

      return {
        ...b,
        chapters,
        totalItems: chapters.reduce((sum, ch) => sum + ch.count, 0),
      };
    });

    result.sort((x, y) => (x.position ?? 0) - (y.position ?? 0));
    return result;
  }, [lectures]);

  // First chapter that contains a free lecture across all books
  const firstFreeChapterKey = useMemo(() => {
    for (const b of booksList) {
      for (const ch of b.chapters) {
        if (ch.freeCount > 0) {
          return ch.key;
        }
      }
    }
    return null;
  }, [booksList]);

  // Filter books and chapters by search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return booksList;
    const q = searchQuery.toLowerCase().trim();

    return booksList
      .map((b) => {
        const matchesBook = b.title.toLowerCase().includes(q);
        const filteredChapters = b.chapters
          .map((ch) => {
            const matchesChapter = ch.title.toLowerCase().includes(q);
            const matchedItems = ch.items.filter((item) =>
              item.title.toLowerCase().includes(q)
            );

            if (matchesBook || matchesChapter || matchedItems.length > 0) {
              const items = matchesBook || matchesChapter ? ch.items : matchedItems;
              return {
                ...ch,
                items,
                count: items.length,
                freeCount: items.filter((l) =>
                  Boolean(l.isFree || l.freePreview || l.isFreePreview || l.isPreview)
                ).length,
                totalTime: formatTotalTime(items),
              };
            }
            return null;
          })
          .filter(Boolean);

        if (filteredChapters.length > 0) {
          return {
            ...b,
            chapters: filteredChapters,
            totalItems: filteredChapters.reduce((sum, ch) => sum + ch.count, 0),
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [booksList, searchQuery]);

  // Collapse all chapters by default EXCEPT the first chapter that contains a free lecture
  const isChapterExpanded = (key) => {
    if (searchQuery.trim()) return true;
    if (toggledChapters[key] !== undefined) {
      return toggledChapters[key];
    }
    return key === firstFreeChapterKey;
  };

  const toggleChapter = (key) => {
    const current = isChapterExpanded(key);
    setToggledChapters((prev) => ({
      ...prev,
      [key]: !current,
    }));
  };

  const openAccessModal = (lockedInfo = null) => {
    if (typeof lockedInfo === "string") {
      setSelectedLockedLecture({ title: lockedInfo, book: "", chapter: "" });
    } else {
      setSelectedLockedLecture(lockedInfo);
    }
    setAccessDialogOpen(true);
  };

  // Carousel navigation
  const maxCarouselIndex = Math.max(0, relatedCourses.length - 3);
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };
  const handleNextCarousel = () => {
    setCarouselIndex((prev) => Math.min(maxCarouselIndex, prev + 1));
  };

  // Render Access / Progress Card (used in desktop sticky sidebar and mobile top position)
  const renderAccessOrProgressCard = () => {
    return (
      <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 shadow-[0_4px_16px_rgba(20,30,60,0.05)] space-y-4">
        {userData?.enrolled ? (
          // Enrolled Student Progress Card
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[18px] font-bold text-[#0B2A4A]">Your Progress</h4>
              <span className="text-[14px] font-bold text-[#0B2A4A]">
                {userData.progressPercent || 0}%
              </span>
            </div>

            <p className="text-[14px] text-[#6B7385]">
              {userData.completedLectures || 0} of {userData.totalLectures || lectures.length} lectures completed
            </p>

            {/* Progress Bar with Indicator Dot */}
            <div className="relative w-full h-2 rounded-full bg-[#E2E8F0]">
              <div
                className="h-full bg-[#0B2A4A] rounded-full transition-all duration-300 relative"
                style={{ width: `${Math.min(100, Math.max(3, userData.progressPercent || 0))}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0B2A4A] border-2 border-white rounded-full shadow-xs" />
              </div>
            </div>

            <div className="pt-1 space-y-2.5">
              <Link
                href={`/student/courses/${course.slug}${
                  userData.lastWatchedLectureId ? `/lectures/${userData.lastWatchedLectureId}` : ""
                }`}
                className="w-full h-[52px] rounded-[14px] bg-[#0B2A4A] hover:bg-[#152B52] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4 text-white" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </Link>

              <button
                type="button"
                onClick={handleToggleSave}
                className={`w-full h-[48px] rounded-[14px] border text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSavedForLater
                    ? "bg-[#FFFBEB] text-[#0B2A4A] border-[#FFB800]"
                    : "bg-white text-[#0B2A4A] border-[#D9DFEA] hover:bg-[#F8FAFC]"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 text-[#0B2A4A] ${isSavedForLater ? "fill-[#0B2A4A]" : ""}`}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <span>{isSavedForLater ? "Saved for Later" : "Save for Later"}</span>
              </button>
            </div>
          </div>
        ) : (
          // Visitor Action Card
          <div className="space-y-4">
            <div>
              <h4 className="text-[18px] font-bold text-[#0B2A4A]">Get Full Course Access</h4>
              <p className="text-[14px] text-[#6B7385] mt-1 leading-relaxed">
                Access all video lectures, chapter notes, Sunday mock tests, and mentor guidance.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => openAccessModal()}
                className="w-full h-[52px] rounded-[14px] bg-[#0B2A4A] hover:bg-[#152B52] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.28 16.46 16.59 20.15 12.05 20.15ZM16.57 14.34C16.32 14.21 15.1 13.61 14.88 13.53C14.65 13.45 14.49 13.41 14.32 13.66C14.16 13.9 13.69 14.45 13.55 14.61C13.41 14.77 13.27 14.79 13.02 14.66C12.77 14.54 11.98 14.28 11.04 13.44C10.31 12.79 9.81 11.98 9.67 11.74C9.53 11.49 9.66 11.36 9.78 11.23C9.89 11.12 10.03 10.94 10.15 10.8C10.27 10.66 10.31 10.56 10.39 10.4C10.47 10.23 10.43 10.09 10.37 9.97C10.31 9.84 9.82 8.64 9.61 8.14C9.41 7.66 9.21 7.72 9.06 7.71C8.92 7.7 8.76 7.7 8.59 7.7C8.43 7.7 8.16 7.76 7.94 8C7.71 8.25 7.08 8.84 7.08 10.04C7.08 11.24 7.96 12.4 8.08 12.56C8.2 12.73 9.79 15.18 12.24 16.23C12.82 16.48 13.27 16.63 13.63 16.74C14.22 16.93 14.75 16.9 15.18 16.84C15.65 16.77 16.64 16.24 16.84 15.67C17.05 15.1 17.05 14.61 16.99 14.51C16.93 14.41 16.82 14.46 16.57 14.34Z" />
                </svg>
                <span>Get Access on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSave}
                className={`w-full h-[48px] rounded-[14px] border text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSavedForLater
                    ? "bg-[#FFFBEB] text-[#0B2A4A] border-[#FFB800]"
                    : "bg-white text-[#0B2A4A] border-[#D9DFEA] hover:bg-[#F8FAFC]"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 text-[#0B2A4A] ${isSavedForLater ? "fill-[#0B2A4A]" : ""}`}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <span>{isSavedForLater ? "Saved for Later" : "Save for Later"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 1. TABS + SEARCH BAR: White Card Container (rounded-[18px], 64px on desktop, sticky under navbar) */}
      <div
        className="sticky z-20 mt-4 mb-4 rounded-[18px] bg-white border border-[rgba(20,30,60,0.06)] shadow-[0_4px_20px_rgba(20,30,60,0.06)] px-4 sm:px-6 transition-all"
        style={{ top: "calc(var(--nav-h, 72px) + 8px)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-2 sm:py-0 sm:h-16">
          {/* Navigation Tabs (Lectures, About, Faculty, Notes, Practice Questions) */}
          <div
            role="tablist"
            aria-label="Course Sections"
            className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar h-[52px] sm:h-full shrink-0"
          >
            {[
              { id: "lectures", label: "Lectures" },
              { id: "about", label: "About" },
              { id: "faculty", label: "Faculty" },
              { id: "notes", label: "Notes" },
              { id: "practice", label: "Practice Questions" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 text-[15px] transition-all whitespace-nowrap cursor-pointer h-full flex items-center ${
                    isActive
                      ? "text-[#0B2A4A] font-bold"
                      : "text-[#4A5570] font-medium hover:text-[#0B2A4A]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 sm:bottom-2 left-2 right-2 h-[3px] bg-[#FFB800] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Curriculum Search Box (Under 640px: 2nd row 52px; Desktop: 80 width) */}
          <div className="relative w-full sm:w-80 shrink-0 h-[52px] sm:h-auto flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A6]" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures, topics, or keywords..."
              className="w-full pl-10 pr-9 bg-white border border-[#E3E8F0] rounded-full text-xs text-[#0B2A4A] placeholder-[#8A93A6] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET RESPONSIVE ORDER (<1024px): Hero -> Tabs -> Access/Progress Card -> Lectures */}
      <div className="block lg:hidden mb-6">
        {renderAccessOrProgressCard()}
      </div>

      {/* 2. TWO-COLUMN LAYOUT (Max 1240px, Gap 24px, Left Flexible + Right 360px) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-4">
        {/* LEFT COLUMN: Content Panels (Flexible) */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          {/* TAB 1: LECTURES ACCORDION */}
          {activeTab === "lectures" && (
            <div
              id="panel-lectures"
              role="tabpanel"
              aria-labelledby="tab-lectures"
              className="space-y-6"
              style={{ scrollMarginTop: "152px" }}
            >
              <CourseSyllabus
                course={course}
                lectures={lectures}
                isEnrolled={!!userData?.enrolled}
                completedLectureIds={userData?.completedLectureIds || []}
                lectureProgressMap={userData?.progressMap || {}}
                whatsappNumber={siteWhatsapp}
                showCourseHeader={false}
              />
            </div>
          )}

          {/* TAB 2: ABOUT PANEL */}
          {activeTab === "about" && (
            <div
              id="panel-about"
              role="tabpanel"
              aria-labelledby="tab-about"
              className="space-y-6"
              style={{ scrollMarginTop: "152px" }}
            >
              <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 sm:p-6 space-y-4 shadow-[0_4px_16px_rgba(20,30,60,0.05)]">
                <h3 className="text-[18px] font-bold text-[#0B2A4A]">About This Course</h3>
                <p className="text-[15px] text-[#475569] leading-relaxed">
                  {course.about || course.description}
                </p>
              </div>

              {course.highlights && course.highlights.length > 0 && (
                <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 sm:p-6 space-y-4 shadow-[0_4px_16px_rgba(20,30,60,0.05)]">
                  <h3 className="text-[18px] font-bold text-[#0B2A4A]">Key Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[rgba(20,30,60,0.06)]"
                      >
                        {renderCourseIncludeIcon(h.icon || "check", h.text || h.label)}
                        <span className="text-[14px] font-medium text-[#0B2A4A]">
                          {h.text || h.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACULTY PANEL */}
          {activeTab === "faculty" && (
            <div
              id="panel-faculty"
              role="tabpanel"
              aria-labelledby="tab-faculty"
              className="space-y-6"
              style={{ scrollMarginTop: "152px" }}
            >
              <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 sm:p-6 space-y-5 shadow-[0_4px_16px_rgba(20,30,60,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#FFE6A8] flex items-center justify-center text-[#0B2A4A] font-extrabold text-[20px] shrink-0">
                    RD
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold text-[#0B2A4A]">
                      {course.facultyName || "Ronak Dugar"}
                    </h3>
                    <p className="text-[14px] text-[#6B7385] font-medium">
                      {course.facultyRole || "Lead Accountancy Faculty"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[rgba(20,30,60,0.06)]">
                  {(
                    course.facultyPoints ||
                    course.facultyBullets || [
                      "10+ years of teaching experience",
                      "Specialized in Class 11 & 12 Accountancy",
                      "Concept-based and exam-oriented approach",
                      "Trusted by thousands of students",
                    ]
                  ).map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[14px] text-[#334155]">
                      <CheckCircle2 className="w-[18px] h-[18px] text-[#1F9D63] shrink-0 mt-0.5" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES PANEL */}
          {activeTab === "notes" && (
            <div
              id="panel-notes"
              role="tabpanel"
              aria-labelledby="tab-notes"
              className="space-y-4"
              style={{ scrollMarginTop: "152px" }}
            >
              {conceptNotes.length === 0 ? (
                <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-8 text-center space-y-2">
                  <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" strokeWidth={1.75} />
                  <h3 className="text-base font-bold text-[#0B1B3D]">No Notes Available</h3>
                  <p className="text-xs text-[#64748B]">
                    Concept notes for this course will be uploaded here shortly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {conceptNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={{
                        ...note,
                        courses: note.courses || [{ title: course.title, theme: course.theme }],
                      }}
                      userData={userData}
                      onViewPdf={(n) => setViewingPdfNote(n)}
                      onOpenAccess={(n) => openAccessModal(`Note: ${n.title}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PRACTICE QUESTIONS PANEL */}
          {activeTab === "practice" && (
            <div
              id="panel-practice"
              role="tabpanel"
              aria-labelledby="tab-practice"
              className="space-y-4"
              style={{ scrollMarginTop: "152px" }}
            >
              {practiceNotes.length === 0 ? (
                <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-8 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" strokeWidth={1.75} />
                  <h3 className="text-base font-bold text-[#0B1B3D]">No Practice Sheets Available</h3>
                  <p className="text-xs text-[#64748B]">
                    Practice worksheets and question banks will appear here shortly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {practiceNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={{
                        ...note,
                        courses: note.courses || [{ title: course.title, theme: course.theme }],
                      }}
                      userData={userData}
                      onViewPdf={(n) => setViewingPdfNote(n)}
                      onOpenAccess={(n) => openAccessModal(`Practice: ${n.title}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 360px SIDEBAR (order: Access/Progress, Course Includes, Faculty) */}
        <div
          ref={sidebarRef}
          className={`w-full lg:w-[360px] shrink-0 space-y-4 ${
            canStick ? "lg:sticky" : "lg:static"
          }`}
          style={
            canStick
              ? { top: "calc(var(--nav-h, 72px) + 88px)" }
              : undefined
          }
        >
          {/* CARD 1: DESKTOP ACCESS / PROGRESS CARD (hidden on mobile, shown on desktop) */}
          <div className="hidden lg:block">
            {renderAccessOrProgressCard()}
          </div>

          {/* CARD 2: COURSE INCLUDES (Dark navy outline icons, 20px, stroke 1.75, NO colored background, 36px rows) */}
          {course.includes && course.includes.length > 0 && (
            <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 shadow-[0_4px_16px_rgba(20,30,60,0.05)] space-y-3.5">
              <h4 className="text-[18px] font-bold text-[#0B2A4A]">Course Includes</h4>
              <div className="space-y-1">
                {course.includes.map((item, idx) => {
                  const text = typeof item === "string" ? item : item.text || item.label || "";
                  const iconKey = typeof item === "object" ? item.icon : "";
                  if (!text) return null;

                  return (
                    <div key={idx} className="h-9 flex items-center gap-3 text-[14.5px] text-[#1F2A44]">
                      {renderCourseIncludeIcon(iconKey, text)}
                      <span className="font-medium text-[#1F2A44] truncate">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CARD 3: FACULTY CARD (56px avatar, soft yellow #FFE6A8 fill, dark navy 'RD', green outline CheckCircle2) */}
          <div className="rounded-[20px] border border-[rgba(20,30,60,0.06)] bg-white p-5 shadow-[0_4px_16px_rgba(20,30,60,0.05)] space-y-3.5">
            <h4 className="text-[18px] font-bold text-[#0B2A4A]">Faculty</h4>
            <div className="flex items-center gap-3.5">
              {/* Soft yellow 56px avatar */}
              <div className="w-14 h-14 rounded-full bg-[#FFE6A8] flex items-center justify-center text-[#0B2A4A] font-extrabold text-[20px] shrink-0">
                RD
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-[#0B2A4A] truncate">
                  {course.facultyName || "Ronak Dugar"}
                </p>
                <p className="text-[14px] text-[#6B7385] truncate">
                  {course.facultyRole || "Lead Accountancy Faculty"}
                </p>
              </div>
            </div>

            {/* Checkmarked Points */}
            <div className="space-y-2.5 pt-3.5 border-t border-[rgba(20,30,60,0.06)]">
              {(
                course.facultyPoints ||
                course.facultyBullets || [
                  "10+ years of teaching experience",
                  "Specialized in Class 11 & 12 Accountancy",
                  "Concept-based and exam-oriented approach",
                  "Trusted by thousands of students",
                ]
              ).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[14px] text-[#334155]">
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#1F9D63] shrink-0 mt-0.5" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                  <span>{bullet}</span>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href="/about"
                  className="text-[14px] font-semibold text-[#1D5FD6] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>View Faculty Profile</span>
                  <ArrowRight className="w-4 h-4 text-[#1D5FD6]" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RELATED COURSES SECTION (64px circle with soft pastel tint, 2-line title, 13px lecture count, arrow chip) */}
      {relatedCourses.length > 0 && (
        <div className="mt-14 pt-10 border-t border-[rgba(20,30,60,0.06)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-9 h-1 bg-[#FFB800] rounded-full mb-3" />
              <h3 className="text-[28px] font-extrabold text-[#0B2A4A] tracking-tight">Related Courses</h3>
              <p className="text-[15px] text-[#6B7385] mt-1">
                Explore more courses to strengthen your preparation.
              </p>
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevCarousel}
                disabled={carouselIndex === 0}
                className="w-9 h-9 rounded-full border border-[#D9DFEA] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-[#1B2B4B] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                aria-label="Previous courses"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </button>
              <button
                type="button"
                onClick={handleNextCarousel}
                disabled={carouselIndex >= maxCarouselIndex}
                className="w-9 h-9 rounded-full border border-[#D9DFEA] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-[#1B2B4B] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                aria-label="Next courses"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
              </button>
            </div>
          </div>

          {/* Cards: 3 in a row on desktop, horizontal scroll on mobile (< 1024px) */}
          <div className="flex overflow-x-auto no-scrollbar snap-x pb-2 gap-4 lg:grid lg:grid-cols-3 lg:gap-5 items-stretch">
            {relatedCourses.slice(carouselIndex, carouselIndex + 3).map((rel, relIdx) => {
              const tone = RELATED_TONE_CYCLE[relIdx % RELATED_TONE_CYCLE.length];

              return (
                <Link
                  key={rel._id || rel.slug}
                  href={`/courses/${rel.slug}`}
                  className="group p-[18px] rounded-[18px] border border-[rgba(20,30,60,0.06)] bg-white hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-4 shadow-[0_4px_16px_rgba(20,30,60,0.05)] hover:shadow-md min-w-[280px] sm:min-w-[320px] lg:min-w-0 shrink-0 lg:shrink h-full"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* 64px Circular Icon Container */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: tone.bg, color: tone.text }}
                    >
                      {rel.slug?.includes("11") || relIdx % 3 === 2 ? (
                        <BookOpen className="w-7 h-7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <FileText className="w-7 h-7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[16px] font-bold text-[#0B2A4A] group-hover:text-[#1D5FD6] transition-colors line-clamp-2 leading-snug">
                        {rel.title} {rel.subtitle ? `(${rel.subtitle.replace(/^\(|\)$/g, "")})` : ""}
                      </h4>
                      <p className="text-[13px] text-[#6B7385] font-normal mt-1">
                        {rel.lectureCount ||
                          (rel.metaRight && /^\d+/.test(rel.metaRight)
                            ? rel.metaRight.replace(/HD\s+/i, "").trim()
                            : rel.slug?.includes("11")
                            ? "90 Lectures"
                            : "120 Lectures")}
                      </p>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-white border border-[#D9DFEA] group-hover:bg-[#0B2A4A] text-[#1B2B4B] group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                    <ArrowRight className="w-4 h-4" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Access Dialog Modal */}
      <AccessDialog
        isOpen={accessDialogOpen}
        onClose={() => {
          setAccessDialogOpen(false);
          setSelectedLockedLecture(null);
        }}
        course={course}
        courseTitle={course.title}
        courseSlug={course.slug}
        userData={userData}
        siteWhatsapp={siteWhatsapp}
        whatsappDefaultMessage={whatsappDefaultMessage}
        lockedLecture={selectedLockedLecture}
        lockedLectureTitle={
          typeof selectedLockedLecture === "object"
            ? selectedLockedLecture?.title || ""
            : selectedLockedLecture || ""
        }
        lockedLectureBook={
          typeof selectedLockedLecture === "object"
            ? selectedLockedLecture?.book || ""
            : ""
        }
        lockedLectureChapter={
          typeof selectedLockedLecture === "object"
            ? selectedLockedLecture?.chapter || ""
            : ""
        }
      />

      {/* Free Lecture Preview Modal */}
      {previewLecture && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setPreviewLecture(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#E2E8F0]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
              <div className="min-w-0 pr-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF2FE] text-[#1D5FD6] border border-[#BFDBFE] mb-1">
                  <Play className="w-2.5 h-2.5 fill-[#1D5FD6]" /> Free Preview
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0B2A4A] truncate">
                  {previewLecture.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLecture(null)}
                className="w-8 h-8 rounded-full hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0B2A4A] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video w-full bg-black">
              {previewLecture.playerUrl || previewLecture.vimeoId ? (
                <VimeoPlayer
                  playerUrl={previewLecture.playerUrl}
                  vimeoId={previewLecture.vimeoId}
                  vimeoHash={previewLecture.vimeoHash}
                  watermarkText="RD Classes Preview"
                  enableProgress={false}
                />
              ) : previewLecture.videoUrl ? (
                <video
                  src={previewLecture.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center">
                  <Video className="w-12 h-12 text-[#FFB800] mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-semibold">Video preview will be available soon.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-white border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#6B7385] text-center sm:text-left">
                Enjoying this class? Get full access to all lectures, handwritten notes, and Sunday tests on WhatsApp.
              </div>
              <button
                type="button"
                onClick={() => {
                  const lec = previewLecture;
                  setPreviewLecture(null);
                  openAccessModal({
                    title: lec.title,
                    book: lec.book || "",
                    chapter: lec.chapter || "",
                  });
                }}
                className="h-[44px] px-6 rounded-full bg-[#0B2A4A] hover:bg-[#152B52] text-white text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                Get Access on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdfNote && (
        <PdfViewerModal
          isOpen={!!viewingPdfNote}
          onClose={() => setViewingPdfNote(null)}
          note={viewingPdfNote}
        />
      )}
    </div>
  );
}
