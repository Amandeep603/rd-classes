"use client";

import { useState } from "react";
import { Link2, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { parseVimeoUrl } from "@/lib/utils/vimeoParser";

export default function BulkPasteVimeoModal({
  isOpen,
  onClose,
  chapter,
  lectures = [],
  onSuccess,
}) {
  const [linksText, setLinksText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !chapter) return null;

  const chapterLectures = lectures.filter((l) => {
    const cId = l.chapterId?._id?.toString() || l.chapterId?.toString();
    return cId === chapter._id.toString();
  });

  const parsedLines = linksText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      const parsed = parseVimeoUrl(line);
      return { raw: line, ...parsed };
    });

  const handleApply = async () => {
    if (parsedLines.length === 0) {
      setErrorMsg("Please paste at least one Vimeo link or embed code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const updates = [];
      for (let i = 0; i < parsedLines.length && i < chapterLectures.length; i++) {
        const item = parsedLines[i];
        const lec = chapterLectures[i];
        if (item.isValid && item.vimeoId) {
          updates.push({
            id: lec._id,
            vimeoId: item.vimeoId,
            vimeoHash: item.vimeoHash || "",
            videoUrl: item.raw,
          });
        }
      }

      if (updates.length === 0) {
        throw new Error("No valid Vimeo links found in the pasted text.");
      }

      // Execute updates
      for (const u of updates) {
        await fetch(`/api/admin/lectures/${u.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vimeoId: u.vimeoId,
            vimeoHash: u.vimeoHash,
            videoUrl: u.videoUrl,
            status: "published",
          }),
        });
      }

      if (onSuccess) {
        onSuccess(updates.length);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to update lectures");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] bg-[#FAFCFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2A4A]">Bulk Paste Vimeo Links</h3>
              <p className="text-xs text-[#64748B]">
                Chapter: <span className="font-semibold text-[#0B2A4A]">{chapter.title}</span> ({chapterLectures.length} lectures)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">
              Paste one Vimeo link or embed code per line:
            </label>
            <textarea
              rows={8}
              value={linksText}
              onChange={(e) => {
                setLinksText(e.target.value);
                setErrorMsg("");
              }}
              placeholder={`https://vimeo.com/1040854407/59f81bc26c\nhttps://player.vimeo.com/video/1157301569?h=8ade1b94c8\n<iframe src="https://player.vimeo.com/video/1157302265"...>`}
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          {parsedLines.length > 0 && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0B2A4A]">
                <span>Parsed {parsedLines.length} links:</span>
                <span className="text-gray-500">
                  Matches first {Math.min(parsedLines.length, chapterLectures.length)} of {chapterLectures.length} lectures
                </span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {parsedLines.map((item, idx) => {
                  const targetLec = chapterLectures[idx];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white border border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono text-gray-400 w-5">#{idx + 1}</span>
                        <span className="font-medium text-[#1E293B] truncate max-w-[180px]">
                          {targetLec ? targetLec.title : "(Extra link - ignored)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {item.vimeoId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-mono text-[10px] bg-rose-50 px-1.5 py-0.5 rounded">
                            Invalid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F1F5F9] bg-[#FAFCFF]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || parsedLines.length === 0}
            className="px-5 py-2 rounded-xl bg-[#0B2A4A] hover:bg-[#15345E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Assign Links in Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

