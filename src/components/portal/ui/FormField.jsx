export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
  id,
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-[#1F2937]"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-[#6B7280]">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  id,
  type = "text",
  error,
  className = "",
  ...props
}) {
  return (
    <input
      id={id}
      type={type}
      aria-invalid={Boolean(error)}
      className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 ${
        error ? "border-red-400 bg-red-50/20" : "border-black/10"
      } ${className}`}
      {...props}
    />
  );
}

export function Select({
  id,
  error,
  children,
  className = "",
  ...props
}) {
  return (
    <select
      id={id}
      aria-invalid={Boolean(error)}
      className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#111827] transition-all focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 ${
        error ? "border-red-400 bg-red-50/20" : "border-black/10"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  id,
  rows = 3,
  error,
  className = "",
  ...props
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={Boolean(error)}
      className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] transition-all focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 ${
        error ? "border-red-400 bg-red-50/20" : "border-black/10"
      } ${className}`}
      {...props}
    />
  );
}

export function Switch({
  checked,
  onChange,
  id,
  label,
  disabled = false,
  className = "",
}) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="h-6 w-11 rounded-full bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FFC21A]/30 peer-checked:bg-[#FFC21A] transition-colors" />
        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-xs" />
      </div>
      {label && <span className="text-sm font-medium text-[#374151]">{label}</span>}
    </label>
  );
}

export function DatePicker({
  id,
  value,
  onChange,
  error,
  className = "",
  ...props
}) {
  return (
    <input
      id={id}
      type="date"
      value={value}
      onChange={onChange}
      aria-invalid={Boolean(error)}
      className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#111827] transition-all focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 ${
        error ? "border-red-400 bg-red-50/20" : "border-black/10"
      } ${className}`}
      {...props}
    />
  );
}
