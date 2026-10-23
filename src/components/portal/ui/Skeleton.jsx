export function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`portal-skeleton rounded-lg ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({ size = 40, className = "" }) {
  return (
    <div
      className={`portal-skeleton rounded-full shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ width = "100%", height = 16, className = "" }) {
  return (
    <div
      className={`portal-skeleton rounded-md ${className}`}
      style={{ width: typeof width === "number" ? `${width}px` : width, height: `${height}px` }}
      aria-hidden="true"
    />
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard...">
      {/* Announcement banner skeleton */}
      <div className="h-24 w-full rounded-[20px] bg-amber-50/60 border border-amber-200/50" />

      {/* Hero row: Resume card + Syllabus card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-[327px] rounded-[22px] bg-white border border-black/5 p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-4 w-36 bg-neutral-200 rounded" />
            <div className="h-8 w-3/4 bg-neutral-200 rounded" />
            <div className="h-4 w-1/2 bg-neutral-100 rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-3 w-full bg-neutral-200 rounded-full" />
            <div className="h-11 w-44 bg-amber-200 rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-4 h-[327px] rounded-[22px] bg-[#0B2A47]/80 p-8 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 bg-white/20 rounded" />
            <div className="h-7 w-3/4 bg-white/30 rounded" />
            <div className="h-4 w-full bg-white/10 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full border-4 border-white/20" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-white/20 rounded" />
              <div className="h-4 w-32 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-[95px] rounded-[22px] bg-blue-50/70 border border-blue-100" />
        <div className="h-[95px] rounded-[22px] bg-amber-50/70 border border-amber-100" />
        <div className="h-[95px] rounded-[22px] bg-orange-50/70 border border-orange-100" />
      </div>

      {/* Upcoming test & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-[281px] rounded-[22px] bg-white border border-black/5 p-6" />
        <div className="lg:col-span-7 h-[281px] rounded-[22px] bg-white border border-black/5 p-6" />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading admin dashboard...">
      {/* Welcome banner skeleton */}
      <div className="h-[195px] w-full rounded-[22px] bg-amber-50/60 border border-amber-200/50 p-8 flex justify-between items-center">
        <div className="space-y-4 max-w-xl">
          <div className="h-5 w-48 bg-amber-200/70 rounded-full" />
          <div className="h-10 w-96 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-80 bg-neutral-100 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-11 w-44 bg-amber-300 rounded-xl" />
          <div className="h-10 w-44 bg-white/80 rounded-xl" />
        </div>
      </div>

      {/* 6 Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[140px] rounded-[20px] bg-neutral-100/80 border border-black/5" />
        ))}
      </div>

      {/* Left col (763) + Right col (416) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-[380px] rounded-[22px] bg-white border border-black/5 p-6" />
          <div className="h-[280px] rounded-[22px] bg-white border border-black/5 p-6" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-[340px] rounded-[22px] bg-white border border-black/5 p-6" />
          <div className="h-[320px] rounded-[22px] bg-white border border-black/5 p-6" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
