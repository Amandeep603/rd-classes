"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Trophy,
  Upload,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import Modal from "@/components/admin/ui/Modal";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import FormField from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";

// Helper: compress image file without cropping, preserving exact aspect ratio
async function processTopperImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, w, h);

        // Compress to WebP under 350KB
        const quality = 0.88;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Image processing failed"));
            }
            resolve(blob);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PortalToppersView({ initialToppers = [] }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [toppers, setToppers] = useState(initialToppers);
  const [isModalOpen, setIsModalOpen] = useState(searchParams?.get("add") === "1");
  const [editingTopper, setEditingTopper] = useState(null);
  const [deletingTopper, setDeletingTopper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("2025");
  const [marks, setMarks] = useState("");
  const [outOf, setOutOf] = useState(100);
  const [classLevel, setClassLevel] = useState("12");
  const [order, setOrder] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [featured, setFeatured] = useState(true);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setName("");
    setSchool("");
    setYear("2025");
    setMarks("");
    setOutOf(100);
    setClassLevel("12");
    setOrder(0);
    setPhotoUrl("");
    setPublicId("");
    setFeatured(true);
    setFormError("");
    setEditingTopper(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (topper) => {
    setEditingTopper(topper);
    setName(topper.name || "");
    setSchool(topper.school || "");
    setYear(topper.year || topper.examYear || "2025");
    setMarks(topper.marks || topper.score || "");
    setOutOf(topper.outOf || 100);
    setClassLevel(topper.classLevel || "12");
    setOrder(topper.order ?? 0);
    setPhotoUrl(topper.photoUrl || topper.photo || "");
    setPublicId(topper.publicId || "");
    setFeatured(Boolean(topper.featuredOnHome ?? topper.featured ?? topper.isFeatured));
    setFormError("");
    setIsModalOpen(true);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setFormError("");
      const processedBlob = await processTopperImage(file);

      const formData = new FormData();
      formData.append("file", processedBlob, "topper.webp");

      const res = await fetch("/api/admin/toppers/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setPhotoUrl(data.url);
      setPublicId(data.publicId);
      showToast("Photo processed and uploaded to Cloudinary", "success");
    } catch (err) {
      setFormError(err.message || "Failed to process image");
      showToast(err.message || "Photo upload failed", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Student name is required.");
    if (!school.trim()) return setFormError("School name is required.");
    if (!marks.toString().trim()) return setFormError("Marks/Score is required (e.g. 100 or 98).");

    setLoading(true);
    setFormError("");

    try {
      const payload = {
        name: name.trim(),
        school: school.trim(),
        year: year.toString().trim(),
        examYear: year.toString().trim(),
        marks: marks.toString().trim(),
        score: marks.toString().trim(),
        outOf: Number(outOf) || 100,
        classLevel: classLevel || "12",
        order: Number(order) || 0,
        photoUrl,
        publicId,
        featured,
        featuredOnHome: featured,
        isFeatured: featured,
      };

      if (editingTopper) {
        const res = await fetch(`/api/admin/toppers/${editingTopper._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        setToppers((prev) =>
          prev.map((t) => (t._id === editingTopper._id ? data.topper : t))
        );
        showToast("Topper updated successfully");
      } else {
        const res = await fetch("/api/admin/toppers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");

        setToppers((prev) => [data.topper, ...prev]);
        showToast("Topper added successfully");
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
    if (!deletingTopper) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/toppers/${deletingTopper._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setToppers((prev) => prev.filter((t) => t._id !== deletingTopper._id));
      showToast("Topper deleted successfully");
      setDeletingTopper(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (topper) => {
    const currentFeatured = Boolean(topper.featuredOnHome ?? topper.featured ?? topper.isFeatured);
    const newFeatured = !currentFeatured;
    try {
      const res = await fetch(`/api/admin/toppers/${topper._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featured: newFeatured,
          featuredOnHome: newFeatured,
          isFeatured: newFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Toggle failed");

      setToppers((prev) =>
        prev.map((t) =>
          t._id === topper._id
            ? {
                ...t,
                featured: newFeatured,
                featuredOnHome: newFeatured,
                isFeatured: newFeatured,
              }
            : t
        )
      );
      showToast(newFeatured ? "Topper featured on Home carousel" : "Removed from Home carousel");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const columns = [
    {
      header: "Photo",
      field: "photoUrl",
      render: (row) => (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-black/10 bg-[#F3F4F6]">
          {row.photoUrl || row.photo ? (
            <Image
              src={row.photoUrl || row.photo}
              alt={row.name}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-bold text-gray-400 text-xs">
              {row.name?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Student",
      field: "name",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-[#111827]">{row.name}</div>
          <div className="text-xs text-[#6B7280]">{row.school}</div>
        </div>
      ),
    },
    {
      header: "Class",
      field: "classLevel",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          Class {row.classLevel || "12"}
        </span>
      ),
    },
    {
      header: "Score / Marks",
      field: "marks",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-[#FFF8E6] text-[#B47500] border border-[#FFE59E]">
          {row.marks || row.score} / {row.outOf || 100}
        </span>
      ),
    },
    { header: "Year", field: "year", sortable: true },
    {
      header: "Order",
      field: "order",
      render: (row) => (
        <span className="text-xs font-semibold text-gray-600">
          {row.order ?? 0}
        </span>
      ),
    },
    {
      header: "Home Carousel",
      field: "featuredOnHome",
      render: (row) => {
        const isFeat = Boolean(row.featuredOnHome ?? row.featured ?? row.isFeatured);
        return (
          <button
            type="button"
            onClick={() => handleToggleFeatured(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              isFeat
                ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isFeat ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{isFeat ? "Featured" : "Standard"}</span>
          </button>
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
            title="Edit Topper"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingTopper(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Topper"
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
        title="Board Toppers"
        subtitle="Manage felicitated board exam merit scorers, 95+ and 100/100 distinction holders."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Toppers" },
        ]}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Topper</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={toppers}
        searchPlaceholder="Search toppers by student name, school, year or marks..."
        emptyTitle="No toppers registered yet"
        emptyDescription="Add Class 11 and Class 12 board merit holders to highlight them on the public Results page and home showcase."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTopper ? "Edit Board Topper" : "Add Board Topper"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Photo Upload: Client compresses to WebP preserving aspect ratio */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1.5">
              Student Photo (Portrait, square, or landscape - auto-fitted without cropping)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                {photoUrl ? (
                  <Image src={photoUrl} alt="Topper preview" fill className="object-contain" />
                ) : (
                  <Camera className="h-7 w-7 text-gray-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{photoUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>
                <p className="mt-1 text-[11px] text-gray-500">
                  Client compresses to WebP while preserving exact aspect ratio before upload.
                </p>
              </div>
            </div>
          </div>

          <FormField
            label="Student Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vardaan Agarwal"
            required
          />

          <FormField
            label="School Name"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g. MVN (Modern Vidya Niketan)"
            required
          />

          {/* Class, Score and Out-of row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                Class Level
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <option value="12">Class 12</option>
                <option value="11">Class 11</option>
              </select>
            </div>
            <FormField
              label="Marks / Score"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="e.g. 98"
              required
            />
            <FormField
              label="Out Of"
              type="number"
              value={outOf}
              onChange={(e) => setOutOf(e.target.value)}
              placeholder="100"
              required
            />
          </div>

          {/* Exam Year & Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Board Exam Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025"
              required
            />
            <FormField
              label="Display Order (Sort)"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0 (lowest first)"
            />
          </div>

          {/* Featured on Home */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="featured-toggle"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded text-[#FFC21A] focus:ring-[#FFC21A]"
            />
            <label htmlFor="featured-toggle" className="text-xs font-bold text-gray-800 cursor-pointer">
              Show in Home Toppers (Board Toppers Carousel)
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
              disabled={loading || uploadingPhoto}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingTopper ? "Save Changes" : "Add Topper"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTopper)}
        onClose={() => setDeletingTopper(null)}
        onConfirm={handleDelete}
        title="Delete Board Topper?"
        message={`Are you sure you want to remove "${deletingTopper?.name}"? If a photo was stored on Cloudinary, it will be automatically cleaned up.`}
        confirmText="Delete Topper"
        isDestructive
        isLoading={loading}
      />
    </div>
  );
}
