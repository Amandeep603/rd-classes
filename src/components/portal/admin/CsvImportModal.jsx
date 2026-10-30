"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, ArrowRight } from "lucide-react";
import Button from "../ui/Button";

export default function CsvImportModal({ isOpen, onClose, onImportSuccess }) {
  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target?.result || "");
        setPreviewData(null);
        setErrorMsg("");
      };
      reader.readAsText(selected);
    }
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setErrorMsg("Please upload a CSV file or paste CSV content.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/lectures/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, preview: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse preview");
      }
      setPreviewData(data);
    } catch (err) {
      setErrorMsg(err.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/lectures/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, preview: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import CSV");
      }
      if (onImportSuccess) {
        onImportSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Import execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] bg-[#FAFCFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2A4A]">Import Lectures from CSV</h3>
              <p className="text-xs text-[#64748B]">
                Upload or paste CSV with columns: course, book_no, book_title, chapter_no, chapter_title, lecture_no, title, duration_seconds, vimeo_url, is_free
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!previewData ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0066FF] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#F8FAFC] hover:bg-[#F0F7FF]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0B2A4A]">
                  {file ? file.name : "Click to browse or drop CSV file here"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports standard CSV format with comma delimiters
                </p>
              </div>

              {/* Or Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#334155]">Or paste CSV rows directly:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(
                        `course,book_no,book_title,chapter_no,chapter_title,lecture_no,title,duration_seconds,vimeo_url,is_free\n"Class 12 Accountancy",1,"Accounting for Partnership Firms",1,"Partnership Fundamentals",1,"Sample Lecture",1200,"",false`
                      );
                    }}
                    className="text-[11px] font-semibold text-[#0066FF] hover:underline"
                  >
                    Insert template header
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    setPreviewData(null);
                  }}
                  placeholder="Paste CSV rows here..."
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-mono focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Counts Banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xl font-extrabold text-emerald-800">{previewData.newCount}</div>
                  <div className="text-xs font-semibold text-emerald-600">New Lectures to Add</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-xl font-extrabold text-blue-800">{previewData.updatedCount}</div>
                  <div className="text-xs font-semibold text-blue-600">Existing to Update</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xl font-extrabold text-gray-700">{previewData.totalRows}</div>
                  <div className="text-xs font-semibold text-gray-500">Total Rows in CSV</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 font-bold text-[#64748B]">
                    <tr>
                      <th className="py-2 px-3 w-16">Status</th>
                      <th className="py-2 px-3 w-12">Ch</th>
                      <th className="py-2 px-3 w-12">Lec</th>
                      <th className="py-2 px-3">Title</th>
                      <th className="py-2 px-3">Vimeo Link</th>
                      <th className="py-2 px-3 w-16 text-center">Free</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {previewData.previewRows?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              row.status === "new"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500">{row.chapterNo || row.chapter}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#0B2A4A]">#{row.lectureNo}</td>
                        <td className="py-2 px-3 font-medium text-[#1E293B] max-w-xs truncate" title={row.title}>
                          {row.title}
                        </td>
                        <td className="py-2 px-3 text-gray-500 font-mono text-[11px] truncate max-w-[140px]">
                          {row.vimeoUrl || "—"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isFree ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              FREE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-500">LOCK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.totalRows > 15 && (
                <p className="text-[11px] text-gray-500 text-center">
                  Showing first 15 of {previewData.totalRows} lectures. All {previewData.totalRows} will be imported.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9] bg-[#FAFCFF]">
          {previewData ? (
            <button
              type="button"
              onClick={() => setPreviewData(null)}
              className="text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              ← Back to Edit CSV
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            {!previewData ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading || !csvText.trim()}
                className="px-4 py-2 rounded-xl bg-[#0B2A4A] hover:bg-[#15345E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Preview Import</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm &amp; Import ({previewData.totalRows} Lectures)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

