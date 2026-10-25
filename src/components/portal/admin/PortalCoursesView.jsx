"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Video,
  Users,
  Edit,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import {
  reorderCourseAction,
  deleteCourseAction,
  togglePublishCourseAction,
} from "@/server/actions/admin.courses.actions.js";

export default function PortalCoursesView({ courses = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [unpublishCandidate, setUnpublishCandidate] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const sortedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const filteredCourses = sortedCourses.filter((c) =>
    (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReorder = async (courseId, direction) => {
    setBusyId(courseId);
    setErrorMsg("");
    try {
      const res = await reorderCourseAction(courseId, direction);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to reorder course.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(course._id);
    setErrorMsg("");
    try {
      const res = await deleteCourseAction(course._id);
      if (!res.success) {
        if (res.error?.toLowerCase().includes("enrolled")) {
          setUnpublishCandidate(course);
        } else {
          setErrorMsg(res.error || "Failed to delete course.");
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleUnpublish = async (course) => {
    setBusyId(course._id);
    setErrorMsg("");
    try {
      const res = await togglePublishCourseAction(course._id, false);
      if (res.success) {
        setUnpublishCandidate(null);
      } else {
        setErrorMsg(res.error || "Failed to unpublish course.");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Course Library</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Manage course offerings, pricing details, syllabus badges, and lecture permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--portal-text-muted)]" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="portal-input !pl-9 !py-2 text-xs !w-60"
            />
          </div>

          <Link href="/admin/courses/new">
            <Button variant="yellow" size="md">
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-[var(--portal-text-muted)] mb-3" />
          <h3 className="text-base font-bold text-[var(--portal-text-main)]">No courses found</h3>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            {searchTerm ? "Try searching with a different keyword." : "Click Add Course to publish your first course."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c, idx) => (
            <Card key={c._id} className="overflow-hidden flex flex-col justify-between group hover:shadow-lg transition">
              <div>
                {/* Course Header Banner */}
                <div
                  className="h-28 w-full relative flex items-center justify-between p-5 overflow-hidden"
                  style={{
                    background:
                      c.tone === "sky"
                        ? "linear-gradient(135deg, #DDEEFB 0%, #BAE0F7 100%)"
                        : c.tone === "yellow"
                        ? "linear-gradient(135deg, #FFF1C2 0%, #FEE58A 100%)"
                        : c.tone === "orange"
                        ? "linear-gradient(135deg, #FFE0D0 0%, #FCC4A8 100%)"
                        : c.tone === "green"
                        ? "linear-gradient(135deg, #DDF3E8 0%, #B7E7CE 100%)"
                        : c.tone === "purple"
                        ? "linear-gradient(135deg, #E8E2FB 0%, #D1C5F7 100%)"
                        : "linear-gradient(135deg, #FFE0DF 0%, #FCC0BE 100%)",
                  }}
                >
                  <div className="flex flex-col gap-1.5 z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 shadow-sm">
                        {c.classLabel || "Class 12"}
                      </span>
                      {c.badgeText && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>{c.badgeText}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-700/80 font-semibold">
                      /{c.slug}
                    </span>
                  </div>

                  {/* Status & Featured */}
                  <div className="flex flex-col items-end gap-1.5 z-10">
                    {c.published ? (
                      <Badge tone="green">Published</Badge>
                    ) : (
                      <Badge tone="yellow">Draft</Badge>
                    )}
                    {c.featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                        ★ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <h3 className="text-base font-bold text-[var(--portal-text-main)] group-hover:text-amber-600 transition line-clamp-1">
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <span className="text-xs text-[var(--portal-text-muted)] font-normal line-clamp-1">
                        {c.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--portal-text-muted)] mt-1 line-clamp-2 min-h-[32px]">
                    {c.description || "Comprehensive syllabus coverage with board preparation exercises."}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">
                      Order: {c.order ?? idx}
                    </span>
                    <span>•</span>
                    <span>Tone: <strong className="capitalize">{c.tone || "sky"}</strong></span>
                    <span>•</span>
                    <span>{c.metaText || "Full Year"}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--portal-card-border)] flex items-center justify-between text-xs font-semibold text-[var(--portal-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-4 h-4 text-amber-600" />
                      <span>{c.lectureCount || 0} Lectures</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{c.studentCount || 0} Students</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-[var(--portal-card-border)]/50 mt-2">
                {/* Reorder Arrows */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0 || busyId === c._id}
                    onClick={() => handleReorder(c._id, "up")}
                    className="p-1.5 rounded-lg border border-[var(--portal-card-border)] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Move up"
                    aria-label="Move course up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sortedCourses.length - 1 || busyId === c._id}
                    onClick={() => handleReorder(c._id, "down")}
                    className="p-1.5 rounded-lg border border-[var(--portal-card-border)] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Move down"
                    aria-label="Move course down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link
                  href={`/admin/courses/${c._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--portal-accent-yellow)] text-[var(--portal-accent-yellow-text)] hover:brightness-105 transition"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Lectures & Edit</span>
                </Link>

                <Button
                  variant="soft-red"
                  size="sm"
                  disabled={busyId === c._id}
                  onClick={() => handleDelete(c)}
                  aria-label="Delete course"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Unpublish modal when students are enrolled */}
      <Dialog
        isOpen={!!unpublishCandidate}
        onClose={() => setUnpublishCandidate(null)}
        title="Cannot Delete Course"
        description="Active student enrollments protect this course from permanent deletion."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[var(--portal-text-muted)] leading-relaxed">
            Students are currently enrolled in{" "}
            <strong className="text-[var(--portal-text-main)]">
              {unpublishCandidate?.title}
            </strong>
            . Deleting it would break student portal access and lecture tracking.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            💡 <strong>Recommended:</strong> Unpublish the course instead. Existing enrolled students keep their access, but new visitors cannot see or purchase it.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnpublishCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="yellow"
              size="sm"
              disabled={busyId === unpublishCandidate?._id}
              onClick={() => handleUnpublish(unpublishCandidate)}
            >
              {busyId === unpublishCandidate?._id ? "Unpublishing..." : "Unpublish Course"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
