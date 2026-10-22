"use client";

import { useActionState, useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { changeStudentPasswordAction } from "@/server/actions/student.account.actions.js";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changeStudentPasswordAction, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="bg-[#131316] border border-[#222226] rounded-2xl p-6 shadow-xl">
      <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
        <Lock className="w-4 h-4 text-[#FFB800]" />
        <span>Change Account Password</span>
      </h3>
      <p className="text-xs text-gray-400 mb-5">
        Updating your password will automatically log out any other active sessions.
      </p>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Password updated successfully! Other sessions have been revoked.</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              name="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              disabled={isPending}
              placeholder="Enter current password"
              className="w-full bg-[#1A1A1E] border border-[#2D2D33] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            New Password (minimum 8 characters)
          </label>
          <div className="relative">
            <input
              name="newPassword"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              disabled={isPending}
              placeholder="Enter new strong password"
              className="w-full bg-[#1A1A1E] border border-[#2D2D33] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
