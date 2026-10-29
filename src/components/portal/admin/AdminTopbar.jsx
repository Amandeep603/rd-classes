"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ExternalLink,
  Bell,
  ChevronDown,
  Menu,
  Volume2,
  VolumeX,
  Smartphone,
  BookOpen,
  Users,
  Video,
  FileText,
  ShieldAlert,
  CheckCheck,
  Laptop,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { logoutAdminAction } from "@/server/actions/auth.actions.js";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function getNotificationIcon(type) {
  switch (type) {
    case "device_request":
      return <Smartphone className="h-4 w-4 text-amber-600" />;
    case "course_created":
    case "course_updated":
      return <BookOpen className="h-4 w-4 text-blue-600" />;
    case "student_import":
      return <Users className="h-4 w-4 text-emerald-600" />;
    case "lecture_added":
      return <Video className="h-4 w-4 text-indigo-600" />;
    case "note_uploaded":
      return <FileText className="h-4 w-4 text-sky-600" />;
    case "login_blocked":
      return <ShieldAlert className="h-4 w-4 text-red-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export default function AdminTopbar({
  workspaceName = "Ronak Sir Workspace",
  adminUser,
  onOpenMobileMenu,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(
    adminUser || { name: "Ronak Dugar", role: "admin" }
  );

  useEffect(() => {
    let isMounted = true;
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    notifications,
    unreadCount,
    soundEnabled,
    desktopAlertsEnabled,
    toggleSound,
    requestDesktopAlerts,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications();

  const displayName = currentUser?.name || "Ronak Dugar";
  const initial = displayName.charAt(0).toUpperCase() || "R";

  const handleLogout = async (e) => {
    e?.preventDefault();
    if (window.confirm("Log out of the admin panel?")) {
      setAvatarDropdownOpen(false);
      try {
        await fetch("/api/auth/admin-logout", { method: "POST" });
      } catch (err) {}
      window.location.href = "/admin-login";
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(e.target)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="flex h-[78px] w-full items-center justify-between border-b border-black/6 bg-[#FBF8F1]/80 px-6 backdrop-blur-md sticky top-0 z-40"
      role="banner"
    >
      {/* Left side: Hamburger (mobile) + ADMIN PORTAL + Workspace pill */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden rounded-xl p-2 text-[#4B5563] hover:bg-black/5"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[13px] font-extrabold tracking-[0.14em] text-[#6B7280]">
            ADMIN PORTAL
          </span>
          <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
        </div>

        {/* Workspace pill */}
        <div className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3.5 py-1.5 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-[#1F2937]">
            {workspaceName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </div>
      </div>

      {/* Right side: View Public Website + Bell + Avatar */}
      <div className="flex items-center gap-3.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs transition-colors"
        >
          <span>View Public Website</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#6B7280]" />
        </a>

        {/* Bell with red unread count badge + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/8 text-[#4B5563] hover:text-[#111827] shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A]"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-black text-white ring-2 ring-white shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[400px] rounded-2xl bg-white shadow-2xl border border-black/8 py-3 text-left z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/6 px-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#111827]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-100">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="p-1 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-black/5 transition-colors"
                    title={soundEnabled ? "Mute alert sound" : "Unmute alert sound"}
                    aria-label={soundEnabled ? "Mute alert sound" : "Unmute alert sound"}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-[#9CA3AF]" />
                    )}
                  </button>

                  {/* Mark all as read */}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop alerts banner if not enabled */}
              {!desktopAlertsEnabled && typeof window !== "undefined" && "Notification" in window && (
                <div className="flex items-center justify-between bg-amber-50/60 border-b border-amber-100/60 px-4 py-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-medium">
                    <Laptop className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Enable desktop alerts</span>
                  </div>
                  <button
                    type="button"
                    onClick={requestDesktopAlerts}
                    className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-700 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-black/5">
                {notifications.length > 0 ? (
                  notifications.map((item) => {
                    const isUnread = !item.readAt;
                    return (
                      <div
                        key={item._id}
                        className={`group relative flex items-start gap-3 p-3.5 transition-colors hover:bg-black/2 ${
                          isUnread ? "bg-[#FFFDF7]" : ""
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-black/5 mt-0.5">
                          {getNotificationIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[#111827] truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF] shrink-0 font-medium">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          {item.link && (
                            <Link
                              href={item.link}
                              onClick={() => {
                                if (isUnread) markAsRead(item._id);
                                setDropdownOpen(false);
                              }}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700"
                            >
                              <span>View details</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>

                        {/* Unread dot / Mark read */}
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(item._id)}
                            title="Mark as read"
                            className="shrink-0 mt-1 h-2 w-2 rounded-full bg-amber-500 hover:ring-2 hover:ring-amber-300 transition-all"
                            aria-label="Mark as read"
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto h-7 w-7 text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-[#4B5563]">
                      No notifications yet.
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                      New alerts and device requests will appear here in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Avatar Dropdown */}
        <div className="relative" ref={avatarDropdownRef}>
          <button
            type="button"
            onClick={() => setAvatarDropdownOpen((prev) => !prev)}
            aria-expanded={avatarDropdownOpen}
            aria-haspopup="true"
            aria-label="Admin Profile Menu"
            className="flex items-center gap-2 rounded-full p-1 hover:ring-2 hover:ring-[#FFC21A]/40 transition-all cursor-pointer"
          >
            {/* Yellow-ring avatar "R" */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-sm font-black text-neutral-900 shadow-2xs ring-2 ring-[#FFC21A]">
              {initial}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${
                avatarDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {avatarDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/8 bg-white p-2 shadow-xl z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              <div className="px-3 py-2 border-b border-black/5 mb-1">
                <div className="font-bold text-[#111827] truncate">
                  {displayName}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Administrator
                </div>
              </div>

              {/* 1. My Profile */}
              <Link
                href="/admin/profile"
                onClick={() => setAvatarDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[#374151] hover:bg-black/5 hover:text-[#111827] font-medium transition-colors"
                role="menuitem"
              >
                <User className="h-4 w-4 text-slate-500" />
                <span>My Profile</span>
              </Link>

              {/* 2. Institute Settings */}
              <Link
                href="/admin/settings"
                onClick={() => setAvatarDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[#374151] hover:bg-black/5 hover:text-[#111827] font-medium transition-colors"
                role="menuitem"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Institute Settings</span>
              </Link>

              {/* 3. View Public Website */}
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAvatarDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[#374151] hover:bg-black/5 hover:text-[#111827] font-medium transition-colors"
                role="menuitem"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span>View Public Website</span>
              </Link>

              <div className="my-1 border-t border-black/5" />

              {/* 4. Logout with confirmation */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
