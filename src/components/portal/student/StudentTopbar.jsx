"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  Video,
  FileText,
  CalendarCheck,
  X,
  Search,
} from "lucide-react";
import { logoutStudentAction } from "@/server/actions/auth.actions.js";

export default function StudentTopbar({
  student,
  subtitle,
  classPill,
  notifications = { announcements: [], notes: [] },
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [liveNotifs, setLiveNotifs] = useState(null);

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch notifications from server endpoint
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/student/notifications");
      if (res.ok) {
        const data = await res.json();
        setLiveNotifs(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/student/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/student/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        // Ignore network errors in search
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const studentName = student?.name ? student.name.trim() : "Student";
  const initial = student?.name
    ? student.name.trim().charAt(0).toUpperCase()
    : "S";
  const classLabel = classPill || (student?.className ? `Class ${student.className}` : "Class 12");
  const mainSubtitle =
    subtitle || (student?.className ? `Class ${student.className} Comprehensive Accountancy` : "Accountancy");

  const unreadCount = liveNotifs?.unreadCount !== undefined
    ? liveNotifs.unreadCount
    : (notifications.announcements?.length || 0) + (notifications.notes?.length || 0);

  const displayNotifs = liveNotifs?.notifications || [];

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-h-[72px] mb-4">
      {/* Left: Greeting + Class Pill + Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] sm:text-[28px] font-extrabold tracking-tight text-[#1F2A44]">
            Hi {studentName} <span aria-hidden="true">👋</span>
          </h1>
          <span className="inline-flex items-center rounded-full bg-[#FEF08A] px-[12px] py-[3px] text-[12px] font-semibold text-[#854D0E]">
            {classLabel}
          </span>
        </div>
        <p className="mt-0.5 text-[15px] font-medium text-[#5B6577]">
          {mainSubtitle}
        </p>
      </div>

      {/* Right: Search Box + Bell + Avatar Menu */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Search Input with Live Dropdown */}
        <div className="relative flex-1 sm:w-[340px]" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              id="student-search-box"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              placeholder="Search lectures, notes, tests..."
              className="h-[44px] w-full rounded-full bg-white border border-black/8 pl-11 pr-10 text-[13.5px] text-[#1F2A44] placeholder:text-[#9CA3AF] transition-all duration-150 focus:border-[#FFC93C] focus:outline-none focus:ring-2 focus:ring-[#FFC93C]/20 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                aria-label="Clear search"
                className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#111827] hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white p-3 shadow-2xl border border-black/8 z-50 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              {searching ? (
                <div className="py-4 text-center text-xs text-[#6B7280]">
                  Searching accessible materials...
                </div>
              ) : searchResults.lectures?.length === 0 &&
                searchResults.notes?.length === 0 &&
                searchResults.tests?.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#6B7280]">
                  No matching lectures, notes or tests found.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Lectures */}
                  {searchResults.lectures?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-amber-800">
                        Lectures
                      </div>
                      <div className="space-y-1">
                        {searchResults.lectures.map((l) => (
                          <Link
                            key={l._id}
                            href={l.href}
                            onClick={() => setSearchResults(null)}
                            className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-amber-50 text-xs font-semibold text-[#111827] transition-colors"
                          >
                            <Video className="h-4 w-4 text-amber-600 shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold">{l.title}</span>
                              <span className="text-[#6B7280] ml-1.5 text-[11px]">
                                {l.chapter || l.section || ""}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {searchResults.notes?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-sky-800">
                        Notes & Handouts
                      </div>
                      <div className="space-y-1">
                        {searchResults.notes.map((n) => (
                          <a
                            key={n._id}
                            href={n.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setSearchResults(null)}
                            className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-sky-50 text-xs font-semibold text-[#111827] transition-colors"
                          >
                            <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold">{n.title}</span>
                              <span className="text-[#6B7280] ml-1.5 text-[11px]">
                                {n.book || n.section || ""}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tests */}
                  {searchResults.tests?.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        Tests
                      </div>
                      <div className="space-y-1">
                        {searchResults.tests.map((t) => (
                          <Link
                            key={t._id}
                            href="/student/tests"
                            onClick={() => setSearchResults(null)}
                            className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-emerald-50 text-xs font-semibold text-[#111827] transition-colors"
                          >
                            <CalendarCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold">{t.title}</span>
                              <span className="text-[#6B7280] ml-1.5 text-[11px]">
                                {t.kind || "Sunday Mock"}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bell with Real Unread Count */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              const next = !notifOpen;
              setNotifOpen(next);
              if (next) fetchNotifications();
            }}
            aria-expanded={notifOpen}
            aria-label={`Notifications, ${unreadCount} new`}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white border border-black/8 text-[#4B5563] hover:text-[#1F2A44] hover:border-black/15 shadow-xs transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFC93C] px-1 text-[11px] font-bold text-[#1F2A44] ring-2 ring-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl bg-white p-3 shadow-2xl border border-black/8 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-[#0284C7] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-black/5 max-h-72 overflow-y-auto mt-1">
                {displayNotifs.length > 0 ? (
                  displayNotifs.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl transition-colors ${
                        n.isRead ? "opacity-75 hover:bg-neutral-50" : "bg-sky-50/50 hover:bg-sky-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {n.type === "lecture_added" && <Video className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                        {n.type === "note_uploaded" && <FileText className="h-3.5 w-3.5 text-sky-600 shrink-0" />}
                        {n.type === "mock_test_scheduled" && <CalendarCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        <div className="text-xs font-bold text-[#111827] truncate flex-1">{n.title}</div>
                      </div>
                      {n.message && (
                        <div className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5">{n.message}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    {notifications.announcements?.map((a) => (
                      <div key={a._id} className="p-2.5 hover:bg-neutral-50 rounded-xl transition-colors">
                        <div className="text-xs font-bold text-[#111827]">{a.title}</div>
                        <div className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5">{a.body}</div>
                      </div>
                    ))}

                    {notifications.notes?.map((n) => (
                      <Link
                        key={n._id}
                        href="/student/notes"
                        onClick={() => setNotifOpen(false)}
                        className="p-2.5 hover:bg-neutral-50 rounded-xl flex items-center gap-2.5 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-[#D97706] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#111827] truncate">{n.title}</div>
                          <div className="text-[10px] text-[#6B7280]">New handout uploaded</div>
                        </div>
                      </Link>
                    ))}

                    {(!notifications.announcements || notifications.announcements.length === 0) &&
                      (!notifications.notes || notifications.notes.length === 0) && (
                        <div className="py-6 text-center text-xs text-[#6B7280]">
                          No notifications right now.
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar circle + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#FFC93C]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C]"
          >
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#FFC93C] font-extrabold text-[#1F2A44] text-[17px] shadow-xs select-none">
              {initial}
            </div>
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white p-2 shadow-xl border border-black/8 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-black/5">
                <p className="text-sm font-bold text-[#111827] truncate">
                  {student?.name || "Student"}
                </p>
                <p className="text-xs text-[#6B7280] truncate font-mono">
                  {student?.loginId}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/student/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#374151] hover:bg-neutral-50 transition-colors"
                >
                  <User className="h-4 w-4 text-[#6B7280]" />
                  <span>Profile</span>
                </Link>

                <form action={logoutStudentAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
