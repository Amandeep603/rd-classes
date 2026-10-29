"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from "lucide-react";

export default function DataTable({
  columns = [],
  data = [],
  keyField = "_id",
  keyExtractor = null,
  searchPlaceholder = "Search records...",
  searchFields = [],
  pageSize = 10,
  isLoading = false,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries to display at this moment.",
  emptyAction = null,
  emptyState = null,
  pagination = null,
  hideSearch = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const isBusy = Boolean(isLoading || loading);

  // Resolved empty state props
  const resolvedEmptyTitle = emptyState?.title || emptyTitle;
  const resolvedEmptyDesc = emptyState?.message || emptyState?.description || emptyDescription;
  const resolvedEmptyAction = emptyAction || (emptyState?.actionLabel && emptyState?.onAction ? (
    <button
      type="button"
      onClick={emptyState.onAction}
      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-neutral-900 bg-[#FFC21A] hover:bg-[#e5ae17] rounded-xl transition-colors cursor-pointer"
    >
      {emptyState.actionLabel}
    </button>
  ) : null);

  // Filter (only client-side filter if not using external pagination search)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || pagination) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) => {
      if (searchFields.length > 0) {
        return searchFields.some((f) => {
          const val = row[f];
          return val ? String(val).toLowerCase().includes(q) : false;
        });
      }
      return Object.values(row).some((val) =>
        val ? String(val).toLowerCase().includes(q) : false
      );
    });
  }, [data, searchQuery, searchFields, pagination]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      const comp = valA < valB ? -1 : 1;
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginate: use external pagination if provided, otherwise client-side slice
  const isServerPagination = Boolean(pagination && typeof pagination.onPageChange === "function");
  const totalPages = isServerPagination
    ? (pagination.totalPages || 1)
    : Math.max(1, Math.ceil(sortedData.length / pageSize));

  const pageData = useMemo(() => {
    if (isServerPagination) {
      return sortedData;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, isServerPagination, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const totalCount = isServerPagination
    ? (typeof pagination.total === "number" ? pagination.total : sortedData.length)
    : sortedData.length;

  return (
    <div className="rounded-[20px] bg-white border border-black/5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Search Header */}
      {!hideSearch && (
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b border-black/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-10 rounded-xl border border-black/10 bg-[#FBF8F1]/60 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#FFC21A] focus:bg-white focus:outline-none transition-colors"
            />
          </div>
          <div className="text-xs font-semibold text-[#6B7280]">
            Total: <span className="text-[#111827] font-bold">{totalCount}</span>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FBF8F1]/80 text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-black/5">
            <tr>
              {columns.map((col) => {
                const key = col.field || col.accessor || col.header;
                const fieldName = col.field || col.accessor;
                return (
                  <th
                    key={key}
                    className={`px-5 py-3.5 ${
                      col.sortable ? "cursor-pointer select-none hover:text-[#111827]" : ""
                    }`}
                    onClick={() => col.sortable && fieldName && handleSort(fieldName)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown className="h-3 w-3 text-[#9CA3AF]" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {isBusy ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((c, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-black/6 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length > 0 ? (
              pageData.map((row, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(row)
                  : (row[keyField] || row._id || rowIdx);
                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-[#FBF8F1]/40 transition-colors"
                  >
                    {columns.map((col) => {
                      const key = col.field || col.accessor || col.header;
                      const renderFn = col.render || col.cell;
                      const fieldName = col.field || col.accessor;
                      const cellContent = renderFn
                        ? renderFn(row)
                        : (fieldName ? row[fieldName] : null);

                      return (
                        <td key={key} className="px-5 py-4 text-[#374151]">
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : null}
          </tbody>
        </table>

        {/* Empty State */}
        {!isBusy && pageData.length === 0 && (
          <div className="py-16 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8E6] text-[#B47500] mb-3">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">{resolvedEmptyTitle}</h3>
            <p className="mt-1 text-sm text-[#6B7280] max-w-sm mx-auto">
              {resolvedEmptyDesc}
            </p>
            {resolvedEmptyAction && <div className="mt-4">{resolvedEmptyAction}</div>}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!isBusy && (isServerPagination ? totalPages > 1 : sortedData.length > pageSize) && (
        <div className="flex items-center justify-between border-t border-black/5 px-5 py-3.5 bg-white text-xs font-semibold text-[#6B7280]">
          <div>
            Page {isServerPagination ? pagination.page : currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isServerPagination ? pagination.page <= 1 : currentPage <= 1}
              onClick={() => {
                if (isServerPagination) {
                  pagination.onPageChange(Math.max(1, pagination.page - 1));
                } else {
                  setCurrentPage((p) => Math.max(1, p - 1));
                }
              }}
              className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={isServerPagination ? pagination.page >= totalPages : currentPage >= totalPages}
              onClick={() => {
                if (isServerPagination) {
                  pagination.onPageChange(Math.min(totalPages, pagination.page + 1));
                } else {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }
              }}
              className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
