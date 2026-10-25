"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  Video,
} from "lucide-react";

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "15m";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remainingMins}m`;
  return `${mins}m`;
}

export default function StudentLecturesView({
  courses = [],
  lectures = [],
  lastWatched = null,
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLectures = useMemo(() => {
    let result = [...lectures];

    if (selectedCourseId !== "all") {
      result = result.filter((l) => l.courseId === selectedCourseId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.section?.toLowerCase().includes(q) ||
          l.courseTitle?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [lectures, selectedCourseId, searchQuery]);

  // Group filtered lectures by Course -> Section
  const groupedData = useMemo(() => {
    const courseMap = {};

    filteredLectures.forEach((lec) => {
      const cId = lec.courseId;
      if (!courseMap[cId]) {
        courseMap[cId] = {
          courseId: cId,
          courseTitle: lec.courseTitle,
          courseSlug: lec.courseSlug,
          classLabel: lec.classLabel,
          tone: lec.tone,
          sections: {},
        };
      }

      const secName = lec.section || "General";
      if (!courseMap[cId].sections[secName]) {
        courseMap[cId].sections[secName] = [];
      }
      courseMap[cId].sections[secName].push(lec);
    });

    return Object.values(courseMap).map((c) => ({
      ...c,
      sectionList: Object.entries(c.sections).map(([name, lecs]) => ({
        sectionName: name,
        lectures: lecs,
      })),
    }));
  }, [filteredLectures]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
            My Video Lectures
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            Browse all chapter lectures from your enrolled courses with progress tracking.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search lectures or chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9.5 pr-4 rounded-xl border border-black/10 bg-white text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FFC21A] focus:ring-2 focus:ring-[#FFC21A]/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Resume Last Watched Banner */}
      {lastWatched && !searchQuery && (
        <div className="rounded-[22px] bg-gradient-to-r from-[#0F1B2D] to-[#172B45] text-white p-5 sm:p-6 shadow-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFC21A] text-slate-900 shadow-sm shrink-0">
              <PlayCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFD54A]">
                  CONTINUE LEARNING
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 font-semibold">
                  {lastWatched.courseTitle}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {lastWatched.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>{lastWatched.section}</span>
                {lastWatched.durationSec > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDuration(lastWatched.durationSec)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/student/courses/${lastWatched.courseSlug}/lectures/${lastWatched._id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFC21A] hover:bg-[#ffd54a] text-slate-900 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-98 shrink-0"
          >
            <span>Resume Lecture</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Course Filter Tabs */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCourseId("all")}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedCourseId === "all"
                ? "bg-[#FFC21A] text-slate-900 shadow-2xs"
                : "bg-white text-slate-600 border border-black/5 hover:bg-slate-50"
            }`}
          >
            All Enrolled Courses ({lectures.length})
          </button>
          {courses.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setSelectedCourseId(c._id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedCourseId === c._id
                  ? "bg-[#FFC21A] text-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border border-black/5 hover:bg-slate-50"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Lectures Content */}
      {groupedData.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-black/10 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
          <h3 className="text-base font-bold text-[#111827]">
            {searchQuery ? "No matching lectures found" : "No Enrolled Lectures Yet"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            {searchQuery
              ? "Try searching with a different chapter name or lecture title."
              : "Lectures for your assigned courses will appear here once published."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedData.map((courseGroup) => (
            <div key={courseGroup.courseId} className="space-y-4">
              {/* Course Group Header */}
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFC21A] text-slate-900 shadow-2xs">
                    {courseGroup.classLabel || "Class 12"}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#111827]">
                    {courseGroup.courseTitle}
                  </h2>
                </div>

                <Link
                  href={`/student/courses/${courseGroup.courseSlug}`}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  View Course Details →
                </Link>
              </div>

              {/* Sections in this Course */}
              <div className="space-y-4">
                {courseGroup.sectionList.map((sec, secIdx) => (
                  <div
                    key={sec.sectionName}
                    className="rounded-[20px] border border-black/5 bg-white shadow-xs overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-black text-[11px]">
                          {secIdx + 1}
                        </div>
                        <h3 className="text-sm font-extrabold text-[#111827]">
                          {sec.sectionName}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {sec.lectures.length} {sec.lectures.length === 1 ? "lecture" : "lectures"}
                      </span>
                    </div>

                    {/* Lectures List */}
                    <div className="divide-y divide-black/5">
                      {sec.lectures.map((lecture, lIdx) => {
                        const isCompleted = !!lecture.completed;
                        const isCurrentResume =
                          lastWatched && lastWatched._id === lecture._id;

                        return (
                          <div
                            key={lecture._id}
                            className={`flex items-center justify-between gap-4 p-4 hover:bg-slate-50/70 transition-colors ${
                              isCurrentResume ? "bg-amber-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Progress Tick Icon */}
                              {isCompleted ? (
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0"
                                  title="Completed"
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                </div>
                              ) : (
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0"
                                  title="Not watched yet"
                                >
                                  {lIdx + 1}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-[#111827] truncate flex items-center gap-2">
                                  <span>{lecture.title}</span>
                                  {isCurrentResume && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9.5px] font-black uppercase tracking-wide">
                                      Last Watched
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(lecture.durationSec)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action CTA */}
                            <div className="shrink-0">
                              <Link
                                href={`/student/courses/${courseGroup.courseSlug}/lectures/${lecture._id}`}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
                                  isCurrentResume
                                    ? "bg-[#FFC21A] text-slate-900 hover:bg-[#ffd54a]"
                                    : isCompleted
                                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    : "bg-[#FFC21A] text-slate-900 hover:bg-[#ffd54a]"
                                }`}
                              >
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span>
                                  {isCurrentResume
                                    ? "Resume"
                                    : isCompleted
                                    ? "Replay"
                                    : "Watch"}
                                </span>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
