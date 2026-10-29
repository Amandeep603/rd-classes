"use client";

const BADGE_STYLES = {
  active: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  approved: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  published: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  pending: "bg-[#FFF8E6] text-[#B47500] border-[#FFE59E]",
  blocked: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  rejected: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  revoked: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  draft: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
};

export default function StatusBadge({ status, label }) {
  const normalized = (status || "draft").toLowerCase();
  const style = BADGE_STYLES[normalized] || BADGE_STYLES.draft;
  const displayLabel = label || status || "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{displayLabel}</span>
    </span>
  );
}
