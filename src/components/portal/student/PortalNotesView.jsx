"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Download,
  Eye,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
} from "lucide-react";
import Badge from "@/components/portal/ui/Badge";

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

export default function PortalNotesView({ initialNotes = [], activeCourses = [] }) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedKind, setSelectedKind] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    return initialNotes.filter((note) => {
      // Course filter
      if (selectedCourse !== "all") {
        const matchesCourse = note.courseIds?.some(
          (c) => (c._id?.toString() || c.toString()) === selectedCourse
        );
        if (!matchesCourse) return false;
      }

      // Kind filter
      if (selectedKind !== "all" && note.kind !== selectedKind) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const sectionMatch = note.section?.toLowerCase().includes(query);
        if (!titleMatch && !sectionMatch) return false;
      }

      return true;
    });
  }, [initialNotes, selectedCourse, selectedKind, searchQuery]);

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
              <span>Study Materials & Handouts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Course Notes & Practice Sheets
            </h1>
            <p className="text-sm text-[#4B5563]">
              Curated handwritten notes, chapter formulas, CBSE practice sets, and past year board papers linked to your enrolled courses.
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

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notes by title or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-neutral-50/60 py-2.5 pl-10 pr-4 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:border-amber-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Course Dropdown */}
          <div className="sm:w-64">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-neutral-50/60 px-3 py-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
            >
              <option value="all">All Enrolled Courses ({activeCourses.length})</option>
              {activeCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kind Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {NOTE_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelectedKind(k.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                selectedKind === k.id
                  ? "bg-[#FFC21A] text-neutral-900 shadow-2xs"
                  : "bg-neutral-100/80 text-[#4B5563] hover:bg-neutral-200/70"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/15 bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">
            {initialNotes.length === 0 ? "No Notes Published Yet" : "No Notes Match Your Filters"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#6B7280]">
            {initialNotes.length === 0
              ? "Handouts, formula sheets, and practice sets will appear here once Sir attaches them to your courses."
              : "Try clearing search queries or switching the course and category filters."}
          </p>
          {(searchQuery || selectedCourse !== "all" || selectedKind !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("all");
                setSelectedKind("all");
              }}
              className="mt-4 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-[#111827] hover:bg-neutral-200"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isLink = note.source === "link";
            const accessUrl = isLink
              ? note.externalUrl
              : `/api/notes/${note._id}/stream`;
            const downloadUrl = `/api/notes/${note._id}/stream?download=1`;

            return (
              <div
                key={note._id}
                className="flex flex-col justify-between rounded-[22px] border border-black/6 bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={KIND_TONES[note.kind] || "yellow"} size="sm">
                      {KIND_LABELS[note.kind] || "Notes"}
                    </Badge>
                    <span className="text-[11px] font-bold text-[#6B7280]">
                      {isLink ? "External Link" : note.pageCount ? `${note.pageCount} Pages` : "PDF File"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#111827] leading-snug line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#6B7280] line-clamp-1">
                      {note.section || "General Study Material"}
                    </p>
                  </div>

                  {/* Course Tags */}
                  {note.courseIds && note.courseIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {note.courseIds.slice(0, 2).map((c) => (
                        <span
                          key={c._id || c}
                          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{c.title || "Course"}</span>
                        </span>
                      ))}
                      {note.courseIds.length > 2 && (
                        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                          +{note.courseIds.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[#6B7280]">
                    {isLink ? "Web Resource" : formatFileSize(note.fileSize) || "Ready to view"}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLink ? (
                      <a
                        href={accessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-3.5 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Link</span>
                      </a>
                    ) : (
                      <>
                        <a
                          href={accessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-[#FFC21A] px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </a>
                        <a
                          href={downloadUrl}
                          download
                          title="Download PDF"
                          className="rounded-xl border border-black/10 bg-white p-1.5 text-[#374151] hover:bg-neutral-50 shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
