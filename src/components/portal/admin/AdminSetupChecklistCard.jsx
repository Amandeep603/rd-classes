import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Video,
  Users,
  FileText,
} from "lucide-react";

export default function AdminSetupChecklistCard({
  coursesCount = 0,
  lecturesCount = 0,
  studentsCount = 0,
  notesCount = 0,
}) {
  const steps = [
    {
      id: "course",
      title: "Create your first course",
      description: "Define syllabus, pricing, and grade (Class 11 / 12).",
      href: "/admin/courses/new",
      completed: coursesCount > 0,
      icon: BookOpen,
      actionLabel: "Add Course",
    },
    {
      id: "lecture",
      title: "Add video lectures & free preview",
      description: "Attach Vimeo videos with automatic free preview for visitors.",
      href: "/admin/courses",
      completed: lecturesCount > 0,
      icon: Video,
      actionLabel: "Manage Lectures",
    },
    {
      id: "student",
      title: "Enroll or import students",
      description: "Create accounts or bulk-import students with secure credentials.",
      href: "/admin/students",
      completed: studentsCount > 0,
      icon: Users,
      actionLabel: "Add Students",
    },
    {
      id: "note",
      title: "Upload study notes & formula sheets",
      description: "Provide downloadable chapter PDFs and formula resources.",
      href: "/admin/notes",
      completed: notesCount > 0,
      icon: FileText,
      actionLabel: "Upload Notes",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;

  if (allComplete) {
    return null;
  }

  const percent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="rounded-[22px] border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-6 sm:p-7 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.18)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#111827]">
                Quick Setup Checklist
              </h2>
              <span className="rounded-full bg-amber-100 border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                {completedCount} of {steps.length} done
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Complete these setup steps to launch your RD Classes learning portal.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="sm:w-44 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#374151]">
            <span>Setup Progress</span>
            <span className="text-amber-700">{percent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition-all ${
                step.completed
                  ? "border-emerald-200/80 bg-emerald-50/40 text-emerald-950"
                  : "border-black/5 bg-white shadow-2xs hover:border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span
                      className={`text-xs font-bold truncate ${
                        step.completed
                          ? "line-through text-emerald-900/70"
                          : "text-[#111827]"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </div>

              {!step.completed && (
                <Link
                  href={step.href}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
