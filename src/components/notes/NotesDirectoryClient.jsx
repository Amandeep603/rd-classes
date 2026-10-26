"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Lock,
  Download,
  ExternalLink,
  MessageCircle,
  LogIn,
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const KIND_META = {
  notes: {
    label: "Concept Notes",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-600",
  },
  practice: {
    label: "Practice Sheets",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-600",
  },
  formula: {
    label: "Formula Cards",
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-600",
  },
  paper: {
    label: "Board Papers",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-600",
  },
};

export default function NotesDirectoryClient({
  notes = [],
  courses = [],
  siteWhatsapp = "+919876543210",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNoteForBuy, setSelectedNoteForBuy] = useState(null);

  // User access state
  const [userAccess, setUserAccess] = useState({
    authenticated: false,
    enrolledCourseIds: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      try {
        const res = await fetch("/api/me/course-access");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.authenticated) {
            setUserAccess({
              authenticated: true,
              enrolledCourseIds: data.enrolledCourseIds || [],
              loading: false,
            });
            return;
          }
        }
      } catch {
        // Visitor mode fallback
      }
      if (!cancelled) {
        setUserAccess((prev) => ({ ...prev, loading: false }));
      }
    }
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const cleanPhone = siteWhatsapp.replace(/[^0-9]/g, "");

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Kind filter
      if (selectedKind !== "all" && note.kind !== selectedKind) {
        return false;
      }

      // Category filter (Class 12 / Class 11 via linked courses)
      if (selectedCategory !== "all") {
        const hasMatchingCourse = note.courses?.some((c) => {
          if (selectedCategory === "class12") {
            return c.category === "class12" || c.title?.toLowerCase().includes("12");
          }
          if (selectedCategory === "class11") {
            return c.category === "class11" || c.title?.toLowerCase().includes("11");
          }
          return false;
        });
        if (!hasMatchingCourse) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = note.title?.toLowerCase().includes(q);
        const matchesSection = note.section?.toLowerCase().includes(q);
        const matchesCourse = note.courses?.some((c) =>
          c.title?.toLowerCase().includes(q)
        );
        return matchesTitle || matchesSection || matchesCourse;
      }

      return true;
    });
  }, [notes, selectedKind, selectedCategory, searchQuery]);

  // Counts for kind filter chips
  const kindCounts = useMemo(() => {
    const counts = { all: notes.length };
    for (const note of notes) {
      counts[note.kind] = (counts[note.kind] || 0) + 1;
    }
    return counts;
  }, [notes]);

  const getBuyWhatsappHref = (note) => {
    const courseTitle = note.courses?.[0]?.title || "RD Classes Accountancy";
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello RD Classes, I want to access the note: "${note.title}" from course: ${courseTitle}. Please share enrollment details.`
    )}`;
  };

  return (
    <div className="space-y-8">
      {/* 1. FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col gap-5 bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        {/* Top row: Search input + Class/Category selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Curriculum Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by note title, chapter name, or course..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#0B1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Classes" },
              { id: "class12", label: "Class 12" },
              { id: "class11", label: "Class 11" },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-white text-[#0B1B3D] shadow-xs"
                      : "text-[#64748B] hover:text-[#0B1B3D]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom row: Kind filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#F1F5F9]">
          {[
            { id: "all", label: "All Materials" },
            { id: "notes", label: "Concept Notes" },
            { id: "practice", label: "Practice Sheets" },
            { id: "formula", label: "Formula Cards" },
            { id: "paper", label: "Board Papers" },
          ].map((chip) => {
            const count = kindCounts[chip.id] || 0;
            const isSelected = selectedKind === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedKind(chip.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                  isSelected
                    ? "bg-[#0B2545] text-white shadow-xs"
                    : "bg-white border border-[#E2E8F0] text-[#556987] hover:border-[#CBD5E1]"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.2 font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. NOTES GRID */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0B1B3D]">No study materials found</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {searchQuery
              ? `No notes match your search "${searchQuery}". Try a different keyword or reset filters.`
              : "No study materials have been published in this category yet. Check back soon!"}
          </p>
          {(searchQuery || selectedKind !== "all" || selectedCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedKind("all");
                setSelectedCategory("all");
              }}
              className="mt-2 text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const meta = KIND_META[note.kind] || KIND_META.notes;

            // Check if user has active enrollment in any linked course
            const isEnrolled =
              userAccess.authenticated &&
              note.courses?.some((c) =>
                userAccess.enrolledCourseIds.includes(c._id)
              );

            const streamUrl = `/api/notes/${note._id}/stream`;
            const primaryCourse = note.courses?.[0];

            return (
              <div
                key={note._id}
                className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 hover:border-[#CBD5E1] transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top metadata pill row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md border ${meta.bg}`}
                    >
                      {meta.label}
                    </span>

                    <span className="text-[11px] font-mono text-[#64748B] flex items-center gap-1">
                      {note.source === "link" ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          External Link
                        </span>
                      ) : note.pageCount > 0 ? (
                        <span>{note.pageCount} Pages • PDF</span>
                      ) : (
                        <span>PDF Note</span>
                      )}
                    </span>
                  </div>

                  {/* Title & Section */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0B1B3D] group-hover:text-[#0066FF] transition-colors line-clamp-2 leading-snug">
                      {note.title}
                    </h3>
                    {note.section && (
                      <p className="text-xs text-[#64748B] font-medium mt-1">
                        Chapter: {note.section}
                      </p>
                    )}
                  </div>

                  {/* Linked Course badges */}
                  {note.courses && note.courses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {note.courses.map((course) => (
                        <Link
                          key={course._id}
                          href={`/courses/${course.slug}#notes`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B2545] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-2.5 py-1 rounded-lg transition-colors truncate max-w-[240px]"
                          title={course.title}
                        >
                          <BookOpen className="w-3 h-3 text-[#FFB800] flex-shrink-0" />
                          <span className="truncate">{course.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action Row */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
                  {isEnrolled ? (
                    <a
                      href={streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm min-h-[40px]"
                    >
                      {note.source === "link" ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Resource</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>View Note (PDF)</span>
                        </>
                      )}
                    </a>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-semibold">
                        <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>Enrolled Only</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedNoteForBuy(note)}
                        className="py-2 px-3.5 rounded-xl bg-[#0B2545] hover:bg-[#143565] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer min-h-[38px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Buy Course</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. BUY COURSE TO UNLOCK NOTE MODAL DIALOG */}
      {selectedNoteForBuy && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy-note-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedNoteForBuy(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedNoteForBuy(null);
          }}
        >
          <div
            className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedNoteForBuy(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with lock icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-6">
                <h3 id="buy-note-title" className="text-base font-bold text-[#0B1B3D]">
                  Unlock Study Material
                </h3>
                <p className="text-xs text-[#556987] font-medium truncate">
                  {selectedNoteForBuy.title}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-[#475569] leading-relaxed">
              This study note is part of the course curriculum. Message Sir on WhatsApp to buy the course, unlock all chapters, video lectures, and receive your student login ID.
            </p>

            {/* Buttons */}
            <div className="space-y-2.5 pt-1">
              <a
                href={getBuyWhatsappHref(selectedNoteForBuy)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#143565] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Buy Course on WhatsApp</span>
              </a>

              <div className="text-center pt-1">
                <Link
                  href="/student/login"
                  onClick={() => setSelectedNoteForBuy(null)}
                  className="text-xs font-semibold text-[#0066FF] hover:underline inline-flex items-center gap-1"
                >
                  <span>I already have a login</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
