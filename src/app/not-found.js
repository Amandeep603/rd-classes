import Link from "next/link";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 font-black text-2xl shadow-xs mb-6">
        <span>404</span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-extrabold text-amber-800 mb-3 border border-amber-200/60">
        <BookOpen className="h-3.5 w-3.5" />
        <span>Page Not Found</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight max-w-md">
        We couldn&apos;t find the page you were looking for.
      </h1>

      <p className="mt-3 max-w-sm text-sm text-[#4B5563]">
        The course, study handout, or lecture may have moved or been updated. Let&apos;s get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-5 py-2.5 text-xs font-bold text-neutral-900 shadow-xs hover:bg-[#ffd54a] transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-2.5 text-xs font-bold text-[#111827] hover:bg-neutral-50 shadow-2xs transition-all"
        >
          <BookOpen className="h-4 w-4" />
          <span>Browse All Courses</span>
        </Link>
      </div>
    </div>
  );
}
