import Link from "next/link";
import { Megaphone, Plus, ArrowRight, Calendar } from "lucide-react";

export default function AdminAnnouncementsCard({ announcements = [] }) {
  const displayList = announcements.slice(0, 3);

  return (
    <div className="rounded-[22px] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111827]">
              Announcements
            </h3>
          </div>
        </div>

        <Link
          href="/admin/announcements"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
        >
          <span>Manage</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* List */}
      {displayList.length > 0 ? (
        <div className="space-y-2.5">
          {displayList.map((ann) => (
            <div
              key={ann._id}
              className="rounded-2xl border border-black/5 bg-neutral-50/70 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#111827] truncate">
                  {ann.title}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 shrink-0">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] line-clamp-2">
                {ann.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-xs text-[#6B7280]">
          No active announcements.
        </div>
      )}
    </div>
  );
}
