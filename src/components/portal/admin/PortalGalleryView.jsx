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
  ImageIcon,
  Video,
  Play,
  Maximize2,
  X,
  Check,
  Eye,
  EyeOff,
  Film,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import { useToast } from "@/components/admin/ui/Toast";

// Helper to upload a single file directly from browser to Cloudinary with progress
function uploadFileDirectToCloudinary({ file, signData, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`;

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          reject(new Error("Invalid response format from Cloudinary."));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || `Cloudinary upload failed: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Upload failed with HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload to Cloudinary."));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("signature", signData.signature);
    formData.append("folder", signData.folder);

    xhr.send(formData);
  });
}

export default function PortalGalleryView({ initialItems = [] }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // Array of { id, name, size, type, progress, status, error }
  const [deletingItem, setDeletingItem] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [captionText, setCaptionText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);

    // Initialize individual upload progress tracking
    const queue = files.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
      isVideo: f.type.includes("video") || Boolean(f.name.match(/\.(mp4|mov|m4v|webm)$/i)),
      progress: 0,
      status: "pending", // "pending" | "uploading" | "done" | "error"
      file: f,
    }));
    setUploadFiles(queue);

    try {
      // 1. Get signed credentials from server
      const signRes = await fetch("/api/admin/gallery/sign-upload", { method: "POST" });
      const signData = await signRes.json();
      if (!signRes.ok || !signData.signature) {
        throw new Error(signData.error || "Failed to obtain upload authorization.");
      }

      const uploadedRecords = [];

      // 2. Upload each file directly to Cloudinary
      for (const item of queue) {
        setUploadFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q))
        );

        try {
          const res = await uploadFileDirectToCloudinary({
            file: item.file,
            signData,
            onProgress: (percent) => {
              setUploadFiles((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
              );
            },
          });

          const isVideo =
            res.resource_type === "video" || item.isVideo;

          // Poster URL for video
          let posterUrl = "";
          let finalUrl = res.secure_url || res.url;

          if (isVideo) {
            // Generate poster frame URL by replacing video extension with .jpg
            posterUrl = finalUrl.replace(/\.[^/.]+$/, ".jpg");
          } else {
            // Ensure format auto-optimization for delivery (HEIC/JPEG/PNG/WebP)
            if (finalUrl.includes("/upload/")) {
              finalUrl = finalUrl.replace(/\/upload\//, "/upload/f_auto,q_auto/");
            }
          }

          uploadedRecords.push({
            type: isVideo ? "video" : "image",
            url: finalUrl,
            imageUrl: finalUrl,
            posterUrl,
            publicId: res.public_id,
            width: res.width || 0,
            height: res.height || 0,
            caption: item.name.replace(/\.[^/.]+$/, ""),
            showOnHome: true,
          });

          setUploadFiles((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100 } : q))
          );
        } catch (fileErr) {
          setUploadFiles((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "error", error: fileErr.message } : q
            )
          );
        }
      }

      if (uploadedRecords.length === 0) {
        throw new Error("No files were successfully uploaded.");
      }

      // 3. Save records in DB
      const saveRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadedRecords),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Failed to save records in database");

      const newDocs = saveData.items || [];
      setItems((prev) => [...newDocs, ...prev]);
      showToast(`${newDocs.length} item(s) successfully uploaded to gallery!`);
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
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

  const toggleShowOnHome = async (item) => {
    const nextVal = item.showOnHome === false ? true : false;
    try {
      const res = await fetch(`/api/admin/gallery/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update visibility");

      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, showOnHome: nextVal } : i))
      );
      showToast(nextVal ? "Visible on Home Page" : "Hidden from Home Page");
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
      if (!res.ok) throw new Error(data.error || "Failed to delete item");

      setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
      showToast("Item deleted from gallery and Cloudinary");
      setDeletingItem(null);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Classroom & Events Gallery"
        subtitle="Upload photos & videos directly to Cloudinary. Supports iPhone HEIC, MP4, MOV, and high-res photos."
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
            <span>Upload Media</span>
          </button>
        }
      />

      {/* Multi-File Drag-and-Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? "border-[#FFC21A] bg-amber-50/50"
            : "border-gray-300 bg-white hover:border-[#FFC21A] hover:bg-gray-50/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,video/*,.mp4,.mov,.m4v,.webm"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3 shadow-2xs">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {uploading ? "Uploading files to Cloudinary..." : "Drag and drop photos & videos here"}
          </h3>
          <p className="mt-1 text-xs text-gray-500 max-w-md">
            Direct browser-to-Cloudinary upload bypassing Vercel body limits. Supports multiple files, MP4, MOV, HEIC, PNG, JPG.
          </p>
        </div>
      </div>

      {/* Individual Upload Progress Bars */}
      {uploadFiles.length > 0 && uploading && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Upload Progress ({uploadFiles.filter((f) => f.status === "done").length} / {uploadFiles.length})
          </h4>
          <div className="space-y-2.5">
            {uploadFiles.map((f) => (
              <div key={f.id} className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {f.isVideo ? (
                      <Video className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="font-semibold text-gray-800 truncate">{f.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-mono">({f.size})</span>
                  </div>
                  <div className="shrink-0 font-bold text-[11px]">
                    {f.status === "error" ? (
                      <span className="text-red-600">Failed</span>
                    ) : f.status === "done" ? (
                      <span className="text-emerald-600">Complete</span>
                    ) : (
                      <span className="text-amber-700">{f.progress}%</span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      f.status === "error"
                        ? "bg-red-500"
                        : f.status === "done"
                        ? "bg-emerald-500"
                        : "bg-[#FFC21A]"
                    }`}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h4 className="text-base font-bold text-gray-800">No gallery media uploaded</h4>
          <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
            Upload celebration snapshots, classroom moments, seminars or short videos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item, index) => {
            const isEditing = editingCaptionId === item._id;
            const isVideo =
              item.type === "video" ||
              Boolean((item.url || item.imageUrl)?.match(/\.(mp4|mov|m4v|webm)$/i));
            const thumbSrc =
              item.posterUrl ||
              item.imageUrl ||
              item.image ||
              item.url ||
              (isVideo && item.url ? item.url.replace(/\.[^/.]+$/, ".jpg") : item.url);

            return (
              <div
                key={item._id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xs transition-all hover:shadow-md"
              >
                {/* Media Preview Container */}
                <div
                  className="relative aspect-4/3 w-full bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => setLightboxItem(item)}
                >
                  {thumbSrc ? (
                    <Image
                      src={thumbSrc}
                      alt={item.caption || "Gallery item"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Video Badge & Play Icon */}
                  {isVideo && (
                    <>
                      <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-xs border border-white/20">
                        <Video className="w-3 h-3 text-[#FFC21A]" />
                        <span>VIDEO</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs">
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>{isVideo ? "Play Video" : "View Photo"}</span>
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
                        {item.caption || item.title || (
                          <span className="text-gray-400 italic font-normal">No caption set</span>
                        )}
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

                  {/* Show on Home Toggle */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleShowOnHome(item)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                        item.showOnHome !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                      }`}
                      title="Click to toggle Home visibility"
                    >
                      {item.showOnHome !== false ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Home: Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-gray-400" />
                          <span>Home: Hidden</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Order & Delete Row */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
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
                      title="Delete Item"
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

      {/* Lightbox / Video Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxItem(null)}
            className="absolute top-5 right-5 z-50 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxItem.type === "video" ||
            Boolean((lightboxItem.url || lightboxItem.imageUrl)?.match(/\.(mp4|mov|m4v|webm)$/i)) ? (
              <video
                controls
                autoPlay
                playsInline
                poster={lightboxItem.posterUrl}
                src={lightboxItem.url || lightboxItem.imageUrl}
                className="max-h-[80vh] max-w-[85vw] rounded-2xl shadow-2xl bg-black outline-none"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxItem.url || lightboxItem.imageUrl || lightboxItem.image}
                alt={lightboxItem.caption || "Gallery enlarged"}
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-2xl"
              />
            )}
            {lightboxItem.caption && (
              <p className="mt-3 text-sm text-white/90 bg-black/60 px-4 py-1.5 rounded-full">
                {lightboxItem.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Delete Gallery Item?"
        message="Are you sure you want to remove this item? It will be permanently removed from Cloudinary and the database."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
