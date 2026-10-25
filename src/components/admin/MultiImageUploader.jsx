"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { uploadClientFile } from "@/utils/clientUploader";

export default function MultiImageUploader({
  onUploadBatchComplete = () => {},
  className = "",
  label = "Upload Images",
  description = "Select or drop multiple images (PNG, JPG, WebP)",
  maxSizeMB = 10,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState([]); // { id, file, progress, error, asset, status: 'pending'|'uploading'|'done'|'error' }
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const newItems = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      progress: 0,
      error: null,
      asset: null,
      status: "pending",
    }));

    setItems((prev) => [...prev, ...newItems]);
    setIsUploading(true);

    const completedAssets = [];

    // Process files with independent progress
    for (const item of newItems) {
      // Validate
      if (!item.file.type.startsWith("image/")) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: "Only image files allowed." }
              : i
          )
        );
        continue;
      }
      if (item.file.size > maxSizeMB * 1024 * 1024) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: `Exceeds ${maxSizeMB}MB` }
              : i
          )
        );
        continue;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i))
      );

      try {
        const asset = await uploadClientFile(item.file, {
          kind: "image",
          onProgress: (percent) => {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
            );
          },
        });

        completedAssets.push(asset);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "done", progress: 100, asset }
              : i
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: err?.message || "Failed" }
              : i
          )
        );
      }
    }

    setIsUploading(false);
    if (completedAssets.length > 0) {
      onUploadBatchComplete(completedAssets);
    }
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[#FFB800] bg-[#FFB800]/5"
            : "border-white/15 hover:border-white/30 bg-[#0C1222]/60"
        }`}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
            <Upload className="w-5 h-5 text-[#FFB800]" />
          </div>
          <p className="text-sm font-medium text-white">
            Drag & drop multiple images or <span className="text-[#FFB800]">browse</span>
          </p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>

      {/* Upload Items List with Progress */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-[#0C1222] text-xs gap-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.asset ? (
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-black/40">
                    <Image
                      src={item.asset.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Upload className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-gray-200 font-medium">{item.name}</p>
                  {item.status === "uploading" && (
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-[#FFB800] h-full transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.status === "error" && (
                    <p className="text-red-400 text-[11px] truncate">{item.error}</p>
                  )}
                  {item.status === "done" && (
                    <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
