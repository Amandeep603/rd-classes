"use client";

import { useActionState, useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { changeStudentPasswordAction } from "@/server/actions/student.account.actions.js";

export default function ChangePasswordCard() {
  const [state, formAction, isPending] = useActionState(
    changeStudentPasswordAction,
    null
  );
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="rounded-[22px] border border-black/5 bg-white p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(120,90,20,0.12)] space-y-5">
      <div>
        <h3 className="text-base font-extrabold text-[#111827] flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500" />
          <span>Change Account Password</span>
        </h3>
        <p className="mt-1 text-xs text-[#6B7280]">
          Updating your password will automatically log out any other active sessions.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs font-semibold text-red-800"
        >
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Password updated successfully! Other sessions have been revoked.</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              disabled={isPending}
              placeholder="Enter current password"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-4 pr-10 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1.5">
            New Password (minimum 8 characters)
          </label>
          <div className="relative">
            <input
              name="newPassword"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              disabled={isPending}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-4 pr-10 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 transition-all disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-sm hover:bg-[#ffd54a] transition-all disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </form>
    </div>
  );
}
