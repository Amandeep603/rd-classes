import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  BookOpen,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default function UpcomingTestCard({ test }) {
  if (!test) {
    return (
      <div className="flex h-[281px] flex-col items-center justify-center rounded-[22px] border border-black/5 bg-white p-6 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">
          No Upcoming Tests Scheduled
        </h3>
        <p className="mt-1 max-w-xs text-xs text-[#6B7280]">
          Sir announces Sunday mock tests in advance. Check back for the next schedule.
        </p>
      </div>
    );
  }

  const startDate = new Date(test.startsAt);
  const monthStr = startDate
    .toLocaleDateString("en-IN", {
      month: "short",
      timeZone: "Asia/Kolkata",
    })
    .toUpperCase();
  const dayStr = startDate.toLocaleDateString("en-IN", {
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const weekdayStr = startDate.toLocaleDateString("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  });

  const timeStr = startDate.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const durationHours = Math.round((test.durationMin || 180) / 60);

  return (
    <div className="relative flex h-[281px] flex-col justify-between rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#111827]">
            Upcoming Test
          </h3>
        </div>

        <span className="rounded-full bg-[#FFE8A3] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#78350F]">
          {test.kind || "SUNDAY MOCK"}
        </span>
      </div>

      {/* Body: Date tile + Test details */}
      <div className="flex items-center gap-5 my-auto">
        {/* Date Tile */}
        <div className="flex h-[110px] w-[88px] flex-col items-center justify-center rounded-2xl border border-black/8 bg-neutral-50/80 p-2 shadow-2xs shrink-0 text-center">
          <span className="text-[11px] font-extrabold tracking-wider text-[#6B7280]">
            {monthStr}
          </span>
          <span className="text-3xl font-black text-[#111827] leading-tight">
            {dayStr}
          </span>
          <span className="text-xs font-semibold text-[#6B7280]">
            {weekdayStr}
          </span>
        </div>

        {/* Test metadata */}
        <div className="space-y-2 min-w-0 flex-1">
          <h4 className="text-[15.5px] font-extrabold text-[#111827] truncate">
            {test.title}
          </h4>

          <div className="space-y-1 text-xs text-[#4B5563]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
              <span>
                {timeStr} ({durationHours} Hours)
              </span>
            </div>

            {test.syllabus && (
              <div className="flex items-center gap-2 truncate">
                <BookOpen className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                <span className="truncate">{test.syllabus}</span>
              </div>
            )}

            {test.venue && (
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                <span className="truncate">{test.venue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action arrow button */}
        <Link
          href="/student/tests"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-[#111827] hover:bg-[#FFC21A] transition-colors shrink-0 shadow-2xs"
          aria-label="View test details"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Footer link */}
      <div className="border-t border-black/5 pt-2.5 text-right">
        <Link
          href="/student/tests"
          className="text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          View all tests & results →
        </Link>
      </div>
    </div>
  );
}
