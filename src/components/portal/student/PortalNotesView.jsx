"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Eye,
  BookOpen,
  Filter,
  X,
  Maximize2,
} from "lucide-react";
import Badge from "@/components/portal/ui/Badge";
import NoteCard from "@/components/notes/NoteCard";
import PdfViewerModal from "@/components/notes/PdfViewerModal";

const NOTE_KINDS = [
  { id: "all", label: "All Resources" },
  { id: "notes", label: "Concept Notes" },
  { id: "practice", label: "Practice Sheets" },
  { id: "formula", label: "Formula Cards" },
  { id: "paper", label: "Board Papers" },
];

const KIND_LABELS = {
  notes: "Concept Notes",
  practice: "Practice Sheet",
  formula: "Formula Card",
  paper: "Board Paper",
};

const KIND_TONES = {
  notes: "yellow",
  practice: "blue",
  formula: "green",
  paper: "peach",
};

export default function PortalNotesView({
  initialNotes = [],
  activeCourses = [],
}) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedKind, setSelectedKind] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingNote, setViewingNote] = useState(null);

  // Extract all unique books available in the notes
  const availableBooks = useMemo(() => {
    const set = new Set();
    initialNotes.forEach((n) => {
      if (n.book && n.book.trim()) {
        set.add(n.book.trim());
      }
    });
    return Array.from(set).sort();
  }, [initialNotes]);

  const filteredNotes = useMemo(() => {
    return initialNotes.filter((note) => {
      // Course filter
      if (selectedCourse !== "all") {
        const matchesCourse = note.courseIds?.some(
          (c) => (c._id?.toString() || c.toString()) === selectedCourse
        );
        if (!matchesCourse) return false;
      }

      // Book filter
      if (selectedBook !== "all" && note.book !== selectedBook) {
        return false;
      }

      // Kind filter
      if (selectedKind !== "all" && note.kind !== selectedKind) {
        return false;
      }

      // Search query (matches title, book or section)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const bookMatch = note.book?.toLowerCase().includes(query);
        const sectionMatch = note.section?.toLowerCase().includes(query);
        if (!titleMatch && !bookMatch && !sectionMatch) return false;
      }

      return true;
    });
  }, [initialNotes, selectedCourse, selectedBook, selectedKind, searchQuery]);

  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-[28px] border border-black/5 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-extrabold text-amber-900">
              <FileText className="h-3.5 w-3.5" />
              <span>Study Materials &amp; Handouts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Course Notes &amp; Practice Sheets
            </h1>
            <p className="text-sm text-[#4B5563]">
              Handwritten formula sheets, chapter revision notes, CBSE practice sets, and past year board papers linked to your enrolled courses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-2xs">
              <div className="text-xs font-semibold text-[#6B7280]">Available Notes</div>
              <div className="text-2xl font-black text-[#111827]">{initialNotes.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar: Course, Book, Kind, Search */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, chapters..."
              className="w-full h-10 rounded-xl bg-neutral-50 border border-black/8 pl-9 pr-8 text-xs font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter by Course */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              aria-label="Filter by Course"
              className="w-full h-10 rounded-xl bg-neutral-50 border border-black/8 px-3 text-xs font-medium text-[#374151] focus:border-[#FFC21A] focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
            >
              <option value="all">All Enrolled Courses</option>
              {activeCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Book */}
          <div>
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              aria-label="Filter by Book"
              className="w-full h-10 rounded-xl bg-neutral-50 border border-black/8 px-3 text-xs font-medium text-[#374151] focus:border-[#FFC21A] focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
            >
              <option value="all">All Books / Parts</option>
              {availableBooks.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Kind */}
          <div>
            <select
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              aria-label="Filter by Resource Kind"
              className="w-full h-10 rounded-xl bg-neutral-50 border border-black/8 px-3 text-xs font-medium text-[#374151] focus:border-[#FFC21A] focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
            >
              {NOTE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-black/10 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mx-auto mb-3 shadow-2xs">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Matching Notes Found</h3>
          <p className="mt-1 text-xs text-[#6B7280]">
            Try adjusting your search query, book filter, or course selection.
          </p>
          {(searchQuery || selectedCourse !== "all" || selectedBook !== "all" || selectedKind !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("all");
                setSelectedBook("all");
                setSelectedKind("all");
              }}
              className="mt-4 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-[#111827] hover:bg-neutral-200"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              userData={{
                role: "student",
                enrolledCourseIds: activeCourses.map((c) => c._id),
              }}
              onViewPdf={(n) => setViewingNote(n)}
            />
          ))}
        </div>
      )}

      {/* Shared In-Browser PDF Viewer Modal */}
      {viewingNote && (
        <PdfViewerModal
          note={viewingNote}
          onClose={() => setViewingNote(null)}
        />
      )}
    </div>
  );
}
