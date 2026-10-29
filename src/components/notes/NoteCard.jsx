"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Lock,
  Download,
  Eye,
  MessageCircle,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";

const THEME_STYLES = {
  blue: {
    headerBg: "bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE]",
    badgeBg: "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]",
    iconBg: "bg-[#2563EB] text-white",
  },
  emerald: {
    headerBg: "bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5]",
    badgeBg: "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]",
    iconBg: "bg-[#059669] text-white",
  },
  green: {
    headerBg: "bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7]",
    badgeBg: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",
    iconBg: "bg-[#16A34A] text-white",
  },
  purple: {
    headerBg: "bg-gradient-to-r from-[#FAF5FF] to-[#F3E8FF]",
    badgeBg: "bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]",
    iconBg: "bg-[#7C3AED] text-white",
  },
  violet: {
    headerBg: "bg-gradient-to-r from-[#F5F3FF] to-[#EDE9FE]",
    badgeBg: "bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]",
    iconBg: "bg-[#6D28D9] text-white",
  },
  orange: {
    headerBg: "bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5]",
    badgeBg: "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]",
    iconBg: "bg-[#EA580C] text-white",
  },
  yellow: {
    headerBg: "bg-gradient-to-r from-[#FEFCE8] to-[#FEF08A]",
    badgeBg: "bg-[#FEF08A] text-[#854D0E] border-[#FDE047]",
    iconBg: "bg-[#CA8A04] text-white",
  },
  red: {
    headerBg: "bg-gradient-to-r from-[#FEF2F2] to-[#FEE2E2]",
    badgeBg: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
    iconBg: "bg-[#DC2626] text-white",
  },
};

const CATEGORY_LABELS = {
  notes: "Concept Note",
  "formula-sheet": "Formula Sheet",
  "practice-questions": "Practice Sheet",
  "previous-papers": "Board Paper",
  other: "Study Material",
};

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function NoteCard({
  note,
  userData = null,
  onViewPdf,
  onOpenAccess,
}) {
  const noteCourseIds = useMemo(() => {
    const ids = [];
    if (note.courseId) ids.push(note.courseId.toString());
    if (Array.isArray(note.courseIds)) {
      for (const c of note.courseIds) {
        if (typeof c === "string") ids.push(c);
        else if (c?._id) ids.push(c._id.toString());
      }
    }
    if (Array.isArray(note.courses)) {
      for (const c of note.courses) {
        if (c?._id) ids.push(c._id.toString());
      }
    }
    return Array.from(new Set(ids));
  }, [note]);

  // Unlocked check: Free OR Admin OR Enrolled in any attached course
  const isFree = Boolean(note.isFree);
  const isEnrolled = useMemo(() => {
    if (userData?.role === "admin") return true;
    if (!userData?.enrolledCourseIds || !Array.isArray(userData.enrolledCourseIds)) {
      return false;
    }
    return noteCourseIds.some((cid) => userData.enrolledCourseIds.includes(cid));
  }, [userData, noteCourseIds]);

  const isUnlocked = isFree || isEnrolled;

  // Attached course objects
  const courses = useMemo(() => {
    if (Array.isArray(note.courses) && note.courses.length > 0) {
      return note.courses;
    }
    if (Array.isArray(note.courseIds) && typeof note.courseIds[0] === "object") {
      return note.courseIds;
    }
    return [];
  }, [note]);

  const firstCourse = courses[0] || null;
  const theme = firstCourse?.theme || firstCourse?.tone || "blue";
  const styles = THEME_STYLES[theme] || THEME_STYLES.blue;

  const categoryKey = note.category || note.kind || "notes";
  const categoryLabel = CATEGORY_LABELS[categoryKey] || "Notes";

  const sizeText = formatFileSize(note.sizeBytes || note.fileSize);
  const dateText = formatDate(note.createdAt);

  const metaParts = [];
  if (note.book && note.chapter) {
    metaParts.push(`${note.book} · ${note.chapter}`);
  } else if (note.book) {
    metaParts.push(note.book);
  } else if (note.chapter) {
    metaParts.push(note.chapter);
  } else if (note.section) {
    metaParts.push(note.section);
  }

  if (note.pageCount > 0) {
    metaParts.push(`${note.pageCount} page${note.pageCount > 1 ? "s" : ""}`);
  } else if (sizeText) {
    metaParts.push(sizeText);
  }

  if (dateText) {
    metaParts.push(dateText);
  }

  return (
    <div
      className={`group rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full relative ${
        isUnlocked ? "border-[#E2E8F0]" : "border-[#E2E8F0] bg-gradient-to-b from-white to-[#FAF6EE]/30"
      }`}
    >
      {/* 1. SOFT HEADER (Tinted by first course theme) */}
      <div className={`p-4 sm:p-5 border-b border-[#E2E8F0] ${styles.headerBg}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Category Pill */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${styles.badgeBg}`}
          >
            {categoryLabel}
          </span>

          {/* FREE Badge or Locked Pill */}
          {isFree ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFB800] text-[#0A0A0A] shadow-2xs">
              FREE
            </span>
          ) : isUnlocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ENROLLED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
              <Lock className="w-2.5 h-2.5" />
              LOCKED
            </span>
          )}
        </div>

        {/* Center: PDF Icon + Course Chips */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${styles.iconBg}`}
          >
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1 flex flex-wrap gap-1.5">
            {courses.slice(0, 2).map((c, i) => (
              <span
                key={c._id || i}
                className="inline-block px-2 py-0.5 rounded-md bg-white/90 text-[#0B1B3D] border border-white text-[11px] font-semibold truncate max-w-[140px] shadow-2xs"
                title={c.title}
              >
                {c.title}
              </span>
            ))}
            {courses.length > 2 && (
              <span className="inline-block px-1.5 py-0.5 rounded-md bg-white/90 text-[#556987] border border-white text-[10px] font-bold shadow-2xs">
                +{courses.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARD BODY: Title, Description, Meta */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#0B1B3D] leading-snug line-clamp-2">
            {note.title}
          </h3>

          <p className="mt-1.5 text-xs text-[#556987] leading-relaxed line-clamp-2">
            {note.description || "Comprehensive revision and practice material curated by Ronak Dugar Sir."}
          </p>
        </div>

        {/* Meta row */}
        {metaParts.length > 0 && (
          <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2 text-[11px] text-[#64748B] font-medium">
            {metaParts.map((part, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-[#CBD5E1]">·</span>}
                <span>{part}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. CARD FOOTER: Actions */}
      <div
        className={`px-4 sm:px-5 py-3 border-t border-[#F1F5F9] bg-[#FAF6EE]/20 flex items-center justify-between gap-2.5 ${
          !isUnlocked ? "backdrop-blur-xs" : ""
        }`}
      >
        {isUnlocked ? (
          // UNLOCKED: View (Modal) and Download
          <>
            <button
              type="button"
              onClick={() => onViewPdf && onViewPdf(note)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#0B1B3D] hover:bg-[#152B52] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer min-h-[38px]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>

            <a
              href={`/api/notes/${note._id}/stream?download=1`}
              className="py-2 px-3 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#0B1B3D] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs min-h-[38px]"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </>
        ) : (
          // LOCKED: Get Access on WhatsApp
          <button
            type="button"
            onClick={() => onOpenAccess && onOpenAccess(note)}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0B1B3D] hover:bg-[#152B52] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer min-h-[40px]"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            <span>Get Access on WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  );
}

