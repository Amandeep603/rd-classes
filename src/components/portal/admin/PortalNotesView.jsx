"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  ExternalLink,
  Eye,
  Download,
  Trash2,
  Edit2,
  BookOpen,
  Filter,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Badge from "@/components/portal/ui/Badge";
import FileUploader from "@/components/admin/FileUploader";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/server/actions/admin.notes.actions.js";

const NOTE_KINDS = [
  { id: "all", label: "All Types" },
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
  courses = [],
  currentFilters = {},
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || "");
  const [selectedCourse, setSelectedCourse] = useState(currentFilters.courseId || "all");
  const [selectedKind, setSelectedKind] = useState(currentFilters.kind || "all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formKind, setFormKind] = useState("notes");
  const [formSource, setFormSource] = useState("file");
  const [formExternalUrl, setFormExternalUrl] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formFileKey, setFormFileKey] = useState("");
  const [formFileSize, setFormFileSize] = useState(0);
  const [formPageCount, setFormPageCount] = useState("");
  const [formCourseIds, setFormCourseIds] = useState([]);
  const [formPublished, setFormPublished] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    const merged = {
      q: searchQuery,
      courseId: selectedCourse,
      kind: selectedKind,
      ...newFilters,
    };
    if (merged.q) params.set("q", merged.q);
    if (merged.courseId && merged.courseId !== "all") params.set("courseId", merged.courseId);
    if (merged.kind && merged.kind !== "all") params.set("kind", merged.kind);

    startTransition(() => {
      router.push(`/admin/notes?${params.toString()}`);
    });
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormSection("");
    setFormKind("notes");
    setFormSource("file");
    setFormExternalUrl("");
    setFormFileUrl("");
    setFormFileKey("");
    setFormFileSize(0);
    setFormPageCount("");
    setFormCourseIds([]);
    setFormPublished(true);
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormTitle(note.title || "");
    setFormSection(note.section || "");
    setFormKind(note.kind || "notes");
    setFormSource(note.source || "file");
    setFormExternalUrl(note.externalUrl || "");
    setFormFileUrl(note.fileUrl || "");
    setFormFileKey(note.fileKey || "");
    setFormFileSize(note.fileSize || 0);
    setFormPageCount(note.pageCount ? String(note.pageCount) : "");
    setFormCourseIds((note.courseIds || []).map((c) => c._id || c));
    setFormPublished(note.published !== false);
    setFormError("");
    setShowModal(true);
  };

  const handleToggleCourse = (courseId) => {
    setFormCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (formSource === "link") {
      if (!formExternalUrl.trim()) {
        setFormError("External link URL is required.");
        return;
      }
      try {
        new URL(formExternalUrl.trim());
      } catch {
        setFormError("Please enter a valid HTTP/HTTPS link URL.");
        return;
      }
    } else {
      if (!editingNote && !formFileUrl) {
        setFormError("Please upload a PDF file or switch to External Link.");
        return;
      }
    }

    setFormSubmitting(true);

    const payload = {
      title: formTitle.trim(),
      section: formSection.trim(),
      kind: formKind,
      source: formSource,
      published: formPublished,
      courseIds: formCourseIds,
      pageCount: formPageCount ? parseInt(formPageCount, 10) : undefined,
    };

    if (formSource === "link") {
      payload.externalUrl = formExternalUrl.trim();
    } else {
      if (formFileUrl) {
        payload.fileUrl = formFileUrl;
        payload.fileKey = formFileKey || `notes/${Date.now()}.pdf`;
        payload.fileSize = formFileSize || 0;
        payload.contentType = "application/pdf";
      }
    }

    try {
      let res;
      if (editingNote) {
        res = await updateNoteAction(editingNote._id, payload);
      } else {
        res = await createNoteAction(payload);
      }

      if (!res.success) {
        setFormError(res.error || "Failed to save note.");
        setFormSubmitting(false);
        return;
      }

      setShowModal(false);
      setFormSubmitting(false);
      router.refresh();
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteNoteTarget) return;
    try {
      await deleteNoteAction(deleteNoteTarget._id);
      setDeleteNoteTarget(null);
      router.refresh();
    } catch (err) {
      alert("Failed to delete note: " + err.message);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">
            Notes & Materials Library
          </h1>
          <p className="text-xs text-[#6B7280]">
            Manage study handouts, practice sheets, formula cards, and board papers across all courses.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#ffd54a] transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Study Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateFilters({ q: searchQuery })}
              className="w-full rounded-xl border border-black/10 bg-neutral-50/60 py-2.5 pl-10 pr-4 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus:border-amber-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Course filter */}
          <div className="sm:w-64">
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                updateFilters({ courseId: e.target.value });
              }}
              className="w-full rounded-xl border border-black/10 bg-neutral-50/60 px-3 py-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map((c) => (
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
              onClick={() => {
                setSelectedKind(k.id);
                updateFilters({ kind: k.id });
              }}
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

      {/* Notes Table / List */}
      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-xs">
        {initialNotes.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Study Materials Found</h3>
            <p className="mt-1 max-w-sm text-xs text-[#6B7280]">
              Upload your first concept notes PDF or add a Google Drive link to attach it to student courses.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-4 py-2 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#ffd54a]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Material</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {initialNotes.map((note) => {
              const isLink = note.source === "link";
              const accessUrl = isLink
                ? note.externalUrl
                : `/api/notes/${note._id}/stream`;

              return (
                <div
                  key={note._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#111827] truncate">
                          {note.title}
                        </span>
                        <Badge tone={KIND_TONES[note.kind] || "yellow"} size="xs">
                          {KIND_LABELS[note.kind] || note.kind}
                        </Badge>
                        <Badge tone={note.published ? "green" : "neutral"} size="xs">
                          {note.published ? "Published" : "Draft"}
                        </Badge>
                        <Badge tone={isLink ? "blue" : "neutral"} size="xs">
                          {isLink ? "External Link" : "File"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
                        <span>{note.section || "General"}</span>
                        <span>•</span>
                        <span>
                          {isLink
                            ? "Web Link"
                            : note.pageCount
                            ? `${note.pageCount} pages`
                            : formatFileSize(note.fileSize) || "PDF"}
                        </span>
                        {note.courseIds && note.courseIds.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-neutral-700">
                              Attached to {note.courseIds.length}{" "}
                              {note.courseIds.length === 1 ? "course" : "courses"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isLink ? (
                      <a
                        href={accessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open</span>
                      </a>
                    ) : (
                      <>
                        <a
                          href={accessUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-800 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </a>
                        <a
                          href={`/api/notes/${note._id}/stream?download=1`}
                          download
                          title="Download PDF"
                          className="rounded-xl border border-black/10 bg-white p-1.5 text-[#374151] hover:bg-neutral-50 shadow-2xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="rounded-xl border border-black/10 bg-white p-1.5 text-[#374151] hover:bg-neutral-50 shadow-2xs"
                      title="Edit Note"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteNoteTarget(note)}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 shadow-2xs"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h2 className="text-lg font-black text-[#111827]">
                {editingNote ? "Edit Study Material" : "Add New Study Material"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-1.5 text-[#6B7280] hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 1: Partnership Fundamental Notes"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-neutral-50/60 p-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              {/* Section / Topic & Page Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Section / Chapter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Partnership Accounts"
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-neutral-50/60 p-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Page Count (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 18"
                    value={formPageCount}
                    onChange={(e) => setFormPageCount(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-neutral-50/60 p-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Kind */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Resource Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "notes", label: "Notes" },
                    { id: "practice", label: "Practice" },
                    { id: "formula", label: "Formula" },
                    { id: "paper", label: "Paper" },
                  ].map((k) => (
                    <button
                      type="button"
                      key={k.id}
                      onClick={() => setFormKind(k.id)}
                      className={`rounded-xl py-2 text-xs font-bold transition-all ${
                        formKind === k.id
                          ? "bg-[#FFC21A] text-neutral-900 shadow-2xs"
                          : "bg-neutral-100 text-[#4B5563] hover:bg-neutral-200"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Switch: File vs Link */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Storage Source
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setFormSource("file")}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      formSource === "file"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-neutral-100 text-[#4B5563]"
                    }`}
                  >
                    Direct PDF Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSource("link")}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      formSource === "link"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-neutral-100 text-[#4B5563]"
                    }`}
                  >
                    External Link (Drive / Dropbox)
                  </button>
                </div>

                {formSource === "link" ? (
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      Resource URL *
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formExternalUrl}
                      onChange={(e) => setFormExternalUrl(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-neutral-50/60 p-2.5 text-sm font-semibold text-[#111827] focus:border-amber-400 focus:bg-white focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#6B7280]">
                      Make sure sharing is set to &quot;Anyone with the link can view&quot;.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      Upload PDF File
                    </label>
                    <FileUploader
                      folder="notes"
                      allowedTypes={["application/pdf"]}
                      onUploadComplete={(result) => {
                        setFormFileUrl(result.url);
                        setFormFileKey(result.key);
                        setFormFileSize(result.size || 0);
                      }}
                    />
                    {formFileUrl && (
                      <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>File uploaded and ready.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Course Multi-select */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Attach to Courses ({formCourseIds.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-black/10 bg-neutral-50/60 p-2 space-y-1">
                  {courses.length === 0 ? (
                    <div className="p-2 text-xs text-[#6B7280]">No courses found.</div>
                  ) : (
                    courses.map((course) => {
                      const isChecked = formCourseIds.includes(course._id);
                      return (
                        <label
                          key={course._id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs font-semibold text-[#111827] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCourse(course._id)}
                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                          />
                          <span className="truncate">{course.title}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Published switch */}
              <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <div>
                  <div className="text-xs font-bold text-[#111827]">Published</div>
                  <div className="text-[11px] text-[#6B7280]">
                    Visible to enrolled students immediately
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>

              {/* Modal buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-black/5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-5 py-2 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#ffd54a] disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingNote ? "Save Changes" : "Create Material"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteNoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Delete Study Material?</h3>
              <p className="mt-1 text-xs text-[#6B7280]">
                Are you sure you want to delete &quot;{deleteNoteTarget.title}&quot;? This will remove it from all courses and student portals.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteNoteTarget(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-[#4B5563] hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
