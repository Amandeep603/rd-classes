"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Phone,
  KeyRound,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  LogOut,
  Copy,
  Check,
  MessageCircle,
  BookOpen,
  Video,
  Clock,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
  History,
  CheckCircle2,
} from "lucide-react";
import { logoutStudentAction } from "@/server/actions/auth.actions.js";

function getDeviceIcon(deviceType) {
  const t = (deviceType || "").toLowerCase();
  if (t === "mobile" || t === "smartphone" || t === "phone") {
    return <Smartphone className="w-5 h-5 text-[#0B2A4A]" />;
  }
  if (t === "tablet" || t === "ipad") {
    return <Tablet className="w-5 h-5 text-[#0B2A4A]" />;
  }
  if (t === "desktop" || t === "pc") {
    return <Monitor className="w-5 h-5 text-[#0B2A4A]" />;
  }
  return <Laptop className="w-5 h-5 text-[#0B2A4A]" />;
}

export default function StudentProfileClient({
  student,
  approvedDevice,
  activeCourses = [],
  stats,
  recentActivity = [],
  whatsappNumber = "918368545620",
}) {
  const [copied, setCopied] = useState(false);

  const cleanPhone = (whatsappNumber || "918368545620").replace(/\D/g, "");

  const handleCopyLoginId = async () => {
    if (!student?.loginId) return;
    try {
      await navigator.clipboard.writeText(student.loginId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const deviceChangeWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello RD Classes, I would like to request a device change for my student account.\nName: ${student?.name || ""}\nLogin ID: ${student?.loginId || ""}`
  )}`;

  const updateDetailsWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello RD Classes, I would like to update my personal details/password.\nName: ${student?.name || ""}\nLogin ID: ${student?.loginId || ""}`
  )}`;

  const initial = (student?.name || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="w-full space-y-6">
      {/* 1. HERO CARD (soft cream/yellow gradient, subtle border) */}
      <div
        className="rounded-[24px] border border-[#FBE7A6]/80 p-6 sm:p-7 shadow-xs relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FFFDF7 0%, #FFF8EE 45%, #FFF2D6 100%)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          {/* Avatar + Main Identity */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Large yellow avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFB800] text-[#0B2A4A] font-black text-2xl sm:text-3xl flex items-center justify-center shrink-0 border-2 border-white shadow-xs">
              {initial}
            </div>

            <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A4A] tracking-tight truncate">
                {student?.name || "Student"}
              </h1>

              {/* Chips row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Monospace Login ID chip with one-click copy */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200/80 text-xs shadow-2xs">
                  <span className="text-[#64748B] text-[11px] font-medium">ID:</span>
                  <span className="font-mono font-bold text-[#0B2A4A]">{student?.loginId}</span>
                  <button
                    type="button"
                    onClick={handleCopyLoginId}
                    aria-label="Copy Login ID"
                    className="p-1 -mr-1 rounded hover:bg-amber-100 text-[#475569] hover:text-[#0B2A4A] transition-colors cursor-pointer"
                    title="Copy Login ID"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    )}
                  </button>
                </div>

                {/* Class chip */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#FFF0D4] text-[#B7791F] font-bold text-xs border border-amber-200/60 shadow-2xs">
                  Class {student?.className || "12"}
                </span>

                {/* Status chip */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/80 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>

                {/* Joined date */}
                {student?.joinedDate && (
                  <span className="text-xs font-medium text-[#64748B] hidden md:inline ml-1">
                    Joined: {student.joinedDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Right Logout Button */}
          <div className="shrink-0 self-start sm:self-center">
            <form action={logoutStudentAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200/80 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. FOUR CLEAN STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Courses Enrolled (Blue) */}
        <div className="rounded-[20px] p-5 border border-[#CFE6F7] bg-[#EAF4FD] flex flex-col justify-between h-[104px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E5BD8] uppercase tracking-wider">
              Enrolled
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D6EAF8] flex items-center justify-center text-[#1E5BD8]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2A4A] tracking-tight">
              {stats?.coursesEnrolled ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#64748B] ml-1.5">
              Course{stats?.coursesEnrolled === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Card 2: Lectures Completed (Yellow) */}
        <div className="rounded-[20px] p-5 border border-[#FBE7A6] bg-[#FFF6DA] flex flex-col justify-between h-[104px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B7791F] uppercase tracking-wider">
              Lectures
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDEEBA] flex items-center justify-center text-[#B7791F]">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2A4A] tracking-tight">
              {stats?.completedLectures ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#64748B] ml-1.5">
              / {stats?.totalLectures ?? 0} completed
            </span>
          </div>
        </div>

        {/* Card 3: Watch Time (Green) */}
        <div className="rounded-[20px] p-5 border border-[#B9E9CB] bg-[#E8F8F0] flex flex-col justify-between h-[104px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#15803D] uppercase tracking-wider">
              Watch Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D0F3DF] flex items-center justify-center text-[#15803D]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2A4A] tracking-tight">
              {stats?.watchTimeFormatted || "0h 0m"}
            </span>
          </div>
        </div>

        {/* Card 4: Tests Attended (Peach) */}
        <div className="rounded-[20px] p-5 border border-[#F8CFB4] bg-[#FDEBDD] flex flex-col justify-between h-[104px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#C2410C] uppercase tracking-wider">
              Mock Tests
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAD9C3] flex items-center justify-center text-[#C2410C]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2A4A] tracking-tight">
              {stats?.testsAttended ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#64748B] ml-1.5">Attended</span>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN SECTION (grid-cols-1 lg:grid-cols-12, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-6): Personal Details Card */}
        <div className="lg:col-span-6 rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#F1F5F9]">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#E8870E] flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B2A4A] tracking-tight">
                Personal Details
              </h2>
              <p className="text-xs text-[#64748B]">Your registered student credentials</p>
            </div>
          </div>

          {/* Detail Rows */}
          <div className="space-y-3.5">
            {/* Full Name */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9]">
              <span className="flex items-center gap-2.5 text-xs font-semibold text-[#64748B]">
                <UserIcon className="w-4 h-4 text-[#94A3B8]" />
                Full Name
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0B2A4A]">
                {student?.name || "—"}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9]">
              <span className="flex items-center gap-2.5 text-xs font-semibold text-[#64748B]">
                <Phone className="w-4 h-4 text-[#94A3B8]" />
                Phone Number
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#0B2A4A]">
                {student?.phone ? (student.phone.startsWith("+") ? student.phone : `+91 ${student.phone}`) : "—"}
              </span>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9]">
              <span className="flex items-center gap-2.5 text-xs font-semibold text-[#64748B]">
                <Mail className="w-4 h-4 text-[#94A3B8]" />
                Email Address
              </span>
              <span className="text-xs sm:text-sm font-mono text-[#0B2A4A] truncate max-w-[200px]">
                {student?.email || "—"}
              </span>
            </div>

            {/* Login ID */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9]">
              <span className="flex items-center gap-2.5 text-xs font-semibold text-[#64748B]">
                <KeyRound className="w-4 h-4 text-[#94A3B8]" />
                Login ID
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#0B2A4A] bg-[#FFF8EE] px-2.5 py-1 rounded-md border border-amber-200/60">
                {student?.loginId || "—"}
              </span>
            </div>
          </div>

          {/* Muted Note with WhatsApp link */}
          <div className="pt-2 text-xs text-[#64748B] flex items-center justify-between gap-2 border-t border-[#F1F5F9]">
            <span>To change personal details or password, contact RD Classes</span>
            <a
              href={updateDetailsWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#25D366] hover:underline shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Column (lg:col-span-6): My Device Card */}
        <div className="lg:col-span-6 rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#E8870E] flex items-center justify-center">
                {getDeviceIcon(approvedDevice?.deviceType)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0B2A4A] tracking-tight">
                  My Device
                </h2>
                <p className="text-xs text-[#64748B]">Active authorized device</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Approved &amp; active
            </span>
          </div>

          {/* Approved Device Info (NO raw Device ID string!) */}
          <div className="rounded-2xl bg-[#FAFBFD] p-4 border border-[#F1F5F9] space-y-2">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#0B2A4A]" />
              <span className="text-sm font-bold text-[#0B2A4A]">
                {approvedDevice?.formattedLabel || "Windows laptop · Chrome"}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Last active: {approvedDevice?.lastActiveFormatted || "Recently"}
            </p>
          </div>

          {/* One-device policy note */}
          <div className="rounded-2xl bg-[#FFF9EE] p-4 border border-[#FBE7A6] text-xs text-[#92400E] leading-relaxed space-y-1">
            <p className="font-bold">One-Device Policy</p>
            <p className="text-[11px] text-[#A16207]">
              For student account security and anti-piracy, your portal access is locked to this approved device.
            </p>
          </div>

          {/* Request Device Change Button */}
          <div className="pt-1">
            <a
              href={deviceChangeWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Request device change on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. MY COURSES SECTION (Full Width) */}
      <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#E8870E] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0B2A4A] tracking-tight">
                My Courses
              </h2>
              <p className="text-xs text-[#64748B]">
                {activeCourses.length} Enrolled {activeCourses.length === 1 ? "Course" : "Courses"}
              </p>
            </div>
          </div>
        </div>

        {activeCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.map((c) => {
              const continueHref = c.lastWatchedLectureId
                ? `/student/watch/${c.lastWatchedLectureId}`
                : `/student/lectures?course=${encodeURIComponent(c.slug)}`;

              return (
                <div
                  key={c._id}
                  className="rounded-2xl border border-[#E8ECF2] bg-[#FAFBFD] p-5 space-y-4 hover:border-[#FFB800] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FFF0D4] text-[#B7791F] font-bold text-[11px] border border-amber-200/60">
                        {c.classLabel || "Class 12"}
                      </span>
                      <h3 className="text-base font-bold text-[#0B2A4A] leading-snug">
                        {c.title}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-[#0B2A4A] shrink-0">
                      {c.percent || 0}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className="h-full bg-[#FFB800] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(c.completedLectures > 0 ? 3 : 0, c.percent || 0))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>
                        {c.completedLectures || 0} of {c.totalLectures || 136} lectures
                      </span>
                      {c.validUntilFormatted && (
                        <span>Valid until: {c.validUntilFormatted}</span>
                      )}
                    </div>
                  </div>

                  {/* Yellow Continue Learning Button */}
                  <div className="pt-1">
                    <Link
                      href={continueHref}
                      className="w-full h-10 rounded-xl bg-[#FFB800] hover:bg-[#E5A600] text-[#0B2A4A] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
                    >
                      <span>Continue learning</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#0B2A4A]">No courses assigned yet</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              You are not currently enrolled in any active courses. Please contact RD Classes to assign your batch.
            </p>
          </div>
        )}
      </div>

      {/* 5. RECENT ACTIVITY SECTION (Full Width) */}
      <div className="rounded-[24px] border border-[#E8ECF2] bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F5F9]">
          <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] text-[#E8870E] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B2A4A] tracking-tight">
              Recent Activity
            </h2>
            <p className="text-xs text-[#64748B]">Last watched lectures &amp; progress</p>
          </div>
        </div>

        {recentActivity.length > 0 ? (
          <div className="space-y-2.5">
            {recentActivity.map((act) => (
              <div
                key={act.lectureId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] hover:border-[#FFB800] transition-colors gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0B2A4A] truncate">
                      {act.lectureTitle}
                    </span>
                    {act.completed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    {act.chapter || "Course Revision"}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-semibold text-[#8C95A6]">
                    Watched {act.timeAgo}
                  </span>
                  <Link
                    href={`/student/watch/${act.lectureId}`}
                    className="h-8 px-3.5 rounded-full bg-[#FFF8EE] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-xs flex items-center gap-1 border border-amber-200/80 transition-colors shadow-2xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Watch</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#64748B]">
            No recent activity yet. Start watching lectures to track your progress!
          </div>
        )}
      </div>
    </div>
  );
}

