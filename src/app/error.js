"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log sanitized error details in development only
    if (process.env.NODE_ENV !== "production") {
      console.error("Global Error Caught:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 text-rose-600 shadow-xs mb-6">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-extrabold text-rose-800 mb-3 border border-rose-200/60">
        <span>Something went wrong</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight max-w-md">
        An unexpected error occurred while loading this page.
      </h1>

      <p className="mt-2 max-w-sm text-sm text-[#4B5563]">
        Our team has been notified. Please try refreshing or return to the homepage.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#ffd54a] transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-2.5 text-xs font-bold text-[#111827] hover:bg-neutral-50 shadow-2xs transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
