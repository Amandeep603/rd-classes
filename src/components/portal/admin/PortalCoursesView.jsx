"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Video,
  Users,
  Edit,
  Trash2,
  Copy,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical,
  Upload,
  Check,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import CourseCard from "@/components/courses/CourseCard";

const THEME_OPTIONS = [
  { id: "blue", label: "Blue (Full Year)", hex: "#0F2A4A", headerBg: "#DCEBFB" },
  { id: "yellow", label: "Yellow (Foundation)", hex: "#FFB800", headerBg: "#FFF1C2" },
  { id: "orange", label: "Orange (Revision)", hex: "#FF6B00", headerBg: "#FDD9C8" },
  { id: "emerald", label: "Emerald (Portal)", hex: "#0E9F7E", headerBg: "#D3F1E6" },
  { id: "violet", label: "Violet (Mock Test)", hex: "#6C4BDB", headerBg: "#E4DDFA" },
  { id: "rose", label: "Rose (Quick Crash)", hex: "#E0457B", headerBg: "#FBD3E2" },
];

const PRESET_ILLUSTRATIONS = [
  { key: "books", label: "Books Stack" },
  { key: "open book with pen", label: "Open Book with Pen" },
  { key: "revision notepad", label: "Revision Notepad" },
  { key: "laptop", label: "Laptop" },
  { key: "test paper", label: "Test Paper" },
  { key: "textbook", label: "Textbook (Orange)" },
];

const DEFAULT_TAGS = [
  "Class 12 CBSE",
  "Class 11 Foundation",
  "Recorded Portal",
  "Crash Courses",
];

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export default function PortalCoursesView({ courses: initialCourses = [] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal State for Add / Edit Course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [previewVariant, setPreviewVariant] = useState("home");

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    slug: "",
    classLabel: "Class 12",
    badgeText: "",
    description: "",
    metaLeft: "",
    metaRight: "",
    rating: 4.9,
    ratingCount: 150,
    categories: ["Class 12 CBSE"],
    price: "",
    theme: "blue",
    illustrationKey: "books",
    illustrationUrl: "",
    status: "published",
    showOnHome: true,
  });

  // Drag to reorder state
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Check how many published courses have showOnHome = true
  const homeCount = useMemo(() => {
    return courses.filter((c) => {
      const isPub = c.status === "published" || c.published;
      const isHome = c.showOnHome ?? c.featured;
      return isPub && isHome;
    }).length;
  }, [courses]);

  const filteredCourses = courses.filter((c) =>
    (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.categories || []).some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      slug: "",
      classLabel: "Class 12",
      badgeText: "",
      description: "",
      metaLeft: "",
      metaRight: "",
      rating: 4.9,
      ratingCount: 150,
      categories: ["Class 12 CBSE"],
      price: "",
      theme: "blue",
      illustrationKey: "books",
      illustrationUrl: "",
      status: "published",
      showOnHome: true,
    });
    setEditingCourseId(null);
    setNewTagInput("");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourseId(course._id);
    setFormData({
      title: course.title || "",
      subtitle: course.subtitle || "",
      slug: course.slug || "",
      classLabel: course.classLabel || "Class 12",
      badgeText: course.badgeText || "",
      description: course.description || "",
      metaLeft: course.metaLeft || "",
      metaRight: course.metaRight || "",
      rating: typeof course.rating === "number" ? course.rating : 4.9,
      ratingCount: typeof course.ratingCount === "number" ? course.ratingCount : 150,
      categories: Array.isArray(course.categories) && course.categories.length > 0 ? course.categories : ["Class 12 CBSE"],
      price: course.price || "",
      theme: course.theme || course.tone || "blue",
      illustrationKey: course.illustrationKey || "books",
      illustrationUrl: course.illustrationUrl || "",
      status: course.status || (course.published ? "published" : "draft"),
      showOnHome: Boolean(course.showOnHome ?? course.featured),
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingCourseId ? prev.slug : slugify(val),
    }));
  };

  const handleIllustrationUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/courses/upload-illustration", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to upload illustration");
      }
      setFormData((prev) => ({
        ...prev,
        illustrationUrl: json.url,
      }));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCategory = (tag) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(tag);
      const next = exists
        ? prev.categories.filter((t) => t !== tag)
        : [...prev.categories, tag];
      return { ...prev, categories: next };
    });
  };

  const handleAddNewTag = (e) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim();
      if (!formData.categories.includes(clean)) {
        setFormData((prev) => ({
          ...prev,
          categories: [...prev.categories, clean],
        }));
      }
      setNewTagInput("");
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setBusyId("modal-save");

    try {
      const url = editingCourseId
        ? `/api/admin/courses/${editingCourseId}`
        : `/api/admin/courses`;
      const method = editingCourseId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save course");

      // Refresh list
      const listRes = await fetch("/api/admin/courses");
      const listJson = await listRes.json();
      if (listJson.courses) setCourses(listJson.courses);

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleShowOnHome = async (course) => {
    setBusyId(course._id);
    setErrorMsg("");
    const nextVal = !(course.showOnHome ?? course.featured);
    try {
      const res = await fetch(`/api/admin/courses/${course._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: nextVal }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to update course");
      }
      setCourses((prev) =>
        prev.map((c) =>
          c._id === course._id
            ? { ...c, showOnHome: nextVal, featured: nextVal }
            : c
        )
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (course) => {
    setBusyId(course._id);
    setErrorMsg("");
    const curStatus = course.status || (course.published ? "published" : "draft");
    const nextStatus = curStatus === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/courses/${course._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, published: nextStatus === "published" }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to update course");
      }
      setCourses((prev) =>
        prev.map((c) =>
          c._id === course._id
            ? { ...c, status: nextStatus, published: nextStatus === "published" }
            : c
        )
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (course) => {
    setBusyId(course._id);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/courses/${course._id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to duplicate course");

      const listRes = await fetch("/api/admin/courses");
      const listJson = await listRes.json();
      if (listJson.courses) setCourses(listJson.courses);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;
    setBusyId(course._id);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/courses/${course._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete course");

      setCourses((prev) => prev.filter((c) => c._id !== course._id));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // Drag & drop reorder
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const reordered = [...courses];
    const item = reordered.splice(draggedIdx, 1)[0];
    reordered.splice(index, 0, item);
    setDraggedIdx(index);
    setCourses(reordered);
  };

  const handleDragEnd = async () => {
    setDraggedIdx(null);
    const orderedIds = courses.map((c) => c._id);
    try {
      await fetch("/api/admin/courses/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.warn("Failed to save reorder", err);
    }
  };

  return (
    <div className="portal-page-container space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Course Library</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            The single source of truth for all public website courses, themes, illustrations, and enrollments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--portal-text-muted)]" />
            <input
              type="text"
              placeholder="Search courses or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="portal-input !pl-9 !py-2 text-xs !w-60"
            />
          </div>

          <Button variant="yellow" size="md" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </Button>
        </div>
      </div>

      {/* Warning banner if >6 courses toggled for home */}
      {homeCount > 6 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Home shows only 6 courses. You currently have {homeCount} courses marked for Home. Only the first 6 in order will appear on the homepage default grid.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Course Cards / Table Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-[var(--portal-text-muted)] mb-3" />
          <h3 className="text-base font-bold text-[var(--portal-text-main)]">No courses found</h3>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            {searchTerm ? "Try searching with a different keyword." : "Click Add Course to publish your first course."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[var(--portal-text-muted)] px-1 flex items-center justify-between">
            <span>Drag rows by the handle to reorder the homepage sequence</span>
            <span>Total: {filteredCourses.length} courses</span>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--portal-border)] overflow-hidden shadow-xs divide-y divide-[var(--portal-border)]">
            {filteredCourses.map((c, idx) => {
              const isPub = c.status === "published" || c.published;
              const isHome = c.showOnHome ?? c.featured;
              const isBusy = busyId === c._id;

              return (
                <div
                  key={c._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/70 ${
                    draggedIdx === idx ? "opacity-40 bg-amber-50" : ""
                  }`}
                >
                  {/* Left: Drag handle + Theme swatch + Title & Details */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1 -ml-1 select-none"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </button>

                    {/* Theme color swatch */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs border border-black/5"
                      style={{
                        background:
                          c.theme === "yellow"
                            ? "#FFF1C2"
                            : c.theme === "orange"
                            ? "#FDD9C8"
                            : c.theme === "emerald"
                            ? "#D3F1E6"
                            : c.theme === "violet"
                            ? "#E4DDFA"
                            : c.theme === "rose"
                            ? "#FBD3E2"
                            : "#DCEBFB",
                        color:
                          c.theme === "yellow"
                            ? "#92400E"
                            : c.theme === "orange"
                            ? "#EA580C"
                            : c.theme === "emerald"
                            ? "#0B6B55"
                            : c.theme === "violet"
                            ? "#6C4BDB"
                            : c.theme === "rose"
                            ? "#E0457B"
                            : "#0F2A4A",
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-[var(--portal-text-main)] truncate">
                          {c.title}
                        </h3>
                        {c.subtitle && (
                          <span className="text-xs font-semibold text-slate-500">
                            / {c.subtitle}
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.classLabel || "Class 12"}
                        </span>
                        {c.badgeText && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {c.badgeText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--portal-text-muted)] mt-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-slate-500">
                          /{c.slug}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          <span>{c.lectureCount ?? 0} Lectures</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{c.studentCount ?? 0} Students</span>
                        </span>
                        {Array.isArray(c.categories) && c.categories.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Tags: {c.categories.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls & Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap">
                    {/* Manage Lectures button */}
                    <Link
                      href={`/admin/lectures?courseId=${c._id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FDB813] hover:bg-[#ffc633] text-neutral-900 text-xs font-bold shadow-2xs transition-all active:scale-98"
                      title={`Manage lectures for ${c.title}`}
                    >
                      <Video className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Manage Lectures</span>
                    </Link>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleStatus(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                        isPub
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                      title="Click to toggle Draft / Published"
                    >
                      {isPub ? "Published" : "Draft"}
                    </button>

                    {/* Show on Home Toggle */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleShowOnHome(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        isHome
                          ? "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title="Show on home grid"
                    >
                      <span>Home</span>
                      {isHome ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(c)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Duplicate course"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/courses/${c.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Course Modal with Live CourseCard Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCourseId ? "Edit Course" : "Add New Course"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live preview shows exactly how this course renders on the public homepage and catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1">
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSaveCourse} className="lg:col-span-7 space-y-4">
                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Class 12 Accountancy"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Full Year Batch"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                </div>

                {/* Slug & Class Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                      className="portal-input text-xs w-full font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Class Label
                    </label>
                    <input
                      type="text"
                      placeholder="Class 11 / Class 12"
                      value={formData.classLabel}
                      onChange={(e) => setFormData({ ...formData, classLabel: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                </div>

                {/* Badge Text & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badge Text (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Most Popular, Foundation Course"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Free or 14,999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the course content and outcomes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="portal-input text-xs w-full resize-none"
                  />
                </div>

                {/* Meta Left & Right */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta Left
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Full Year + 136 Videos"
                      value={formData.metaLeft}
                      onChange={(e) => setFormData({ ...formData, metaLeft: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta Right
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bilingual"
                      value={formData.metaRight}
                      onChange={(e) => setFormData({ ...formData, metaRight: e.target.value })}
                      className="portal-input text-xs w-full"
                    />
                  </div>
                </div>

                {/* Theme Color (6 Choices) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {THEME_OPTIONS.map((th) => {
                      const isSelected = formData.theme === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, theme: th.id })}
                          className={`p-2 rounded-xl border text-center transition-all select-none cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? "border-slate-900 ring-2 ring-slate-900/10 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/10"
                            style={{ backgroundColor: th.hex }}
                          />
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full">
                            {th.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Illustration: Preset or Cloudinary Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Illustration (Preset or Custom Cloudinary Upload)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <select
                        value={formData.illustrationKey}
                        onChange={(e) => setFormData({ ...formData, illustrationKey: e.target.value })}
                        className="portal-input text-xs w-full cursor-pointer"
                      >
                        {PRESET_ILLUSTRATIONS.map((ill) => (
                          <option key={ill.key} value={ill.key}>
                            {ill.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? "Uploading..." : "Upload PNG/WebP"}</span>
                        <input
                          type="file"
                          accept="image/png,image/webp"
                          onChange={handleIllustrationUpload}
                          className="sr-only"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                  {formData.illustrationUrl && (
                    <div className="mt-1.5 text-[11px] text-emerald-600 font-mono truncate">
                      Custom URL: {formData.illustrationUrl}
                    </div>
                  )}
                </div>

                {/* Categories / Tags Multi-Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Categories & Filter Tags (Select or add new)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {DEFAULT_TAGS.map((tag) => {
                      const isSel = formData.categories.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleCategory(tag)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                            isSel
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}

                    {formData.categories
                      .filter((t) => !DEFAULT_TAGS.includes(t))
                      .map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 select-none"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => toggleCategory(tag)}
                            className="hover:text-black"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Type a new tag and press Enter..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddNewTag}
                    className="portal-input text-xs w-full"
                  />
                </div>

                {/* Status & Show on Home Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.status === "published"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value === "published" || e.target.checked ? "published" : "draft",
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-800">Published Status</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.showOnHome}
                      onChange={(e) =>
                        setFormData({ ...formData, showOnHome: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-800">Show on Home Grid</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="yellow"
                    disabled={busyId === "modal-save"}
                  >
                    {editingCourseId ? "Save Changes" : "Create Course"}
                  </Button>
                </div>
              </form>

              {/* Right Column: Live CourseCard Preview */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Live Component Preview
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewVariant("home")}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        previewVariant === "home" ? "bg-slate-900 text-white" : "text-slate-600"
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewVariant("catalog")}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        previewVariant === "catalog" ? "bg-slate-900 text-white" : "text-slate-600"
                      }`}
                    >
                      Catalog
                    </button>
                  </div>
                </div>

                {/* Card Container */}
                <div className="w-full max-w-[360px]">
                  <CourseCard
                    course={{
                      title: formData.title || "Course Title",
                      subtitle: formData.subtitle || "Batch Subtitle",
                      slug: formData.slug || "sample-course",
                      classLabel: formData.classLabel || "Class 12",
                      badgeText: formData.badgeText,
                      description: formData.description || "Comprehensive course covering all syllabus chapters with notes and practice.",
                      metaLeft: formData.metaLeft || "Full Year",
                      metaRight: formData.metaRight || "Bilingual",
                      rating: formData.rating,
                      ratingCount: formData.ratingCount,
                      theme: formData.theme,
                      illustrationKey: formData.illustrationKey,
                      illustrationUrl: formData.illustrationUrl,
                      categories: formData.categories,
                    }}
                    variant={previewVariant}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
