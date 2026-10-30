"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function StudentPortalError({ error, reset }) {
  useEffect(() => {
    console.error("[STUDENT_PORTAL_CLIENT_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[28px] border border-black/5 shadow-xs space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-1">
        <AlertCircle className="h-7 w-7" />
      </div>

      <div className="max-w-md space-y-1">
        <h2 className="text-xl font-black text-[#111827]">
          Unable to Load Content
        </h2>
        <p className="text-sm text-[#6B7280]">
          We encountered an issue loading this study module. Please click Retry below to reload.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] px-5 py-2.5 text-xs font-bold text-[#0B2A4A] shadow-xs cursor-pointer transition-transform active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-bold text-[#111827] hover:bg-neutral-50 shadow-2xs"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

