export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-white/60 p-10 text-center ${className}`}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 shadow-xs">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-[#111827]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#6B7280]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
