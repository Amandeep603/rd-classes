"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Edit2,
  Upload,
  AlertCircle,
  X,
  Calendar,
  Check,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Layers,
  Filter,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const CATEGORIES = [
  { value: "notes", label: "Chapter Notes" },
  { value: "formula-sheet", label: "Formula Sheet" },
  { value: "practice-questions", label: "Practice Questions" },
  { value: "previous-papers", label: "Previous Papers" },
  { value: "other", label: "Other Material" },
];

function getCourseBadgeStyle(theme) {
  switch (theme) {
    case "blue":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "amber":
    case "yellow":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "purple":
    case "violet":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "emerald":
    case "green":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rose":
    case "red":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function PortalNotesView({
  initialNotes = [],
  courses = [],
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFree, setSelectedFree] = useState("all");
  const [selectedPublished, setSelectedPublished] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Selection for bulk actions
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [bulkAttachCourseId, setBulkAttachCourseId] = useState(courses[0]?._id || "");
  const [isBulkBusy, setIsBulkBusy] = useState(false);

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("notes");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadBook, setUploadBook] = useState("Book 1: Partnership Accounts");
  const [uploadChapter, setUploadChapter] = useState("");
  const [uploadSelectedCourses, setUploadSelectedCourses] = useState(courses[0]?._id ? [courses[0]._id] : []);
  const [uploadIsAllCourses, setUploadIsAllCourses] = useState(false);
  const [uploadIsFree, setUploadIsFree] = useState(false);
  const [uploadPublished, setUploadPublished] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNoteId, setEditNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("notes");
  const [editDescription, setEditDescription] = useState("");
  const [editBook, setEditBook] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editSelectedCourses, setEditSelectedCourses] = useState([]);
  const [editIsAllCourses, setEditIsAllCourses] = useState(false);
  const [editIsFree, setEditIsFree] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Replace File Modal state
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replaceTargetNote, setReplaceTargetNote] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);

  const filteredNotes = notes.filter((n) => {
    // Course match
    let courseMatch = selectedCourse === "all";
    if (!courseMatch) {
      if (n.courseId?._id === selectedCourse || n.courseId === selectedCourse) {
        courseMatch = true;
      } else if (Array.isArray(n.courseIds)) {
        courseMatch = n.courseIds.some((c) => (c?._id || c) === selectedCourse);
      }
    }

    // Category match
    const categoryMatch = selectedCategory === "all" || n.category === selectedCategory;

    // Free match
    let freeMatch = true;
    if (selectedFree === "free") freeMatch = Boolean(n.isFree);
    if (selectedFree === "locked") freeMatch = !n.isFree;

    // Published match
    let publishedMatch = true;
    if (selectedPublished === "published") publishedMatch = n.published !== false;
    if (selectedPublished === "draft") publishedMatch = n.published === false;

    // Search match
    const searchMatch =
      !searchTerm ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.book && n.book.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.chapter && n.chapter.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.description && n.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return courseMatch && categoryMatch && freeMatch && publishedMatch && searchMatch;
  });

  const toggleSelectAll = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map((n) => n._id));
    }
  };

  const toggleSelectNote = (id) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAddModal = () => {
    setUploadTitle("");
    setUploadCategory("notes");
    setUploadDescription("");
    setUploadBook("Book 1: Partnership Accounts");
    setUploadChapter("");
    setUploadSelectedCourses(courses.length > 0 ? [courses[0]._id] : []);
    setUploadIsAllCourses(false);
    setUploadIsFree(false);
    setUploadPublished(true);
    setUploadFile(null);
    setErrorMsg("");
    setSuccessMsg("");
    setIsUploadModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditNoteId(note._id);
    setEditTitle(note.title || "");
    setEditCategory(note.category || "notes");
    setEditDescription(note.description || "");
    setEditBook(note.book || "");
    setEditChapter(note.chapter || "");

    const existingCourseIds = Array.isArray(note.courseIds) && note.courseIds.length > 0
      ? note.courseIds.map((c) => c._id || c)
      : note.courseId
      ? [note.courseId._id || note.courseId]
      : [];

    setEditSelectedCourses(existingCourseIds);
    setEditIsAllCourses(existingCourseIds.length >= courses.length && courses.length > 0);
    setEditIsFree(Boolean(note.isFree));
    setEditPublished(note.published !== false);
    setErrorMsg("");
    setIsEditModalOpen(true);
  };

  const handleOpenReplaceModal = (note) => {
    setReplaceTargetNote(note);
    setReplacementFile(null);
    setErrorMsg("");
    setIsReplaceModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Only PDF files are allowed.");
      setUploadFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      setUploadFile(null);
      return;
    }

    setErrorMsg("");
    setUploadFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleReplacementFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Only PDF files are allowed.");
      setReplacementFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File size exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      setReplacementFile(null);
      return;
    }

    setErrorMsg("");
    setReplacementFile(file);
  };

  const toggleUploadCourse = (courseId) => {
    if (uploadSelectedCourses.includes(courseId)) {
      setUploadSelectedCourses((prev) => prev.filter((id) => id !== courseId));
      setUploadIsAllCourses(false);
    } else {
      const next = [...uploadSelectedCourses, courseId];
      setUploadSelectedCourses(next);
      if (next.length === courses.length) setUploadIsAllCourses(true);
    }
  };

  const toggleAllUploadCourses = () => {
    if (uploadIsAllCourses) {
      setUploadSelectedCourses([]);
      setUploadIsAllCourses(false);
    } else {
      setUploadSelectedCourses(courses.map((c) => c._id));
      setUploadIsAllCourses(true);
    }
  };

  const toggleEditCourse = (courseId) => {
    if (editSelectedCourses.includes(courseId)) {
      setEditSelectedCourses((prev) => prev.filter((id) => id !== courseId));
      setEditIsAllCourses(false);
    } else {
      const next = [...editSelectedCourses, courseId];
      setEditSelectedCourses(next);
      if (next.length === courses.length) setEditIsAllCourses(true);
    }
  };

  const toggleAllEditCourses = () => {
    if (editIsAllCourses) {
      setEditSelectedCourses([]);
      setEditIsAllCourses(false);
    } else {
      setEditSelectedCourses(courses.map((c) => c._id));
      setEditIsAllCourses(true);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg("Please select a PDF file to upload.");
      return;
    }

    const assignedCourses = uploadIsAllCourses ? courses.map((c) => c._id) : uploadSelectedCourses;
    if (assignedCourses.length === 0) {
      setErrorMsg("Please attach note to at least one course.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const data = new FormData();
      data.append("title", uploadTitle.trim());
      data.append("category", uploadCategory);
      data.append("description", uploadDescription.trim());
      data.append("book", uploadBook.trim());
      data.append("chapter", uploadChapter.trim());
      data.append("courseIds", JSON.stringify(assignedCourses));
      data.append("isFree", String(uploadIsFree));
      data.append("published", String(uploadPublished));
      data.append("file", uploadFile);

      const res = await fetch("/api/admin/notes", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload PDF");

      setNotes((prev) => [json.note, ...prev]);
      setIsUploadModalOpen(false);
      setSuccessMsg(`Note "${json.note.title}" uploaded successfully!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const assignedCourses = editIsAllCourses ? courses.map((c) => c._id) : editSelectedCourses;
    if (assignedCourses.length === 0) {
      setErrorMsg("Please select at least one course.");
      return;
    }

    setIsSavingEdit(true);
    setErrorMsg("");

    try {
      const payload = {
        title: editTitle.trim(),
        category: editCategory,
        description: editDescription.trim(),
        book: editBook.trim(),
        chapter: editChapter.trim(),
        courseIds: assignedCourses,
        isFree: editIsFree,
        published: editPublished,
      };

      const res = await fetch(`/api/admin/notes/${editNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update note");

      setNotes((prev) => prev.map((n) => (n._id === editNoteId ? json.note : n)));
      setIsEditModalOpen(false);
      setSuccessMsg("Note details updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replacementFile || !replaceTargetNote) {
      setErrorMsg("Please select a replacement PDF file.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      const data = new FormData();
      data.append("file", replacementFile);

      const res = await fetch(`/api/admin/notes/${replaceTargetNote._id}`, {
        method: "PATCH",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to replace PDF");

      setNotes((prev) =>
        prev.map((n) => (n._id === replaceTargetNote._id ? json.note : n))
      );
      setIsReplaceModalOpen(false);
      setReplacementFile(null);
      setReplaceTargetNote(null);
      setSuccessMsg("PDF file replaced successfully! Old file removed from Cloudinary.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (note) => {
    if (!confirm(`Are you sure you want to delete "${note.title}"? This will permanently delete the PDF file from Cloudinary.`)) {
      return;
    }

    setBusyId(note._id);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/notes/${note._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete note");

      setNotes((prev) => prev.filter((n) => n._id !== note._id));
      setSelectedNoteIds((prev) => prev.filter((id) => id !== note._id));
      setSuccessMsg("Note and Cloudinary asset deleted.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // Bulk actions executor
  const handleBulkAction = async (action) => {
    if (selectedNoteIds.length === 0) return;

    if (action === "delete") {
      if (!confirm(`Are you sure you want to delete ${selectedNoteIds.length} notes? This will permanently delete their PDF files from Cloudinary.`)) {
        return;
      }
    }

    setIsBulkBusy(true);
    setErrorMsg("");

    try {
      const payload = {
        action,
        noteIds: selectedNoteIds,
        courseId: action === "attach" ? bulkAttachCourseId : undefined,
      };

      const res = await fetch("/api/admin/notes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Bulk action failed");

      // Refetch notes to get populated references accurately
      const refreshRes = await fetch("/api/admin/notes");
      const refreshJson = await refreshRes.json();
      if (refreshJson.notes) {
        setNotes(refreshJson.notes);
      }

      setSuccessMsg(json.message || "Bulk action completed successfully!");
      if (action === "delete") {
        setSelectedNoteIds([]);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsBulkBusy(false);
    }
  };

  return (
    <div className="portal-page-container space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">
            Course Notes & Materials
          </h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Upload chapter PDFs and formula sheets directly to Cloudinary authenticated storage. Attach to multiple courses and control preview access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span>PDF Limit: 10 MB</span>
          </span>

          <Button variant="yellow" size="md" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Upload PDF</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--portal-border)] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Course filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700">Course:</span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="portal-input text-xs font-semibold py-1.5 cursor-pointer"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="portal-input text-xs font-semibold py-1.5 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Free / Locked filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700">Access:</span>
              <select
                value={selectedFree}
                onChange={(e) => setSelectedFree(e.target.value)}
                className="portal-input text-xs font-semibold py-1.5 cursor-pointer"
              >
                <option value="all">All Access</option>
                <option value="free">Free Preview</option>
                <option value="locked">Enrolled Only (Locked)</option>
              </select>
            </div>

            {/* Published / Draft filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-700">Status:</span>
              <select
                value={selectedPublished}
                onChange={(e) => setSelectedPublished(e.target.value)}
                className="portal-input text-xs font-semibold py-1.5 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes, books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="portal-input !pl-9 text-xs w-full"
            />
          </div>
        </div>

        {/* Bulk Action Bar (visible when items selected) */}
        {selectedNoteIds.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <CheckSquare className="w-4 h-4 text-amber-700" />
              <span>{selectedNoteIds.length} notes selected</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Attach to course */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-200">
                <span className="font-semibold text-slate-600">Attach:</span>
                <select
                  value={bulkAttachCourseId}
                  onChange={(e) => setBulkAttachCourseId(e.target.value)}
                  disabled={isBulkBusy}
                  className="bg-transparent font-medium text-xs text-slate-800 outline-none cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleBulkAction("attach")}
                  disabled={isBulkBusy}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[11px] transition"
                >
                  Apply
                </button>
              </div>

              {/* Mark Free / Locked */}
              <button
                type="button"
                onClick={() => handleBulkAction("mark-free")}
                disabled={isBulkBusy}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span>Mark Free</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction("mark-locked")}
                disabled={isBulkBusy}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Mark Locked</span>
              </button>

              {/* Publish / Unpublish */}
              <button
                type="button"
                onClick={() => handleBulkAction("publish")}
                disabled={isBulkBusy}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition"
              >
                Publish
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction("unpublish")}
                disabled={isBulkBusy}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold transition"
              >
                Unpublish
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleBulkAction("delete")}
                disabled={isBulkBusy}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNoteIds([])}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No notes found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload chapter PDFs and formula sheets for your students. Each PDF is safely stored in authenticated Cloudinary storage.
          </p>
          <div className="mt-5">
            <Button variant="yellow" size="sm" onClick={handleOpenAddModal}>
              Upload PDF Note
            </Button>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--portal-border)] overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="px-5 py-3 bg-slate-50/80 border-b border-[var(--portal-border)] flex items-center gap-3 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-slate-400 hover:text-slate-700"
              title={selectedNoteIds.length === filteredNotes.length ? "Deselect All" : "Select All"}
            >
              {selectedNoteIds.length === filteredNotes.length && filteredNotes.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1">Document & Category</div>
            <div className="w-48 hidden lg:block">Attached Courses</div>
            <div className="w-24 text-center hidden md:block">Access</div>
            <div className="w-24 text-center hidden sm:block">Status</div>
            <div className="w-40 text-right">Actions</div>
          </div>

          <div className="divide-y divide-[var(--portal-border)]">
            {filteredNotes.map((note) => {
              const isSelected = selectedNoteIds.includes(note._id);
              const dateStr = note.createdAt
                ? new Date(note.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";

              // Resolve courses
              const attachedCoursesList = Array.isArray(note.courseIds) && note.courseIds.length > 0
                ? note.courseIds
                : note.courseId
                ? [note.courseId]
                : [];

              const categoryObj = CATEGORIES.find((c) => c.value === note.category) || {
                label: note.category || "Notes",
              };

              return (
                <div
                  key={note._id}
                  className={`p-4 sm:p-5 flex items-center gap-3 hover:bg-slate-50/70 transition ${
                    isSelected ? "bg-amber-50/40" : ""
                  }`}
                >
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleSelectNote(note._id)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Icon & Document Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-2xs">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {note.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {categoryObj.label}
                        </span>
                        {note.book && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {note.book}
                          </span>
                        )}
                        {note.chapter && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {note.chapter}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {note.description && (
                          <span className="text-slate-600 italic truncate max-w-xs">
                            {note.description}
                          </span>
                        )}
                        <span>{formatBytes(note.sizeBytes || note.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{dateStr}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Courses Chips (Desktop) */}
                  <div className="w-48 hidden lg:flex flex-wrap gap-1 items-center">
                    {attachedCoursesList.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No course</span>
                    ) : attachedCoursesList.length > 2 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {attachedCoursesList.length} Courses
                      </span>
                    ) : (
                      attachedCoursesList.map((c) => {
                        const courseId = c._id || c;
                        const courseObj = courses.find((item) => item._id === courseId) || c;
                        return (
                          <span
                            key={courseId}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[140px] ${getCourseBadgeStyle(
                              courseObj.theme
                            )}`}
                            title={courseObj.title}
                          >
                            {courseObj.title || "Course"}
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Access: Free vs Locked */}
                  <div className="w-24 text-center hidden md:block">
                    {note.isFree ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Unlock className="w-3 h-3" />
                        <span>FREE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Status: Published vs Draft */}
                  <div className="w-24 text-center hidden sm:block">
                    {note.published !== false ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Published
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-40 flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(note)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit note details & courses"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReplaceModal(note)}
                      disabled={busyId === note._id}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Replace PDF file (deletes old Cloudinary asset)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(note)}
                      disabled={busyId === note._id}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete note and Cloudinary asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-bold text-slate-900">Upload PDF Note</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1 - Complete Formula Sheet"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="portal-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="portal-input text-xs w-full cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Book 1: Partnership Accounts"
                    value={uploadBook}
                    onChange={(e) => setUploadBook(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chapter / Unit (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 2: Goodwill"
                    value={uploadChapter}
                    onChange={(e) => setUploadChapter(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brief Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Key formulas and previous board adjustments"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Attach to courses (multi-select with chips) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Attach to Courses *
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllUploadCourses}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    {uploadIsAllCourses ? "Deselect All" : "Select All 6 Courses"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {courses.map((course) => {
                    const isSelected = uploadIsAllCourses || uploadSelectedCourses.includes(course._id);
                    return (
                      <button
                        type="button"
                        key={course._id}
                        onClick={() => toggleUploadCourse(course._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-400 text-slate-900 border-amber-500 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                        <span>{course.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles: Free Preview & Published */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition">
                  <input
                    type="checkbox"
                    checked={uploadIsFree}
                    onChange={(e) => setUploadIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Free for everyone
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Public visitors can view without login
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition">
                  <input
                    type="checkbox"
                    checked={uploadPublished}
                    onChange={(e) => setUploadPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Published
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Immediately visible in portal & courses
                    </span>
                  </div>
                </label>
              </div>

              {/* PDF File Picker */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    PDF Document (Max 10 MB) *
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Cloudinary authenticated storage
                  </span>
                </div>

                <label className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 cursor-pointer transition">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadFile ? uploadFile.name : "Click to select PDF"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {uploadFile
                      ? `${formatBytes(uploadFile.size)} - ready to upload`
                      : "PDF files only up to 10 MB"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="yellow"
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? "Uploading to Cloudinary..." : "Upload Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Edit Note Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="portal-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="portal-input text-xs w-full cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book Name
                  </label>
                  <input
                    type="text"
                    value={editBook}
                    onChange={(e) => setEditBook(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chapter / Unit (Optional)
                  </label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brief Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="portal-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Attach to courses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Attach to Courses *
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllEditCourses}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    {editIsAllCourses ? "Deselect All" : "Select All Courses"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {courses.map((course) => {
                    const isSelected = editIsAllCourses || editSelectedCourses.includes(course._id);
                    return (
                      <button
                        type="button"
                        key={course._id}
                        onClick={() => toggleEditCourse(course._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-400 text-slate-900 border-amber-500 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                        <span>{course.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles: Free Preview & Published */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition">
                  <input
                    type="checkbox"
                    checked={editIsFree}
                    onChange={(e) => setEditIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Free for everyone
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Public visitors can view without login
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition">
                  <input
                    type="checkbox"
                    checked={editPublished}
                    onChange={(e) => setEditPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">
                      Published
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Immediately visible in portal & courses
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="yellow" disabled={isSavingEdit}>
                  {isSavingEdit ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace PDF Modal */}
      {isReplaceModalOpen && replaceTargetNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Replace PDF File</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <p className="font-bold">{replaceTargetNote.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Replacing this file will automatically delete the old file from Cloudinary and save the new authenticated asset.
                </p>
              </div>

              <div>
                <label className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 cursor-pointer transition">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {replacementFile ? replacementFile.name : "Select new replacement PDF"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {replacementFile
                      ? `${formatBytes(replacementFile.size)} - ready to replace`
                      : "PDF only, max 10 MB"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleReplacementFileChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsReplaceModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="yellow"
                  disabled={isUploading || !replacementFile}
                >
                  {isUploading ? "Uploading & Replacing..." : "Confirm Replacement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
