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
  CheckCircle,
  XCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
} from "@/server/actions/admin.courses.actions.js";

export default function CoursesManager({ courses = [] }) {
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeCourse, setActiveCourse] = useState(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [published, setPublished] = useState(false);
  const [order, setOrder] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const openCreateModal = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setThumbnail("");
    setPublished(true);
    setOrder(courses.length);
    setActiveCourse(null);
    setModalMode("create");
    setError("");
  };

  const openEditModal = (c) => {
    setActiveCourse(c);
    setTitle(c.title);
    setSlug(c.slug);
    setDescription(c.description || "");
    setThumbnail(c.thumbnail || "");
    setPublished(!!c.published);
    setOrder(c.order || 0);
    setModalMode("edit");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("title", title);
    if (slug) fd.append("slug", slug);
    fd.append("description", description);
    fd.append("thumbnail", thumbnail);
    if (published) fd.append("published", "on");
    fd.append("order", order.toString());

    let res;
    if (modalMode === "create") {
      res = await createCourseAction(null, fd);
    } else {
      res = await updateCourseAction(activeCourse._id, null, fd);
    }

    setIsSubmitting(false);
    if (res?.success) {
      setModalMode(null);
    } else {
      setError(res?.error || "Failed to save course.");
    }
  };

  const handleDelete = async (courseId) => {
    if (confirm("Delete this course and all its lectures? This cannot be undone.")) {
      await deleteCourseAction(courseId);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Courses Manager
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create courses and manage their curriculum and Vimeo lecture videos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-[#131316] border border-[#222226] rounded-2xl p-10 text-center">
          <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No courses created yet</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Get started by adding your first Accountancy course.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#FFB800] text-[#0A0A0B] text-xs font-bold rounded-xl"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c._id}
              className="bg-[#131316] border border-[#222226] hover:border-[#383842] rounded-2xl overflow-hidden flex flex-col justify-between transition-colors shadow-lg"
            >
              <div>
                {c.thumbnail ? (
                  <div className="h-40 bg-[#1A1A1E] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-[#1C1C22] to-[#121215] flex items-center justify-center border-b border-[#222226]">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-gray-400">/{c.slug}</span>
                    {c.published ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                        <CheckCircle className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
                    {c.title}
                  </h3>
                  {c.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-[#1F1F24]">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <strong>{c.lectureCount || 0}</strong> lectures
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <strong>{c.studentCount || 0}</strong> enrolled
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#16161B] border-t border-[#222226] flex items-center justify-between gap-2">
                <Link
                  href={`/admin/courses/${c._id}`}
                  className="px-3.5 py-1.5 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-lg transition"
                >
                  Manage Lectures →
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#202028]"
                    title="Edit Course"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-950/30"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141418] border border-[#2B2B33] rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setModalMode(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {modalMode === "create" ? "Add New Course" : "Edit Course"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-xs text-red-200 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CBSE Class 12 Partnership Accounts"
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              {modalMode === "edit" && (
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of syllabus, chapters, and board exam drills..."
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Thumbnail URL (optional)
                </label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="accent-[#FFB800]"
                  />
                  <span>Published (visible to enrolled students)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Order:</span>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-16 bg-[#1A1A1E] border border-[#2D2D35] rounded-lg px-2 py-1 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222228]">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-300 hover:bg-[#202028] rounded-xl border border-[#303038]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold rounded-xl flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
