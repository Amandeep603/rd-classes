"use client";

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-2xl bg-black/5 p-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "bg-white text-[#111827] shadow-xs"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                  isActive
                    ? "bg-[#FFC21A] text-neutral-900"
                    : "bg-black/10 text-[#4B5563]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
