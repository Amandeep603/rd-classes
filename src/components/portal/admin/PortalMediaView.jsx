"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  FileText,
  Search,
  Copy,
  Check,
  Archive,
  RotateCcw,
  Trash2,
  Upload,
  AlertTriangle,
  X,
} from "lucide-react";
import FileUploader from "@/components/admin/FileUploader";
import {
  archiveAssetAction,
  restoreAssetAction,
  deleteAssetPermanentlyAction,
} from "@/server/actions/admin.media.actions.js";

export default function PortalMediaView({ initialData, currentFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState(null);
  const [deleteModalAsset, setDeleteModalAsset] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadKind, setUploadKind] = useState("image");

  const { assets, total, totalPages, page } = initialData;

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    const merged = { ...currentFilters, ...newFilters };
    if (merged.kind && merged.kind !== "all") params.set("kind", merged.kind);
    if (merged.search) params.set("q", merged.search);
    if (merged.showArchived) params.set("archived", "true");
    if (merged.page && merged.page > 1) params.set("page", merged.page.toString());

    startTransition(() => {
      router.push(`/admin/media?${params.toString()}`);
    });
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArchive = async (id) => {
    await archiveAssetAction(id);
    router.refresh();
  };

  const handleRestore = async (id) => {
    await restoreAssetAction(id);
    router.refresh();
  };

  const handleDeletePermanent = async () => {
    if (!deleteModalAsset) return;
    setDeleteError("");
    const res = await deleteAssetPermanentlyAction(deleteModalAsset._id, deleteConfirmInput);
    if (!res.success) {
      setDeleteError(res.error);
    } else {
      setDeleteModalAsset(null);
      setDeleteConfirmInput("");
      router.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#FFB800]" />
            <span>Media Library</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Immutable storage repository for images, photos, and result PDFs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF9000] text-black font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-[#FFB800]/10"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[#0C1222] border border-white/10">
        <div className="flex items-center gap-2">
          {["all", "image", "pdf"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => updateFilters({ kind: k, page: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                (currentFilters.kind || "all") === k
                  ? "bg-[#FFB800] text-black"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {k === "all" ? "All Media" : `${k}s`}
            </button>
          ))}

          <button
            type="button"
            onClick={() => updateFilters({ showArchived: !currentFilters.showArchived, page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentFilters.showArchived
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            {currentFilters.showArchived ? "Showing Archived" : "Show Archived"}
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search filenames..."
            defaultValue={currentFilters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ search: e.target.value, page: 1 });
              }
            }}
            className="pl-9 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB800] w-full sm:w-60"
          />
        </div>
      </div>

      {/* Grid of Media Assets */}
      {assets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#0C1222]">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No media assets found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Upload images or PDFs to populate the media library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="group relative rounded-xl border border-white/10 bg-[#0C1222] overflow-hidden flex flex-col justify-between transition-all hover:border-white/20"
            >
              {/* Asset Media Preview */}
              <div className="relative aspect-square w-full bg-black/40 flex items-center justify-center overflow-hidden">
                {asset.kind === "image" ? (
                  <Image
                    src={asset.url}
                    alt={asset.originalName || "Media thumbnail"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-red-400">
                    <FileText className="w-10 h-10 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                  </div>
                )}

                {/* Usage pill top-right */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/70 text-white backdrop-blur-sm border border-white/10">
                  {asset.usageCount > 0 ? `${asset.usageCount} in use` : "Unused"}
                </div>
              </div>

              {/* Information & Action Footer */}
              <div className="p-2.5 space-y-1.5 border-t border-white/10">
                <p className="text-xs font-medium text-white truncate" title={asset.originalName}>
                  {asset.originalName || "Untitled"}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{(asset.size / 1024).toFixed(0)} KB</span>
                  <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleCopy(asset.url, asset._id)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/5"
                    title="Copy URL"
                  >
                    {copiedId === asset._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {asset.archivedAt ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(asset._id)}
                        className="p-1 text-amber-400 hover:text-amber-300 rounded hover:bg-white/5"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleArchive(asset._id)}
                        className="p-1 text-gray-400 hover:text-amber-400 rounded hover:bg-white/5"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={asset.usageCount > 0}
                      onClick={() => {
                        setDeleteModalAsset(asset);
                        setDeleteConfirmInput("");
                        setDeleteError("");
                      }}
                      className={`p-1 rounded ${
                        asset.usageCount > 0
                          ? "opacity-30 cursor-not-allowed text-gray-600"
                          : "text-gray-400 hover:text-red-400 hover:bg-white/5"
                      }`}
                      title={
                        asset.usageCount > 0
                          ? `Cannot delete: referenced in ${asset.usageCount} place(s)`
                          : "Permanently delete"
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateFilters({ page: page - 1 })}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => updateFilters({ page: page + 1 })}
            className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0E1526] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#FFB800]" />
                <span>Upload New Media Asset</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setUploadKind("image")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  uploadKind === "image"
                    ? "bg-[#FFB800] text-black"
                    : "bg-white/5 text-gray-300"
                }`}
              >
                Image (JPEG, PNG, WebP)
              </button>
              <button
                type="button"
                onClick={() => setUploadKind("pdf")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  uploadKind === "pdf"
                    ? "bg-[#FFB800] text-black"
                    : "bg-white/5 text-gray-300"
                }`}
              >
                PDF Document
              </button>
            </div>

            <FileUploader
              kind={uploadKind}
              maxSizeMB={uploadKind === "pdf" ? 50 : 10}
              onChange={(asset) => {
                if (asset) {
                  setShowUploadModal(false);
                  router.refresh();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0E1526] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Permanently Delete Asset?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              This action <span className="text-red-400 font-semibold">cannot be undone</span>. The file
              will be permanently removed from storage and cannot be recovered.
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs">
              <p className="text-gray-400">File:</p>
              <p className="text-white font-medium truncate">{deleteModalAsset.originalName}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Type <span className="text-white font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-red-400"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-400">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalAsset(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmInput !== "DELETE"}
                onClick={handleDeletePermanent}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
