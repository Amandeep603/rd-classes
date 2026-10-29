import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TONES = {
  yellow: {
    cardBg: "bg-[#FFF7ED]",
    border: "border-[#FDE6C8]",
    iconBg: "bg-[#FED7AA]/60",
    iconColor: "text-[#C2410C]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#C2410C]",
  },
  blue: {
    cardBg: "bg-[#EBF5FE]",
    border: "border-[#CFE7FC]",
    iconBg: "bg-[#BAE6FD]/60",
    iconColor: "text-[#0284C7]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#0284C7]",
  },
  red: {
    cardBg: "bg-[#FDF0EE]",
    border: "border-[#FCD8D4]",
    iconBg: "bg-[#FECACA]/60",
    iconColor: "text-[#DC2626]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#DC2626]",
  },
  indigo: {
    cardBg: "bg-[#F0F4FE]",
    border: "border-[#D9E2FD]",
    iconBg: "bg-[#C7D2FE]/60",
    iconColor: "text-[#4F46E5]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#4F46E5]",
  },
  green: {
    cardBg: "bg-[#EBF8F2]",
    border: "border-[#CFECE0]",
    iconBg: "bg-[#BBF7D0]/60",
    iconColor: "text-[#16A34A]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#16A34A]",
  },
  purple: {
    cardBg: "bg-[#F8F0FE]",
    border: "border-[#ECCDFD]",
    iconBg: "bg-[#E9D5FF]/60",
    iconColor: "text-[#9333EA]",
    arrowBg: "bg-white/80",
    arrowColor: "text-[#9333EA]",
  },
};

export default function StatCard({
  icon: Icon,
  value,
  label,
  href,
  tone = "yellow",
}) {
  const toneStyle = TONES[tone] || TONES.yellow;

  const content = (
    <div
      className={`group relative flex flex-col justify-between rounded-[22px] ${toneStyle.cardBg} border ${toneStyle.border} p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200`}
    >
      {/* Top row: Icon + Arrow */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneStyle.iconBg} ${toneStyle.iconColor} shadow-2xs`}
        >
          {Icon && <Icon className="h-5 w-5 stroke-[2.2]" />}
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full ${toneStyle.arrowBg} ${toneStyle.arrowColor} shadow-2xs group-hover:scale-105 transition-transform`}
        >
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.3]" />
        </div>
      </div>

      {/* Value & Label */}
      <div>
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#111827]">
          {value}
        </div>
        <div className="mt-1 text-xs sm:text-[13px] font-semibold text-[#4B5563]">
          {label}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] rounded-[22px]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
