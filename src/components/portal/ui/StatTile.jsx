import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function StatTile({
  icon: Icon,
  value,
  label,
  href,
  tone = "yellow",
  className = "",
}) {
  const content = (
    <div
      className={`portal-stat-tile flex flex-col justify-between rounded-[20px] p-5 border transition-all duration-200 h-[140px] ${className}`}
      data-tone={tone}
    >
      <div className="flex items-center justify-between">
        <div className="portal-stat-icon-tile flex h-[46px] w-[46px] items-center justify-center rounded-xl shrink-0 shadow-sm">
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <div className="portal-stat-arrow flex h-[30px] w-[30px] items-center justify-center rounded-full shrink-0 shadow-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-2">
        <div className="text-[28px] font-extrabold leading-none tracking-tight text-[#111827]">
          {value}
        </div>
        <div className="text-[14px] font-medium text-[#6B7280] mt-1 truncate">
          {label}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] rounded-[20px]">
        {content}
      </Link>
    );
  }

  return content;
}
