"use client";

export default function FormField({
  label,
  name,
  error,
  helperText,
  hint,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  rows,
  as,
  className = "",
  children,
  ...rest
}) {
  const effectiveHint = helperText || hint;
  const isTextarea = as === "textarea" || type === "textarea";

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-bold uppercase tracking-wider text-[#374151]"
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      {children ? (
        <div>{children}</div>
      ) : isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows || 3}
          className={`w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A] disabled:opacity-50 transition-colors ${
            error ? "border-red-400 focus:ring-red-300" : ""
          } ${className}`}
          {...rest}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          className={`w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC21A] disabled:opacity-50 transition-colors ${
            error ? "border-red-400 focus:ring-red-300" : ""
          } ${className}`}
          {...rest}
        />
      )}

      {effectiveHint && !error && (
        <p className="text-[11px] text-[#6B7280]">{effectiveHint}</p>
      )}

      {error && (
        <p className="text-xs font-semibold text-[#DC2626]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
