"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Lock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { loginAdminAction } from "@/server/actions/auth.actions.js";

export default function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md bg-[#131316] border border-[#2B2B33] rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex p-2 bg-white rounded-xl mb-3 shadow">
          <Image
            src="/images/logo-rd.png"
            alt="RD Classes"
            width={48}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          RD Classes Administration
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Authorized personnel only. Sessions expire after 8 hours.
        </p>
      </div>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="adminLoginId"
            className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
          >
            Admin ID
          </label>
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="adminLoginId"
              name="loginId"
              type="text"
              required
              autoComplete="username"
              placeholder="e.g. admin"
              disabled={isPending}
              className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="adminPassword"
            className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
          >
            Admin Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="adminPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter admin password"
              disabled={isPending}
              className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 py-3 px-4 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold text-sm rounded-xl shadow-lg shadow-[#FFB800]/10 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Admin Console</span>
          )}
        </button>
      </form>
    </div>
  );
}
