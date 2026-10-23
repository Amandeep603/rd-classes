import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  const content = (
    <div
      className={`portal-stat-card flex items-center justify-between rounded-[22px] p-5 transition-all duration-200 border ${className}`}
      data-tone={tone}
    >
      <div className="flex items-center gap-4">
        <div className="portal-stat-icon-tile flex h-14 w-14 items-center justify-center rounded-2xl shrink-0">
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-extrabold tracking-tight text-[#111827]">
              {value}
            </span>
            {total !== undefined && (
              <span className="text-sm font-semibold text-[#6B7280]">
                /{total}
              </span>
            )}
            {suffix && (
              <span className="text-sm font-semibold text-[#6B7280]">
                {suffix}
              </span>
            )}
          </div>
          <p className="text-[14px] font-medium text-[#4B5563] mt-0.5">{label}</p>
        </div>
      </div>

      <div className="portal-stat-arrow flex h-10 w-10 items-center justify-center rounded-full shrink-0 shadow-sm transition-transform group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] rounded-[22px]">
        {content}
      </Link>
    );
  }

  return content;
}
