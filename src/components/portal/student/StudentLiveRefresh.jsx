"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function StudentLiveRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const lastRefreshRef = useRef(Date.now());

  useEffect(() => {
    // 1. Strictly disable auto-refresh on watch pages or pages with a mounted player
    if (pathname && (pathname.startsWith("/student/watch") || pathname.includes("/watch/"))) {
      return;
    }

    // 2. Elsewhere, refresh capped to >= 60 seconds and only when tab is visible
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastRefreshRef.current >= 60000) {
          lastRefreshRef.current = now;
          router.refresh();
        }
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        // Throttle visibility refreshes to at least 60 seconds apart
        if (now - lastRefreshRef.current >= 60000) {
          lastRefreshRef.current = now;
          router.refresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, pathname]);

  return null;
}
