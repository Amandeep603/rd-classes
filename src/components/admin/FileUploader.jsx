"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, RotateCcw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { uploadClientFile } from "@/utils/clientUploader";

export default function FileUploader({
  kind = "image",
  value = null, // asset or url
  onChange = () => {},
  className = "",
  label = "Upload file",
  description = "",
  maxSizeMB = 10,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [hasFailedFile, setHasFailedFile] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(value);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);
  const lastFileRef = useRef(null);

  const accept =
    kind === "pdf"
      ? "application/pdf"
      : "image/jpeg,image/png,image/webp,image/avif";

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    lastFileRef.current = file;

    // Validate size client-side
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File exceeds maximum size of ${maxSizeMB}MB.`);
      return;
    }

    // Validate type client-side
    if (kind === "pdf" && file.type !== "application/pdf") {
      setError("Only PDF documents are allowed.");
      return;
    }
    if (kind === "image" && !file.type.startsWith("image/")) {
      setError("Only JPEG, PNG, WebP, and AVIF images are allowed.");
      return;
    }

    setUploading(true);
    setProgress(0);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const asset = await uploadClientFile(file, {
        kind,
        onProgress: (p) => setProgress(p),
        abortSignal: controller.signal,
      });

      setCurrentAsset(asset);
      onChange(asset);
      setError("");
      setHasFailedFile(false);
    } catch (err) {
      setHasFailedFile(true);
      if (err.name === "AbortError" || err.message?.includes("cancelled")) {
        setError("Upload cancelled.");
      } else {
        setError(err.message || "Upload failed. Please retry.");
      }
    } finally {
      setUploading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetry = () => {
    if (lastFileRef.current) {
      handleFile(lastFileRef.current);
    }
  };

  const handleRemove = () => {
    setCurrentAsset(null);
    setError("");
    setHasFailedFile(false);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Preview if file already selected/uploaded */}
      {currentAsset && !uploading && (
        <div className="relative rounded-xl border border-white/10 bg-[#0C1222] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {kind === "image" ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                <Image
                  src={currentAsset.url || currentAsset}
                  alt={currentAsset.originalName || "Uploaded preview"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentAsset.originalName || "Uploaded File"}
              </p>
              {currentAsset.size && (
                <p className="text-xs text-gray-400">
                  {(currentAsset.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
            title="Remove file"
            aria-label="Remove uploaded file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      {(!currentAsset || uploading) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!uploading && e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => {
            if (!uploading && inputRef.current) {
              inputRef.current.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-[#FFB800] bg-[#FFB800]/5"
              : "border-white/15 hover:border-white/30 bg-[#0C1222]/60"
          } ${uploading ? "cursor-not-allowed opacity-90" : ""}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                <span>Optimizing & Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FFB800] to-[#FF9000] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
                <Upload className="w-5 h-5 text-[#FFB800]" />
              </div>
              <p className="text-sm font-medium text-white">
                Drag and drop or <span className="text-[#FFB800]">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                {description ||
                  (kind === "pdf"
                    ? "PDF document up to 50MB"
                    : "PNG, JPG, WebP up to 10MB (optimized automatically)")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error state with retry */}
      {error && (
        <div className="flex items-center justify-between gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {hasFailedFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 font-semibold text-red-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
