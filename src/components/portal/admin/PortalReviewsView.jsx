"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Star,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ClipboardPaste,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import Modal from "@/components/admin/ui/Modal";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import FormField from "@/components/admin/ui/FormField";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { useToast } from "@/components/admin/ui/Toast";

export default function PortalReviewsView({ initialReviews = [] }) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");
  const [role, setRole] = useState("student");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [published, setPublished] = useState(true);
  const [formError, setFormError] = useState("");

  // Bulk State
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");

  const resetForm = () => {
    setName("");
    setMeta("");
    setRole("student");
    setRating(5);
    setQuote("");
    setPublished(true);
    setFormError("");
    setEditingReview(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setName(review.name || review.studentName || "");
    setMeta(review.meta || review.school || "");
    setRole(review.role || "student");
    setRating(review.rating || 5);
    setQuote(review.quote || review.text || "");
    setPublished(Boolean(review.published ?? review.isVisible));
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Author name is required.");
    if (!quote.trim()) return setFormError("Review quote is required.");

    setLoading(true);
    setFormError("");

    try {
      const payload = {
        name: name.trim(),
        meta: meta.trim(),
        role,
        rating: Number(rating),
        quote: quote.trim(),
        published,
      };

      if (editingReview) {
        const res = await fetch(`/api/admin/reviews/${editingReview._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        setReviews((prev) =>
          prev.map((r) => (r._id === editingReview._id ? data.review : r))
        );
        showToast("Review updated successfully");
      } else {
        const res = await fetch("/api/admin/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");

        setReviews((prev) => [data.review, ...prev]);
        showToast("Review created successfully");
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

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return setBulkError("Please paste some reviews.");

    setLoading(true);
    setBulkError("");

    try {
      const res = await fetch("/api/admin/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: bulkText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk import failed");

      setReviews((prev) => [...data.reviews, ...prev]);
      showToast(`Successfully imported ${data.count} reviews`);
      setIsBulkOpen(false);
      setBulkText("");
    } catch (err) {
      setBulkError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (review) => {
    const newPublished = !review.published;
    try {
      const res = await fetch(`/api/admin/reviews/${review._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update publish state");

      setReviews((prev) =>
        prev.map((r) => (r._id === review._id ? { ...r, published: newPublished } : r))
      );
      showToast(newPublished ? "Review published to public carousel" : "Review unpublished");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deletingReview._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setReviews((prev) => prev.filter((r) => r._id !== deletingReview._id));
      showToast("Review deleted successfully");
      setDeletingReview(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Author",
      field: "name",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[#111827]">{row.name}</div>
          <div className="text-xs text-[#6B7280]">
            <span className={`capitalize font-semibold ${row.role === "parent" ? "text-purple-600" : "text-blue-600"}`}>
              {row.role || "student"}
            </span>
            {row.meta && ` • ${row.meta}`}
          </div>
        </div>
      ),
    },
    {
      header: "Rating",
      field: "rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 font-bold text-xs text-amber-500">
          <span>{row.rating || 5}</span>
          <Star className="h-3.5 w-3.5 fill-amber-500" />
        </div>
      ),
    },
    {
      header: "Quote Excerpt",
      field: "quote",
      render: (row) => (
        <p className="text-xs text-[#4B5563] line-clamp-2 max-w-sm">
          &ldquo;{row.quote || row.text}&rdquo;
        </p>
      ),
    },
    {
      header: "Status",
      field: "published",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleTogglePublish(row)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            row.published
              ? "bg-[#DEF7EC] text-[#03543F] hover:bg-[#BCF0DA]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {row.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span>{row.published ? "Published" : "Draft"}</span>
        </button>
      ),
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
            title="Edit Review"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingReview(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Review"
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
        title="Student & Parent Reviews"
        subtitle="Manage verified feedback, testimonials, ratings, and quotes showcased on the public carousel."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Reviews" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setBulkText("");
                setBulkError("");
                setIsBulkOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-800 shadow-2xs hover:bg-gray-50 transition-all cursor-pointer"
            >
              <ClipboardPaste className="h-4 w-4" />
              <span>Bulk Paste Helper</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Review</span>
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={reviews}
        searchPlaceholder="Search reviews by name, school or quote..."
        emptyTitle="No reviews yet"
        emptyDescription="Add parent and student testimonials or use the bulk paste helper. Only published reviews appear on the home carousel."
      />

      {/* Add / Edit Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReview ? "Edit Testimonial" : "Add Testimonial"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Author Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanya Grover"
              required
            />

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Meta / School / Board"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="e.g. MVN Sector 17, 98% in 2025"
            />

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">Rating (1 to 5)</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★☆</option>
                <option value={3}>3 Stars ★★★☆☆</option>
                <option value={2}>2 Stars ★★☆☆☆</option>
                <option value={1}>1 Star ★☆☆☆☆</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5">Testimonial Quote</label>
            <textarea
              rows={4}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter the student or parent's direct words..."
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="published-toggle"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded text-[#FFC21A] focus:ring-[#FFC21A]"
            />
            <label htmlFor="published-toggle" className="text-xs font-bold text-gray-800 cursor-pointer">
              Publish immediately to the website testimonials carousel
            </label>
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
              <span>{editingReview ? "Save Changes" : "Create Review"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Paste Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import Reviews"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Paste multiple reviews, one per line using the pipe (<code>|</code>) format:
          </p>
          <div className="rounded-xl bg-gray-50 p-3 text-[11px] font-mono text-gray-700 border border-gray-200">
            Name | Role | Rating | School or Details | Quote text...
            <br />
            <span className="text-gray-400">Example:</span>
            <br />
            Aarav Sharma | student | 5 | DPS Faridabad 2025 | Ronak Sir made partnership accounts crystal clear!
            <br />
            Mrs. Neha Mehta | parent | 5 | Parent of Class 12 student | My daughter scored 98 in Accounts thanks to RD Classes.
          </div>

          {bulkError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{bulkError}</span>
            </div>
          )}

          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Paste your pipe-delimited review lines here..."
            className="w-full font-mono rounded-xl border border-black/10 bg-white p-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsBulkOpen(false)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={loading || !bulkText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Import Reviews</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial?"
        message={`Are you sure you want to delete the review from "${deletingReview?.name}"?`}
        confirmText="Delete Review"
        isDestructive
        isLoading={loading}
      />
    </div>
  );
}
