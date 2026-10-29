"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Plus,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import Modal from "@/components/admin/ui/Modal";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import FormField from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PortalResultPdfsView({ initialResults = [] }) {
  const { showToast } = useToast();
  const [results, setResults] = useState(initialResults);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingResult, setDeletingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [title, setTitle] = useState("");
  const [classLabel, setClassLabel] = useState("Class 12");
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [selectedFile, setSelectedFile] = useState(null);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setTitle("");
    setClassLabel("Class 12");
    setYear(new Date().getFullYear().toString());
    setSelectedFile(null);
    setFormError("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setFormError("Only PDF documents are allowed.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFormError("File size exceeds 10 MB (Cloudinary free plan limit).");
      setSelectedFile(null);
      return;
    }

    setFormError("");
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setFormError("Title is required.");
    if (!selectedFile) return setFormError("Please select a PDF file.");

    setLoading(true);
    setFormError("");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title.trim());
      formData.append("classLabel", classLabel.trim());
      formData.append("year", year.trim());

      setUploadProgress(50);
      const res = await fetch("/api/admin/result-pdfs", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload result PDF");

      setUploadProgress(100);
      setResults((prev) => [data.result, ...prev]);
      showToast("Result PDF uploaded to Cloudinary successfully");
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deletingResult) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/result-pdfs/${deletingResult._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setResults((prev) => prev.filter((r) => r._id !== deletingResult._id));
      showToast("Result PDF removed and deleted from Cloudinary");
      setDeletingResult(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Result Document",
      field: "title",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shadow-2xs">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-[#111827]">{row.title}</div>
            <div className="text-xs text-[#6B7280]">
              {row.classLabel || "Class 12"} • {row.year || row.examYear}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Size",
      field: "sizeBytes",
      render: (row) => (
        <span className="text-xs font-semibold text-gray-600">
          {formatBytes(row.sizeBytes || row.fileSize)}
        </span>
      ),
    },
    {
      header: "Uploaded",
      field: "createdAt",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      field: "_id",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.fileUrl && (
            <a
              href={row.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-black/5 hover:text-black transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setDeletingResult(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete PDF"
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
        title="Result PDFs"
        subtitle="Upload official CBSE board merit sheets, distinction lists, and score summary sheets."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Result PDFs" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-4 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Result PDF</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={results}
        searchPlaceholder="Search result sheets by title, class or year..."
        emptyTitle="No result PDFs uploaded"
        emptyDescription="Upload board results and merit lists in PDF format (up to 10 MB). They will appear publicly on the /results page."
      />

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Result PDF"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* PDF File Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-neutral-800">
                PDF Document (Max 10 MB)
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Cloudinary Free Limit: 10 MB
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#FFC21A] hover:bg-amber-50/20 transition-all text-center"
            >
              <FileText className="h-10 w-10 text-red-500 mb-2" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[280px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatBytes(selectedFile.size)}
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-bold text-[#1593C9] hover:underline">
                    Click to change file
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-800">
                    Click to select PDF file
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    PDF only, max 10 MB. Public delivery.
                  </p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <FormField
            label="Document Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CBSE Class 12 Accountancy Board Results 2025"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1.5">Class</label>
              <select
                value={classLabel}
                onChange={(e) => setClassLabel(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A]"
              >
                <option value="Class 12">Class 12</option>
                <option value="Class 11">Class 11</option>
                <option value="Combined">Combined</option>
              </select>
            </div>

            <FormField
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025"
              required
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                <span>Uploading to Cloudinary...</span>
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
              disabled={loading || !selectedFile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#E5AE17] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Uploading..." : "Upload PDF"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingResult)}
        onClose={() => setDeletingResult(null)}
        onConfirm={handleDelete}
        title="Delete Result PDF?"
        message={`Are you sure you want to delete "${deletingResult?.title}"? The PDF file will also be permanently deleted from Cloudinary.`}
        confirmText="Delete PDF"
        isDestructive
        isLoading={loading}
      />
    </div>
  );
}
