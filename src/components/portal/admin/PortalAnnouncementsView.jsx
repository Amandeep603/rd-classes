"use client";

import { useState } from "react";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/server/actions/admin.announcements.actions.js";

export default function PortalAnnouncementsView({
  announcements = [],
  courses = [],
}) {
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeItem, setActiveItem] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceAll, setAudienceAll] = useState(true);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);
  const [dismissible, setDismissible] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setActiveItem(null);
    setTitle("");
    setBody("");
    setAudienceAll(true);
    setSelectedCourseIds([]);
    setStartsAt(new Date().toISOString().slice(0, 10));
    setEndsAt("");
    setActive(true);
    setDismissible(true);
    setError("");
    setModalMode("create");
  };

  const openEdit = (item) => {
    setActiveItem(item);
    setTitle(item.title || "");
    setBody(item.body || "");
    setAudienceAll(item.audience?.all !== false);
    setSelectedCourseIds(item.audience?.courseIds || []);
    setStartsAt(
      item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 10) : ""
    );
    setEndsAt(
      item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 10) : ""
    );
    setActive(item.active !== false);
    setDismissible(item.dismissible !== false);
    setError("");
    setModalMode("edit");
  };

  const handleCourseCheckbox = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      body,
      audience: {
        all: audienceAll,
        courseIds: audienceAll ? [] : selectedCourseIds,
      },
      startsAt,
      endsAt: endsAt || null,
      active,
      dismissible,
    };

    try {
      let res;
      if (modalMode === "create") {
        res = await createAnnouncementAction(payload);
      } else {
        res = await updateAnnouncementAction(activeItem._id, payload);
      }

      if (res?.success) {
        setModalMode(null);
        window.location.reload();
      } else {
        setError(res?.error || "Failed to save announcement.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete announcement "${item.title}"?`)) return;
    const res = await deleteAnnouncementAction(item._id);
    if (res?.success) {
      window.location.reload();
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Student Announcements</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Publish yellow highlight banners displayed at the top of the student dashboard.
          </p>
        </div>

        <Button variant="yellow" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="w-10 h-10 mx-auto text-[var(--portal-accent-yellow)] mb-3" />
          <h3 className="text-base font-bold text-[var(--portal-text-main)]">No announcements yet</h3>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1 mb-4">
            Broadcast test schedules, holiday revisions, or batch timings to students.
          </p>
          <Button variant="yellow" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann._id}
              className="p-5 border-l-4 border-l-[var(--portal-accent-yellow)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[var(--portal-tint-yellow-bg)] text-[var(--portal-tint-yellow-icon)] flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--portal-accent-yellow)] text-[var(--portal-accent-yellow-text)]">
                        Announcement
                      </span>
                      <h3 className="text-base font-bold text-[var(--portal-text-main)]">
                        {ann.title}
                      </h3>
                      {ann.active ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="yellow">Inactive</Badge>
                      )}
                    </div>

                    <p className="text-sm text-[var(--portal-text-muted)] mt-2 whitespace-pre-wrap">
                      {ann.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--portal-text-muted)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {ann.audience?.all
                            ? "All Enrolled Students"
                            : `${ann.audience?.courseIds?.length || 0} Targeted Course(s)`}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Started:{" "}
                          {new Date(ann.startsAt).toLocaleDateString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      </span>
                      {ann.endsAt && (
                        <>
                          <span>•</span>
                          <span>
                            Expires:{" "}
                            {new Date(ann.endsAt).toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(ann)}>
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="soft-red"
                    size="sm"
                    onClick={() => handleDelete(ann)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Post New Announcement" : "Edit Announcement"}
        description="Broadcast timely notices to students on their dashboard."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <FormField label="Headline Title" required hint="e.g. Sunday Mock Test #15 Schedule">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="portal-input"
              placeholder="e.g. Sunday Mock Test #15 Schedule"
              required
            />
          </FormField>

          <FormField label="Notice Body" required>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="portal-input min-h-[90px]"
              placeholder="Reporting time 9:00 AM sharp at Sector 9 Centre. Syllabus: Accounting for Share Capital..."
              required
            />
          </FormField>

          <div className="p-3 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--portal-text-main)]">
              <input
                type="radio"
                name="aud"
                checked={audienceAll}
                onChange={() => setAudienceAll(true)}
                className="accent-[var(--portal-accent-yellow)]"
              />
              <span>Broadcast to all students</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--portal-text-main)]">
              <input
                type="radio"
                name="aud"
                checked={!audienceAll}
                onChange={() => setAudienceAll(false)}
                className="accent-[var(--portal-accent-yellow)]"
              />
              <span>Target specific course(s) only</span>
            </label>

            {!audienceAll && (
              <div className="pt-2 pl-5 space-y-1.5 border-t border-[var(--portal-card-border)] mt-2">
                {courses.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-xs text-[var(--portal-text-main)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(c._id)}
                      onChange={() => handleCourseCheckbox(c._id)}
                      className="rounded accent-[var(--portal-accent-yellow)]"
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="portal-input text-xs"
              />
            </FormField>

            <FormField label="Expiry Date (Optional)">
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="portal-input text-xs"
              />
            </FormField>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded accent-[var(--portal-accent-yellow)]"
              />
              <span>Active (Visible on Dashboard)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
              <input
                type="checkbox"
                checked={dismissible}
                onChange={(e) => setDismissible(e.target.checked)}
                className="rounded accent-[var(--portal-accent-yellow)]"
              />
              <span>Students can dismiss (X)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm" disabled={saving}>
              {saving ? "Posting..." : modalMode === "create" ? "Post Announcement" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
