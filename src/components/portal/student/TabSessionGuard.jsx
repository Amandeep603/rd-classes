"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * TabSessionGuard:
 * - If sessionMode is "tab" (default): verifies sessionStorage has "rd_tab" === "1".
 *   If missing (new tab or restored tab after browser/tab close), calls student logout
 *   and redirects to /student-login with tab_closed notice.
 * - Does NOT log out on pagehide, reload, or navigation within the same tab.
 * - Also provides a floating "Reconnecting..." retry banner for transient network/DB errors.
 */
export default function TabSessionGuard({ sessionMode = "tab" }) {
  const router = useRouter();
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    // In browser mode, guard is disabled
    if (sessionMode === "browser") return;

    try {
      const tabMarker = sessionStorage.getItem("rd_tab");
      if (!tabMarker) {
        // Tab marker is missing -> new or reopened tab!
        // Call logout API and redirect with message
        fetch("/api/auth/student-logout?reason=tab_closed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }).finally(() => {
          router.replace(
            "/student-login?reason=tab_closed&message=" +
              encodeURIComponent(
                "You were logged out because the tab was closed. Please log in again."
              )
          );
        });
      }
    } catch {
      // Failing guard leaves page usable
    }
  }, [sessionMode, router]);

  // Listen for custom "rd:connection-error" events emitted by API calls
  useEffect(() => {
    const handleConnError = (e) => {
      setReconnecting(true);
    };
    const handleConnRestored = () => {
      setReconnecting(false);
    };

    window.addEventListener("rd:connection-error", handleConnError);
    window.addEventListener("rd:connection-restored", handleConnRestored);

    return () => {
      window.removeEventListener("rd:connection-error", handleConnError);
      window.removeEventListener("rd:connection-restored", handleConnRestored);
    };
  }, []);

  if (!reconnecting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs sm:text-sm shadow-2xl backdrop-blur-md transition-all animate-in fade-in"
    >
      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
      <span>Reconnecting to server...</span>
      <button
        type="button"
        onClick={() => {
          setReconnecting(false);
          window.location.reload();
        }}
        className="ml-2 underline font-medium hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}

