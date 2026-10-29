"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";

export default function StudentError({ error, reset }) {
  useEffect(() => {
    const msg = error?.message || "";
    if (
      msg.includes("UNAUTHORIZED") ||
      msg.includes("Unauthorized") ||
      error?.digest?.includes("UNAUTHORIZED")
    ) {
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/student";
      window.location.href = `/student-login?reason=expired&next=${encodeURIComponent(
        currentPath
      )}`;
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          An unexpected error occurred while loading your learning portal.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry</span>
          </button>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Go to dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
