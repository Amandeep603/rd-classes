"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Play,
  GripVertical,
  Check,
  X,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Upload,
  MoreVertical,
  FolderPlus,
  Move,
  Layers,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import VimeoImportModal from "./VimeoImportModal";
import VimeoPlayer from "@/components/student/VimeoPlayer";

// Natural sort: "Class 2" before "Class 10", "Part 2" before "Part 10"
function naturalCompare(a, b) {
  return (a || "").localeCompare(b || "", undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
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

  // Active course
  const [selectedCourse, setSelectedCourse] = useState(
    initialCourse || courses[0] || null
  );

  // Core data states
  const [books, setBooks] = useState(initialBooks);
  const [chapters, setChapters] = useState(initialChapters);
  const [lectures, setLectures] = useState(initialLectures);

  // Selection & navigation state
  const [selectedBookId, setSelectedBookId] = useState(() => {
    return initialBooks[0]?._id?.toString() || "";
  });
  const [selectedChapterId, setSelectedChapterId] = useState(() => {
    return initialChapters[0]?._id?.toString() || "";
  });

  // Expanded book IDs in tree
  const [expandedBookIds, setExpandedBookIds] = useState(() => {
    const set = new Set();
    initialBooks.forEach((b) => set.add(b._id?.toString()));
    return set;
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Modals state
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [isVimeoImportOpen, setIsVimeoImportOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [testPlayLecture, setTestPlayLecture] = useState(null);

  // Inline rename state: { id, type: 'book' | 'chapter', title }
  const [inlineEditing, setInlineEditing] = useState(null);

  // Quick Add inline states
  const [newBookTitle, setNewBookTitle] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newChapterBookId, setNewChapterBookId] = useState(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  // Drag reordering state
  const [draggedItem, setDraggedItem] = useState(null); // { id, type: 'book' | 'chapter' | 'lecture' }

  // Lecture form state (for Add / Edit)
  const [lectureForm, setLectureForm] = useState({
    title: "",
    partNumber: 1,
    description: "",
    videoProvider: "vimeo",
    videoUrl: "",
    durationSeconds: "",
    status: "published",
    isFree: false,
    bookId: "",
    chapterId: "",
  });


  // Target chapter for bulk move
  const [targetMoveChapterId, setTargetMoveChapterId] = useState("");

  // Sync state if initialCourse or initial lists change
  useEffect(() => {
    setSelectedCourse(initialCourse || courses[0] || null);
    setBooks(initialBooks || []);
    setChapters(initialChapters || []);
    setLectures(initialLectures || []);
    if (initialBooks && initialBooks.length > 0) {
      if (!selectedBookId || !initialBooks.some((b) => b._id?.toString() === selectedBookId)) {
        setSelectedBookId(initialBooks[0]._id.toString());
      }
    }
    if (initialChapters && initialChapters.length > 0) {
      if (!selectedChapterId || !initialChapters.some((c) => c._id?.toString() === selectedChapterId)) {
        setSelectedChapterId(initialChapters[0]._id.toString());
      }
    }
  }, [initialCourse, initialBooks, initialChapters, initialLectures, courses]);

  // When course changes via dropdown
  const handleCourseChange = (slug) => {
    const found = courses.find((c) => c.slug === slug || c._id === slug);
    if (found) {
      router.push(`/admin/lectures?course=${found.slug}`);
    }
  };

  // Helper to show transient feedback
  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 3500);
  };

  // Active book & chapter objects
  const activeBook = useMemo(() => {
    return books.find((b) => b._id.toString() === selectedBookId) || books[0] || null;
  }, [books, selectedBookId]);

  const activeChapter = useMemo(() => {
    return (
      chapters.find((c) => c._id.toString() === selectedChapterId) ||
      chapters.find((c) => c.bookId?.toString() === activeBook?._id?.toString()) ||
      chapters[0] ||
      null
    );
  }, [chapters, selectedChapterId, activeBook]);

  // Stats across the entire selected course
  const courseStats = useMemo(() => {
    const total = lectures.length;
    let free = 0;
    let locked = 0;
    let published = 0;
    let draft = 0;

    lectures.forEach((l) => {
      if (l.isFree || l.isFreePreview || l.freePreview) free++;
      else locked++;
      if (l.status === "published" || l.published) published++;
      else draft++;
    });

    return { total, free, locked, published, draft };
  }, [lectures]);

  // Map of chapter counts: chapterId -> { total, free, locked }
  const chapterCountsMap = useMemo(() => {
    const map = new Map();
    chapters.forEach((c) => {
      map.set(c._id.toString(), { total: 0, free: 0, locked: 0 });
    });

    lectures.forEach((l) => {
      const cId = l.chapterId?._id?.toString() || l.chapterId?.toString();
      if (cId && map.has(cId)) {
        const item = map.get(cId);
        item.total++;
        if (l.isFree || l.isFreePreview || l.freePreview) {
          item.free++;
        } else {
          item.locked++;
        }
      }
    });

    return map;
  }, [chapters, lectures]);

  // Lectures for the active view:
  // If search is active, search across the course and naturally sort
  // Otherwise, show activeChapter lectures sorted by position
  const displayedLectures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      return lectures
        .filter((l) => l.title?.toLowerCase().includes(q))
        .sort((a, b) => naturalCompare(a.title, b.title));
    }

    if (!activeChapter) return [];

    return lectures
      .filter((l) => {
        const cId = l.chapterId?._id?.toString() || l.chapterId?.toString();
        return cId === activeChapter._id.toString();
      })
      .sort((a, b) => (a.position ?? a.order ?? 0) - (b.position ?? b.order ?? 0));
  }, [lectures, activeChapter, searchTerm]);

  // Toggle book expansion
  const toggleBookExpanded = (bId) => {
    setExpandedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(bId)) next.delete(bId);
      else next.add(bId);
      return next;
    });
  };

  // --- ACTIONS: BOOK ---
  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !selectedCourse) return;

    try {
      setLoading(true);
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
        setSelectedBookId(data.book._id.toString());
        setExpandedBookIds((prev) => new Set([...prev, data.book._id.toString()]));
        setNewBookTitle("");
        setIsAddingBook(false);
        showFeedback(`Book "${data.book.title}" created.`);
      } else {
        alert(data.error || "Failed to create book");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async (bookId, patchData) => {
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.book) {
          setBooks((prev) =>
            prev.map((b) => (b._id.toString() === bookId ? { ...b, ...data.book } : b))
          );
        }
        if (patchData.action === "unlock_all" || patchData.action === "lock_all") {
          // Re-fetch lectures or update local state
          const isFreeVal = patchData.action === "unlock_all";
          setLectures((prev) =>
            prev.map((l) => {
              const bId = l.bookId?._id?.toString() || l.bookId?.toString();
              return bId === bookId ? { ...l, isFree: isFreeVal, freePreview: isFreeVal } : l;
            })
          );
          showFeedback(data.message || "Book lectures updated.");
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm("Are you sure you want to delete this Book, all its Chapters and Lectures?")) return;
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBooks((prev) => prev.filter((b) => b._id.toString() !== bookId));
        setChapters((prev) => prev.filter((c) => c.bookId?.toString() !== bookId));
        setLectures((prev) => {
          return prev.filter((l) => {
            const bId = l.bookId?._id?.toString() || l.bookId?.toString();
            return bId !== bookId;
          });
        });
        showFeedback("Book and its contents deleted.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // --- ACTIONS: CHAPTER ---
  const handleAddChapter = async (bookId) => {
    if (!newChapterTitle.trim() || !selectedCourse || !bookId) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse._id,
          bookId,
          title: newChapterTitle.trim(),
          status: "published",
        }),
      });
      const data = await res.json();
      if (data.success && data.chapter) {
        setChapters((prev) => [...prev, data.chapter]);
        setSelectedChapterId(data.chapter._id.toString());
        setSelectedBookId(bookId);
        setNewChapterTitle("");
        setNewChapterBookId(null);
        showFeedback(`Chapter "${data.chapter.title}" created.`);
      } else {
        alert(data.error || "Failed to create chapter");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChapter = async (chapterId, patchData) => {
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.chapter) {
          setChapters((prev) =>
            prev.map((c) => (c._id.toString() === chapterId ? { ...c, ...data.chapter } : c))
          );
        }
        if (patchData.action === "unlock_all" || patchData.action === "lock_all") {
          const isFreeVal = patchData.action === "unlock_all";
          setLectures((prev) =>
            prev.map((l) => {
              const cId = l.chapterId?._id?.toString() || l.chapterId?.toString();
              return cId === chapterId ? { ...l, isFree: isFreeVal, freePreview: isFreeVal } : l;
            })
          );
          showFeedback(data.message || "Chapter lectures updated.");
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm("Delete this chapter and all its lectures?")) return;
    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setChapters((prev) => prev.filter((c) => c._id.toString() !== chapterId));
        setLectures((prev) => {
          return prev.filter((l) => {
            const cId = l.chapterId?._id?.toString() || l.chapterId?.toString();
            return cId !== chapterId;
          });
        });
        showFeedback("Chapter and its lectures deleted.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // --- ACTIONS: LECTURE ---
  const handleToggleLock = async (lecture) => {
    const nextFree = !lecture.isFree;
    try {
      const res = await fetch(`/api/admin/lectures/${lecture._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFree: nextFree }),
      });
      const data = await res.json();
      if (data.success) {
        setLectures((prev) =>
          prev.map((l) =>
            l._id === lecture._id
              ? { ...l, isFree: nextFree, isFreePreview: nextFree, freePreview: nextFree }
              : l
          )
        );
        showFeedback(nextFree ? "Lecture set to FREE" : "Lecture LOCKED");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTogglePublish = async (lecture) => {
    const nextStatus = lecture.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/lectures/${lecture._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLectures((prev) =>
          prev.map((l) =>
            l._id === lecture._id
              ? { ...l, status: nextStatus, published: nextStatus === "published" }
              : l
          )
        );
        showFeedback(`Lecture set to ${nextStatus.toUpperCase()}`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      const res = await fetch(`/api/admin/lectures/${lectureId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setLectures((prev) => prev.filter((l) => l._id !== lectureId));
        setSelectedIds((prev) => prev.filter((id) => id !== lectureId));
        showFeedback("Lecture deleted.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Add/Edit Lecture
  const handleSaveLectureForm = async (e) => {
    e.preventDefault();
    if (!lectureForm.title.trim() || !selectedCourse) return;

    const bId = lectureForm.bookId || activeBook?._id?.toString();
    const cId = lectureForm.chapterId || activeChapter?._id?.toString();

    if (!cId) {
      alert("Please select or create a chapter first.");
      return;
    }

    try {
      setLoading(true);
      if (editingLecture) {
        // Edit mode
        const res = await fetch(`/api/admin/lectures/${editingLecture._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lectureForm.title.trim(),
            partNumber: Number(lectureForm.partNumber) || 1,
            description: lectureForm.description,
            videoProvider: lectureForm.videoProvider,
            videoUrl: lectureForm.videoUrl,
            durationSeconds: Number(lectureForm.durationSeconds) || 0,
            status: lectureForm.status,
            isFree: Boolean(lectureForm.isFree),
            bookId: bId,
            chapterId: cId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setLectures((prev) =>
            prev.map((l) => (l._id === editingLecture._id ? { ...l, ...data.lecture } : l))
          );
          setIsAddLectureOpen(false);
          setEditingLecture(null);
          showFeedback("Lecture updated.");
        } else {
          alert(data.error || "Failed to update lecture");
        }
      } else {
        // Add mode
        const res = await fetch("/api/admin/lectures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: selectedCourse._id,
            bookId: bId,
            chapterId: cId,
            title: lectureForm.title.trim(),
            partNumber: Number(lectureForm.partNumber) || 1,
            description: lectureForm.description,
            videoProvider: lectureForm.videoProvider,
            videoUrl: lectureForm.videoUrl,
            durationSeconds: Number(lectureForm.durationSeconds) || 0,
            status: lectureForm.status,
            isFree: Boolean(lectureForm.isFree),
          }),
        });
        const data = await res.json();
        if (data.success && data.lecture) {
          setLectures((prev) => [...prev, data.lecture]);
          setIsAddLectureOpen(false);
          showFeedback("Lecture added.");
        } else {
          alert(data.error || "Failed to add lecture");
        }
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddLecture = () => {
    const nextPart = (displayedLectures.length || 0) + 1;
    setLectureForm({
      title: "",
      partNumber: nextPart,
      description: "",
      videoProvider: "vimeo",
      videoUrl: "",
      durationSeconds: "",
      status: "published",
      isFree: false,
      bookId: activeBook?._id?.toString() || "",
      chapterId: activeChapter?._id?.toString() || "",
    });
    setEditingLecture(null);
    setIsAddLectureOpen(true);
  };

  const openEditLecture = (lec) => {
    setEditingLecture(lec);
    setLectureForm({
      title: lec.title || "",
      partNumber: lec.partNumber || 1,
      description: lec.description || "",
      videoProvider: lec.videoProvider || "vimeo",
      videoUrl: lec.videoUrl || "",
      durationSeconds: lec.durationSeconds || lec.durationSec || "",
      status: lec.status || "published",
      isFree: Boolean(lec.isFree || lec.isFreePreview || lec.freePreview),
      bookId: lec.bookId?._id?.toString() || lec.bookId?.toString() || "",
      chapterId: lec.chapterId?._id?.toString() || lec.chapterId?.toString() || "",
    });
    setIsAddLectureOpen(true);
  };

  // --- ACTIONS: BULK ON SELECTED ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = displayedLectures.map((l) => l._id.toString());
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.length} lectures?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/admin/lectures/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          targetChapterId: targetMoveChapterId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "make_free") {
          setLectures((prev) =>
            prev.map((l) => (selectedIds.includes(l._id) ? { ...l, isFree: true } : l))
          );
        } else if (action === "make_locked") {
          setLectures((prev) =>
            prev.map((l) => (selectedIds.includes(l._id) ? { ...l, isFree: false } : l))
          );
        } else if (action === "publish") {
          setLectures((prev) =>
            prev.map((l) =>
              selectedIds.includes(l._id) ? { ...l, status: "published", published: true } : l
            )
          );
        } else if (action === "draft") {
          setLectures((prev) =>
            prev.map((l) =>
              selectedIds.includes(l._id) ? { ...l, status: "draft", published: false } : l
            )
          );
        } else if (action === "delete") {
          setLectures((prev) => prev.filter((l) => !selectedIds.includes(l._id)));
        } else if (action === "move_to_chapter") {
          const targetChap = chapters.find((c) => c._id.toString() === targetMoveChapterId);
          setLectures((prev) =>
            prev.map((l) =>
              selectedIds.includes(l._id)
                ? {
                    ...l,
                    chapterId: targetMoveChapterId,
                    bookId: targetChap?.bookId || l.bookId,
                  }
                : l
            )
          );
          setIsMoveModalOpen(false);
        }

        setSelectedIds([]);
        showFeedback(`Bulk action "${action}" completed.`);
      } else {
        alert(data.error || "Bulk action failed");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  // --- DRAG AND DROP REORDER ---
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropLecture = async (e, targetLecture) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== "lecture" || draggedItem.id === targetLecture._id) {
      return;
    }

    const currentList = [...displayedLectures];
    const dragIdx = currentList.findIndex((l) => l._id === draggedItem.id);
    const dropIdx = currentList.findIndex((l) => l._id === targetLecture._id);

    if (dragIdx === -1 || dropIdx === -1) return;

    const [moved] = currentList.splice(dragIdx, 1);
    currentList.splice(dropIdx, 0, moved);

    // Optimistically update positions
    const orderedIds = currentList.map((l) => l._id);
    setLectures((prev) => {
      const otherLectures = prev.filter((l) => !orderedIds.includes(l._id));
      const updated = currentList.map((l, idx) => ({ ...l, position: idx + 1, order: idx + 1 }));
      return [...otherLectures, ...updated];
    });

    setDraggedItem(null);

    // Call API
    try {
      await fetch("/api/admin/lectures/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds, type: "lecture" }),
      });
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Summary Strip */}
      <div className="bg-white rounded-[20px] border border-[rgba(20,30,60,0.06)] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2A4A] tracking-tight">
              Curriculum &amp; Lectures
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Organize books, chapters, video lessons and access permissions.
            </p>
          </div>

          {/* Course Selector Dropdown & Import Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Course:
              </label>
              <select
                value={selectedCourse?.slug || ""}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm font-bold text-[#0B2A4A] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsVimeoImportOpen(true)}
              className="h-10 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              title="Import lectures directly from Vimeo or file"
            >
              <Upload className="w-4 h-4 text-sky-600" />
              <span>Import from Vimeo</span>
            </button>
          </div>
        </div>

        {/* Course-wide Search and Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Tile 1: Total */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#64748B] uppercase">Total Lectures</span>
            <p className="text-lg font-extrabold text-[#0B2A4A] mt-0.5">{courseStats.total}</p>
          </div>

          {/* Tile 2: Free */}
          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
            <span className="text-[11px] font-bold text-[#065F46] uppercase flex items-center gap-1">
              <Unlock className="w-3 h-3 text-[#059669]" />
              Free Previews
            </span>
            <p className="text-lg font-extrabold text-[#059669] mt-0.5">{courseStats.free}</p>
          </div>

          {/* Tile 3: Locked */}
          <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1]">
            <span className="text-[11px] font-bold text-[#334155] uppercase flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#1E293B]" />
              Locked
            </span>
            <p className="text-lg font-extrabold text-[#1E293B] mt-0.5">{courseStats.locked}</p>
          </div>

          {/* Tile 4: Published */}
          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
            <span className="text-[11px] font-bold text-[#1E40AF] uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] inline-block" />
              Published
            </span>
            <p className="text-lg font-extrabold text-[#1D4ED8] mt-0.5">{courseStats.published}</p>
          </div>

          {/* Tile 5: Draft */}
          <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
            <span className="text-[11px] font-bold text-[#92400E] uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />
              Draft
            </span>
            <p className="text-lg font-extrabold text-[#B45309] mt-0.5">{courseStats.draft}</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lectures across all books and chapters..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {feedbackMsg && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ================= LEFT PANEL (280px): Tree Books > Chapters ================= */}
        <aside className="w-full lg:w-[280px] shrink-0 bg-white rounded-[20px] border border-[rgba(20,30,60,0.06)] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#475569]">
              Curriculum Tree
            </h2>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsVimeoImportOpen(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                title="Import from Vimeo or File"
              >
                <Upload className="w-3 h-3" />
                <span>Import</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBook(true)}
                className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Book</span>
              </button>
            </div>
          </div>

          {/* Inline Add Book Form */}
          {isAddingBook && (
            <form onSubmit={handleAddBook} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
              <input
                type="text"
                autoFocus
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="e.g. Book 1: Partnership"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-medium focus:outline-none focus:border-[#0066FF]"
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingBook(false)}
                  className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newBookTitle.trim()}
                  className="px-2.5 py-1 rounded-md bg-[#0B2A4A] text-white text-[11px] font-bold hover:bg-[#15345E]"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Books Tree */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {books.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No books yet. Click &quot;Add Book&quot; above.
              </div>
            ) : (
              books.map((b) => {
                const bId = b._id.toString();
                const isExpanded = expandedBookIds.has(bId);
                const bookChapters = chapters.filter(
                  (c) => c.bookId?.toString() === bId || c.bookId?._id?.toString() === bId
                );

                return (
                  <div key={bId} className="rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] overflow-hidden">
                    {/* Book Row */}
                    <div className="p-2 flex items-center justify-between gap-1.5 hover:bg-[#F0F5FA] transition-colors">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleBookExpanded(bId)}
                          className="p-1 text-gray-400 hover:text-gray-700 shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Status dot */}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            b.status === "published" ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          title={b.status === "published" ? "Published" : "Draft"}
                        />

                        {/* Title or inline edit */}
                        {inlineEditing?.id === bId && inlineEditing?.type === "book" ? (
                          <input
                            type="text"
                            autoFocus
                            defaultValue={b.title}
                            onBlur={(e) => {
                              handleUpdateBook(bId, { title: e.target.value });
                              setInlineEditing(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateBook(bId, { title: e.currentTarget.value });
                                setInlineEditing(null);
                              } else if (e.key === "Escape") {
                                setInlineEditing(null);
                              }
                            }}
                            className="px-1.5 py-0.5 rounded border border-[#0066FF] text-xs font-bold text-[#0B2A4A] w-full"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setSelectedBookId(bId);
                              if (bookChapters[0]) {
                                setSelectedChapterId(bookChapters[0]._id.toString());
                              }
                            }}
                            onDoubleClick={() => setInlineEditing({ id: bId, type: "book" })}
                            className="text-xs font-bold text-[#0B2A4A] truncate cursor-pointer hover:text-[#0066FF]"
                            title="Click to select, double click to rename"
                          >
                            {b.title}
                          </span>
                        )}
                      </div>

                      {/* Book Action Menu */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setNewChapterBookId(bId)}
                          className="p-1 rounded text-gray-400 hover:text-[#0066FF] hover:bg-white"
                          title="Add Chapter to this book"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative group">
                          <button
                            type="button"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-white"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          <div className="hidden group-hover:block absolute right-0 top-full z-20 w-44 rounded-xl bg-white border border-[#E2E8F0] shadow-lg py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateBook(bId, { action: "unlock_all" })}
                              className="w-full px-3 py-1.5 text-left text-emerald-700 hover:bg-emerald-50 font-medium flex items-center gap-2"
                            >
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              Unlock all in book
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBook(bId, { action: "lock_all" })}
                              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                            >
                              <Lock className="w-3 h-3 text-slate-600" />
                              Lock all in book
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBook(bId, {
                                  action: b.status === "published" ? "draft" : "publish",
                                })
                              }
                              className="w-full px-3 py-1.5 text-left text-[#0B2A4A] hover:bg-[#F0F7FF] font-medium flex items-center gap-2"
                            >
                              <Check className="w-3 h-3 text-blue-600" />
                              {b.status === "published" ? "Draft book" : "Publish book"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditing({ id: bId, type: "book" })}
                              className="w-full px-3 py-1.5 text-left text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2"
                            >
                              <Edit2 className="w-3 h-3" />
                              Rename book
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(bId)}
                              className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete book
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inline Add Chapter Form */}
                    {newChapterBookId === bId && (
                      <div className="p-2 bg-white border-t border-[#F1F5F9] space-y-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={newChapterTitle}
                          onChange={(e) => setNewChapterTitle(e.target.value)}
                          placeholder="e.g. Chapter 1: Fundamentals"
                          className="w-full px-2 py-1 rounded border border-[#CBD5E1] text-xs focus:outline-none focus:border-[#0066FF]"
                        />
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setNewChapterBookId(null)}
                            className="px-2 py-0.5 text-[10px] text-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddChapter(bId)}
                            className="px-2 py-0.5 rounded bg-[#0B2A4A] text-white text-[10px] font-bold"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chapters List */}
                    {isExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-1 bg-white border-t border-[#F1F5F9]">
                        {bookChapters.length === 0 ? (
                          <p className="text-[11px] text-gray-400 py-1 pl-2">
                            No chapters. Click + above.
                          </p>
                        ) : (
                          bookChapters.map((c) => {
                            const cId = c._id.toString();
                            const isSelected = selectedChapterId === cId;
                            const counts = chapterCountsMap.get(cId) || { total: 0, free: 0, locked: 0 };

                            return (
                              <div
                                key={cId}
                                onClick={() => {
                                  setSelectedChapterId(cId);
                                  setSelectedBookId(bId);
                                }}
                                className={`px-2 py-1.5 rounded-lg flex items-center justify-between gap-1 cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[#EAF2FE] border border-[#BFDBFE] text-[#0066FF]"
                                    : "hover:bg-[#F8FAFC] text-[#334155]"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      c.status === "published" ? "bg-emerald-500" : "bg-slate-300"
                                    }`}
                                  />
                                  {inlineEditing?.id === cId && inlineEditing?.type === "chapter" ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      defaultValue={c.title}
                                      onBlur={(e) => {
                                        handleUpdateChapter(cId, { title: e.target.value });
                                        setInlineEditing(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleUpdateChapter(cId, { title: e.currentTarget.value });
                                          setInlineEditing(null);
                                        } else if (e.key === "Escape") {
                                          setInlineEditing(null);
                                        }
                                      }}
                                      className="px-1.5 py-0.5 rounded border border-[#0066FF] text-xs font-semibold text-[#0B2A4A] w-full"
                                    />
                                  ) : (
                                    <span
                                      onDoubleClick={() =>
                                        setInlineEditing({ id: cId, type: "chapter" })
                                      }
                                      className="text-xs font-semibold truncate"
                                      title={c.title}
                                    >
                                      {c.title}
                                    </span>
                                  )}
                                </div>

                                {/* Count Chip: e.g. "3 free / 29 locked" */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                      counts.free > 0
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {counts.free > 0 ? `${counts.free} free / ` : ""}
                                    {counts.locked} locked
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteChapter(cId);
                                    }}
                                    className="p-1 rounded text-gray-300 hover:text-rose-600"
                                    title="Delete chapter"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ================= RIGHT PANEL: Lectures Table & Actions ================= */}
        <main className="flex-1 w-full bg-white rounded-[20px] border border-[rgba(20,30,60,0.06)] p-5 shadow-xs space-y-4 min-w-0">
          {/* Header of Selected Chapter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] mb-1">
                <span>{activeBook?.title || "Book"}</span>
                <span>&gt;</span>
                <span className="text-[#0B2A4A]">{activeChapter?.title || "Chapter"}</span>
                {activeChapter && (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeChapter.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {activeChapter.status?.toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-extrabold text-[#0B2A4A] truncate">
                {searchTerm
                  ? `Search results for "${searchTerm}" (${displayedLectures.length})`
                  : activeChapter?.title || "Select a Chapter"}
              </h2>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              {activeChapter && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateChapter(activeChapter._id, { action: "unlock_all" })}
                    className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unlock all</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateChapter(activeChapter._id, { action: "lock_all" })}
                    className="h-9 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Lock all</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateChapter(activeChapter._id, {
                        action: activeChapter.status === "published" ? "draft" : "publish",
                      })
                    }
                    className="h-9 px-3 rounded-xl bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#0066FF] border border-[#BFDBFE] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span>{activeChapter.status === "published" ? "Draft" : "Publish"}</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsVimeoImportOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Import from Vimeo</span>
              </button>

              <button
                type="button"
                onClick={openAddLecture}
                className="h-9 px-4 rounded-xl bg-[#0B2A4A] hover:bg-[#15345E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lecture</span>
              </button>
            </div>
          </div>

          {/* Sticky Bulk Action Bar when rows selected */}
          {selectedIds.length > 0 && (
            <div className="sticky top-2 z-30 p-3 rounded-xl bg-[#0B2A4A] text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-semibold">lectures selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkAction("make_free")}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  <span>Make Free</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkAction("make_locked")}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Make Locked</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkAction("publish")}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Publish
                </button>

                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Move className="w-3 h-3" />
                  <span>Move to Chapter</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkAction("delete")}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1.5 text-xs text-gray-300 hover:text-white"
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}

          {/* Compact 52px Rows Table */}
          <div className="overflow-x-auto rounded-xl border border-[#F1F5F9]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        displayedLectures.length > 0 &&
                        selectedIds.length === displayedLectures.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8"></th>
                  <th className="py-3 px-3 w-16">Part</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3 w-24">Duration</th>
                  <th className="py-3 px-3 w-24">Provider</th>
                  <th className="py-3 px-3 w-32 text-center">Lock Status</th>
                  <th className="py-3 px-3 w-24 text-center">Status</th>
                  <th className="py-3 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {displayedLectures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-[#64748B]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                        <p className="font-semibold text-gray-500">
                          {searchTerm
                            ? `No lectures found matching "${searchTerm}"`
                            : "No lectures in this chapter yet."}
                        </p>
                        {!searchTerm && (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={openAddLecture}
                              className="px-3 py-1.5 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold"
                            >
                              Add First Lecture
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsVimeoImportOpen(true)}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold"
                            >
                              Import from Vimeo
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedLectures.map((lec, idx) => {
                    const isSelected = selectedIds.includes(lec._id);
                    const isFree = Boolean(lec.isFree || lec.isFreePreview || lec.freePreview);

                    return (
                      <tr
                        key={lec._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { id: lec._id, type: "lecture" })}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropLecture(e, lec)}
                        className={`h-[52px] transition-colors ${
                          isSelected ? "bg-[#F0F7FF]" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectId(lec._id)}
                            className="rounded border-gray-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                          />
                        </td>

                        {/* Drag Handle */}
                        <td className="py-2 px-2 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </td>

                        {/* Part Number */}
                        <td className="py-2 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#0B2A4A] font-bold text-xs">
                            P{lec.partNumber || idx + 1}
                          </span>
                        </td>

                        {/* Editable Title */}
                        <td className="py-2 px-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => openEditLecture(lec)}
                              className="text-sm font-semibold text-[#0B2A4A] hover:text-[#0066FF] truncate cursor-pointer"
                              title={lec.title}
                            >
                              {lec.title}
                            </span>
                            {lec.description && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                                title={lec.description}
                              />
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-2 px-3 text-xs font-mono text-[#64748B]">
                          {formatDuration(lec.durationSeconds || lec.durationSec)}
                        </td>

                        {/* Video Provider Badge */}
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              lec.videoProvider === "vimeo"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : lec.videoProvider === "youtube"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : lec.videoProvider === "bunny"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {lec.videoProvider || "vimeo"}
                          </span>
                        </td>

                        {/* Clear Lock Toggle (Navy Lock = locked, Green Unlock = free) */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLock(lec)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isFree
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                                : "bg-[#0B2A4A] text-white hover:bg-[#15345E]"
                            }`}
                            title={isFree ? "Free lecture - click to lock" : "Locked lecture - click to make free"}
                          >
                            {isFree ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                <span>FREE</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-white" />
                                <span>LOCKED</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Status Switch (Published / Draft) */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(lec)}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-colors cursor-pointer ${
                              lec.status === "published" || lec.published
                                ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {lec.status === "published" || lec.published ? "Published" : "Draft"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Test Play */}
                            <button
                              type="button"
                              onClick={() => setTestPlayLecture(lec)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              title="Test play lecture"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditLecture(lec)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit lecture"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLecture(lec._id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Delete lecture"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ================= MODAL: ADD / EDIT LECTURE ================= */}
      {isAddLectureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#CBD5E1] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-bold text-[#0B2A4A]">
                {editingLecture ? "Edit Lecture" : "Add New Lecture"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLectureOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLectureForm} className="space-y-3.5">
              {/* Destination Chapter */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Book</label>
                  <select
                    value={lectureForm.bookId}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, bookId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
                  >
                    {books.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Chapter</label>
                  <select
                    value={lectureForm.chapterId}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, chapterId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
                  >
                    {chapters
                      .filter(
                        (c) =>
                          !lectureForm.bookId ||
                          c.bookId?.toString() === lectureForm.bookId ||
                          c.bookId?._id?.toString() === lectureForm.bookId
                      )
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Title & Part */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-[#475569] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={lectureForm.title}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Profit & Loss Appropriation Account"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium focus:border-[#FFB800]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Part #</label>
                  <input
                    type="number"
                    min="1"
                    value={lectureForm.partNumber}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, partNumber: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-center"
                  />
                </div>
              </div>

              {/* Video Provider & URL */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Provider</label>
                  <select
                    value={lectureForm.videoProvider}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, videoProvider: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
                  >
                    <option value="vimeo">Vimeo</option>
                    <option value="youtube">YouTube</option>
                    <option value="bunny">Bunny CDN</option>
                    <option value="direct">Direct MP4 / HLS</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#475569] mb-1">Video URL or ID</label>
                  <input
                    type="text"
                    value={lectureForm.videoUrl}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, videoUrl: e.target.value }))
                    }
                    placeholder="https://vimeo.com/123456789/hash"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Duration & Switches */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={lectureForm.durationSeconds}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, durationSeconds: e.target.value }))
                    }
                    placeholder="e.g. 1800"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono"
                  />
                </div>

                {/* Free Lock Toggle */}
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Access</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                    <input
                      type="checkbox"
                      checked={lectureForm.isFree}
                      onChange={(e) =>
                        setLectureForm((prev) => ({ ...prev, isFree: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-700">Free Preview</span>
                  </label>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Status</label>
                  <select
                    value={lectureForm.status}
                    onChange={(e) =>
                      setLectureForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={lectureForm.description}
                  onChange={(e) =>
                    setLectureForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Key concepts covered in this part..."
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsAddLectureOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#15345E]"
                >
                  {editingLecture ? "Update Lecture" : "Save Lecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIMEO & FILE IMPORT ================= */}
      <VimeoImportModal
        isOpen={isVimeoImportOpen}
        onClose={() => setIsVimeoImportOpen(false)}
        courseId={selectedCourse?._id?.toString()}
        courseTitle={selectedCourse?.title || "Selected Course"}
        defaultBookId={selectedBookId}
        defaultChapterId={selectedChapterId}
        books={books}
        chapters={chapters}
        onSuccess={() => {
          router.refresh();
          showFeedback("Lectures imported successfully.");
        }}
      />

      {/* ================= MODAL: MOVE TO CHAPTER ================= */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#CBD5E1] space-y-4">
            <h3 className="text-base font-bold text-[#0B2A4A]">Move Selected Lectures</h3>
            <p className="text-xs text-[#64748B]">
              Choose the destination chapter for the {selectedIds.length} selected lectures:
            </p>

            <select
              value={targetMoveChapterId}
              onChange={(e) => setTargetMoveChapterId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold"
            >
              <option value="">-- Choose Target Chapter --</option>
              {chapters.map((c) => {
                const book = books.find((b) => b._id.toString() === c.bookId?.toString());
                return (
                  <option key={c._id} value={c._id}>
                    {book ? `${book.title} > ` : ""}
                    {c.title}
                  </option>
                );
              })}
            </select>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetMoveChapterId}
                onClick={() => handleBulkAction("move_to_chapter")}
                className="px-5 py-2 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#15345E] disabled:opacity-50"
              >
                Move Lectures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TEST PLAY ================= */}
      {testPlayLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-3xl bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-700">
            <div className="p-4 bg-neutral-800 flex items-center justify-between text-white border-b border-neutral-700">
              <div className="min-w-0 pr-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Test Player
                </span>
                <h4 className="text-sm font-bold truncate">{testPlayLecture.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setTestPlayLecture(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {testPlayLecture.videoProvider === "vimeo" && testPlayLecture.vimeoId ? (
                <VimeoPlayer
                  vimeoId={testPlayLecture.vimeoId}
                  vimeoHash={testPlayLecture.vimeoHash}
                  playerUrl={testPlayLecture.videoUrl}
                  watermarkText="Admin Preview"
                  enableProgress={false}
                />
              ) : testPlayLecture.videoUrl ? (
                <video
                  src={testPlayLecture.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-neutral-400 text-xs text-center p-6">
                  No video URL or Vimeo ID configured for this lecture.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
