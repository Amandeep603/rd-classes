"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import { updateStudentDeviceNoteAction } from "@/server/actions/auth.actions.js";
import { SITE_CONFIG } from "@/constants/site";

export default function PendingDeviceView({
  initialRequest,
  studentName = "Student",
  studentCode = "",
}) {
  const [status, setStatus] = useState(initialRequest?.status || "pending");
  const [rejectReason, setRejectReason] = useState(initialRequest?.note || "");
  const [deviceLabel, setDeviceLabel] = useState(
    initialRequest?.label || "This Browser Device"
  );
  const [requestId, setRequestId] = useState(initialRequest?._id || "");
  const [note, setNote] = useState(initialRequest?.studentNote || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const deviceId = initialRequest?.deviceId || "";

  // Poll status every 10s while tab is visible
  useEffect(() => {
    if (status !== "pending") return;

    const checkStatus = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(
          `/api/student/device-status?deviceId=${encodeURIComponent(deviceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status && data.status !== "pending") {
            setStatus(data.status);
            if (data.note) setRejectReason(data.note);
            if (data.label) setDeviceLabel(data.label);
          }
        }
      } catch {
        // network retry
      }
    };

    const interval = setInterval(checkStatus, 10000);
    const handleVis = () => {
      if (!document.hidden) checkStatus();
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, [deviceId, status]);

  const handleSaveNote = async () => {
    if (!requestId || savingNote) return;
    setSavingNote(true);
    try {
      const res = await updateStudentDeviceNoteAction(requestId, note);
      if (res?.success) {
        setNoteSaved(true);
        setTimeout(() => setNoteSaved(false), 2500);
      }
    } finally {
      setSavingNote(false);
    }
  };

  const whatsappPhone =
    SITE_CONFIG?.contact?.whatsapp?.replace(/\D/g, "") || "919999999999";
  const whatsappMsg = `Hello Sir, I have requested device approval for the RD Classes portal.\nStudent: ${studentName}${
    studentCode ? ` (${studentCode})` : ""
  }\nDevice: ${deviceLabel}`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    whatsappMsg
  )}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background:
          "radial-gradient(ellipse at 12% 20%, rgba(230, 243, 253, 0.85) 0%, transparent 45%), #FDF9F0",
      }}
    >
      <div className="w-full max-w-lg rounded-[32px] bg-white p-6 sm:p-10 border border-black/5 shadow-[0_12px_40px_-15px_rgba(120,90,20,0.18)]">
        {/* State 1: Approved */}
        {status === "approved" ? (
          <div className="text-center space-y-5 animate-in fade-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827]">
                Device Approved!
              </h1>
              <p className="mt-1.5 text-sm text-[#4B5563]">
                Sir has approved this device for your account. You can now log in to the learning portal.
              </p>
            </div>
            <Link
              href="/student/login"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FFD54A] to-[#FFC21A] py-3.5 px-4 font-bold text-neutral-900 shadow-md hover:shadow-lg transition-all"
            >
              Log in now
            </Link>
          </div>
        ) : status === "rejected" ? (
          /* State 2: Rejected */
          <div className="text-center space-y-5 animate-in fade-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-xs">
              <XCircle className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#111827]">
                Request Rejected
              </h1>
              <p className="mt-1.5 text-sm text-[#4B5563]">
                {rejectReason
                  ? `Note from Sir: "${rejectReason}"`
                  : "Your device approval request could not be approved at this time."}
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message Sir on WhatsApp</span>
              </a>
              <Link
                href="/student/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#4B5563] hover:bg-neutral-50 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          /* State 3: Pending Approval */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3 border border-amber-200/60 shadow-xs">
                <Smartphone className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
                Waiting for Approval
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Your account is locked to your approved device.
              </p>
            </div>

            {/* Device Info Card */}
            <div className="rounded-2xl bg-[#F8FAF7] p-4 border border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Device Label
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for approval
                </span>
              </div>
              <div className="text-base font-bold text-[#111827]">
                {deviceLabel}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {initialRequest?.createdAt
                    ? `Requested at ${new Date(initialRequest.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Kolkata",
                      })}`
                    : "Requested recently"}
                </span>
              </div>
            </div>

            {/* Optional Note Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="device-note"
                  className="text-xs font-bold uppercase tracking-wider text-[#374151]"
                >
                  Reason or note for Sir (Optional)
                </label>
                <span className="text-xs text-[#9CA3AF]">
                  {note.length}/140
                </span>
              </div>
              <div className="relative">
                <input
                  id="device-note"
                  type="text"
                  maxLength={140}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="e.g. Wants to revise lectures on mobile while traveling"
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-4 pr-24 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-black/5 px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-black/10 transition-colors disabled:opacity-50"
                >
                  {savingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : noteSaved ? (
                    <span className="text-emerald-600 font-bold">Saved!</span>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Sir will see this note in the admin dashboard when reviewing your device request.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message Sir on WhatsApp</span>
              </a>

              <Link
                href="/student/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-[#4B5563] hover:bg-neutral-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to login</span>
              </Link>
            </div>

            {/* Polling indicator */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-[#9CA3AF] flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-ping" />
                Checking approval status automatically...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
