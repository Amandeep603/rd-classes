import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TONES = {
  blue: {
    bg: "bg-[#EAF4FD]",
    border: "border-[#CFE6F7]",
    iconChip: "bg-[#D6EAF8] text-[#1F2A44]",
  },
  yellow: {
    bg: "bg-[#FFF6DA]",
    border: "border-[#FBE7A6]",
    iconChip: "bg-[#FDEEBA] text-[#1F2A44]",
  },
  peach: {
    bg: "bg-[#FDEBDD]",
    border: "border-[#F8CFB4]",
    iconChip: "bg-[#FAD9C3] text-[#1F2A44]",
  },
};

export default function StatCard({
  icon: Icon,
  value,
  total,
  suffix = "",
  label,
  href,
  tone = "blue",
  className = "",
}) {
  const currentTone = TONES[tone] || TONES.blue;

  const content = (
    <div
      className={`group flex h-[96px] items-center justify-between rounded-[20px] px-6 border ${currentTone.bg} ${currentTone.border} transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs select-none ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* 52px icon chip in deeper tint with dark navy outline icon */}
        <div
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-[16px] shrink-0 ${currentTone.iconChip}`}
        >
          {Icon && <Icon className="h-[22px] w-[22px] text-[#1F2A44] stroke-[2]" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-1 truncate">
            <span className="text-[30px] font-bold tracking-tight text-[#1F2A44] leading-none">
              {value}
            </span>
            {total !== undefined && (
              <span className="text-[16px] font-medium text-[#6B7A99] ml-0.5">
                /{total}
              </span>
            )}
            {suffix && (
              <span className="text-[14px] font-medium text-[#6B7A99] ml-1">
                {suffix}
              </span>
            )}
          </div>
          <p className="text-[15px] font-medium text-[#1F2A44] truncate mt-1">
            {label}
          </p>
        </div>
      </div>

      {/* 40px white circle arrow button */}
      <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white text-[#1F2A44] shadow-xs shrink-0 transition-transform duration-150 group-hover:translate-x-0.5">
        <ArrowRight className="h-[18px] w-[18px] text-[#1F2A44] stroke-[2.2]" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] rounded-[20px]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
