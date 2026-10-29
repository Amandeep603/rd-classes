import { BarChart3, Trophy } from "lucide-react";
import ProgressRing from "../ui/ProgressRing";

export default function SyllabusCoverageCard({ syllabus }) {
  const percent = syllabus?.percent || 0;
  const completed = syllabus?.completedLectures || 0;
  const total = syllabus?.totalLectures || 0;
  const courseHeading = syllabus?.courseTitle || "Board Preparation";

  const targetScore = syllabus?.targetScore || "100/100";
  const rewardTargetText = syllabus?.rewardTargetText || "₹5,100 Cash Reward Target";

  let formattedExpiry = "2026 - 03 - 31";
  if (syllabus?.earliestExpiry) {
    try {
      const d = new Date(syllabus.earliestExpiry);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      formattedExpiry = `${y} - ${m} - ${day}`;
    } catch {
      formattedExpiry = "2026 - 03 - 31";
    }
  }

  return (
    <div
      className="relative flex min-h-[300px] h-full flex-col justify-between rounded-[24px] p-7 sm:p-[28px] text-white shadow-sm overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, #07172B 0%, #0F2A48 100%)",
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
          {/* Chart icon in 36px rounded square (dark blue with 3 white/sky bars) */}
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#103860] text-white/90 shadow-2xs">
            <BarChart3 className="h-[18px] w-[18px] text-sky-200" />
          </div>
        </div>

        <h2 className="mt-2 text-[22px] lg:text-[24px] font-extrabold tracking-tight text-white leading-tight line-clamp-2">
          {courseHeading}
        </h2>
        <p className="mt-1 text-[14.5px] font-medium text-white/75 leading-normal">
          You have completed {completed} out of {total} recorded video lectures.
        </p>
      </div>

      {/* Middle: 78px Donut ring + Target & Cash Reward */}
      <div className="relative z-10 flex items-center gap-5 my-auto pt-3 pb-2">
        <div className="shrink-0">
          <ProgressRing
            percent={percent}
            size={78}
            strokeWidth={8}
            color="#FFC93C"
            trackColor="rgba(255, 255, 255, 0.15)"
            textColor="#ffffff"
            textSize="19px"
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#FFC93C] shrink-0" />
            <span className="text-[15px] font-bold text-white">
              Target: {targetScore}
            </span>
          </div>
          {rewardTargetText && (
            <p className="text-[13.5px] font-medium text-slate-300 leading-snug">
              {rewardTargetText}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer: Valid until */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex items-center text-[12px] font-medium text-white/60">
        <span>Valid until:&nbsp;</span>
        <span className="font-semibold text-white/80">{formattedExpiry}</span>
      </div>
    </div>
  );
}
