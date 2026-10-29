"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import NoteCard from "./NoteCard";
import PdfViewerModal from "./PdfViewerModal";
import AccessDialog from "@/components/courses/AccessDialog";

export default function NotesDirectoryClient({
  notes = [],
  courses = [],
  siteWhatsapp = "918368545620",
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modals state
  const [viewingPdfNote, setViewingPdfNote] = useState(null);
  const [accessNote, setAccessNote] = useState(null);

  // User access state (student enrollment)
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchUserAccess() {
      try {
        const res = await fetch("/api/me/course-access");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.authenticated) {
            setUserData(data);
          }
        }
      } catch {
        // Fallback to visitor mode
      }
    }
    fetchUserAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute courses that actually have at least 1 published note
  const coursesWithNotes = useMemo(() => {
    const courseMap = new Map();
    for (const note of notes) {
      const cList = Array.isArray(note.courses)
        ? note.courses
        : Array.isArray(note.courseIds)
        ? note.courseIds
        : [];

      for (const c of cList) {
        if (!c) continue;
        const id = (c._id || c).toString();
        if (!courseMap.has(id)) {
          // Find course title & theme from courses list
          const fullCourse = courses.find((orig) => orig._id.toString() === id);
          courseMap.set(id, {
            _id: id,
            title: fullCourse?.title || c.title || "Course",
            theme: fullCourse?.theme || fullCourse?.tone || c.theme || "blue",
          });
        }
      }
    }
    return Array.from(courseMap.values());
  }, [notes, courses]);

  // Combined Filtering and Sorting
  const filteredNotes = useMemo(() => {
    let result = notes;

    // 1. Filter by Course
    if (selectedCourseId !== "all") {
      result = result.filter((n) => {
        const noteCids = (n.courses || n.courseIds || []).map((c) =>
          (c._id || c).toString()
        );
        return noteCids.includes(selectedCourseId);
      });
    }

    // 2. Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter(
        (n) => (n.category || n.kind) === selectedCategory
      );
    }

    // 3. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const descMatch = (n.description || "").toLowerCase().includes(q);
        const bookMatch = (n.book || "").toLowerCase().includes(q);
        const chapterMatch = (n.chapter || "").toLowerCase().includes(q);
        const sectionMatch = (n.section || "").toLowerCase().includes(q);
        return titleMatch || descMatch || bookMatch || chapterMatch || sectionMatch;
      });
    }

    // 4. Sort
    return [...result].sort((a, b) => {
      if (sortBy === "title-asc") {
        return (a.title || "").localeCompare(b.title || "");
      }
      // default: newest
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [notes, selectedCourseId, selectedCategory, searchQuery, sortBy]);

  const hasActiveFilters =
    selectedCourseId !== "all" ||
    selectedCategory !== "all" ||
    searchQuery.trim() !== "" ||
    sortBy !== "newest";

  const handleClearFilters = () => {
    setSelectedCourseId("all");
    setSelectedCategory("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. SINGLE-LINE RESPONSIVE FILTER ROW */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E8ECEF] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Course Tabs */}
        <div
          role="tablist"
          aria-label="Filter by course"
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
        >
          {/* All Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedCourseId === "all"}
            onClick={() => setSelectedCourseId("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCourseId === "all"
                ? "bg-[#0B1B3D] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#556987] hover:bg-[#F1F5F9] hover:text-[#0B1B3D]"
            }`}
          >
            <span>All Courses</span>
            <span className="ml-1.5 text-[10px] opacity-80 font-mono">
              ({notes.length})
            </span>
          </button>

          {/* One tab per course with published notes */}
          {coursesWithNotes.map((course) => {
            const isSelected = selectedCourseId === course._id;
            return (
              <button
                key={course._id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCourseId(course._id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#0B1B3D] text-white shadow-xs"
                    : "bg-[#F8FAFC] text-[#556987] hover:bg-[#F1F5F9] hover:text-[#0B1B3D]"
                }`}
              >
                <span>{course.title}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Dropdowns + Search Input */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0B1B3D] focus:outline-none focus:border-[#FFB800] transition-colors cursor-pointer min-h-[38px]"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              <option value="notes">Concept Notes</option>
              <option value="formula-sheet">Formula Sheets</option>
              <option value="practice-questions">Practice Questions</option>
              <option value="previous-papers">Previous Papers</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0B1B3D] focus:outline-none focus:border-[#FFB800] transition-colors cursor-pointer min-h-[38px]"
              aria-label="Sort notes"
            >
              <option value="newest">Newest First</option>
              <option value="title-asc">Title A-Z</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-7 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0B1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#FFB800] focus:bg-white transition-all min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARDS GRID (3 / 2 / 1 Columns, Equal Heights) */}
      {filteredNotes.length === 0 ? (
        // Empty state
        <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-[#E8ECEF] shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6EE] text-[#D97706] flex items-center justify-center mx-auto shadow-2xs">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#0B1B3D]">
            Notes will appear here soon.
          </h3>
          <p className="text-xs text-[#556987] max-w-sm mx-auto">
            {hasActiveFilters
              ? "No notes matched your selected filters or search query."
              : "Study materials for this section are currently being organized."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[#0B1B3D] text-white text-xs font-bold hover:bg-[#152B52] transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch transition-opacity duration-300">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              userData={userData}
              onViewPdf={(n) => setViewingPdfNote(n)}
              onOpenAccess={(n) => setAccessNote(n)}
            />
          ))}
        </div>
      )}

      {/* 3. PDF VIEWER MODAL */}
      {viewingPdfNote && (
        <PdfViewerModal
          note={viewingPdfNote}
          onClose={() => setViewingPdfNote(null)}
        />
      )}

      {/* 4. WHATSAPP ACCESS DIALOG */}
      {accessNote && (
        <AccessDialog
          isOpen={true}
          onClose={() => setAccessNote(null)}
          course={
            accessNote.courses?.[0] || {
              _id: accessNote.courseId || accessNote._id,
              title: "RD Classes Study Material",
              slug: "notes",
              classLabel: "Class 11 & 12",
              theme: "blue",
            }
          }
          lockedLectureTitle={`Note: ${accessNote.title}`}
          userData={userData}
          siteWhatsapp={siteWhatsapp}
        />
      )}
    </div>
  );
}
