"use client";

import { useActionState, useState } from "react";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { loginAdminAction } from "@/server/actions/auth.actions.js";
import StandaloneAuthBar from "./StandaloneAuthBar";

export default function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdminAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="min-h-[100svh] flex flex-col justify-between text-white"
      style={{
        background: "linear-gradient(180deg, #0F1B2D 0%, #0B1424 100%)",
      }}
    >
      <StandaloneAuthBar theme="dark" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md rounded-[32px] bg-[#14233A] p-6 sm:p-10 border border-white/10 shadow-2xl text-white">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-neutral-950 font-black text-2xl shadow-lg mb-4">
              RD
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">
                RD CLASSES
              </span>
              <span className="rounded-md bg-[#FFC21A]/20 px-2 py-0.5 text-xs font-black text-[#FFC21A]">
                ADMIN
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Management Console Sign In
            </p>
          </div>

          {state?.error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 flex items-start gap-3 rounded-2xl bg-red-950/50 p-4 border border-red-800/60 text-sm text-red-200"
            >
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="admin-loginId"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Admin ID
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="admin-loginId"
                  name="loginId"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="e.g. admin"
                  disabled={isPending}
                  className="admin-auth-input w-full rounded-2xl border border-white/10 bg-[#0B1524] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/40 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  disabled={isPending}
                  className="admin-auth-input w-full rounded-2xl border border-white/10 bg-[#0B1524] py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/40 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A]"
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFC21A] py-3.5 px-4 font-bold text-neutral-950 shadow-[0_4px_16px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC21A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14233A] transition-all disabled:opacity-60 cursor-pointer text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-950" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-white/8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Restricted to authorized faculty only</span>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} RD Classes. All rights reserved.
      </footer>
    </div>
  );
}
