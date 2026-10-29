import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  BookOpen,
  MapPin,
  ArrowRight,
} from "lucide-react";

export default function UpcomingTestCard({ test }) {
  let monthStr = "NEXT";
  let dayStr = "--";
  let weekdayStr = "Sun";
  let title = "No Mock Test Scheduled";
  let timeStr = "Sunday 9:00 AM - 12:00 PM (Weekly slot)";
  let syllabusStr = "Syllabus announced 3 days prior";
  let venueStr = "RD Classes, Sector 9 Centre";
  let kindPill = "SUNDAY MOCK";

  if (test) {
    const rawDate = test.testDate || test.startsAt || test.createdAt;
    const startDate = rawDate ? new Date(rawDate) : null;
    if (startDate && !isNaN(startDate.getTime())) {
      monthStr = startDate
        .toLocaleDateString("en-IN", {
          month: "short",
          timeZone: "Asia/Kolkata",
        })
        .toUpperCase();
      dayStr = startDate.toLocaleDateString("en-IN", {
        day: "numeric",
        timeZone: "Asia/Kolkata",
      });
      weekdayStr = startDate.toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      });
    }

    const durationHours = Math.round((test.durationMin || 180) / 60);
    const timeFormatted = test.startTime
      ? `${test.startTime}${test.endTime ? ` - ${test.endTime}` : ""}`
      : startDate.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });

    title = test.title || "Sunday Mock Test";
    timeStr = `${timeFormatted} (${durationHours} Hours)`;
    syllabusStr = test.syllabus || "Course syllabus";
    venueStr = test.venue || "RD Classes, Sector 9 Centre";
    kindPill = test.kind || "SUNDAY MOCK";
  }

  return (
    <div className="relative flex min-h-[240px] h-full flex-col justify-between rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-sm select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#EAF4FD] text-[#0284C7] shrink-0">
            <CalendarCheck className="h-5 w-5 text-[#0284C7]" />
          </div>
          <h3 className="text-[20px] font-bold text-[#1F2A44]">
            Upcoming Test
          </h3>
        </div>

        <span className="rounded-full bg-[#FFF4D2] px-3.5 py-1 text-[12px] font-bold uppercase tracking-wide text-[#9A6600]">
          {kindPill}
        </span>
      </div>

      {/* Inner Panel: Date tile + Test details + Arrow button */}
      <div className="mt-4 rounded-[18px] border border-[#E8ECF2] bg-white p-4 sm:p-5 flex items-center justify-between gap-4 sm:gap-6 my-auto">
        {/* Left Date Block (96px width, light blue #EAF4FD, border #CFE6F7) */}
        <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-[14px] border border-[#CFE6F7] bg-[#EAF4FD] p-2 shrink-0 text-center">
          <span className="text-[13px] font-bold tracking-wider text-[#1F2A44] uppercase">
            {monthStr}
          </span>
          <span className="text-[38px] font-extrabold text-[#1F2A44] leading-none my-0.5">
            {dayStr}
          </span>
          <span className="text-[13px] font-medium text-[#5B6577]">
            {weekdayStr}
          </span>
        </div>

        {/* Middle Test Details */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <h4 className="text-[18px] sm:text-[19px] font-bold text-[#1F2A44] truncate">
            {title}
          </h4>

          <div className="space-y-1 text-[14px] font-medium text-[#5B6577]">
            <div className="flex items-center gap-2 truncate">
              <Clock className="h-4 w-4 text-[#8A94A6] shrink-0" />
              <span className="truncate">{timeStr}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <BookOpen className="h-4 w-4 text-[#8A94A6] shrink-0" />
              <span className="truncate">{syllabusStr}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-[#8A94A6] shrink-0" />
              <span className="truncate">{venueStr}</span>
            </div>
          </div>
        </div>

        {/* Right Arrow Button (44px circle) */}
        <Link
          href="/student/tests"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#EAF4FD] text-[#1F2A44] hover:bg-[#FFC93C] transition-colors shrink-0 shadow-2xs ml-auto"
          aria-label="View all tests"
        >
          <ArrowRight className="h-5 w-5 stroke-[2.2]" />
        </Link>
      </div>
    </div>
  );
}
