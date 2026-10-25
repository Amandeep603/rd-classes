"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function StudentPortalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Student Portal Error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[28px] border border-black/5 shadow-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-black text-[#111827]">
        Unable to Load Portal Content
      </h2>

      <p className="mt-2 max-w-md text-xs text-[#6B7280]">
        An error occurred while loading your study module. Please refresh or return to your dashboard.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-4 py-2 text-xs font-bold text-neutral-900 shadow-2xs hover:bg-[#ffd54a]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reload</span>
        </button>
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#111827] hover:bg-neutral-50 shadow-2xs"
        >
          <Home className="h-3.5 w-3.5" />
          <span>My Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
