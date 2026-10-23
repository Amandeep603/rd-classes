"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Video,
  FileText,
  CalendarCheck,
  MessageCircle,
} from "lucide-react";
import { loginStudentAction } from "@/server/actions/auth.actions.js";
import { SITE_CONFIG } from "@/constants/site";
import {
  BookStackIllustration,
  LeavesIllustration,
} from "../illustrations/PortalIllustrations";

export default function StudentLoginForm() {
  const [state, formAction, isPending] = useActionState(loginStudentAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const whatsappPhone =
    SITE_CONFIG?.contact?.whatsapp?.replace(/\D/g, "") || "919999999999";
  const whatsappEnquiryUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    "Hello RD Classes, I want to enrol in an Accountancy course."
  )}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10"
      style={{
        background:
          "radial-gradient(ellipse at 12% 20%, rgba(230, 243, 253, 0.85) 0%, transparent 45%), #FDF9F0",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1020px] flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
        {/* Left Side: Brand Panel */}
        <div
          className="relative flex flex-col justify-between overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10 border border-black/4 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.18)] lg:w-[420px] shrink-0"
          style={{
            background:
              "linear-gradient(180deg, #E6F3FD 0%, #F8FAF7 45%, #FBF8EF 100%)",
          }}
        >
          <LeavesIllustration className="absolute -top-4 -right-4 h-28 w-28 text-sky-200/50 pointer-events-none" />

          {/* Top: Logo & Brand */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-900 font-black text-2xl shadow-sm">
                RD
              </div>
              <div>
                <div className="text-[22px] font-black leading-tight tracking-tight text-[#111827]">
                  RD Classes
                </div>
                <div className="text-[12px] font-bold tracking-[0.14em] text-[#6B7280]">
                  STUDENT PORTAL
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2937] leading-snug">
                Consistent<br />Learning<br />Brighter Results
              </h2>
              <div className="h-1 w-10 bg-[#FFC21A] rounded-full" />
            </div>

            {/* Benefits list */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#374151]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs text-[#FFC21A]">
                  <Video className="h-4 w-4 text-amber-500" />
                </div>
                <span>HD recorded lectures</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-[#374151]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs text-[#FFC21A]">
                  <FileText className="h-4 w-4 text-amber-500" />
                </div>
                <span>Notes & formula sheets</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-[#374151]">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs text-[#FFC21A]">
                  <CalendarCheck className="h-4 w-4 text-amber-500" />
                </div>
                <span>Sunday mock tests</span>
              </div>
            </div>
          </div>

          {/* Bottom Illustration */}
          <div className="relative z-10 hidden sm:flex justify-end pt-6">
            <BookStackIllustration className="h-20 w-28" />
          </div>
        </div>

        {/* Right Side: White Card Form */}
        <div className="flex flex-1 flex-col justify-center rounded-[32px] bg-white p-6 sm:p-10 lg:p-12 border border-black/4 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.15)]">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-[#6B7280]">
              Login with the ID and password shared by RD Classes
            </p>
          </div>

          {state?.error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 border border-red-200/80 text-sm text-red-800"
            >
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="loginId"
                className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1.5"
              >
                Login ID
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="e.g. rd2025001"
                  disabled={isPending}
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isPending}
                  className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-11 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFD54A] to-[#FFC21A] py-3.5 px-4 font-bold text-neutral-900 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:shadow-[0_6px_20px_rgba(255,194,26,0.45)] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Footer Helpers */}
          <div className="mt-8 space-y-3 pt-6 border-t border-black/6 text-center">
            <p className="text-xs text-[#6B7280]">
              Your account works on one approved device. Need another device? Ask Sir for approval.
            </p>
            <div>
              <a
                href={whatsappEnquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5 fill-[#059669]" />
                <span>Don&apos;t have an ID? Enquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
