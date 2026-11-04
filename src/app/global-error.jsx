"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Only logged in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.error("Root Global Error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-black/10 p-8 text-center shadow-lg">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 mb-3 border border-rose-200">
            <span>Critical Error</span>
          </div>

          <h1 className="text-xl font-black text-[#111827] tracking-tight">
            Something went wrong on our side.
          </h1>

          <p className="mt-2 text-xs text-[#4B5563]">
            Please try refreshing or return to the homepage. If this persists, please quote the reference below.
          </p>

          {error?.digest && (
            <p className="mt-3 text-xs font-mono text-neutral-400 bg-neutral-100 py-1 px-2 rounded-md inline-block">
              Reference: {error.digest}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFC21A] px-4 py-2 text-xs font-bold text-neutral-900 hover:bg-[#ffd54a] transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-bold text-[#111827] hover:bg-neutral-50 transition-all"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

