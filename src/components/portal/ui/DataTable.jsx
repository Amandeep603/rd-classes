export default function DataTable({
  columns = [],
  data = [],
  keyField = "_id",
  emptyMessage = "No records found.",
  renderMobileCard,
  className = "",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-[22px] border border-black/5 bg-white p-12 text-center text-sm font-medium text-[#6B7280]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {data.map((row, idx) => (
          <div
            key={row[keyField] || idx}
            className="rounded-[20px] border border-black/5 bg-white p-4 shadow-xs"
          >
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-[#6B7280]">{col.label}</span>
                    <span className="text-[#111827]">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto rounded-[22px] border border-black/5 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 bg-neutral-50/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6B7280] ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-[#374151]">
            {data.map((row, idx) => (
              <tr
                key={row[keyField] || idx}
                className="transition-colors hover:bg-neutral-50/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-4 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${col.cellClassName || ""}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
