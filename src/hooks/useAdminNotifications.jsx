"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useToast } from "@/components/admin/ui/Toast";

const AdminNotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  pendingDeviceCount: 0,
  isLoading: false,
  soundEnabled: true,
  desktopAlertsEnabled: false,
  toggleSound: () => {},
  requestDesktopAlerts: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
});

function playSoftChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Soft high-low pleasant chime: 587.33Hz (D5) -> 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.33);
  } catch {
    // AudioContext blocked before first user interaction
  }
}

export function AdminNotificationsProvider({ children, initialPendingCount = 0 }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDeviceCount, setPendingDeviceCount] = useState(initialPendingCount);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("rd_admin_notif_sound");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [desktopAlertsEnabled, setDesktopAlertsEnabled] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission === "granted";
    }
    return false;
  });

  const { showToast } = useToast();
  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("rd_admin_notif_sound", String(next));
      } catch {}
      return next;
    });
  }, []);

  const requestDesktopAlerts = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const permission = await window.Notification.requestPermission();
      setDesktopAlertsEnabled(permission === "granted");
      if (permission === "granted") {
        showToast("Desktop notifications enabled!", "success");
      }
    } catch (e) {
      console.error("Desktop notification error:", e);
    }
  }, [showToast]);

  const fetchNotifications = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;

    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const newNotifs = data.notifications || [];
      const newPendingCount =
        typeof data.pendingDeviceCount === "number"
          ? data.pendingDeviceCount
          : 0;

      // Check for incoming brand new notifications
      if (!isFirstLoadRef.current) {
        for (const notif of newNotifs) {
          if (!knownIdsRef.current.has(notif._id)) {
            // New notification arrived!
            showToast(notif.message || notif.title, "info");

            if (soundEnabled) {
              playSoftChime();
            }

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              window.Notification.permission === "granted"
            ) {
              try {
                new window.Notification(notif.title, {
                  body: notif.message,
                  icon: "/favicon.ico",
                });
              } catch {}
            }
          }
        }
      } else {
        isFirstLoadRef.current = false;
      }

      // Update known IDs
      for (const notif of newNotifs) {
        knownIdsRef.current.add(notif._id);
      }

      setNotifications(newNotifs);
      setUnreadCount(data.unreadCount ?? 0);
      setPendingDeviceCount(newPendingCount);
    } catch {
      // Silent catch on network glitches
    }
  }, [showToast, soundEnabled]);

  // Polling every 10 seconds only while visible
  useEffect(() => {
    let cancelled = false;

    const initTimer = setTimeout(() => {
      if (!cancelled) fetchNotifications();
    }, 0);

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const now = new Date();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
      setUnreadCount(0);

      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  return (
    <AdminNotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        pendingDeviceCount,
        isLoading,
        soundEnabled,
        desktopAlertsEnabled,
        toggleSound,
        requestDesktopAlerts,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  return useContext(AdminNotificationsContext);
}

export default useAdminNotifications;
