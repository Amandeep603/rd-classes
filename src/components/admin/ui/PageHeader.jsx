"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] mb-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#111827] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#1F2937]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-[#6B7280]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
