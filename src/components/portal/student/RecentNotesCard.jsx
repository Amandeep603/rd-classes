import Link from "next/link";
import { FileText, Eye, Download, ArrowRight } from "lucide-react";

const CHIP_STYLES = [
  { bg: "bg-[#FFF6DA]", text: "text-[#D97706]" },
  { bg: "bg-[#EAF4FD]", text: "text-[#0284C7]" },
  { bg: "bg-[#FDEBDD]", text: "text-[#C2410C]" },
];

export default function RecentNotesCard({ notes = [] }) {
  const hasNotes = Boolean(notes && notes.length > 0);

  return (
    <div className="relative flex min-h-[240px] h-full flex-col justify-between rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-sm select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#EAF4FD] text-[#0284C7] shrink-0">
            <FileText className="h-5 w-5 text-[#0284C7]" />
          </div>
          <h3 className="text-[20px] font-bold text-[#1F2A44]">
            Recently Uploaded Notes
          </h3>
        </div>

        <Link
          href="/student/notes"
          className="inline-flex items-center gap-1 text-[15px] font-bold text-[#B7791F] hover:text-[#92400E] transition-colors"
        >
          <span>All Notes</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Up to 3 Note Rows (height 64px each) */}
      <div className="space-y-2.5 my-auto py-2">
        {hasNotes ? (
          notes.slice(0, 3).map((note, idx) => {
            const chip = CHIP_STYLES[idx % CHIP_STYLES.length];
            const bookTag = note.book || note.section || "Book 1";
            const viewUrl =
              note.viewUrl ||
              (note.source === "link" && note.externalUrl
                ? note.externalUrl
                : `/api/notes/${note._id}/stream`);
            const downloadUrl =
              note.downloadUrl ||
              (note.source === "link" && note.externalUrl
                ? note.externalUrl
                : `/api/notes/${note._id}/stream?download=1`);

            return (
              <div
                key={note._id || idx}
                className="flex h-[64px] items-center justify-between gap-3 rounded-[14px] border border-[#F0F2F6] bg-[#FBFBFD] px-4 py-2 hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-[40px] w-[40px] items-center justify-center rounded-[10px] shrink-0 ${chip.bg} ${chip.text}`}
                  >
                    <FileText className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-[#F1F4F8] px-2 py-0.5 text-[11px] font-semibold text-[#475467] shrink-0">
                        {bookTag}
                      </span>
                      <span className="text-[15px] font-semibold text-[#1F2A44] truncate">
                        {note.title}
                      </span>
                    </div>
                    <div className="text-[13px] text-[#8A94A6] mt-0.5">
                      {note.size || "PDF Document"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-full bg-[#FFC93C] hover:bg-[#F7BF2E] text-[14px] font-bold text-[#1F2A44] shadow-2xs transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </a>
                  <a
                    href={downloadUrl}
                    download
                    aria-label={`Download ${note.title}`}
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-white border border-[#E8ECF2] text-[#4B5563] hover:text-[#1F2A44] hover:bg-neutral-50 shadow-2xs transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          /* Graceful 3-row filled layout for empty state */
          <>
            <div className="flex h-[64px] items-center justify-between gap-3 rounded-[14px] border border-[#F0F2F6] bg-[#FBFBFD] px-4 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] shrink-0 bg-[#FFF6DA] text-[#D97706]">
                  <FileText className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#F1F4F8] px-2 py-0.5 text-[11px] font-semibold text-[#475467] shrink-0">
                      Book 1
                    </span>
                    <span className="text-[14px] font-semibold text-[#1F2A44] truncate">
                      Notes will appear here once uploaded
                    </span>
                  </div>
                  <div className="text-[12px] text-[#8A94A6] mt-0.5">
                    PDFs and formula sheets
                  </div>
                </div>
              </div>

              <Link
                href="/student/notes"
                className="inline-flex items-center gap-1 h-[36px] px-3.5 rounded-full bg-[#FFC93C] hover:bg-[#F7BF2E] text-[13px] font-bold text-[#1F2A44] shadow-2xs shrink-0 transition-colors"
              >
                <span>View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex h-[64px] items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#E5E7EB] bg-[#FDFDFE] px-4 py-2 opacity-85">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] shrink-0 bg-[#EAF4FD] text-[#0284C7]">
                  <FileText className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#F1F4F8] px-2 py-0.5 text-[11px] font-semibold text-[#475467] shrink-0">
                      Book 2
                    </span>
                    <span className="text-[14px] font-medium text-[#5B6577] truncate">
                      Upcoming chapter summaries & practice sheets
                    </span>
                  </div>
                  <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                    Uploaded with lecture releases
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-[64px] items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#E5E7EB] bg-[#FDFDFE] px-4 py-2 opacity-70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] shrink-0 bg-[#FDEBDD] text-[#C2410C]">
                  <FileText className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#F1F4F8] px-2 py-0.5 text-[11px] font-semibold text-[#475467] shrink-0">
                      Revision
                    </span>
                    <span className="text-[14px] font-medium text-[#5B6577] truncate">
                      Important adjustments revision notes
                    </span>
                  </div>
                  <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                    Handouts and reference charts
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
