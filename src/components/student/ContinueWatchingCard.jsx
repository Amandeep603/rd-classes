import Link from "next/link";
import { PlayCircle, Clock } from "lucide-react";

export default function ContinueWatchingCard({ item }) {
  if (!item) return null;

  const formatSeconds = (sec) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const percent =
    item.durationSec > 0
      ? Math.min(100, Math.round((item.positionSec / item.durationSec) * 100))
      : 0;

  return (
    <div className="bg-gradient-to-r from-[#17171C] via-[#1A1A21] to-[#141418] border border-amber-900/30 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 flex items-center justify-center shrink-0 text-[#FFB800]">
          <PlayCircle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded">
            Continue Watching
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white mt-1 line-clamp-1">
            {item.lectureTitle}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            <span>{item.courseTitle}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              {formatSeconds(item.positionSec)} / {formatSeconds(item.durationSec)} ({percent}%)
            </span>
          </p>
        </div>
      </div>

      <Link
        href={`/student/courses/${item.courseSlug}/lectures/${item.lectureId}`}
        className="shrink-0 px-4 py-2.5 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
      >
        <span>Resume Lecture</span>
        <PlayCircle className="w-4 h-4" />
      </Link>
    </div>
  );
}
