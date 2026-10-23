"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementBanner({ announcement }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!announcement?._id) return;
    const isDismissed =
      localStorage.getItem(`announcement_${announcement._id}`) === "true";
    if (isDismissed) {
      queueMicrotask(() => setDismissed(true));
    }
  }, [announcement?._id]);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`announcement_${announcement._id}`, "true");
  };

  return (
    <aside
      aria-label="Announcement"
      className="relative flex items-center justify-between gap-4 rounded-[20px] p-4 sm:p-5 border border-[#F6DFA0] shadow-sm mb-6 transition-all duration-300"
      style={{
        background: "linear-gradient(90deg, #FFF3C9 0%, #FFF8E0 100%)",
      }}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Megaphone in yellow circle */}
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#FFD54A] text-neutral-900 shrink-0 shadow-xs">
          <Megaphone className="h-6 w-6 fill-neutral-900 stroke-neutral-900" />
        </div>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="rounded-md bg-[#FFD54A] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-neutral-900">
              ANNOUNCEMENT
            </span>
            <h3 className="text-base sm:text-[18px] font-extrabold text-[#111827] truncate">
              {announcement.title}
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-[14px] text-[#4B5563] line-clamp-2">
            {announcement.body}
          </p>
        </div>
      </div>

      {/* Dismiss Button */}
      {announcement.dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="rounded-full p-2 text-[#78350F] hover:bg-[#FFD54A]/40 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
}
