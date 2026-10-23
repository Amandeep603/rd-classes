export default function ProgressBar({
  value = 0,
  max = 100,
  tone = "yellow",
  height = 8,
  className = "",
  showGlow = false,
}) {
  const clamped = Math.max(0, Math.min(max, Number(value) || 0));
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10 ${className}`}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`portal-progress-bar h-full rounded-full transition-all duration-700 ease-out ${showGlow ? "shadow-[0_0_12px_rgba(255,194,26,0.6)]" : ""}`}
        data-tone={tone}
        style={{
          width: `${percent}%`,
          background: tone === "yellow" ? "var(--portal-yellow-gradient)" : undefined,
        }}
      />
    </div>
  );
}
