import { BarChart3, Trophy } from "lucide-react";
import ProgressRing from "../ui/ProgressRing";

export default function SyllabusCoverageCard({ syllabus }) {
  const percent = syllabus?.percent || 0;
  const completed = syllabus?.completedLectures || 0;
  const total = syllabus?.totalLectures || 0;
  const rewardText = syllabus?.rewardTargetText || "₹5,100 Cash Reward Target";

  const expiryDate = syllabus?.earliestExpiry
    ? new Date(syllabus.earliestExpiry).toLocaleDateString("en-CA") // YYYY-MM-DD
    : null;

  return (
    <div
      className="relative flex h-[327px] flex-col justify-between rounded-[22px] p-7 sm:p-8 text-white shadow-xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0B2A47 0%, #081F34 50%, #051525 100%)",
      }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#FFC21A]">
            SYLLABUS COVERAGE
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-2xs">
            <BarChart3 className="h-4 w-4 text-sky-300" />
          </div>
        </div>

        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
          Board Preparation
        </h2>
        <p className="mt-1 text-xs sm:text-[13.5px] text-white/70">
          You have completed {completed} out of {total} recorded video lectures.
        </p>
      </div>

      {/* Middle: Progress Ring + Target Details */}
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <ProgressRing
            percent={percent}
            size={90}
            strokeWidth={9}
            color="#FFC21A"
            trackColor="rgba(255, 255, 255, 0.15)"
            textColor="#ffffff"
            textSize="20px"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#FFD54A]" />
            <span className="text-xs font-bold text-[#FFE8A3]">
              Target: 100/100
            </span>
          </div>
          <p className="text-[13px] font-medium text-white/90">
            {rewardText}
          </p>
        </div>
      </div>

      {/* Bottom Expiry Footer */}
      <div className="border-t border-white/10 pt-3">
        {expiryDate ? (
          <span className="text-xs font-medium text-white/60">
            Valid until: <span className="font-bold text-white/80">{expiryDate}</span>
          </span>
        ) : (
          <span className="text-xs font-medium text-white/50">
            Full Academic Year Access
          </span>
        )}
      </div>
    </div>
  );
}
