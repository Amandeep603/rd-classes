"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Video,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import {
  updateLectureAction,
  deleteLectureAction,
} from "@/server/actions/admin.lectures.actions.js";

export default function PortalLecturesView({
  lectures = [],
  courses = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [editingLecture, setEditingLecture] = useState(null);

  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [published, setPublished] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [saving, setSaving] = useState(false);

  const filtered = lectures.filter((l) => {
    const matchesCourse = selectedCourse === "all" || l.courseId?._id === selectedCourse;
    const matchesSearch =
      (l.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.section || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.courseId?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const openEdit = (l) => {
    setEditingLecture(l);
    setTitle(l.title || "");
    setSection(l.section || "");
    setPublished(!!l.published);
    setIsPreview(Boolean(l.freePreview ?? l.isPreview));
    setDurationSec(l.durationSec || 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingLecture) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("section", section);
    fd.append("durationSec", durationSec.toString());
    if (published) fd.append("published", "on");
    if (isPreview) {
      fd.append("freePreview", "on");
      fd.append("isPreview", "on");
    }

    try {
      const res = await updateLectureAction(
        editingLecture._id,
        editingLecture.courseId?._id || editingLecture.courseId,
        null,
        fd
      );
      if (res?.success) {
        setEditingLecture(null);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l) => {
    if (!confirm(`Delete "${l.title}"?`)) return;
    const res = await deleteLectureAction(
      l._id,
      l.courseId?._id || l.courseId
    );
    if (res?.success) {
      window.location.reload();
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Lectures Master List</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Browse, search and modify video lectures across all RD Classes courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Course filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="portal-input !w-auto !py-2 text-xs font-semibold"
          >
            <option value="all">All Courses ({lectures.length})</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--portal-text-muted)]" />
            <input
              type="text"
              placeholder="Search lectures, chapters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="portal-input !pl-9 !py-2 text-xs !w-60"
            />
          </div>
        </div>
      </div>

      {/* Lectures table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="portal-table w-full">
            <thead>
              <tr>
                <th className="!text-left">#</th>
                <th className="!text-left">Lecture Title</th>
                <th className="!text-left">Course & Chapter</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Vimeo ID</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--portal-text-muted)] text-xs">
                    No lectures matched your query.
                  </td>
                </tr>
              ) : (
                filtered.map((l, idx) => {
                  const mins = Math.round((l.durationSec || 0) / 60);
                  return (
                    <tr key={l._id}>
                      <td className="font-mono text-xs text-[var(--portal-text-muted)]">{idx + 1}</td>
                      <td>
                        <div className="font-bold text-sm text-[var(--portal-text-main)]">{l.title}</div>
                        {l.description && (
                          <div className="text-xs text-[var(--portal-text-muted)] line-clamp-1 max-w-sm">
                            {l.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-xs font-bold text-[var(--portal-text-main)]">
                          {l.courseId?.title || "Unknown Course"}
                        </div>
                        <div className="text-xs text-[var(--portal-text-muted)]">{l.section || "General"}</div>
                      </td>
                      <td className="text-center text-xs font-semibold text-[var(--portal-text-muted)]">
                        {mins > 0 ? `${mins}m` : "—"}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {l.published ? (
                            <Badge tone="green">Published</Badge>
                          ) : (
                            <Badge tone="yellow">Draft</Badge>
                          )}
                          {Boolean(l.freePreview ?? l.isPreview) && <Badge tone="blue">Free</Badge>}
                        </div>
                      </td>
                      <td className="text-center font-mono text-xs text-[var(--portal-text-muted)]">
                        {l.vimeoId || "—"}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="soft-red" size="sm" onClick={() => handleDelete(l)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        isOpen={!!editingLecture}
        onClose={() => setEditingLecture(null)}
        title="Edit Lecture Details"
        description={editingLecture?.title}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <FormField label="Lecture Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="portal-input"
              required
            />
          </FormField>

          <FormField label="Chapter / Section Name" required>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="portal-input"
              required
            />
          </FormField>

          <FormField label="Duration (Seconds)">
            <input
              type="number"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="portal-input"
              min="0"
            />
          </FormField>

          <div className="flex items-center gap-6 pt-2">
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

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingLecture(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
