"use client";

import { useEffect } from "react";

// Note: clearing only "cached files" does not remove cookies; clearing "cookies and site data" removes both and falls to the OTP path.

const IDB_NAME = "rd_device_backup_db";
const IDB_STORE = "backup_tokens";
const IDB_KEY = "rd_backup";

function getIndexedDbToken() {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined" || !window.indexedDB) return resolve(null);
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const tx = db.transaction(IDB_STORE, "readonly");
          const store = tx.objectStore(IDB_STORE);
          const getReq = store.get(IDB_KEY);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function setIndexedDbToken(token) {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined" || !window.indexedDB || !token) return resolve(false);
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => {
        try {
          const db = e.target.result;
          const tx = db.transaction(IDB_STORE, "readwrite");
          const store = tx.objectStore(IDB_STORE);
          store.put(token, IDB_KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function getCookieValue(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Non-blocking client component that collects device screen metrics, hints,
 * and syncs the persistent rd_backup token in IndexedDB to survive cookie-only clears.
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

        const isSecure = window.location.protocol === "https:";
        const secureFlag = isSecure ? "; Secure" : "";

        // Sync backup token from server cookie into IndexedDB if newly set
        const syncCookie = getCookieValue("rd_backup_sync");
        if (syncCookie) {
          await setIndexedDbToken(syncCookie);
          document.cookie = `rd_backup_sync=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
        }

        // Check if IndexedDB has backup token and restore cookie if missing
        let backupToken = await getIndexedDbToken();
        if (backupToken) {
          document.cookie = `rd_backup=${encodeURIComponent(
            backupToken
          )}; path=/; max-age=34560000; SameSite=Lax${secureFlag}`;
        }

        const payload = {
          v: 1,
          sw,
          sh,
          dpr: Number(dpr.toFixed(2)),
          tp,
          pf: pf.slice(0, 40),
          md,
          bk: backupToken || "",
        };

        const cookieValue = encodeURIComponent(JSON.stringify(payload));

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
