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
  ExternalLink,
  Search,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import {
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
} from "@/server/actions/admin.courses.actions.js";

export default function PortalCoursesView({ courses = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeCourse, setActiveCourse] = useState(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [published, setPublished] = useState(true);
  const [order, setOrder] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredCourses = courses.filter((c) =>
    (c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    try {
      let res;
      if (modalMode === "create") {
        res = await createCourseAction(null, fd);
      } else {
        res = await updateCourseAction(activeCourse._id, null, fd);
      }

      if (res?.success) {
        setModalMode(null);
      } else {
        setError(res?.error || "Failed to save course.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (confirm("Delete this course and all its lectures? This action is permanent.")) {
      await deleteCourseAction(courseId);
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Course Library</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Manage video courses, chapter sections, and student lecture permissions.
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

          <Button variant="yellow" size="md" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </Button>
        </div>
      </div>

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
          {filteredCourses.map((c) => (
            <Card key={c._id} className="overflow-hidden flex flex-col justify-between group hover:shadow-lg transition">
              <div>
                {/* Course Banner / Fallback */}
                <div className="h-40 w-full relative bg-gradient-to-br from-[#0B2A47] to-[#123e66] flex items-center justify-center p-6 text-white overflow-hidden">
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnail}
                      alt={c.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center relative z-10">
                      <BookOpen className="w-8 h-8 mx-auto text-[var(--portal-accent-yellow)] mb-2 opacity-90" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FFD54A]">
                        RD Classes Video Course
                      </span>
                    </div>
                  )}

                  {/* Status chip */}
                  <div className="absolute top-3 right-3 z-20">
                    {c.published ? (
                      <Badge tone="green">Published</Badge>
                    ) : (
                      <Badge tone="yellow">Draft</Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-[var(--portal-text-main)] group-hover:text-[var(--portal-accent-yellow)] transition line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[var(--portal-text-muted)] mt-1 line-clamp-2 min-h-[32px]">
                    {c.description || "Comprehensive syllabus coverage with board preparation exercises."}
                  </p>

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
                <Link
                  href={`/admin/courses/${c._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--portal-accent-yellow)] text-[var(--portal-accent-yellow-text)] hover:brightness-105 transition"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Manage Lectures</span>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(c)}
                  aria-label="Edit course details"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="soft-red"
                  size="sm"
                  onClick={() => handleDelete(c._id)}
                  aria-label="Delete course"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Course Modal (Create / Edit) */}
      <Dialog
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Add New Course" : "Edit Course"}
        description="Configure course title, URL slug, and visibility settings."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <FormField label="Course Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="portal-input"
              placeholder="e.g. Class 12 Comprehensive Accountancy"
              required
            />
          </FormField>

          <FormField label="Slug (URL Path)" hint="Leave blank to auto-generate from title.">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="portal-input font-mono text-xs"
              placeholder="e.g. class-12-accountancy"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="portal-input min-h-[70px]"
              placeholder="Brief course overview for students..."
            />
          </FormField>

          <FormField label="Thumbnail URL" hint="Direct link to course cover image.">
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="portal-input text-xs"
              placeholder="https://..."
            />
          </FormField>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded accent-[var(--portal-accent-yellow)]"
              />
              <span>Publish Course to Enrolled Students</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : modalMode === "create" ? "Create Course" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
