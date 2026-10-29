"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { SITE_CONFIG } from "@/constants/site";
import AuthLayout from "./AuthLayout";

/**
 * UserShieldIcon - Admin ID field icon
 */
function UserShieldIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8 15a4 4 0 0 1 8 0" />
    </svg>
  );
}

/**
 * Shared AuthScene component powering:
 * - Student Login (/student-login & /student/login)
 * - Admin Login (/admin-login & /admin/login)
 */
export default function AuthScene({
  role = "student",
  action,
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const searchParams = useSearchParams();
  const urlError = searchParams?.get("error");
  const reason = searchParams?.get("reason");
  const nextParam = searchParams?.get("next") || searchParams?.get("from") || "";

  let urlErrorMessage = null;
  let isExpiredNotice = false;
  if (reason === "expired" || urlError === "session_expired") {
    urlErrorMessage = "Your session expired. Please log in again.";
    isExpiredNotice = true;
  } else if (urlError === "device_revoked") {
    urlErrorMessage =
      "Your approved device was revoked by the administrator. To use another device, contact RD Classes.";
  } else if (urlError === "account_blocked") {
    urlErrorMessage =
      "Your student account has been deactivated. Please contact RD Classes.";
  }

  const isStudent = role === "student";

  const phone = SITE_CONFIG?.contact?.phone || "918368545620";
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    isStudent
      ? "Hello RD Classes, I am a student and need assistance with my portal account."
      : "Hello RD Classes, I am an administrator and need technical assistance."
  )}`;

  return (
    <AuthLayout
      role={role}
      adminPill={!isStudent}
      cardTitle={isStudent ? "Student Login" : "Admin Login"}
      cardSubtitle={
        isStudent
          ? "Access your learning dashboard."
          : "Authorized staff access only."
      }
      topRightLink={
        isStudent
          ? { label: "Explore Courses →", href: "/courses" }
          : { label: "Back to Website →", href: "/" }
      }
      headlineParts={
        isStudent
          ? {
              line1: "Learn.",
              line2: "Practice.",
              prefix: "Score ",
              highlight: "Higher.",
            }
          : {
              line1: "Manage.",
              line2: "Monitor.",
              prefix: "",
              highlight: "Grow.",
            }
      }
      paragraph={
        isStudent
          ? "Access your lectures, notes, practice questions and track your progress, all in one place."
          : "Manage batches, students, notes, results and announcements from one secure dashboard."
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#0F172A]/90 border border-white/20 text-white text-sm font-medium shadow-2xl backdrop-blur-md transition-all animate-bounce"
        >
          {toastMessage}
        </div>
      )}

      {/* Calm Request Sent State */}
      {state?.pendingApproval && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-950/70 p-4 border border-amber-500/40 text-xs sm:text-sm text-amber-200 backdrop-blur-md shadow-lg"
        >
          <Clock className="h-5 w-5 text-[#FFB800] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[#FFB800] text-sm">Request sent</p>
            <p className="mt-1 text-amber-100/90 leading-relaxed font-normal">
              {state.message ||
                "This device is not approved. Your account works on one device only. A request has been sent to RD Classes. You can login once the admin approves it."}
            </p>
          </div>
        </div>
      )}

      {/* URL Parameter Error Alert (device revoked, blocked, expired) */}
      {urlErrorMessage && !state?.error && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-950/80 p-3.5 border border-amber-500/50 text-xs sm:text-sm text-amber-100 shadow-md"
        >
          {isExpiredNotice ? (
            <Clock className="h-4 w-4 text-[#FFB800] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#FFB800] shrink-0 mt-0.5" />
          )}
          <span>{urlErrorMessage}</span>
        </div>
      )}

      {/* Error Message Alert */}
      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-950/70 p-3.5 border border-red-500/40 text-xs sm:text-sm text-red-200"
        >
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Login Form */}
      <form action={formAction}>
        <input type="hidden" name="next" value={nextParam} />
        <div className="auth-form-gap flex flex-col gap-[18px]">
          {/* Field 1: Login ID or email */}
          <div className="relative">
            {isStudent ? (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 pointer-events-none" />
            ) : (
              <UserShieldIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 pointer-events-none" />
            )}
            <input
              id="auth-loginId"
              name="loginId"
              type="text"
              required
              autoComplete="username"
              placeholder={isStudent ? "Login ID or email" : "Admin ID or email"}
              disabled={isPending}
              className="auth-input w-full rounded-[16px] border border-white/30 bg-white/[0.06] py-3 pl-12 pr-4 text-[16px] text-white placeholder:text-white/60 focus:border-[#FFB800] focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40 transition-all disabled:opacity-50"
            />
          </div>

          {/* Field 2: Password with Eye Toggle */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 pointer-events-none" />
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Password"
              disabled={isPending}
              className="auth-input w-full rounded-[16px] border border-white/30 bg-white/[0.06] py-3 pl-12 pr-12 text-[16px] text-white placeholder:text-white/60 focus:border-[#FFB800] focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] transition-colors cursor-pointer"
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Yellow Pill Button: 60px height, linear-gradient(180deg,#FFC93C,#F9A826), dark text, 18px bold */}
        <button
          type="submit"
          disabled={isPending}
          className="auth-btn-primary w-full mt-6 rounded-full font-bold text-[18px] text-[#0A0A0A] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(249,168,38,0.35)] hover:shadow-[0_12px_28px_rgba(249,168,38,0.48)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800] transition-all disabled:opacity-60 cursor-pointer"
          style={{
            background: "linear-gradient(180deg, #FFC93C 0%, #F9A826 100%)",
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-[#0A0A0A]" />
              <span>
                {isStudent
                  ? "Verifying credentials..."
                  : "Authenticating admin..."}
              </span>
            </>
          ) : (
            <span>
              {isStudent ? "Login →" : "Login to Dashboard →"}
            </span>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-5 pt-3.5 border-t border-white/10 text-center">
        {isStudent ? (
          <>
            <p className="text-[15px] text-white/85">
              Don&apos;t have an account?{" "}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#38BDF8] hover:underline"
              >
                Contact your institute.
              </a>
            </p>
            <p className="text-[13px] text-white/60 flex items-center justify-center gap-1.5 pt-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Your account works on one approved device</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-[15px] text-white/85">
              Not an admin?{" "}
              <Link
                href="/student-login"
                className="font-medium text-[#38BDF8] hover:underline"
              >
                Go to Student Login
              </Link>
            </p>
            <p className="text-[13px] text-white/60 flex items-center justify-center gap-1.5 pt-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Secured access. All logins are monitored.</span>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
