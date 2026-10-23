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
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import Tabs from "../ui/Tabs";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import {
  createLectureAction,
  updateLectureAction,
  deleteLectureAction,
  reorderLecturesAction,
  fetchVimeoMetadataAction,
} from "@/server/actions/admin.lectures.actions.js";
import { updateCourseAction } from "@/server/actions/admin.courses.actions.js";

export default function PortalCourseDetailView({
  course,
  lectures = [],
  enrolledStudents = [],
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
    setTitle(lec.title);
    setVimeoUrl(lec.vimeoHash ? `https://vimeo.com/${lec.vimeoId}/${lec.vimeoHash}` : lec.vimeoId || "");
    setDurationSec(lec.durationSec || 0);
    setDescription(lec.description || "");
    setPublished(!!lec.published);
    setIsPreview(!!lec.isPreview);
    setError("");
    setVimeoMsg("");
    setModalMode("edit");
  };

  const handleFetchVimeo = async () => {
    if (!vimeoUrl) {
      setError("Please enter a Vimeo URL or video ID first.");
      return;
    }
    setIsFetchingVimeo(true);
    setError("");
    setVimeoMsg("");

    const digitsMatch = vimeoUrl.match(/(\d+)/);
    const id = digitsMatch ? digitsMatch[1] : vimeoUrl;

    try {
      const res = await fetchVimeoMetadataAction(id);
      if (res?.success) {
        if (res.title && !title) setTitle(res.title);
        if (res.durationSec) setDurationSec(res.durationSec);
        if (res.description && !description) setDescription(res.description);
        setVimeoMsg("✓ Metadata fetched from Vimeo successfully!");
      } else {
        setError(res?.error || "Could not fetch metadata from Vimeo.");
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
    fd.append("durationSec", durationSec.toString());
    fd.append("description", description);
    if (published) fd.append("published", "on");
    if (isPreview) fd.append("isPreview", "on");

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

  const handleDeleteLecture = async (lecId) => {
    if (!confirm("Delete this lecture permanently?")) return;
    const res = await deleteLectureAction(lecId, course._id);
    if (res?.success) {
      setLectureList((prev) => prev.filter((l) => l._id !== lecId));
    }
  };

  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= lectureList.length) return;

    const updated = [...lectureList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setLectureList(updated);
    const orderedIds = updated.map((l) => l._id);
    await reorderLecturesAction(course._id, orderedIds);
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
              <span>Enrolled Students: <strong>{enrolledStudents.length}</strong></span>
            </p>
          </div>

          <Button variant="yellow" size="md" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            <span>Add Lecture</span>
          </Button>
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
                Add your first Vimeo lecture recording with chapters and preview options.
              </p>
              <Button variant="yellow" size="sm" onClick={openCreateModal}>
                <Plus className="w-4 h-4" />
                <span>Add Lecture</span>
              </Button>
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
                              className="hover:text-[var(--portal-text-main)] disabled:opacity-20"
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(lec.originalIndex, 1)}
                              disabled={lec.originalIndex === lectureList.length - 1}
                              className="hover:text-[var(--portal-text-main)] disabled:opacity-20"
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="w-9 h-9 rounded-lg bg-[var(--portal-tint-yellow-bg)] text-[var(--portal-tint-yellow-icon)] flex items-center justify-center font-bold text-xs">
                            {lec.originalIndex + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[var(--portal-text-main)]">
                                {lec.title}
                              </h3>
                              {lec.isPreview && (
                                <Badge tone="blue">Free Preview</Badge>
                              )}
                              {!lec.published && (
                                <Badge tone="yellow">Draft</Badge>
                              )}
                            </div>
                            <p className="text-xs text-[var(--portal-text-muted)] mt-0.5">
                              {mins > 0 ? `${mins} mins` : "Duration unassigned"}
                              {lec.vimeoId && <> • Vimeo: <span className="font-mono">{lec.vimeoId}</span></>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(lec)}
                            title="Edit lecture"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="soft-red"
                            size="sm"
                            onClick={() => handleDeleteLecture(lec._id)}
                            title="Delete lecture"
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

      {/* Tab 2: Course Settings */}
      {activeTab === "details" && (
        <Card className="p-6 max-w-2xl">
          <h2 className="text-base font-bold text-[var(--portal-text-main)] mb-4">Edit Course Information</h2>
          <form onSubmit={handleSaveCourse} className="space-y-4">
            <FormField label="Course Title" required>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <FormField label="URL Slug" hint="Used in student portal route path.">
              <input
                type="text"
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                className="portal-input font-mono text-xs"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="portal-input min-h-[90px]"
              />
            </FormField>

            <FormField label="Thumbnail URL">
              <input
                type="url"
                value={courseThumbnail}
                onChange={(e) => setCourseThumbnail(e.target.value)}
                className="portal-input text-xs"
              />
            </FormField>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)] pt-2">
              <input
                type="checkbox"
                checked={coursePublished}
                onChange={(e) => setCoursePublished(e.target.checked)}
                className="rounded accent-[var(--portal-accent-yellow)]"
              />
              <span>Course is Published and Visible</span>
            </label>

            {courseMsg && (
              <p className="text-xs font-semibold text-emerald-700">{courseMsg}</p>
            )}

            <Button type="submit" variant="yellow" size="sm" disabled={savingCourse}>
              {savingCourse ? "Saving..." : "Save Course Details"}
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Enrolled Students */}
      {activeTab === "students" && (
        <Card className="p-6">
          <h2 className="text-base font-bold text-[var(--portal-text-main)] mb-4">
            Students Enrolled in this Course ({enrolledStudents.length})
          </h2>

          {enrolledStudents.length === 0 ? (
            <p className="text-xs text-[var(--portal-text-muted)] py-6 text-center">
              No students are currently enrolled in this course. You can assign students from the Students page.
            </p>
          ) : (
            <div className="space-y-2">
              {enrolledStudents.map((enr) => {
                const s = enr.userId;
                if (!s) return null;
                return (
                  <div
                    key={enr._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--portal-text-main)]">{s.name}</span>
                          {s.studentCode && (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-[var(--portal-card-border)]">
                              {s.studentCode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--portal-text-muted)]">
                          Login ID: <strong className="font-mono">{s.loginId}</strong> • Valid until:{" "}
                          <strong>
                            {enr.expiresAt
                              ? new Date(enr.expiresAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
                              : "Lifetime"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/students/${s._id}`}
                      className="text-xs font-bold text-[var(--portal-text-muted)] hover:text-[var(--portal-text-main)]"
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
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="rounded accent-[var(--portal-accent-yellow)]"
                />
                <span>Free Preview Lecture</span>
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
    </div>
  );
}
