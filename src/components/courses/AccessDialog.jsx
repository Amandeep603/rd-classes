"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Lock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function AccessDialog({
  isOpen,
  onClose,
  course,
  lockedLectureTitle = "",
  userData = null,
  siteWhatsapp = "918368545620",
  whatsappDefaultMessage = "",
}) {
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [customMessage, setCustomMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean phone number for wa.me
  const cleanPhone = siteWhatsapp.replace(/[^0-9]/g, "") || "918368545620";

  const effectiveName = visitorName || userData?.student?.name || "";
  const effectivePhone = visitorPhone || userData?.student?.phone || "";

  // Construct message template derived via useMemo
  const defaultMessage = useMemo(() => {
    if (!course) return "";

    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://rd-classes.in/courses/${course.slug}`;

    const student = userData?.student;
    const name = student?.name || effectiveName || "";
    const loginId = student?.loginId || "";

    let studentLine = "";
    if (student?.name && student?.loginId) {
      studentLine = `Student: ${student.name} (${student.loginId})\n`;
    } else if (name) {
      studentLine = `Name: ${name}\n`;
    }

    const defaultTpl =
      whatsappDefaultMessage ||
      "Hello Ronak Sir, I would like to get access to *{course}* at RD Classes.\n{studentLine}Course link: {link}\nPlease guide me about the next steps.";

    let generated = defaultTpl
      .replace(/{course}/g, course.title)
      .replace(/{link}/g, currentUrl)
      .replace(/{name}/g, name || "Student")
      .replace(/{loginId}/g, loginId)
      .replace(/{studentLine}/g, studentLine);

    if (lockedLectureTitle) {
      generated += `\n\nI watched the free lecture and want access to: "${lockedLectureTitle}".`;
    }

    if (extraNote.trim()) {
      generated += `\nNote: ${extraNote.trim()}`;
    }

    return generated;
  }, [course, lockedLectureTitle, userData, effectiveName, extraNote, whatsappDefaultMessage]);

  const message = customMessage !== null ? customMessage : defaultMessage;

  if (!isOpen || !course) return null;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleOpenWhatsApp = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course._id,
          source: lockedLectureTitle ? "lecture-lock" : "course-page",
          name: visitorName || userData?.student?.name || "",
          phone: visitorPhone || userData?.student?.phone || "",
          note: extraNote || (lockedLectureTitle ? `Locked lecture: ${lockedLectureTitle}` : ""),
        }),
      });
    } catch {
      // Non-blocking
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setIsSubmitting(false);
    setSentSuccess(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white sm:rounded-3xl rounded-none min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col shadow-2xl border border-[#E2E8F0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EBF5FF] text-[#0066FF] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div>
              <h3 id="access-dialog-title" className="text-base font-bold text-[#0B1B3D]">
                Get Course Access
              </h3>
              <p className="text-[11px] text-[#64748B]">WhatsApp Access Desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0B1B3D] flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Course Summary Card */}
          <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[#BFDBFE] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#BFDBFE] text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0066FF] border border-[#BFDBFE]">
                  {course.classLabel || "Class 12"}
                </span>
                {lockedLectureTitle && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                    <Lock className="w-2.5 h-2.5" />
                    Locked Lecture
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-[#0B1B3D] truncate">{course.title}</h4>
              {lockedLectureTitle && (
                <p className="text-xs text-[#475569] mt-0.5 truncate">
                  Unlocking: <span className="font-semibold">{lockedLectureTitle}</span>
                </p>
              )}
            </div>
          </div>

          {/* Reassurance Banner */}
          <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
            <span className="font-semibold">Notice:</span> You will be redirected to WhatsApp.
            Sir will create your student ID and share the login details.
          </div>

          {/* Visitor Inputs (Optional) */}
          {!userData?.student && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Your Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>
            </div>
          )}

          {/* Extra Note Field */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Add your own note (optional)
            </label>
            <input
              type="text"
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              placeholder="e.g. Inquiring for full-year batch starting this month"
              className="w-full px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
            />
          </div>

          {/* Message Preview Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#334155]">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066FF] hover:underline"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy message</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#1E293B] font-mono leading-relaxed focus:outline-none focus:border-[#0066FF] focus:bg-white focus:ring-1 focus:ring-[#0066FF] resize-none"
            />
          </div>

          {/* Calm Confirmation Banner */}
          {sentSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Message ready. Sir will share your login ID after confirmation on WhatsApp.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC] space-y-3">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#0B2545] hover:bg-[#15345E] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-70 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            <span>Open WhatsApp</span>
          </button>

          <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
            <span>Already have credentials?</span>
            <Link
              href="/student-login"
              onClick={onClose}
              className="font-semibold text-[#0066FF] hover:underline inline-flex items-center gap-1"
            >
              <span>Student Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

