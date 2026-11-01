"use client";

import { useEffect } from "react";

/**
 * Non-blocking client component that collects device screen metrics and hints,
 * writing them to the rd_hints session cookie.
 */
export default function DeviceHintsCollector() {
  useEffect(() => {
    async function collectHints() {
      try {
        const sw = window.screen ? window.screen.width : 0;
        const sh = window.screen ? window.screen.height : 0;
        const dpr = window.devicePixelRatio || 1;
        const tp = navigator.maxTouchPoints || 0;
        const pf = navigator.platform || "";

        let md = "";
        if (
          navigator.userAgentData &&
          typeof navigator.userAgentData.getHighEntropyValues === "function"
        ) {
          try {
            const data = await navigator.userAgentData.getHighEntropyValues(["model"]);
            if (data?.model && typeof data.model === "string") {
              const clean = data.model.trim();
              if (clean.length > 1 && clean.toLowerCase() !== "k") {
                md = clean.slice(0, 40);
              }
            }
          } catch {
            // Ignore permissions/UA data errors
          }
        }

        const payload = {
          v: 1,
          sw,
          sh,
          dpr: Number(dpr.toFixed(2)),
          tp,
          pf: pf.slice(0, 40),
          md,
        };

        const cookieValue = encodeURIComponent(JSON.stringify(payload));
        const isSecure = window.location.protocol === "https:";
        const secureFlag = isSecure ? "; Secure" : "";

        // Session cookie (no max-age/expires), SameSite=Lax
        document.cookie = `rd_hints=${cookieValue}; path=/; SameSite=Lax${secureFlag}`;
      } catch (err) {
        // Must never throw or block
      }
    }

    collectHints();
  }, []);

  return null;
}

