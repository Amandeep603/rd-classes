"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  FileText,
  Download,
  ArrowRight,
  ArrowDown,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import StudentPhoto from "@/components/shared/StudentPhoto";

export default function ResultsClient({
  toppers = [],
  resultPdfs = [],
}) {
  const [showMeritModal, setShowMeritModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Top 3 toppers for Card 1
  const top3 = useMemo(() => {
    return toppers.slice(0, 3);
  }, [toppers]);

  // Unique years for filters
  const availableYears = useMemo(() => {
    const set = new Set();
    toppers.forEach((t) => {
      if (t.year) set.add(t.year.toString());
      if (t.examYear) set.add(t.examYear.toString());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [toppers]);

  // Filtered toppers for modal
  const filteredToppers = useMemo(() => {
    return toppers.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const school = (t.school || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      if (q && !name.includes(q) && !school.includes(q)) return false;

      const cls = (t.classLevel || t.class || "12").toString().toLowerCase();
      if (selectedClass === "11" && !cls.includes("11")) return false;
      if (selectedClass === "12" && !cls.includes("12")) return false;

      const yr = (t.year || t.examYear || "").toString();
      if (selectedYear !== "All" && yr !== selectedYear) return false;

      return true;
    });
  }, [toppers, searchQuery, selectedClass, selectedYear]);

  // Handle Download Results button click: downloads the first PDF or opens list
  const handleDownloadResults = () => {
    if (resultPdfs.length > 0 && resultPdfs[0]?.fileUrl) {
      window.open(resultPdfs[0].fileUrl, "_blank");
    } else {
      // Fallback: alert or smooth scroll
      const firstRow = document.getElementById("pdf-row-0");
      if (firstRow) {
        firstRow.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* =====================================================================
          CARD 1: MERIT SCORERS & CENTURY SCORERS (Matching Reference 1)
          ===================================================================== */}
      <section
        aria-labelledby="merit-scorers-heading"
        className="rounded-[32px] bg-white border border-[#EEDFCE]/80 shadow-[0_8px_30px_rgba(11,27,58,0.04)] p-6 sm:p-8 lg:p-10 transition-all duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column (span 5): Icon, Heading, Text, Navy Button */}
          <div className="lg:col-span-5 flex flex-col items-start text-left lg:pr-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE6A0] text-[#92400E] flex items-center justify-center shrink-0 mb-4 shadow-2xs">
              <Award className="w-6 h-6 text-[#B45309]" />
            </div>

            <h2
              id="merit-scorers-heading"
              className="text-2xl sm:text-3xl font-black text-[#0B1B3A] tracking-tight leading-tight"
            >
              Merit Scorers &amp;
              <br />
              Century Scorers
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Students felicitated for exceptional scores in Board examinations.
            </p>

            <button
              type="button"
              onClick={() => setShowMeritModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B1B3A] hover:bg-[#15284B] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>View Merit List</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Thin Vertical Divider (Desktop) */}
          <div className="hidden lg:block w-px h-64 bg-slate-200/70 lg:col-span-1 mx-auto" aria-hidden="true" />

          {/* Right Column (span 6): 3 Student Tiles in a row */}
          <div className="lg:col-span-6 w-full">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              {[0, 1, 2].map((idx) => {
                const topper = top3[idx];
                const placeholderScores = ["100/100", "99/100", "98/100"];
                const placeholderClasses = ["Class 12", "Class 12", "Class 11"];

                if (topper) {
                  const score = topper.marks || topper.score || "100";
                  const outOf = topper.outOf || 100;
                  const cls = topper.classLevel || topper.class || "12";
                  const classLabel = cls.toString().includes("11") ? "Class 11" : "Class 12";
                  const photo = topper.photoUrl || topper.photo;

                  return (
                    <div
                      key={topper._id || idx}
                      className="flex flex-col items-center text-center group cursor-pointer"
                      onClick={() => setShowMeritModal(true)}
                    >
                      {/* Photo / Tile Frame */}
                      <div className="w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xs border border-slate-200/80 bg-[#FBF8F3] group-hover:shadow-md transition-shadow relative">
                        {photo ? (
                          <StudentPhoto
                            src={photo}
                            alt={topper.name}
                            aspectRatio="h-full w-full"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 select-none border-2 border-dashed border-slate-300 rounded-2xl sm:rounded-3xl">
                            <span className="text-[11px] sm:text-xs font-extrabold text-slate-600 tracking-wider">
                              TOPPER 0{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-full px-1 mt-0.5">
                              {topper.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Yellow Score Pill */}
                      <div className="mt-2.5 inline-flex items-center px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black shadow-2xs select-none">
                        {score}/{outOf}
                      </div>

                      {/* Class Label */}
                      <span className="mt-1 text-xs font-semibold text-slate-500">
                        {classLabel}
                      </span>
                    </div>
                  );
                }

                // Placeholder tile exactly matching Reference 1
                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-full aspect-square rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-300 bg-[#FBF8F3] flex flex-col items-center justify-center p-3 select-none">
                      <span className="text-[11px] sm:text-xs font-extrabold text-slate-500 tracking-wider">
                        TOPPER 0{idx + 1}
                      </span>
                    </div>

                    <div className="mt-2.5 inline-flex items-center px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black shadow-2xs select-none">
                      {placeholderScores[idx]}
                    </div>

                    <span className="mt-1 text-xs font-semibold text-slate-500">
                      {placeholderClasses[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CARD 2: OFFICIAL RESULT GAZETTE & PDF LISTS (Matching Reference 1)
          ===================================================================== */}
      <section
        aria-labelledby="pdf-lists-heading"
        className="rounded-[32px] bg-white border border-[#EEDFCE]/80 shadow-[0_8px_30px_rgba(11,27,58,0.04)] p-6 sm:p-8 lg:p-10 transition-all duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column (span 5): Document Icon, Heading, Text, Orange Button */}
          <div className="lg:col-span-5 flex flex-col items-start text-left lg:pr-6">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE6A0] text-[#92400E] flex items-center justify-center shrink-0 mb-4 shadow-2xs">
              <FileText className="w-6 h-6 text-[#B45309]" />
            </div>

            <h2
              id="pdf-lists-heading"
              className="text-2xl sm:text-3xl font-black text-[#0B1B3A] tracking-tight leading-tight"
            >
              Official Result
              <br />
              Gazette &amp; PDF Lists
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Download verified marksheets and school-wise performance records in PDF format.
            </p>

            <button
              type="button"
              onClick={handleDownloadResults}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#E65C00] hover:from-[#FFA022] hover:to-[#FF6B00] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Download Results</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Thin Vertical Divider (Desktop) */}
          <div className="hidden lg:block w-px h-64 bg-slate-200/70 lg:col-span-1 mx-auto" aria-hidden="true" />

          {/* Right Column (span 6): 3 PDF Rows */}
          <div className="lg:col-span-6 w-full space-y-3 sm:space-y-3.5">
            {resultPdfs.length === 0 ? (
              // 3 clean list rows matching Reference 1 exactly
              [
                { title: "Class 12 Result Gazette.pdf", key: "c12" },
                { title: "Class 11 Result Gazette.pdf", key: "c11" },
                { title: "Merit List – Class 12.pdf", key: "m12" },
              ].map((fallback, idx) => (
                <div
                  key={fallback.key}
                  id={`pdf-row-${idx}`}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                    <span className="text-sm font-bold text-[#0B1B3A] truncate">
                      {fallback.title}
                    </span>
                  </div>
                  <span className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                    <Download className="w-4 h-4" />
                  </span>
                </div>
              ))
            ) : (
              resultPdfs.slice(0, 3).map((pdf, idx) => (
                <a
                  key={pdf._id || idx}
                  id={`pdf-row-${idx}`}
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  aria-label={`Download ${pdf.title}`}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <FileText className="w-5 h-5 text-slate-500 group-hover:text-[#FF7A00] transition-colors shrink-0" />
                    <span className="text-sm font-bold text-[#0B1B3A] group-hover:text-[#FF7A00] transition-colors truncate">
                      {pdf.title}
                    </span>
                  </div>
                  <span className="p-2 rounded-xl bg-slate-50 group-hover:bg-[#FFF4E0] text-slate-600 group-hover:text-[#FF7A00] transition-colors shrink-0">
                    <Download className="w-4 h-4" />
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          MERIT LIST MODAL / SHEET (Opened by "View Merit List ->")
          ===================================================================== */}
      {showMeritModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="CBSE Board Merit List"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowMeritModal(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-[#FDF8F1]">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0B1B3A]">
                  CBSE Accountancy Merit Scorers
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Consistent 100/100 &amp; 95+ distinction records
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeritModal(false)}
                className="p-2 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                aria-label="Close merit list"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or school..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  {["All", "12", "11"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedClass(c)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        selectedClass === c
                          ? "bg-white text-[#0B1B3A] shadow-xs"
                          : "text-slate-600 hover:text-black"
                      }`}
                    >
                      {c === "All" ? "All Classes" : `Class ${c}`}
                    </button>
                  ))}
                </div>

                {availableYears.length > 0 && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-2 text-[#0B1B3A] focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  >
                    <option value="All">All Years</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Modal Body: Grid of Merit Scorers */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh]">
              {filteredToppers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No merit scorers found matching your criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredToppers.map((t) => {
                    const score = t.marks || t.score || "100";
                    const outOf = t.outOf || 100;
                    const cls = t.classLevel || t.class || "12";
                    const classLabel = cls.toString().includes("11") ? "Class 11" : "Class 12";
                    const photo = t.photoUrl || t.photo;

                    return (
                      <div
                        key={t._id}
                        className="rounded-2xl border border-slate-200/70 bg-[#FFFAF4]/50 p-4 flex flex-col items-center text-center shadow-2xs hover:shadow-md transition-shadow"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3 border border-slate-100">
                          {photo ? (
                            <StudentPhoto
                              src={photo}
                              alt={t.name}
                              aspectRatio="h-full w-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                              RD
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#0B1B3A] line-clamp-1">
                          {t.name}
                        </span>
                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {t.school}
                        </span>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="px-3 py-0.5 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black shadow-2xs">
                            {score}/{outOf}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {classLabel} • {t.year || t.examYear}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMeritModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
