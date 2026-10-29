"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementBanner({ announcement, studentId = "" }) {
  const [dismissed, setDismissed] = useState(false);

  const storageKey = `announcement_${studentId ? `${studentId}_` : ""}${announcement?._id}`;

  useEffect(() => {
    if (!announcement?._id) return;
    const isDismissed = localStorage.getItem(storageKey) === "true";
    if (isDismissed) {
      queueMicrotask(() => setDismissed(true));
    }
  }, [announcement?._id, storageKey]);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  return (
    <aside
      aria-label="Announcement"
      className="relative flex items-center justify-between gap-4 rounded-[20px] p-4 sm:p-5 border border-[#FDE5A9] bg-[#FFF8E7] shadow-xs transition-all duration-300"
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Megaphone in yellow circle */}
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#FDB813] text-[#111827] shrink-0 shadow-2xs">
          <Megaphone className="h-5 w-5 fill-[#111827] stroke-[#111827]" />
        </div>

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="rounded-full bg-[#FDB813]/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#92400E]">
              ANNOUNCEMENT
            </span>
            <h3 className="text-base sm:text-[17px] font-extrabold text-[#111827] truncate">
              {announcement.title}
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-[13.5px] text-[#4B5563] line-clamp-2">
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
          className="rounded-full p-2 text-[#92400E] hover:bg-[#FDB813]/30 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
}
