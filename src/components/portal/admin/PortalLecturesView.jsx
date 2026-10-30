"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ClipboardPaste,
  Layers,
  FolderPlus,
} from "lucide-react";
import { parseVimeoUrl, buildVimeoEmbedUrl } from "@/lib/utils/vimeoParser";

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PortalLecturesView({
  courses = [],
  initialCourse = null,
  initialBooks = [],
  initialChapters = [],
  initialLectures = [],
}) {
  const router = useRouter();

  // Active Course: Default to Class 12 Accountancy if available
  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (initialCourse) return initialCourse;
    return (
      courses.find(
        (c) => c.slug === "class-12-accountancy" || c.title?.toLowerCase().includes("class 12")
      ) ||
      courses[0] ||
      null
    );
  });

  const [books, setBooks] = useState(initialBooks);
  const [chapters, setChapters] = useState(initialChapters);
  const [lectures, setLectures] = useState(initialLectures);

  // Expanded chapters state: Chapter 1 open by default
  const [openChapters, setOpenChapters] = useState(() => {
    const initial = {};
    if (initialChapters.length > 0) {
      initial[initialChapters[0]._id.toString()] = true;
    }
    return initial;
  });

  // Local feedback & input states for inline Vimeo fields
  // map of lectureId -> { linkInput: string, status: "idle" | "saved" | "error", errorMsg: "" }
  const [rowStates, setRowStates] = useState(() => {
    const map = {};
    initialLectures.forEach((l) => {
      const existingUrl = l.vimeoId
        ? `https://player.vimeo.com/video/${l.vimeoId}${l.vimeoHash ? `?h=${l.vimeoHash}` : ""}`
        : "";
      map[l._id.toString()] = {
        linkInput: existingUrl,
        status: l.vimeoId ? "saved" : "idle",
        errorMsg: "",
      };
    });
    return map;
  });

  // Modals state
  const [pasteModalChapter, setPasteModalChapter] = useState(null); // Chapter object
  const [pasteLinksText, setPasteLinksText] = useState("");
  const [savingPaste, setSavingPaste] = useState(false);

  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");

  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterBookId, setNewChapterBookId] = useState("");

  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [newLectureChapterId, setNewLectureChapterId] = useState("");
  const [newLectureDuration, setNewLectureDuration] = useState("20:00");

  const [statusBanner, setStatusBanner] = useState("");

  // Sync state if initialLectures changes
  useEffect(() => {
    setBooks(initialBooks);
    setChapters(initialChapters);
    setLectures(initialLectures);

    const map = {};
    initialLectures.forEach((l) => {
      const existingUrl = l.vimeoId
        ? `https://player.vimeo.com/video/${l.vimeoId}${l.vimeoHash ? `?h=${l.vimeoHash}` : ""}`
        : "";
      map[l._id.toString()] = {
        linkInput: existingUrl,
        status: l.vimeoId ? "saved" : "idle",
        errorMsg: "",
      };
    });
    setRowStates(map);

    if (initialChapters.length > 0) {
      setOpenChapters((prev) => ({
        ...prev,
        [initialChapters[0]._id.toString()]: true,
      }));
    }
  }, [initialBooks, initialChapters, initialLectures]);

  // Overall counts
  const totalLecturesCount = lectures.length;
  const lecturesWithVideosCount = useMemo(() => {
    return lectures.filter((l) => l.vimeoId && l.vimeoId.trim() !== "").length;
  }, [lectures]);

  // Handle Course Switch
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const target = courses.find((c) => c._id.toString() === courseId);
    if (target) {
      setSelectedCourse(target);
      router.push(`/admin/lectures?course=${target.slug || target._id}`);
    }
  };

  const toggleChapter = (chId) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  // Inline Title Save
  const handleTitleBlur = async (lectureId, newTitle) => {
    const clean = (newTitle || "").trim();
    if (!clean) return;

    // optimistic update
    setLectures((prev) =>
      prev.map((l) => (l._id.toString() === lectureId ? { ...l, title: clean } : l))
    );

    try {
      await fetch(`/api/admin/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: clean }),
      });
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // Inline Free Toggle Save
  const handleFreeToggle = async (lectureId, isFree) => {
    setLectures((prev) =>
      prev.map((l) => (l._id.toString() === lectureId ? { ...l, isFree } : l))
    );

    try {
      await fetch(`/api/admin/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFree }),
      });
      showStatus("Lecture access updated");
    } catch (err) {
      console.error("Failed to update free state:", err);
    }
  };

  // Inline Vimeo Link Auto-Save on Blur / Paste
  const handleVimeoLinkBlur = async (lectureId, rawInput) => {
    const trimmed = (rawInput || "").trim();

    if (!trimmed) {
      // Clear video link
      setRowStates((prev) => ({
        ...prev,
        [lectureId]: { linkInput: "", status: "idle", errorMsg: "" },
      }));
      setLectures((prev) =>
        prev.map((l) =>
          l._id.toString() === lectureId
            ? { ...l, vimeoId: "", vimeoHash: "", videoUrl: "", status: "draft" }
            : l
        )
      );

      try {
        await fetch(`/api/admin/lectures/${lectureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vimeoId: "",
            vimeoHash: "",
            videoUrl: "",
            status: "draft",
          }),
        });
      } catch (err) {
        console.error("Failed to clear video link:", err);
      }
      return;
    }

    const parsed = parseVimeoUrl(trimmed);
    if (!parsed.vimeoId) {
      setRowStates((prev) => ({
        ...prev,
        [lectureId]: {
          linkInput: trimmed,
          status: "error",
          errorMsg: "Invalid link, copy it from Vimeo > Share > Embed",
        },
      }));
      return;
    }

    // Valid link: update state & save to server
    const fullEmbedUrl = `https://player.vimeo.com/video/${parsed.vimeoId}${
      parsed.vimeoHash ? `?h=${parsed.vimeoHash}` : ""
    }`;

    setRowStates((prev) => ({
      ...prev,
      [lectureId]: { linkInput: fullEmbedUrl, status: "saved", errorMsg: "" },
    }));

    setLectures((prev) =>
      prev.map((l) =>
        l._id.toString() === lectureId
          ? {
              ...l,
              vimeoId: parsed.vimeoId,
              vimeoHash: parsed.vimeoHash || "",
              videoUrl: trimmed,
              status: "published",
            }
          : l
      )
    );

    try {
      await fetch(`/api/admin/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vimeoId: parsed.vimeoId,
          vimeoHash: parsed.vimeoHash || "",
          videoUrl: trimmed,
          status: "published",
        }),
      });
      showStatus("✓ Video link saved");
    } catch (err) {
      console.error("Failed to save video link:", err);
      setRowStates((prev) => ({
        ...prev,
        [lectureId]: {
          ...prev[lectureId],
          status: "error",
          errorMsg: "Server error saving video",
        },
      }));
    }
  };

  // Delete Lecture
  const handleDeleteLecture = async (lecture) => {
    if (!window.confirm(`Delete lecture "${lecture.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/lectures/${lecture._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLectures((prev) => prev.filter((l) => l._id.toString() !== lecture._id.toString()));
        showStatus(`Deleted lecture: ${lecture.title}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Save Bulk Pasted Vimeo Links
  const handleSaveBulkLinks = async () => {
    if (!pasteModalChapter) return;
    const lines = pasteLinksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const chapterLectures = lectures
      .filter((l) => (l.chapterId?._id || l.chapterId)?.toString() === pasteModalChapter._id.toString())
      .sort((a, b) => (a.lectureNo || a.position || 0) - (b.lectureNo || b.position || 0));

    if (lines.length === 0) {
      alert("Please paste at least one Vimeo link.");
      return;
    }

    setSavingPaste(true);
    const updates = [];
    for (let i = 0; i < chapterLectures.length; i++) {
      const lec = chapterLectures[i];
      const link = lines[i] || "";
      if (link) {
        updates.push({
          lectureId: lec._id.toString(),
          vimeoUrl: link,
        });
      }
    }

    try {
      const res = await fetch("/api/admin/lectures/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_vimeo_links",
          ids: updates.map((u) => u.lectureId),
          updates,
        }),
      });

      if (res.ok) {
        // Update local state
        const updatedIdsMap = {};
        updates.forEach((u) => {
          const parsed = parseVimeoUrl(u.vimeoUrl);
          updatedIdsMap[u.lectureId] = {
            vimeoId: parsed.vimeoId || "",
            vimeoHash: parsed.vimeoHash || "",
            videoUrl: u.vimeoUrl,
          };
        });

        setLectures((prev) =>
          prev.map((l) => {
            const up = updatedIdsMap[l._id.toString()];
            if (up) {
              return { ...l, ...up, status: up.vimeoId ? "published" : "draft" };
            }
            return l;
          })
        );

        setRowStates((prev) => {
          const next = { ...prev };
          updates.forEach((u) => {
            const parsed = parseVimeoUrl(u.vimeoUrl);
            const fullUrl = parsed.vimeoId
              ? `https://player.vimeo.com/video/${parsed.vimeoId}${parsed.vimeoHash ? `?h=${parsed.vimeoHash}` : ""}`
              : u.vimeoUrl;
            next[u.lectureId] = {
              linkInput: fullUrl,
              status: parsed.vimeoId ? "saved" : "error",
              errorMsg: parsed.vimeoId ? "" : "Invalid link",
            };
          });
          return next;
        });

        showStatus(`✓ Saved ${updates.length} video links for ${pasteModalChapter.title}`);
        setPasteModalChapter(null);
        setPasteLinksText("");
      } else {
        alert("Failed to save bulk links.");
      }
    } catch (err) {
      console.error("Bulk save failed:", err);
      alert("Error saving links.");
    } finally {
      setSavingPaste(false);
    }
  };

  // Add Book
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !selectedCourse) return;

    try {
      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          title: newBookTitle.trim(),
          status: "published",
        }),
      });
      const data = await res.json();
      if (data.success && data.book) {
        setBooks((prev) => [...prev, data.book]);
        setShowAddBookModal(false);
        setNewBookTitle("");
        showStatus(`✓ Book "${data.book.title}" added`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Chapter
  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !newChapterBookId || !selectedCourse) return;

    try {
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          bookId: newChapterBookId,
          title: newChapterTitle.trim(),
          status: "published",
        }),
      });
      const data = await res.json();
      if (data.success && data.chapter) {
        setChapters((prev) => [...prev, data.chapter]);
        setOpenChapters((prev) => ({ ...prev, [data.chapter._id.toString()]: true }));
        setShowAddChapterModal(false);
        setNewChapterTitle("");
        showStatus(`✓ Chapter "${data.chapter.title}" added`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Lecture
  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLectureTitle.trim() || !newLectureChapterId || !selectedCourse) return;

    const chapter = chapters.find((c) => c._id.toString() === newLectureChapterId);
    const bookId = chapter?.bookId?._id || chapter?.bookId || books[0]?._id;

    let durSeconds = 1200;
    if (newLectureDuration.includes(":")) {
      const [m, s] = newLectureDuration.split(":").map(Number);
      durSeconds = (m || 0) * 60 + (s || 0);
    } else {
      durSeconds = parseInt(newLectureDuration, 10) || 1200;
    }

    try {
      const res = await fetch("/api/admin/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          bookId,
          chapterId: newLectureChapterId,
          title: newLectureTitle.trim(),
          durationSeconds: durSeconds,
          status: "draft",
          isFree: false,
        }),
      });
      const data = await res.json();
      if (data.success && data.lecture) {
        setLectures((prev) => [...prev, data.lecture]);
        setShowAddLectureModal(false);
        setNewLectureTitle("");
        showStatus(`✓ Lecture "${data.lecture.title}" added`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showStatus = (msg) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(""), 4000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP BAR */}
      <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <label htmlFor="course-select" className="text-[11px] font-bold uppercase tracking-wider text-[#B7791F] block mb-1">
                COURSE
              </label>
              <select
                id="course-select"
                value={selectedCourse?._id?.toString() || ""}
                onChange={handleCourseChange}
                className="h-11 px-4 rounded-xl border border-[#CBD5E1] bg-white font-bold text-[#0B2A4A] text-[15px] focus:outline-none focus:border-[#FFC93C] shadow-2xs cursor-pointer min-w-[260px]"
              >
                {courses.map((c) => (
                  <option key={c._id.toString()} value={c._id.toString()}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter */}
            <div className="sm:border-l sm:border-gray-200 sm:pl-4 pt-1 sm:pt-0">
              <span className="text-[12px] font-bold text-[#64748B] block">PROGRESS</span>
              <span className="text-[17px] font-black text-[#0B2A4A]">
                <span className="text-[#E8870E]">{lecturesWithVideosCount}</span> of {totalLecturesCount} lectures have video links
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddLectureModal(true)}
              className="h-10 px-4 rounded-xl bg-[#0B2A4A] hover:bg-[#152B52] text-white font-bold text-[13px] flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lecture</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (books.length > 0) setNewChapterBookId(books[0]._id.toString());
                setShowAddChapterModal(true);
              }}
              className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#0B2A4A] font-bold text-[13px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gray-500" />
              <span>Add Chapter</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddBookModal(true)}
              className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#0B2A4A] font-bold text-[13px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-gray-500" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* HELPER LINE */}
        <div className="mt-5 rounded-xl bg-[#FFF8EE] border border-[rgba(232,135,14,0.25)] p-3.5 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#E8870E] text-white flex items-center justify-center font-bold text-xs shrink-0">
            i
          </div>
          <p className="text-[13px] font-semibold text-[#8C4A00] leading-snug">
            <span className="font-bold">How to add Vimeo videos:</span> 1. Open the video in Vimeo &nbsp;→&nbsp; 2. Share &gt; Embed &gt; Copy &nbsp;→&nbsp; 3. Paste it in the Vimeo link box.
          </p>
        </div>

        {/* Temporary toast/status */}
        {statusBanner && (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 animate-in fade-in">
            {statusBanner}
          </div>
        )}
      </div>

      {/* 2. BOOKS & CHAPTERS SECTIONS */}
      {books.map((book, bIdx) => {
        const bookChapters = chapters.filter(
          (c) => (c.bookId?._id || c.bookId)?.toString() === book._id.toString()
        );

        return (
          <div key={book._id.toString()} className="space-y-4">
            {/* Book Header */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0B2A4A] text-white font-black text-xs shadow-xs">
                {bIdx + 1}
              </div>
              <h3 className="text-[19px] font-extrabold text-[#0B2A4A] tracking-tight">
                Book {book.position || bIdx + 1}: {book.title}
              </h3>
            </div>

            {/* Chapters */}
            <div className="space-y-4">
              {bookChapters.map((ch) => {
                const chId = ch._id.toString();
                const isOpen = !!openChapters[chId];

                // Lectures belonging to this chapter
                const chapterLectures = lectures
                  .filter((l) => (l.chapterId?._id || l.chapterId)?.toString() === chId)
                  .sort((a, b) => (a.lectureNo || a.position || 0) - (b.lectureNo || b.position || 0));

                const addedCount = chapterLectures.filter(
                  (l) => l.vimeoId && l.vimeoId.trim() !== ""
                ).length;

                return (
                  <div
                    key={chId}
                    className="rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-xs transition-all"
                  >
                    {/* Chapter Header */}
                    <div className="px-5 py-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFBFD] border-b border-[#F1F5F9]">
                      <button
                        type="button"
                        onClick={() => toggleChapter(chId)}
                        className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FFF8EE] text-[#E8870E] border border-[rgba(232,135,14,0.25)] flex items-center justify-center font-black text-xs shrink-0">
                          {ch.chapterNo || ch.position || 1}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-[16px] font-bold text-[#0B2A4A] truncate">
                            Chapter {ch.chapterNo || ch.position || 1} · {ch.title}
                          </h4>
                          <span className="text-[12px] font-semibold text-[#64748B]">
                            <span className="text-[#E8870E] font-bold">{addedCount}</span> of {chapterLectures.length} videos added
                          </span>
                        </div>
                      </button>

                      {/* Right Chapter Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPasteModalChapter(ch);
                            setPasteLinksText("");
                          }}
                          className="h-8 px-3 rounded-lg bg-white border border-[#CBD5E1] hover:bg-gray-50 text-[#0B2A4A] font-bold text-[12px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5 text-[#B7791F]" />
                          <span>Paste all links</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleChapter(chId)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Toggle chapter"
                        >
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Table / Rows inside chapter */}
                    {isOpen && (
                      <div className="overflow-x-auto">
                        {chapterLectures.length === 0 ? (
                          <div className="p-8 text-center text-xs text-gray-500 font-medium">
                            No lectures in this chapter yet. Click &quot;Add Lecture&quot; above to add one.
                          </div>
                        ) : (
                          <table className="w-full text-left text-[14px] border-collapse">
                            <thead>
                              <tr className="border-b border-[#F1F5F9] text-[11px] font-bold uppercase tracking-wider text-[#64748B] bg-white">
                                <th className="py-3 px-4 w-12 text-center">No.</th>
                                <th className="py-3 px-4 min-w-[280px]">Title</th>
                                <th className="py-3 px-4 w-28">Duration</th>
                                <th className="py-3 px-4 min-w-[320px]">Vimeo Link</th>
                                <th className="py-3 px-4 w-20 text-center">Free</th>
                                <th className="py-3 px-4 w-12 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                              {chapterLectures.map((lec, lIdx) => {
                                const lecId = lec._id.toString();
                                const rowState = rowStates[lecId] || {
                                  linkInput: "",
                                  status: "idle",
                                  errorMsg: "",
                                };
                                const isTitleIncomplete =
                                  lec.checkTitle || (lec.title && lec.title.endsWith("..."));

                                return (
                                  <tr
                                    key={lecId}
                                    className="hover:bg-[#FAFBFD] transition-colors"
                                  >
                                    {/* 1. No */}
                                    <td className="py-3 px-4 text-center font-bold text-gray-500 text-xs">
                                      {lec.lectureNo || lIdx + 1}
                                    </td>

                                    {/* 2. Title (Editable in place) */}
                                    <td className="py-3 px-4">
                                      <div className="flex flex-col gap-1">
                                        <input
                                          type="text"
                                          defaultValue={lec.title}
                                          onBlur={(e) => handleTitleBlur(lecId, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.currentTarget.blur();
                                            }
                                          }}
                                          className="w-full font-medium text-[#0B2A4A] bg-transparent hover:bg-white focus:bg-white px-2 py-1 -mx-2 rounded border border-transparent hover:border-gray-200 focus:border-[#FFC93C] focus:outline-none text-[14px]"
                                        />
                                        {isTitleIncomplete && (
                                          <span className="self-start inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.2 text-[10px] font-bold">
                                            title incomplete
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* 3. Duration */}
                                    <td className="py-3 px-4 text-xs font-semibold text-[#64748B] tabular-nums">
                                      {lec.duration_mmss || formatDuration(lec.durationSeconds || lec.durationSec)}
                                    </td>

                                    {/* 4. Vimeo Link Box (ONE box, auto-saves) */}
                                    <td className="py-3 px-4">
                                      <div className="space-y-1">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={rowState.linkInput}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setRowStates((prev) => ({
                                                ...prev,
                                                [lecId]: {
                                                  ...prev[lecId],
                                                  linkInput: val,
                                                },
                                              }));
                                            }}
                                            onBlur={(e) => handleVimeoLinkBlur(lecId, e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.currentTarget.blur();
                                              }
                                            }}
                                            placeholder="Paste Vimeo embed or URL..."
                                            className={`w-full h-9 px-3 rounded-lg border text-xs focus:outline-none transition-all ${
                                              rowState.status === "error"
                                                ? "border-rose-400 bg-rose-50/40 text-rose-800"
                                                : rowState.status === "saved" && rowState.linkInput
                                                ? "border-emerald-300 bg-emerald-50/30 text-[#0B2A4A]"
                                                : "border-gray-200 bg-white text-[#0B2A4A] focus:border-[#FFC93C]"
                                            }`}
                                          />
                                        </div>

                                        {/* Status message */}
                                        {rowState.status === "saved" && rowState.linkInput && (
                                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            Video added
                                          </span>
                                        )}
                                        {rowState.status === "error" && (
                                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 text-rose-600" />
                                            {rowState.errorMsg}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* 5. Free Checkbox */}
                                    <td className="py-3 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(lec.isFree)}
                                        onChange={(e) => handleFreeToggle(lecId, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#0B2A4A] focus:ring-[#FFC93C] cursor-pointer"
                                        title="Toggle free preview"
                                      />
                                    </td>

                                    {/* 6. Delete Action */}
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLecture(lec)}
                                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Delete lecture"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* MODAL: PASTE ALL LINKS FOR CHAPTER */}
      {pasteModalChapter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPasteModalChapter(null)}
        >
          <div
            className="w-full max-w-xl rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B7791F]">
                  BULK PASTE VIMEO LINKS
                </span>
                <h3 className="mt-1 text-[19px] font-bold text-[#0B2A4A]">
                  {pasteModalChapter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasteModalChapter(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#64748B]">
              Paste Vimeo URLs or &lt;iframe&gt; embed codes below, <strong>one link per line</strong>. They will fill this chapter&apos;s lectures in order.
            </p>

            <textarea
              rows={8}
              value={pasteLinksText}
              onChange={(e) => setPasteLinksText(e.target.value)}
              placeholder="https://vimeo.com/1040854407&#10;<iframe src=&quot;https://player.vimeo.com/video/1040854407?h=59f81bc26c&quot; ...>&#10;https://player.vimeo.com/video/1040854407"
              className="w-full rounded-xl border border-gray-200 p-3 font-mono text-xs text-[#0B2A4A] focus:outline-none focus:border-[#FFC93C]"
            />

            {/* Preview counts */}
            {(() => {
              const linesCount = pasteLinksText.split("\n").filter((l) => l.trim()).length;
              const chapterLecsCount = lectures.filter(
                (l) => (l.chapterId?._id || l.chapterId)?.toString() === pasteModalChapter._id.toString()
              ).length;

              return (
                <div className="flex items-center justify-between text-xs font-bold text-[#0B2A4A] bg-[#FFF8EE] border border-[rgba(232,135,14,0.25)] p-2.5 rounded-lg">
                  <span>
                    Preview: <span className="text-[#E8870E]">{linesCount}</span> links for{" "}
                    <span className="text-[#E8870E]">{chapterLecsCount}</span> lectures
                  </span>
                  {linesCount > chapterLecsCount && (
                    <span className="text-amber-700 text-[11px]">
                      (Extra links will be ignored)
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalChapter(null)}
                className="h-10 px-4 rounded-xl border border-gray-200 text-[#475569] font-semibold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPaste || !pasteLinksText.trim()}
                onClick={handleSaveBulkLinks}
                className="h-10 px-5 rounded-xl bg-[#0B2A4A] hover:bg-[#152B52] disabled:opacity-50 text-white font-bold text-[13px] flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
              >
                {savingPaste ? "Saving..." : "Save Links"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BOOK */}
      {showAddBookModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAddBookModal(false)}
        >
          <form
            onSubmit={handleAddBook}
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0B2A4A]">+ Add Book</h3>
              <button
                type="button"
                onClick={() => setShowAddBookModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Book Name
              </label>
              <input
                type="text"
                required
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="e.g. Book 2: Company Accounts"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBookModal(false)}
                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold shadow-xs"
              >
                Create Book
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD CHAPTER */}
      {showAddChapterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAddChapterModal(false)}
        >
          <form
            onSubmit={handleAddChapter}
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0B2A4A]">+ Add Chapter</h3>
              <button
                type="button"
                onClick={() => setShowAddChapterModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Select Book
              </label>
              <select
                value={newChapterBookId}
                onChange={(e) => setNewChapterBookId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              >
                {books.map((b) => (
                  <option key={b._id.toString()} value={b._id.toString()}>
                    Book {b.position || 1}: {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Chapter Name
              </label>
              <input
                type="text"
                required
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="e.g. Accounting for Share Capital"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddChapterModal(false)}
                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold shadow-xs"
              >
                Create Chapter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD LECTURE */}
      {showAddLectureModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAddLectureModal(false)}
        >
          <form
            onSubmit={handleAddLecture}
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0B2A4A]">+ Add Lecture</h3>
              <button
                type="button"
                onClick={() => setShowAddLectureModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Select Chapter
              </label>
              <select
                value={newLectureChapterId || chapters[0]?._id?.toString() || ""}
                onChange={(e) => setNewLectureChapterId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              >
                {chapters.map((ch) => (
                  <option key={ch._id.toString()} value={ch._id.toString()}>
                    Ch {ch.chapterNo || ch.position || 1}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Lecture Title
              </label>
              <input
                type="text"
                required
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                placeholder="e.g. Pro-Rata Allotment Part 1"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#475569] block mb-1">
                Duration (mm:ss)
              </label>
              <input
                type="text"
                value={newLectureDuration}
                onChange={(e) => setNewLectureDuration(e.target.value)}
                placeholder="24:30"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFC93C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLectureModal(false)}
                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold shadow-xs"
              >
                Create Lecture
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
