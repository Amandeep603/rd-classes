"use client";

import { useState } from "react";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Pin,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import Modal from "@/components/admin/ui/Modal";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import FormField from "@/components/admin/ui/FormField";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { useToast } from "@/components/admin/ui/Toast";

export default function PortalAnnouncementsView({
  initialAnnouncements = [],
  announcements: propAnnouncements,
  courses = [],
}) {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState(
    initialAnnouncements.length > 0 ? initialAnnouncements : propAnnouncements || []
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState("all"); // 'all' | 'course'
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setTitle("");
    setBody("");
    setAudienceType("all");
    setSelectedCourseId(courses[0]?._id || "");
    setPinned(false);
    setExpiresAt("");
    setFormError("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setBody(item.body || item.content || "");

    const isAudienceAll =
      !item.audience ||
      item.audience === "all" ||
      item.audience?.all === true;

    if (isAudienceAll) {
      setAudienceType("all");
      setSelectedCourseId(courses[0]?._id || "");
    } else {
      setAudienceType("course");
      const cId =
        typeof item.audience === "string"
          ? item.audience
          : item.audience?.courseIds?.[0] || courses[0]?._id || "";
      setSelectedCourseId(cId);
    }

    setPinned(Boolean(item.pinned));
    const expDate = item.expiresAt || item.endsAt;
    setExpiresAt(expDate ? new Date(expDate).toISOString().slice(0, 10) : "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setFormError("Title is required.");
    if (!body.trim()) return setFormError("Notice body text is required.");

    setLoading(true);
    setFormError("");

    const audienceValue = audienceType === "all" ? "all" : selectedCourseId;

    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience: audienceValue,
      pinned,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
      dismissible: true,
    };

    try {
      if (editingItem) {
        const res = await fetch(`/api/admin/announcements/${editingItem._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        setAnnouncements((prev) =>
          prev.map((a) => (a._id === editingItem._id ? data.announcement : a))
        );
        showToast("Announcement updated successfully");
      } else {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");

        setAnnouncements((prev) => [data.announcement, ...prev]);
        showToast("Announcement published to student dashboard");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/announcements/${deletingItem._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setAnnouncements((prev) => prev.filter((a) => a._id !== deletingItem._id));
      showToast("Announcement deleted successfully");
      setDeletingItem(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (audience) => {
    if (!audience || audience === "all" || audience?.all === true) {
      return "All Enrolled Students";
    }
    const cId = typeof audience === "string" ? audience : audience?.courseIds?.[0];
    const match = courses.find((c) => c._id === cId);
    return match ? match.title : "Targeted Course";
  };

  const columns = [
    {
      header: "Status",
      field: "pinned",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.pinned && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800"
              title="Pinned to top of dashboard"
            >
              <Pin className="h-3.5 w-3.5 fill-amber-700" />
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              row.active !== false
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {row.active !== false ? "Active" : "Archived"}
          </span>
        </div>
      ),
    },
    {
      header: "Announcement",
      field: "title",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[#111827]">{row.title}</div>
          <div className="text-xs text-[#6B7280] line-clamp-1 max-w-md mt-0.5">
            {row.body || row.content}
          </div>
        </div>
      ),
    },
    {
      header: "Audience",
      field: "audience",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <span>{getCourseName(row.audience)}</span>
        </span>
      ),
    },
    {
      header: "Expiry Date",
      field: "expiresAt",
      render: (row) => {
        const exp = row.expiresAt || row.endsAt;
        if (!exp) return <span className="text-xs text-gray-400">No Expiry</span>;
        const d = new Date(exp);
        const isPast = d < new Date();
        return (
          <span
            className={`text-xs font-medium ${isPast ? "text-red-600 line-through" : "text-gray-700"}`}
          >
            {d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      header: "Actions",
      field: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-gray-600 hover:bg-black/5 hover:text-black transition-colors"
            title="Edit Announcement"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingItem(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Announcement"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Announcements"
        subtitle="Broadcast yellow banner notices displayed at the top of the student dashboard. Dismissible per student."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Announcements" },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={announcements}
        searchPlaceholder="Search notices by title or content..."
        emptyTitle="No announcements posted yet"
        emptyDescription="Broadcast test schedules, holiday revisions, or batch timings to students as a yellow dashboard alert."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Announcement" : "Post New Announcement"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <FormField
            label="Notice Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunday Mock Test #15 Schedule"
            required
          />

          <FormField
            label="Notice Body Text"
            as="textarea"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Reporting time 9:00 AM sharp at Sector 9 Centre. Syllabus: Accounting for Share Capital..."
            required
          />

          {/* Audience selection */}
          <div className="rounded-xl border border-black/10 bg-[#FBF8F1]/60 p-3.5 space-y-2.5">
            <label className="block text-xs font-bold text-neutral-800">Target Audience</label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="audienceRadio"
                  checked={audienceType === "all"}
                  onChange={() => setAudienceType("all")}
                  className="accent-[#FFC21A]"
                />
                <span>Broadcast to all enrolled students</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="audienceRadio"
                  checked={audienceType === "course"}
                  onChange={() => setAudienceType("course")}
                  className="accent-[#FFC21A]"
                />
                <span>Target one specific course only</span>
              </label>
            </div>

            {audienceType === "course" && courses.length > 0 && (
              <div className="pt-1">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <FormField
              label="Expiry Date (Optional)"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              helperText="Banner auto-expires after this date."
            />

            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned-toggle"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded text-[#FFC21A] focus:ring-[#FFC21A]"
              />
              <label htmlFor="pinned-toggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                📌 Pin to top of dashboard
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingItem ? "Save Changes" : "Post Announcement"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Announcement?"
        message={`Are you sure you want to remove "${deletingItem?.title}"? It will immediately disappear from student dashboards.`}
        confirmText="Delete Announcement"
        isDestructive
        isLoading={loading}
      />
    </div>
  );
}
