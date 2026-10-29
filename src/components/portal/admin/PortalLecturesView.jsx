"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Video,
  Plus,
  Search,
  BookOpen,
  Edit,
  Trash2,
  Play,
  GripVertical,
  Check,
  X,
  Layers,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

function detectProvider(url) {
  if (!url || typeof url !== "string") return "direct";
  const clean = url.trim().toLowerCase();
  if (
    clean.includes("mediadelivery.net") ||
    clean.includes("bunnycdn.com") ||
    clean.includes("b-cdn.net") ||
    clean.includes("bunny.net")
  ) {
    return "bunny";
  }
  if (clean.includes("vimeo.com")) {
    return "vimeo";
  }
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
    return "youtube";
  }
  if (clean.includes(".m3u8")) {
    return "hls";
  }
  if (clean.includes(".mp4")) {
    return "mp4";
  }
  return "direct";
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PortalLecturesView({
  lectures: initialLectures = [],
  courses = [],
}) {
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get("courseId");

  const [lectures, setLectures] = useState(initialLectures);
  const [selectedCourseId, setSelectedCourseId] = useState(() => {
    if (queryCourseId && courses.some((c) => c._id?.toString() === queryCourseId)) {
      return queryCourseId;
    }
    return courses[0]?._id?.toString() || "";
  });

  const [prevQueryCourseId, setPrevQueryCourseId] = useState(queryCourseId);
  if (queryCourseId !== prevQueryCourseId) {
    setPrevQueryCourseId(queryCourseId);
    if (queryCourseId && courses.some((c) => c._id?.toString() === queryCourseId)) {
      setSelectedCourseId(queryCourseId);
    }
  }
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [testPlayLecture, setTestPlayLecture] = useState(null);
  const [editingLectureId, setEditingLectureId] = useState(null);

  // Single lecture form state
  const [lectureForm, setLectureForm] = useState({
    title: "",
    book: "Book 1: Partnership Accounts",
    chapter: "Chapter 1: Fundamentals of Partnership",
    description: "",
    videoUrl: "",
    videoProvider: "bunny",
    durationMinutes: "",
    status: "published",
    isFreePreview: false,
  });

  // Bulk add state
  const [bulkBook, setBulkBook] = useState("Book 1: Partnership Accounts");
  const [bulkChapter, setBulkChapter] = useState("Chapter 1: Fundamentals of Partnership");
  const [bulkText, setBulkText] = useState("");

  // Drag state
  const [draggedId, setDraggedId] = useState(null);

  // Filter lectures for selected course
  const courseLectures = useMemo(() => {
    return lectures.filter((l) => {
      const cId = l.courseId?._id?.toString() || l.courseId?.toString();
      return cId === selectedCourseId;
    });
  }, [lectures, selectedCourseId]);

  // Group by Book -> Chapter
  const groupedLectures = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const map = {};

    courseLectures.forEach((l) => {
      if (
        q &&
        !l.title.toLowerCase().includes(q) &&
        !l.book.toLowerCase().includes(q) &&
        !l.chapter.toLowerCase().includes(q)
      ) {
        return;
      }

      const bookName = l.book?.trim() || "General / Core Syllabus";
      const chapterName = l.chapter?.trim() || "Chapter 1";

      if (!map[bookName]) map[bookName] = {};
      if (!map[bookName][chapterName]) map[bookName][chapterName] = [];
      map[bookName][chapterName].push(l);
    });

    return map;
  }, [courseLectures, searchTerm]);

  const handleVideoUrlChange = (url) => {
    const detected = detectProvider(url);
    setLectureForm((prev) => ({
      ...prev,
      videoUrl: url,
      videoProvider: detected,
    }));
  };

  const handleOpenAddModal = (book = "", chapter = "") => {
    setEditingLectureId(null);
    setLectureForm({
      title: "",
      book: book || "Book 1: Partnership Accounts",
      chapter: chapter || "Chapter 1: Fundamentals of Partnership",
      description: "",
      videoUrl: "",
      videoProvider: "bunny",
      durationMinutes: "",
      status: "published",
      isFreePreview: false,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (lec) => {
    setEditingLectureId(lec._id);
    setLectureForm({
      title: lec.title || "",
      book: lec.book || "Book 1: Partnership Accounts",
      chapter: lec.chapter || "Chapter 1: Fundamentals of Partnership",
      description: lec.description || "",
      videoUrl: lec.videoUrl || "",
      videoProvider: lec.videoProvider || detectProvider(lec.videoUrl),
      durationMinutes: lec.durationSeconds ? Math.round(lec.durationSeconds / 60) : "",
      status: lec.status || (lec.published ? "published" : "draft"),
      isFreePreview: Boolean(lec.isFreePreview || lec.freePreview || lec.isPreview),
    });
    setIsAddModalOpen(true);
  };

  const handleSaveLecture = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setBusyId("save-lecture");

    try {
      const durationSeconds = Number(lectureForm.durationMinutes || 0) * 60;
      const payload = {
        courseId: selectedCourseId,
        title: lectureForm.title.trim(),
        book: lectureForm.book.trim(),
        chapter: lectureForm.chapter.trim(),
        description: lectureForm.description.trim(),
        videoUrl: lectureForm.videoUrl.trim(),
        videoProvider: lectureForm.videoProvider,
        durationSeconds,
        status: lectureForm.status,
        isFreePreview: Boolean(lectureForm.isFreePreview),
      };

      const url = editingLectureId
        ? `/api/admin/lectures/${editingLectureId}`
        : `/api/admin/lectures`;
      const method = editingLectureId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save lecture");

      // Refresh list
      const listRes = await fetch(`/api/admin/lectures?courseId=${selectedCourseId}`);
      const listJson = await listRes.json();
      if (listJson.lectures) setLectures(listJson.lectures);

      setIsAddModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setBusyId("bulk-save");

    try {
      const res = await fetch("/api/admin/lectures/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          book: bulkBook.trim(),
          chapter: bulkChapter.trim(),
          text: bulkText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add lectures");

      const listRes = await fetch(`/api/admin/lectures?courseId=${selectedCourseId}`);
      const listJson = await listRes.json();
      if (listJson.lectures) setLectures(listJson.lectures);

      setIsBulkModalOpen(false);
      setBulkText("");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteLecture = async (lec) => {
    if (!confirm(`Delete lecture "${lec.title}"?`)) return;
    setBusyId(lec._id);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/lectures/${lec._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete lecture");

      setLectures((prev) => prev.filter((l) => l._id !== lec._id));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (lec) => {
    setBusyId(lec._id);
    const next = lec.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/lectures/${lec._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setLectures((prev) =>
        prev.map((l) => (l._id === lec._id ? { ...l, status: next, published: next === "published" } : l))
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFreePreview = async (lec) => {
    setBusyId(lec._id);
    const currentFree = Boolean(lec.isFreePreview || lec.freePreview || lec.isPreview);
    const nextFree = !currentFree;
    try {
      const res = await fetch(`/api/admin/lectures/${lec._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFreePreview: nextFree }),
      });
      if (!res.ok) throw new Error("Failed to update free preview");

      // Reload lectures for selected course so isLectureFree helper re-evaluates all rows
      const listRes = await fetch(`/api/admin/lectures?courseId=${selectedCourseId}`);
      const listJson = await listRes.json();
      if (listJson.lectures) setLectures(listJson.lectures);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDrop = async (targetId) => {
    if (!draggedId || draggedId === targetId) return;

    const list = [...courseLectures];
    const fromIdx = list.findIndex((l) => l._id === draggedId);
    const toIdx = list.findIndex((l) => l._id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const item = list.splice(fromIdx, 1)[0];
    list.splice(toIdx, 0, item);

    setLectures((prev) => {
      const others = prev.filter((l) => (l.courseId?._id || l.courseId) !== selectedCourseId);
      return [...others, ...list];
    });

    setDraggedId(null);

    try {
      await fetch("/api/admin/lectures/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: list.map((l) => l._id) }),
      });
    } catch (err) {
      console.warn("Failed to persist lecture reorder", err);
    }
  };

  return (
    <div className="portal-page-container space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Lectures Portal</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Group lectures by Book and Chapter with Bunny Stream, Vimeo, or YouTube embed support.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="md" onClick={() => setIsBulkModalOpen(true)}>
            <Layers className="w-4 h-4 mr-1" />
            <span>Bulk Add</span>
          </Button>

          <Button variant="yellow" size="md" onClick={() => handleOpenAddModal()}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Lecture</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Course Selector & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[var(--portal-border)] shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700 shrink-0">Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="portal-input text-xs font-bold w-full sm:w-80 cursor-pointer"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} {c.subtitle ? `(${c.subtitle})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search lectures in this course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="portal-input !pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* Lectures Grouped by Book & Chapter */}
      {Object.keys(groupedLectures).length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No lectures in this course yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by clicking &quot;Add Lecture&quot; or &quot;Bulk Add&quot; to populate chapter-wise video lessons.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="yellow" size="sm" onClick={() => handleOpenAddModal()}>
              Add First Lecture
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsBulkModalOpen(true)}>
              Bulk Paste Links
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-950 font-medium">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Free preview rule:</strong> Free lectures can be watched by anyone without login. If no lecture is marked free, the first published lecture is free automatically.
            </span>
          </div>

          {Object.entries(groupedLectures).map(([bookName, chapters]) => (
            <div key={bookName} className="space-y-4">
              {/* Book Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <h2 className="text-base font-extrabold text-slate-900">{bookName}</h2>
              </div>

              {/* Chapters */}
              <div className="space-y-4 pl-0 sm:pl-3">
                {Object.entries(chapters).map(([chapterName, lecs]) => (
                  <div
                    key={chapterName}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
                  >
                    {/* Chapter Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <h3 className="text-sm font-bold text-slate-800">{chapterName}</h3>
                        <span className="text-[11px] font-semibold text-slate-400">
                          ({lecs.length} lectures)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(bookName, chapterName)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Chapter</span>
                      </button>
                    </div>

                    {/* Lecture Rows */}
                    <div className="divide-y divide-slate-100">
                      {lecs.map((lec, idx) => {
                        const isPub = lec.status === "published" || lec.published;
                        return (
                          <div
                            key={lec._id}
                            draggable
                            onDragStart={() => setDraggedId(lec._id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(lec._id)}
                            className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition ${
                              draggedId === lec._id ? "opacity-30 bg-amber-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                className="cursor-grab text-slate-400 hover:text-slate-600 p-0.5 select-none"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setTestPlayLecture(lec)}
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition shrink-0 shadow-2xs"
                                title="Test play lecture"
                              >
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {idx + 1}. {lec.title}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {lec.videoProvider || "direct"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                  <span>{formatDuration(lec.durationSeconds || lec.durationSec)}</span>
                                  {lec.videoUrl && (
                                    <span className="truncate max-w-[200px] sm:max-w-xs font-mono">
                                      {lec.videoUrl}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Free Preview Switch with FREE badge */}
                              <button
                                type="button"
                                onClick={() => handleToggleFreePreview(lec)}
                                disabled={busyId === lec._id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold select-none cursor-pointer border transition-colors ${
                                  lec.isFreePreview || lec.freePreview || lec.isPreview
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                }`}
                                title="Free lectures can be watched by anyone without login."
                              >
                                {lec.isFreePreview || lec.freePreview || lec.isPreview ? (
                                  <>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-white tracking-wider">
                                      FREE
                                    </span>
                                    <span>Preview</span>
                                  </>
                                ) : (
                                  <span>Locked</span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(lec)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold select-none cursor-pointer ${
                                  isPub
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {isPub ? "Published" : "Draft"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(lec)}
                                className="p-1 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                title="Edit lecture"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLecture(lec)}
                                className="p-1 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"
                                title="Delete lecture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* Add / Edit Lecture Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h2 className="text-lg font-bold text-slate-900">
                {editingLectureId ? "Edit Lecture" : "Add Lecture"}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLecture} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concept of Goodwill & Valuation"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  className="portal-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Book 1: Partnership"
                    value={lectureForm.book}
                    onChange={(e) => setLectureForm({ ...lectureForm, book: e.target.value })}
                    className="portal-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chapter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 2: Change in Ratio"
                    value={lectureForm.chapter}
                    onChange={(e) => setLectureForm({ ...lectureForm, chapter: e.target.value })}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Video URL & Auto-Detect Provider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Video Link (Bunny, Vimeo, YouTube, HLS/MP4) *
                  </label>
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                    Provider: {lectureForm.videoProvider}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Paste Bunny Stream iframe, Vimeo link, YouTube URL, or .m3u8..."
                  value={lectureForm.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="portal-input text-xs w-full font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Hint: For smoothest playback use Bunny Stream or Vimeo.</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45"
                    value={lectureForm.durationMinutes}
                    onChange={(e) =>
                      setLectureForm({ ...lectureForm, durationMinutes: e.target.value })
                    }
                    className="portal-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={lectureForm.status}
                    onChange={(e) => setLectureForm({ ...lectureForm, status: e.target.value })}
                    className="portal-input text-xs w-full cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Free Preview Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Free Preview</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-white tracking-wider">
                      FREE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Free lectures can be watched by anyone without login.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(lectureForm.isFreePreview)}
                  onChange={(e) =>
                    setLectureForm((prev) => ({ ...prev, isFreePreview: e.target.checked }))
                  }
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Test play button inside modal */}
              {lectureForm.videoUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setTestPlayLecture({
                        title: lectureForm.title || "Preview",
                        videoUrl: lectureForm.videoUrl,
                        videoProvider: lectureForm.videoProvider,
                      })
                    }
                    className="w-full py-2 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test play before saving</span>
                  </button>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="yellow" disabled={busyId === "save-lecture"}>
                  {editingLectureId ? "Save Changes" : "Create Lecture"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h2 className="text-lg font-bold text-slate-900">Bulk Add Lectures</h2>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkBook}
                    onChange={(e) => setBulkBook(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chapter
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkChapter}
                    onChange={(e) => setBulkChapter(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Lectures (one per line, format: Title - URL or just URL)
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder={`Lecture 1: Introduction - https://iframe.mediadelivery.net/play/...\nLecture 2: Profit & Loss Appropriation - https://vimeo.com/...\nLecture 3: Interest on Capital - https://...`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="portal-input text-xs w-full font-mono text-[11px] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsBulkModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="yellow" disabled={busyId === "bulk-save"}>
                  Import All
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Play Video Modal */}
      {testPlayLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <Video className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm font-bold truncate">{testPlayLecture.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {testPlayLecture.videoProvider || "direct"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTestPlayLecture(null)}
                className="p-1 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {testPlayLecture.videoUrl ? (
                testPlayLecture.videoProvider === "vimeo" ? (
                  <iframe
                    src={
                      testPlayLecture.videoUrl.includes("player.vimeo.com")
                        ? testPlayLecture.videoUrl
                        : `https://player.vimeo.com/video/${testPlayLecture.videoUrl.replace(/[^0-9]/g, "")}`
                    }
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : testPlayLecture.videoProvider === "youtube" ? (
                  <iframe
                    src={
                      testPlayLecture.videoUrl.includes("embed")
                        ? testPlayLecture.videoUrl
                        : `https://www.youtube.com/embed/${testPlayLecture.videoUrl.split("v=")[1]?.split("&")[0] || testPlayLecture.videoUrl.split("/").pop()}`
                    }
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : testPlayLecture.videoProvider === "bunny" && testPlayLecture.videoUrl.includes("<iframe") ? (
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: testPlayLecture.videoUrl }}
                  />
                ) : testPlayLecture.videoProvider === "bunny" ? (
                  <iframe
                    src={testPlayLecture.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={testPlayLecture.videoUrl}
                    controls
                    className="w-full h-full"
                  />
                )
              ) : (
                <div className="text-slate-500 text-xs">No video URL available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
