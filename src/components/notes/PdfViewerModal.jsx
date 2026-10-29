"use client";

import { useEffect } from "react";
import { X, Download, ExternalLink, FileText } from "lucide-react";

export default function PdfViewerModal({ note, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!note) return null;

  const streamUrl = `/api/notes/${note._id}/stream`;
  const downloadUrl = `/api/notes/${note._id}/stream?download=1`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#CBD5E1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#0B1B3D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="pdf-viewer-title" className="text-sm font-bold truncate text-white">
                {note.title}
              </h3>
              <p className="text-[11px] text-[#94A3B8] truncate">
                {note.courses?.[0]?.title || "Study Material"}
                {note.book ? ` · ${note.book}` : ""}
                {note.chapter ? ` · ${note.chapter}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download Link */}
            <a
              href={downloadUrl}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Open in New Window */}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close PDF viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 w-full bg-[#525659] relative">
          <iframe
            src={streamUrl}
            title={note.title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

