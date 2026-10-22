import { Users, Smartphone, BookOpen, Video, ShieldCheck } from "lucide-react";

export default function StatsOverview({ stats }) {
  const cards = [
    {
      label: "Total Students",
      value: stats.studentsCount,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Pending Devices",
      value: stats.pendingRequestsCount,
      icon: Smartphone,
      color: stats.pendingRequestsCount > 0 ? "text-amber-400" : "text-gray-400",
      bg: stats.pendingRequestsCount > 0 ? "bg-amber-500/10" : "bg-gray-500/10",
      border: stats.pendingRequestsCount > 0 ? "border-amber-500/30" : "border-gray-500/20",
    },
    {
      label: "Active Sessions",
      value: stats.activeSessionsCount,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Published Courses",
      value: stats.coursesCount,
      icon: BookOpen,
      color: "text-[#FFB800]",
      bg: "bg-[#FFB800]/10",
      border: "border-[#FFB800]/20",
    },
    {
      label: "Total Lectures",
      value: stats.lecturesCount,
      icon: Video,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`p-4 rounded-2xl bg-[#131316] border ${c.border} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white">{c.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
