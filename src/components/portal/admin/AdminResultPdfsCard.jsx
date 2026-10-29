"use client";

import Link from "next/link";
import { FileText, ArrowRight, Download, Upload } from "lucide-react";

export default function AdminResultPdfsCard({ pdfs = [], error = null }) {
  if (error) {
    return (
      <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-rose-200">
        <div className="flex items-center gap-2.5 text-rose-600 mb-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-base font-extrabold">Result PDFs</h2>
        </div>
        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          {error}
        </p>
      </div>
    );
  }
  const formatSize = (bytes) => {
    if (!bytes) return "PDF";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-[22px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FileText className="h-5 w-5" />
          </div>
          <h2 className="text-base font-extrabold text-[#111827]">
            Result PDFs
          </h2>
        </div>
        <Link
          href="/admin/results"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
        >
          <span>Upload</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List or Empty State */}
      {pdfs.length > 0 ? (
        <div className="divide-y divide-black/5">
          {pdfs.map((pdf) => (
            <div
              key={pdf._id || pdf.title}
              className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#111827] truncate">
                    {pdf.title}
                  </div>
                  <div className="text-xs text-[#6B7280] truncate">
                    {pdf.sizeBytes ? `${formatSize(pdf.sizeBytes)} • ` : ""}
                    {pdf.createdAt ? `Uploaded on ${formatDate(pdf.createdAt)}` : `Year ${pdf.year || 2025}`}
                  </div>
                </div>
              </div>

              {pdf.fileUrl && (
                <a
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 ml-3 flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-[#4B5563] hover:bg-black/5 hover:text-[#111827] transition-colors"
                  aria-label={`Download ${pdf.title}`}
                  title="View / Download PDF"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-[#FBF8F1]/50 p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-sky-500/60 mb-2" />
          <p className="text-xs font-bold text-[#374151]">No result PDFs uploaded yet</p>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            Upload board merit lists and semester marksheets for public and student viewing.
          </p>
          <Link
            href="/admin/results"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#111827] shadow-2xs hover:bg-[#FBF8F1] transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-sky-600" />
            <span>Upload PDF</span>
          </Link>
        </div>
      )}
    </div>
  );
}
