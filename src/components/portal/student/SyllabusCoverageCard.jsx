import { BarChart3, Trophy } from "lucide-react";
import ProgressRing from "../ui/ProgressRing";

export default function SyllabusCoverageCard({ syllabus }) {
  const percent = syllabus?.percent || 0;
  const completed = syllabus?.completedLectures || 0;
  const total = syllabus?.totalLectures || 0;
  const courseHeading = syllabus?.courseTitle || "Board Preparation";

  // Strict check: Only show if explicitly configured on the course by admin
  const hasReward = Boolean(syllabus?.rewardTargetText && syllabus.rewardTargetText.trim());
  const hasTarget = Boolean(syllabus?.targetScore && syllabus.targetScore.trim());
  const hasDetails = hasReward || hasTarget;

  let formattedExpiry = null;
  if (syllabus?.earliestExpiry) {
    try {
      const d = new Date(syllabus.earliestExpiry);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      formattedExpiry = `${y} - ${m} - ${day}`;
    } catch {
      formattedExpiry = null;
    }
  }

  return (
    <div
      className="relative flex min-h-[300px] h-full flex-col justify-between rounded-[24px] p-7 sm:p-[28px] text-white shadow-sm overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, #0B2A4A 0%, #0A1F38 100%)",
      }}
    >
      {/* Decorative soft glowing blob */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full blur-3xl opacity-20"
        style={{ background: "#38BDF8" }}
        aria-hidden="true"
      />

      {/* Decorative lighter navy wave at bottom right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[240px] h-[150px] overflow-hidden select-none z-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 240 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M0 150C60 110 140 125 240 70V150H0Z"
            fill="#0F3860"
            fillOpacity="0.45"
          />
          <path
            d="M40 150C110 120 180 135 240 100V150H40Z"
            fill="#144675"
            fillOpacity="0.35"
          />
        </svg>
      </div>

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#FFE8A3]">
            SYLLABUS COVERAGE
          </span>
          {/* Chart icon in 40px rounded square (dark blue with 3 white bars) */}
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#103860] text-white/90 shadow-2xs">
            <BarChart3 className="h-[20px] w-[20px] text-sky-200" />
          </div>
        </div>

        <h2 className="mt-2 text-[22px] lg:text-[24px] xl:text-[28px] font-extrabold tracking-tight text-white leading-tight line-clamp-2">
          {courseHeading}
        </h2>
        <p className="mt-1 text-[15px] font-medium text-white/75 leading-normal">
          You have completed {completed} out of {total} recorded video lectures.
        </p>
      </div>

      {/* Middle: 120px Progress Ring + Optional Admin Configured Details */}
      <div className="relative z-10 flex items-center gap-6 my-auto pt-3 pb-1">
        <div className="shrink-0">
          <ProgressRing
            percent={percent}
            size={120}
            strokeWidth={10}
            color="#FFC93C"
            trackColor="rgba(255, 255, 255, 0.15)"
            textColor="#ffffff"
            textSize="28px"
          />
        </div>

        {hasDetails ? (
          <div className="space-y-2 min-w-0">
            {hasTarget && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#FFC93C] shrink-0" />
                <span className="text-sm font-bold text-[#FFE8A3]">
                  Target: {syllabus.targetScore}
                </span>
              </div>
            )}
            {hasReward && (
              <p className="text-[14px] font-semibold text-white/90 leading-snug">
                {syllabus.rewardTargetText}
              </p>
            )}
            {formattedExpiry && (
              <div className="text-[12px] font-medium text-white/60 pt-0.5">
                Valid until: <span className="font-semibold text-white/80">{formattedExpiry}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-[13.5px] font-medium text-white/70 leading-relaxed">
              Keep watching daily to maintain your target pace for the board exams.
            </p>
            {formattedExpiry && (
              <div className="text-[12px] font-medium text-white/50 pt-1">
                Valid until: <span className="font-semibold text-white/70">{formattedExpiry}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom spacer to maintain exact height */}
      <div className="relative z-10 h-1" />
    </div>
  );
}
