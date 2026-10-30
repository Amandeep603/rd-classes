"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    // 1. Refresh every 30 seconds if tab is visible
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    }, 30000);

    // 2. Refresh immediately when tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    // 3. Refresh immediately on window focus
    const handleFocus = () => {
      router.refresh();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  return null;
}

