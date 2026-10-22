"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { loginStudentAction } from "@/server/actions/auth.actions.js";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginStudentAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md bg-[#131316] border border-[#26262B] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-2 bg-white rounded-xl mb-3 shadow">
          <Image
            src="/images/logo-rd.png"
            alt="RD Classes"
            width={52}
            height={34}
            className="h-8 w-auto"
            priority
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Student Portal Login
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Sign in to access your enrolled Accountancy lectures
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="loginId"
            className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
          >
            Student Login ID
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="loginId"
              name="loginId"
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. rd1001"
              disabled={isPending}
              className="w-full bg-[#1A1A1E] border border-[#2D2D33] focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isPending}
              className="w-full bg-[#1A1A1E] border border-[#2D2D33] focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold text-sm rounded-xl shadow-lg shadow-[#FFB800]/10 hover:shadow-[#FFB800]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>Log In to Learning Portal</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#222226] text-center">
        <p className="text-xs text-gray-400">
          Single-device security is active. Each student account is tied to your approved device.
        </p>
      </div>
    </div>
  );
}
