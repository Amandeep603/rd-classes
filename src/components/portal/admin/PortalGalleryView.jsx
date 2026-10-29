"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
  AlertCircle,
  ImageIcon,
  Maximize2,
  X,
  Check,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/components/admin/ui/Toast";

// Helper: resize image to max 1600px width/height & convert to WebP blob
async function resizeImageToMax1600WebP(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Image compression failed"));
            resolve(blob);
          },
          "image/webp",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PortalGalleryView({ initialItems = [] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingItem, setDeletingItem] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [captionText, setCaptionText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      let processedCount = 0;

      for (const file of files) {
        if (!file.type.includes("image") && !file.name.match(/\.(png|webp|jpg|jpeg)$/i)) {
          continue;
        }
        const resizedBlob = await resizeImageToMax1600WebP(file);
        formData.append("files", resizedBlob, `${file.name.replace(/\.[^/.]+$/, "")}.webp`);
        processedCount++;
        setUploadProgress(Math.min(50, 15 + Math.round((processedCount / files.length) * 35)));
      }

      if (processedCount === 0) {
        throw new Error("No valid image files found.");
      }

      setUploadProgress(60);
      const uploadRes = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      // Save records in DB
      const saveRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData.uploaded),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Failed to save gallery records");

      setUploadProgress(100);
      setItems((prev) => [...(saveData.items || []), ...prev]);
      showToast(`${processedCount} image(s) processed and added to gallery`);
    } catch (err) {
      showToast(err.message || "Failed to upload gallery images", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const startEditCaption = (item) => {
    setEditingCaptionId(item._id);
    setCaptionText(item.caption || item.title || "");
  };

  const saveCaption = async (item) => {
    try {
      const res = await fetch(`/api/admin/gallery/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: captionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update caption");

      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, caption: captionText } : i))
      );
      setEditingCaptionId(null);
      showToast("Caption updated");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const moveItem = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    setItems(newItems);

    try {
      await fetch("/api/admin/gallery/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems.map((item, idx) => ({ _id: item._id, position: idx })),
        }),
      });
      showToast("Gallery order updated");
    } catch {
      showToast("Failed to sync reorder", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/admin/gallery/${deletingItem._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete image");

      setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
      showToast("Gallery item and Cloudinary file deleted");
      setDeletingItem(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Classroom & Events Gallery"
        subtitle="Upload photos, felicitations, classroom moments and seminars. Resized to 1600px WebP."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Gallery" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Images</span>
          </button>
        }
      />

      {/* Multi-Image Drag-and-Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-8 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? "border-[#FFC21A] bg-amber-50/50"
            : "border-gray-300 bg-white hover:border-[#FFC21A] hover:bg-gray-50/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3 shadow-2xs">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
            ) : (
              <ImageIcon className="h-7 w-7" />
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {uploading ? "Processing and Uploading Images..." : "Drag and drop multiple classroom photos here"}
          </h3>
          <p className="mt-1 text-xs text-gray-500 max-w-md">
            Auto-resized to max 1600px width/height and compressed to WebP on client before Cloudinary upload.
          </p>

          {uploading && uploadProgress > 0 && (
            <div className="mt-4 w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                <span>Optimizing & Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFC21A] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h4 className="text-base font-bold text-gray-800">No gallery images uploaded</h4>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            Upload celebration snapshots, student batches, and felicitation events. They appear on the Home gallery and /gallery page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item, index) => {
            const isEditing = editingCaptionId === item._id;
            return (
              <div
                key={item._id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs transition-all hover:shadow-md"
              >
                {/* Photo Preview Container */}
                <div
                  className="relative aspect-4/3 w-full bg-gray-100 cursor-pointer overflow-hidden"
                  onClick={() => setLightboxImage(item.imageUrl || item.image)}
                >
                  <Image
                    src={item.imageUrl || item.image}
                    alt={item.caption || "Gallery photo"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Zoom</span>
                    </span>
                  </div>
                </div>

                {/* Card Content & Caption */}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        placeholder="Add caption..."
                        className="flex-1 rounded-lg border border-black/15 px-2.5 py-1 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#FFC21A]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveCaption(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFC21A] text-neutral-900 hover:bg-[#E5AE17]"
                        title="Save caption"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCaptionId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-gray-600 hover:bg-gray-100"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-gray-800 line-clamp-2">
                        {item.caption || item.title || <span className="text-gray-400 italic font-normal">No caption set</span>}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEditCaption(item)}
                        className="text-gray-400 hover:text-black shrink-0 p-1"
                        title="Edit caption"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Order & Actions Row */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-gray-600 hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-gray-600 hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-gray-400 ml-1">
                        #{index + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete Image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Gallery enlarged"
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Gallery Photo?"
        message="Are you sure you want to remove this photo? It will also be permanently deleted from Cloudinary."
        confirmText="Delete Photo"
        isDestructive
      />
    </div>
  );
}
