"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Lock,
  ExternalLink,
  BookOpen,
  FileText,
  Search,
  FolderInput,
  Link as LinkIcon,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Tabs from "../ui/Tabs";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import CourseForm from "./CourseForm.jsx";
import FileUploader from "@/components/admin/FileUploader";
import {
  createLectureAction,
  updateLectureAction,
  deleteLectureAction,
  reorderLecturesAction,
  fetchVimeoMetadataAction,
  bulkAddLecturesToCourseAction,
  moveLectureToSectionAction,
} from "@/server/actions/admin.lectures.actions.js";
import {
  createNoteAction,
  attachNoteToCourseAction,
  detachNoteFromCourseAction,
  reorderCourseNotesAction,
  deleteNoteAction,
  searchNotesForAttachmentAction,
} from "@/server/actions/admin.notes.actions.js";
import { updateCourseAction } from "@/server/actions/admin.courses.actions.js";

export default function PortalCourseDetailView({
  course,
  lectures = [],
  enrolledStudents = [],
  courseNotes = [],
}) {
  const [activeTab, setActiveTab] = useState("lectures");

  // Course Details Form
  const [courseTitle, setCourseTitle] = useState(course.title || "");
  const [courseSlug, setCourseSlug] = useState(course.slug || "");
  const [courseDescription, setCourseDescription] = useState(course.description || "");
  const [courseThumbnail, setCourseThumbnail] = useState(course.thumbnail || "");
  const [coursePublished, setCoursePublished] = useState(!!course.published);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState("");

  // Lectures Management
  const [lectureList, setLectureList] = useState(lectures);
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeLecture, setActiveLecture] = useState(null);

  const [section, setSection] = useState("Chapter 1");
  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingVimeo, setIsFetchingVimeo] = useState(false);
  const [error, setError] = useState("");
  const [vimeoMsg, setVimeoMsg] = useState("");

  // Bulk Lectures Dialog State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkRawUrls, setBulkRawUrls] = useState("");
  const [bulkSection, setBulkSection] = useState("Chapter 1");
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState("");
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState("");

  // Move Lecture Section State
  const [moveModalData, setMoveModalData] = useState(null); // { lecture, targetSection }
  const [targetSectionInput, setTargetSectionInput] = useState("");

  // Notes Management State
  const [noteList, setNoteList] = useState(courseNotes);
  const [createNoteModalOpen, setCreateNoteModalOpen] = useState(false);
  const [attachNoteModalOpen, setAttachNoteModalOpen] = useState(false);

  // Note Form Fields
  const [noteTitle, setNoteTitle] = useState("");
  const [noteKind, setNoteKind] = useState("notes");
  const [noteSource, setNoteSource] = useState("file");
  const [noteExternalUrl, setNoteExternalUrl] = useState("");
  const [noteFileUrl, setNoteFileUrl] = useState("");
  const [noteFileKey, setNoteFileKey] = useState("");
  const [noteFileSize, setNoteFileSize] = useState(0);
  const [notePageCount, setNotePageCount] = useState(0);
  const [noteSection, setNoteSection] = useState("General");
  const [notePublished, setNotePublished] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteFormError, setNoteFormError] = useState("");

  // Attach Note Search State
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [noteSearchResults, setNoteSearchResults] = useState([]);
  const [isSearchingNotes, setIsSearchingNotes] = useState(false);

  // Existing unique sections
  const existingSections = Array.from(
    new Set(lectureList.map((l) => l.section || "General"))
  );

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    setCourseMsg("");

    const fd = new FormData();
    fd.append("title", courseTitle);
    if (courseSlug) fd.append("slug", courseSlug);
    fd.append("description", courseDescription);
    fd.append("thumbnail", courseThumbnail);
    if (coursePublished) fd.append("published", "on");

    try {
      const res = await updateCourseAction(course._id, null, fd);
      if (res?.success) {
        setCourseMsg("Course details updated successfully.");
      } else {
        setCourseMsg(res?.error || "Failed to update course.");
      }
    } finally {
      setSavingCourse(false);
    }
  };

  const openCreateModal = () => {
    setActiveLecture(null);
    setSection(lectureList[lectureList.length - 1]?.section || "Chapter 1");
    setTitle("");
    setVimeoUrl("");
    setDurationSec(0);
    setDescription("");
    setPublished(true);
    setIsPreview(false);
    setError("");
    setVimeoMsg("");
    setModalMode("create");
  };

  const openEditModal = (lec) => {
    setActiveLecture(lec);
    setSection(lec.section || "Chapter 1");
    setTitle(lec.title || "");
    setVimeoUrl(lec.vimeoId ? (lec.vimeoHash ? `${lec.vimeoId}/${lec.vimeoHash}` : lec.vimeoId) : "");
    setDurationSec(lec.durationSec || 0);
    setDescription(lec.description || "");
    setPublished(!!lec.published);
    setIsPreview(Boolean(lec.freePreview ?? lec.isPreview));
    setError("");
    setVimeoMsg("");
    setModalMode("edit");
  };

  const handleFetchVimeo = async () => {
    if (!vimeoUrl.trim()) return;
    setIsFetchingVimeo(true);
    setVimeoMsg("");
    setError("");

    try {
      const trimmed = vimeoUrl.trim();
      const match = trimmed.match(/(\d+)/);
      if (!match) {
        setError("Could not extract a numeric Vimeo ID.");
        return;
      }
      const vId = match[1];
      const res = await fetchVimeoMetadataAction(vId);
      if (res?.success) {
        if (!title && res.title) setTitle(res.title);
        if (!durationSec && res.durationSec) setDurationSec(res.durationSec);
        if (!description && res.description) setDescription(res.description);
        setVimeoMsg("Fetched metadata from Vimeo!");
      } else {
        setError(res?.error || "Could not fetch Vimeo metadata.");
      }
    } finally {
      setIsFetchingVimeo(false);
    }
  };

  const handleLectureSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("section", section);
    fd.append("title", title);
    fd.append("vimeoUrl", vimeoUrl);
    fd.append("durationSec", String(durationSec));
    fd.append("description", description);
    if (published) fd.append("published", "on");
    if (isPreview) {
      fd.append("freePreview", "on");
      fd.append("isPreview", "on");
    }

    try {
      let res;
      if (modalMode === "create") {
        res = await createLectureAction(course._id, null, fd);
      } else {
        res = await updateLectureAction(activeLecture._id, course._id, null, fd);
      }

      if (res?.success) {
        setModalMode(null);
        window.location.reload();
      } else {
        setError(res?.error || "Failed to save lecture.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLecture = async (lectureId) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    const res = await deleteLectureAction(lectureId, course._id);
    if (res?.success) {
      setLectureList((prev) => prev.filter((l) => l._id !== lectureId));
    } else {
      alert(res?.error || "Failed to delete lecture.");
    }
  };

  const handleMove = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= lectureList.length) return;

    const updated = [...lectureList];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setLectureList(updated);
    const orderedIds = updated.map((l) => l._id);
    await reorderLecturesAction(course._id, orderedIds);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBulk(true);
    setBulkError("");
    setBulkResult(null);

    try {
      const res = await bulkAddLecturesToCourseAction({
        courseId: course._id,
        rawUrls: bulkRawUrls,
        section: bulkSection,
        titlePrefix: bulkTitlePrefix,
      });

      if (!res.success) {
        setBulkError(res.error || "Bulk import failed.");
      } else {
        setBulkResult(res);
        if (res.created?.length > 0) {
          // Re-fetch or reload after a short delay
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (err) {
      setBulkError(err.message || "Failed to import bulk lectures.");
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleMoveToSection = async (e) => {
    e.preventDefault();
    if (!moveModalData?.lecture || !targetSectionInput.trim()) return;

    try {
      const res = await moveLectureToSectionAction({
        lectureId: moveModalData.lecture._id,
        courseId: course._id,
        newSection: targetSectionInput.trim(),
      });

      if (res?.success) {
        setLectureList((prev) =>
          prev.map((l) =>
            l._id === moveModalData.lecture._id
              ? { ...l, section: targetSectionInput.trim() }
              : l
          )
        );
        setMoveModalData(null);
      } else {
        alert(res?.error || "Failed to move section.");
      }
    } catch (err) {
      alert(err.message || "Failed to move lecture.");
    }
  };

  // Notes handlers
  const handleCreateNoteSubmit = async (e) => {
    e.preventDefault();
    setIsSavingNote(true);
    setNoteFormError("");

    try {
      const res = await createNoteAction({
        title: noteTitle,
        kind: noteKind,
        source: noteSource,
        externalUrl: noteExternalUrl,
        fileUrl: noteFileUrl,
        fileKey: noteFileKey,
        fileSize: noteFileSize,
        pageCount: notePageCount,
        section: noteSection,
        courseIds: [course._id],
        published: notePublished,
      });

      if (res.success && res.note) {
        setNoteList((prev) => [...prev, res.note]);
        setCreateNoteModalOpen(false);
        // Reset
        setNoteTitle("");
        setNoteExternalUrl("");
        setNoteFileUrl("");
        setNoteFileKey("");
      } else {
        setNoteFormError(res.error || "Failed to save note.");
      }
    } catch (err) {
      setNoteFormError(err.message || "Failed to create note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSearchNotes = async (q) => {
    setNoteSearchQuery(q);
    if (!q.trim()) {
      setNoteSearchResults([]);
      return;
    }
    setIsSearchingNotes(true);
    try {
      const results = await searchNotesForAttachmentAction(q, course._id);
      setNoteSearchResults(results || []);
    } finally {
      setIsSearchingNotes(false);
    }
  };

  const handleAttachExistingNote = async (noteId) => {
    try {
      const res = await attachNoteToCourseAction({ noteId, courseId: course._id });
      if (res?.success && res.note) {
        setNoteList((prev) => [...prev, res.note]);
        setNoteSearchResults((prev) => prev.filter((n) => n._id !== noteId));
      } else {
        alert(res?.error || "Failed to attach note.");
      }
    } catch (err) {
      alert(err.message || "Failed to attach note.");
    }
  };

  const handleDetachNote = async (noteId) => {
    if (!confirm("Are you sure you want to detach this note from this course? (The note will remain in your global Notes library)")) {
      return;
    }
    try {
      const res = await detachNoteFromCourseAction({ noteId, courseId: course._id });
      if (res?.success) {
        setNoteList((prev) => prev.filter((n) => n._id !== noteId));
      } else {
        alert(res?.error || "Failed to detach note.");
      }
    } catch (err) {
      alert(err.message || "Failed to detach note.");
    }
  };

  const handleMoveNote = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= noteList.length) return;

    const updated = [...noteList];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setNoteList(updated);
    const orderedIds = updated.map((n) => n._id);
    await reorderCourseNotesAction({ courseId: course._id, orderedNoteIds: orderedIds });
  };

  // Group lectures by section
  const sectionsMap = {};
  lectureList.forEach((lec, idx) => {
    const sName = lec.section || "General";
    if (!sectionsMap[sName]) sectionsMap[sName] = [];
    sectionsMap[sName].push({ ...lec, originalIndex: idx });
  });

  const tabs = [
    { key: "lectures", label: `Lectures (${lectureList.length})`, icon: <Video className="w-4 h-4" /> },
    { key: "notes", label: `Notes (${noteList.length})`, icon: <FileText className="w-4 h-4" /> },
    { key: "details", label: "Course Settings", icon: <Edit className="w-4 h-4" /> },
    { key: "students", label: `Enrolled Students (${enrolledStudents.length})`, icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="portal-page-container">
      {/* Back button */}
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--portal-text-muted)] hover:text-[var(--portal-text-main)] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      {/* Header Card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">{course.title}</h1>
              {course.published ? (
                <Badge tone="green">Published</Badge>
              ) : (
                <Badge tone="yellow">Draft</Badge>
              )}
            </div>
            <p className="text-xs text-[var(--portal-text-muted)] mt-1 flex items-center gap-3">
              <span>Path: <strong className="font-mono text-[var(--portal-text-main)]">/student/courses/{course.slug}</strong></span>
              <span>•</span>
              <span>Total Lectures: <strong>{lectureList.length}</strong></span>
              <span>•</span>
              <span>Notes: <strong>{noteList.length}</strong></span>
              <span>•</span>
              <span>Enrolled Students: <strong>{enrolledStudents.length}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setBulkRawUrls("");
                setBulkResult(null);
                setBulkError("");
                setBulkModalOpen(true);
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Bulk Add Lectures</span>
            </Button>
            <Button variant="yellow" size="md" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              <span>Add Lecture</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Lectures List */}
      {activeTab === "lectures" && (
        <div className="space-y-6">
          {Object.keys(sectionsMap).length === 0 ? (
            <Card className="p-12 text-center">
              <Video className="w-10 h-10 mx-auto text-[var(--portal-text-muted)] mb-3" />
              <h3 className="text-base font-bold text-[var(--portal-text-main)]">No lectures uploaded yet</h3>
              <p className="text-xs text-[var(--portal-text-muted)] mt-1 mb-4">
                Add single Vimeo recordings or use bulk import to add up to 100 lectures at once.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="yellow" size="sm" onClick={openCreateModal}>
                  <Plus className="w-4 h-4" />
                  <span>Add Single Lecture</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkModalOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  <span>Bulk Add Lectures</span>
                </Button>
              </div>
            </Card>
          ) : (
            Object.entries(sectionsMap).map(([sectionName, sLectures]) => (
              <Card key={sectionName} className="p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--portal-card-border)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[var(--portal-accent-yellow)]" />
                    <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--portal-text-main)]">
                      {sectionName}
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--portal-text-muted)] font-semibold">
                    {sLectures.length} lecture{sLectures.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-2">
                  {sLectures.map((lec) => {
                    const mins = Math.round((lec.durationSec || 0) / 60);
                    return (
                      <div
                        key={lec._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] hover:border-[var(--portal-accent-yellow)]/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          {/* Reorder controls */}
                          <div className="flex flex-col gap-0.5 text-[var(--portal-text-muted)]">
                            <button
                              type="button"
                              onClick={() => handleMove(lec.originalIndex, -1)}
                              disabled={lec.originalIndex === 0}
                              className="hover:text-[var(--portal-text-main)] disabled:opacity-20 cursor-pointer"
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(lec.originalIndex, 1)}
                              disabled={lec.originalIndex === lectureList.length - 1}
                              className="hover:text-[var(--portal-text-main)] disabled:opacity-20 cursor-pointer"
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[var(--portal-text-main)]">
                                {lec.title}
                              </span>
                              {Boolean(lec.freePreview ?? lec.isPreview) && (
                                <Badge tone="blue">Free</Badge>
                              )}
                              {!lec.published && (
                                <Badge tone="yellow">Draft</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--portal-text-muted)] mt-0.5">
                              <span>Vimeo ID: <strong className="font-mono">{lec.vimeoId}</strong></span>
                              {lec.vimeoHash && (
                                <span>(Hash: <strong className="font-mono">{lec.vimeoHash}</strong>)</span>
                              )}
                              <span>•</span>
                              <span>{mins} mins</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setMoveModalData({ lecture: lec });
                              setTargetSectionInput(lec.section || "Chapter 1");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--portal-card-border)] bg-white text-xs font-semibold text-[var(--portal-text-muted)] hover:text-[var(--portal-text-main)] hover:bg-neutral-50 transition"
                            title="Move to another chapter"
                          >
                            <FolderInput className="w-3.5 h-3.5" />
                            <span>Section</span>
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(lec)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLecture(lec._id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Notes Linked to Course */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--portal-card-border)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--portal-text-main)]">Course Study Notes & Handouts</h2>
                <p className="text-xs text-[var(--portal-text-muted)] mt-0.5">
                  Link chapter PDFs or external links (Drive/Dropbox) accessible exclusively by enrolled students.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNoteSearchQuery("");
                    setNoteSearchResults([]);
                    setAttachNoteModalOpen(true);
                  }}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Attach Existing Note</span>
                </Button>
                <Button
                  variant="yellow"
                  size="sm"
                  onClick={() => {
                    setNoteTitle("");
                    setNoteKind("notes");
                    setNoteSource("file");
                    setNoteExternalUrl("");
                    setNoteFileUrl("");
                    setNoteFileKey("");
                    setNoteSection("General");
                    setNoteFormError("");
                    setCreateNoteModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Note</span>
                </Button>
              </div>
            </div>

            {noteList.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-[var(--portal-text-muted)] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[var(--portal-text-main)]">No notes linked to this course</h3>
                <p className="text-xs text-[var(--portal-text-muted)] mt-1 mb-4">
                  Upload PDF revision handouts or attach link resources from your Notes library.
                </p>
                <Button
                  variant="yellow"
                  size="sm"
                  onClick={() => setCreateNoteModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload First Note</span>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--portal-card-border)] mt-2">
                {noteList.map((note, idx) => (
                  <div
                    key={note._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Reorder up/down */}
                      <div className="flex flex-col gap-0.5 text-[var(--portal-text-muted)]">
                        <button
                          type="button"
                          onClick={() => handleMoveNote(idx, -1)}
                          disabled={idx === 0}
                          className="hover:text-[var(--portal-text-main)] disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveNote(idx, 1)}
                          disabled={idx === noteList.length - 1}
                          className="hover:text-[var(--portal-text-main)] disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--portal-text-main)] truncate">
                            {note.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                            {note.kind}
                          </span>
                          {note.source === "link" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Link Note
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              PDF File
                            </span>
                          )}
                          {!note.published && <Badge tone="yellow">Draft</Badge>}
                        </div>
                        <div className="text-xs text-[var(--portal-text-muted)] mt-0.5">
                          Section: <strong>{note.section || "General"}</strong>
                          {note.pageCount > 0 && ` • ${note.pageCount} pages`}
                          {note.fileSize > 0 && ` • ${(note.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {note.source === "link" && note.externalUrl ? (
                        <a
                          href={note.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={`/api/notes/${note._id}/stream`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Stream / View</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDetachNote(note._id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Detach from this course"
                      >
                        Detach
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Course Settings */}
      {activeTab === "details" && (
        <Card className="p-6">
          <CourseForm course={course} />
        </Card>
      )}

      {/* Tab 4: Enrolled Students */}
      {activeTab === "students" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--portal-text-main)]">
              Enrolled Students ({enrolledStudents.length})
            </h2>
            <Link
              href="/admin/students"
              className="text-xs font-semibold text-[var(--portal-accent-yellow)] hover:underline"
            >
              Manage all students →
            </Link>
          </div>

          {enrolledStudents.length === 0 ? (
            <p className="text-xs text-[var(--portal-text-muted)] py-8 text-center">
              No students are currently enrolled in this course.
            </p>
          ) : (
            <div className="divide-y divide-[var(--portal-card-border)]">
              {enrolledStudents.map((enrollment) => {
                const u = enrollment.userId;
                if (!u) return null;
                return (
                  <div key={enrollment._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-[var(--portal-text-main)]">
                          {u.name}
                        </div>
                        <div className="text-xs text-[var(--portal-text-muted)] flex items-center gap-2">
                          <span className="font-mono">{u.studentCode || u.loginId}</span>
                          {u.phone && <span>• {u.phone}</span>}
                          <span>
                            • Valid until:{" "}
                            {enrollment.expiresAt
                              ? new Date(enrollment.expiresAt).toLocaleDateString()
                              : "Lifetime"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/students/${u._id}`}
                      className="text-xs font-semibold text-[var(--portal-text-muted)] hover:text-[var(--portal-text-main)]"
                    >
                      View Student →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Lecture Modal */}
      <Dialog
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Add New Lecture" : "Edit Lecture"}
        description="Provide Vimeo URL, chapter section, and lecture details."
      >
        <form onSubmit={handleLectureSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          {vimeoMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
              {vimeoMsg}
            </div>
          )}

          <FormField label="Chapter / Section Name" required hint="e.g. Book 1: Partnership">
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="portal-input"
              required
            />
          </FormField>

          <FormField label="Vimeo URL or ID" required hint="e.g. https://vimeo.com/123456789 or 123456789/hash">
            <div className="flex gap-2">
              <input
                type="text"
                value={vimeoUrl}
                onChange={(e) => setVimeoUrl(e.target.value)}
                className="portal-input font-mono text-xs"
                placeholder="https://vimeo.com/..."
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFetchVimeo}
                disabled={isFetchingVimeo || !vimeoUrl}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFetchingVimeo ? "Fetching..." : "Fetch"}</span>
              </Button>
            </div>
          </FormField>

          <FormField label="Lecture Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="portal-input"
              placeholder="e.g. Admission of a Partner: Goodwill Adjustments"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (Seconds)">
              <input
                type="number"
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                className="portal-input"
                min="0"
              />
            </FormField>

            <div className="flex flex-col justify-end space-y-2 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded accent-[var(--portal-accent-yellow)]"
                />
                <span>Published</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
                <input
                  type="checkbox"
                  name="freePreview"
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="rounded accent-[var(--portal-accent-yellow)]"
                />
                <span>Free preview</span>
              </label>
            </div>
          </div>

          <FormField label="Description (Optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="portal-input min-h-[60px]"
              placeholder="Concepts, key formulas, or homework references covered in this class..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : modalMode === "create" ? "Add Lecture" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Bulk Add Lectures Modal */}
      <Dialog
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Add Vimeo Lectures"
        description="Paste up to 100 Vimeo URLs (one per line) to batch-import into this course."
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 pt-2">
          {bulkError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {bulkError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Target Chapter / Section" required>
              <input
                type="text"
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                list="bulk-existing-sections"
                className="portal-input"
                placeholder="Chapter 1: Goodwill"
                required
              />
              <datalist id="bulk-existing-sections">
                {existingSections.map((sec, i) => (
                  <option key={i} value={sec} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Title Prefix (Optional)" hint="e.g. Partnership Part">
              <input
                type="text"
                value={bulkTitlePrefix}
                onChange={(e) => setBulkTitlePrefix(e.target.value)}
                className="portal-input"
                placeholder="Optional prefix"
              />
            </FormField>
          </div>

          <FormField
            label="Vimeo Video URLs (Up to 100)"
            required
            hint="Paste one URL per line: https://vimeo.com/123456789 or https://vimeo.com/123456789/hash"
          >
            <textarea
              rows={8}
              value={bulkRawUrls}
              onChange={(e) => setBulkRawUrls(e.target.value)}
              className="portal-input font-mono text-xs"
              placeholder={`https://vimeo.com/123456789\nhttps://vimeo.com/123456790/abcdef\nhttps://player.vimeo.com/video/123456791?h=xyz`}
              required
            />
          </FormField>

          {bulkResult && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Successfully imported {bulkResult.created?.length || 0} lectures!
                </span>
              </div>
              {bulkResult.skipped?.length > 0 && (
                <div className="text-amber-800 text-[11px]">
                  Skipped {bulkResult.skipped.length} line(s) (duplicates or invalid URLs).
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="yellow"
              size="sm"
              disabled={isSubmittingBulk || !bulkRawUrls.trim()}
            >
              {isSubmittingBulk ? "Importing Lectures..." : "Import Lectures"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Move Lecture Section Dialog */}
      <Dialog
        isOpen={!!moveModalData}
        onClose={() => setMoveModalData(null)}
        title="Move Lecture to Section"
        description="Select or type a new section/chapter name."
      >
        <form onSubmit={handleMoveToSection} className="space-y-4 pt-2">
          <FormField label="Target Section Name" required>
            <input
              type="text"
              value={targetSectionInput}
              onChange={(e) => setTargetSectionInput(e.target.value)}
              list="existing-move-sections"
              className="portal-input"
              required
            />
            <datalist id="existing-move-sections">
              {existingSections.map((sec, i) => (
                <option key={i} value={sec} />
              ))}
            </datalist>
          </FormField>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setMoveModalData(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm">
              Save Move
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Create / Upload Note Modal */}
      <Dialog
        isOpen={createNoteModalOpen}
        onClose={() => setCreateNoteModalOpen(false)}
        title="Upload Study Note"
        description="Add a PDF file or an external resource link to this course."
      >
        <form onSubmit={handleCreateNoteSubmit} className="space-y-4 pt-2">
          {noteFormError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {noteFormError}
            </div>
          )}

          <FormField label="Note Title" required>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. Partnership Fundamentals - Formula & Rules Handout"
              className="portal-input"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category / Kind" required>
              <select
                value={noteKind}
                onChange={(e) => setNoteKind(e.target.value)}
                className="portal-input"
              >
                <option value="notes">Concept Notes</option>
                <option value="practice">Practice Sheet</option>
                <option value="formula">Formula Sheet</option>
                <option value="paper">Board Paper</option>
              </select>
            </FormField>

            <FormField label="Chapter / Section">
              <input
                type="text"
                value={noteSection}
                onChange={(e) => setNoteSection(e.target.value)}
                placeholder="General"
                className="portal-input"
              />
            </FormField>
          </div>

          {/* Source Toggle: File vs Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--portal-text-main)]">
              Material Source
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNoteSource("file")}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  noteSource === "file"
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Upload PDF Document</span>
              </button>
              <button
                type="button"
                onClick={() => setNoteSource("link")}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                  noteSource === "link"
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>External Link (Drive / Dropbox)</span>
              </button>
            </div>
          </div>

          {noteSource === "file" ? (
            <div className="space-y-3">
              <FormField label="Upload PDF File" required hint="Max 25MB PDF file">
                <FileUploader
                  kind="pdf"
                  maxSizeMB={25}
                  label="Select PDF Handout"
                  onChange={(asset) => {
                    if (asset) {
                      setNoteFileUrl(asset.url);
                      setNoteFileKey(asset.pathname);
                      setNoteFileSize(asset.size);
                    }
                  }}
                />
              </FormField>

              <FormField label="Page Count (Optional)">
                <input
                  type="number"
                  min="0"
                  value={notePageCount}
                  onChange={(e) => setNotePageCount(Number(e.target.value))}
                  placeholder="e.g. 12"
                  className="portal-input"
                />
              </FormField>
            </div>
          ) : (
            <div className="space-y-2">
              <FormField
                label="External URL (HTTP or HTTPS)"
                required
                hint="Drive, OneDrive, or Dropbox shareable link"
              >
                <input
                  type="url"
                  value={noteExternalUrl}
                  onChange={(e) => setNoteExternalUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="portal-input font-mono text-xs"
                  required
                />
              </FormField>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Notice:</strong> External links will open directly in a new tab for enrolled students and are not access-controlled by the server&apos;s protected streaming route.
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
            <input
              type="checkbox"
              checked={notePublished}
              onChange={(e) => setNotePublished(e.target.checked)}
              className="rounded accent-[var(--portal-accent-yellow)]"
            />
            <span>Publish immediately (visible to enrolled students)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="yellow"
              size="sm"
              disabled={isSavingNote || (noteSource === "file" && !noteFileUrl) || (noteSource === "link" && !noteExternalUrl)}
            >
              {isSavingNote ? "Saving..." : "Add to Course"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Attach Existing Note Modal */}
      <Dialog
        isOpen={attachNoteModalOpen}
        onClose={() => setAttachNoteModalOpen(false)}
        title="Attach Existing Note"
        description="Search notes from your global Notes library to link to this course."
      >
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={noteSearchQuery}
              onChange={(e) => handleSearchNotes(e.target.value)}
              placeholder="Search by title or section..."
              className="portal-input pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isSearchingNotes ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                <span>Searching notes...</span>
              </div>
            ) : noteSearchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                {noteSearchQuery ? "No unattached notes match your search." : "Type a title to search notes."}
              </div>
            ) : (
              noteSearchResults.map((n) => (
                <div
                  key={n._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {n.kind} • {n.source} • {n.section || "General"}
                    </div>
                  </div>
                  <Button
                    variant="yellow"
                    size="sm"
                    onClick={() => handleAttachExistingNote(n._id)}
                  >
                    <span>Attach</span>
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAttachNoteModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
