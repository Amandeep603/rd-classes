import Link from "next/link";
import { FileText, Eye, Download, ArrowRight } from "lucide-react";

export default function RecentNotesCard({ notes = [] }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="flex h-[281px] flex-col items-center justify-center rounded-[22px] border border-black/5 bg-white p-6 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">
          No Handouts Uploaded Yet
        </h3>
        <p className="mt-1 max-w-xs text-xs text-[#6B7280]">
          Formula sheets and chapter revision notes will appear here once published by Sir.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[281px] flex-col justify-between rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#111827]">
            Recently Uploaded Notes
          </h3>
        </div>

        <Link
          href="/student/notes"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
        >
          <span>All Notes</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5 my-auto">
        {notes.slice(0, 3).map((note, idx) => (
          <div
            key={note._id || idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-black/4 bg-neutral-50/70 p-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#111827] truncate">
                  {note.title}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  {note.section || "Chapter Handout"} • {note.size || "2.4 MB"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {note.source === "link" || note.externalUrl ? (
                <a
                  href={note.externalUrl || note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-black/8 px-2.5 py-1 text-xs font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs"
                >
                  <Eye className="h-3 w-3" />
                  <span>Open</span>
                </a>
              ) : (
                <>
                  <a
                    href={`/api/notes/${note._id}/stream`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-black/8 px-2.5 py-1 text-xs font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </a>
                  <a
                    href={`/api/notes/${note._id}/stream?download=1`}
                    download
                    aria-label="Download note"
                    className="rounded-lg bg-white border border-black/8 p-1 text-[#4B5563] hover:text-[#111827] shadow-2xs inline-flex items-center justify-center"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
