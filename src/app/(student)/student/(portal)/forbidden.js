import Link from "next/link";
import { Lock, ArrowLeft, BookOpen } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-sm mb-4">
        <Lock className="h-8 w-8 text-amber-700" />
      </div>
      <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-900 mb-2">
        403 • Access Denied
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#111827]">
        Course Enrollment Required
      </h1>
      <p className="mt-2 max-w-md text-sm text-[#6B7280] leading-relaxed">
        You do not have an active enrollment for this course or lecture. Access is restricted exclusively to enrolled students.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/student/lectures"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-5 py-2.5 text-sm font-bold text-neutral-900 shadow-md hover:bg-[#ffd54a] transition-all"
        >
          <BookOpen className="h-4 w-4" />
          <span>My Enrolled Lectures</span>
        </Link>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 rounded-2xl bg-white border border-black/10 px-5 py-2.5 text-sm font-bold text-[#374151] hover:bg-neutral-50 shadow-2xs transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
