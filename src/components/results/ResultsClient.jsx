"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Award,
  FileText,
  Download,
  ArrowRight,
  ArrowDown,
  Search,
  CheckCircle2,
  X,
  ChevronDown,
} from "lucide-react";
import StudentPhoto from "@/components/shared/StudentPhoto";

export default function ResultsClient({
  toppers = [],
  resultPdfs = [],
}) {
  const [showFullMeritList, setShowFullMeritList] = useState(false);
  const [showAllPdfs, setShowAllPdfs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  const pdfsSectionRef = useRef(null);

  // Top 3 toppers for Card 1 right column
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

  // Filtered toppers for full merit list
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

  // Displayed PDFs (first 3 by default)
  const displayedPdfs = showAllPdfs ? resultPdfs : resultPdfs.slice(0, 3);

  const scrollToPdfs = () => {
    setShowAllPdfs(true);
    pdfsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full space-y-10 sm:space-y-12">
      {/* =====================================================================
          CARD 1: MERIT SCORERS & CENTURY SCORERS (Matching Reference 1)
          ===================================================================== */}
      <section
        aria-labelledby="merit-scorers-heading"
        className="rounded-[32px] bg-white border border-amber-100/80 shadow-[0_8px_30px_rgba(11,27,58,0.05)] p-6 sm:p-8 lg:p-10 transition-all duration-300"
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
              onClick={() => setShowFullMeritList((prev) => !prev)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0B1B3A] hover:bg-[#15284B] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{showFullMeritList ? "Hide Merit List" : "View Merit List"}</span>
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  showFullMeritList ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>
          </div>

          {/* Thin Vertical Divider (Desktop) */}
          <div className="hidden lg:block w-px h-64 bg-slate-200/60 lg:col-span-1 mx-auto" aria-hidden="true" />

          {/* Right Column (span 6): 3 Student Tiles in a row */}
          <div className="lg:col-span-6 w-full">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[0, 1, 2].map((idx) => {
                const topper = top3[idx];
                if (topper) {
                  const score = topper.marks || topper.score || "100";
                  const outOf = topper.outOf || 100;
                  const cls = topper.classLevel || topper.class || "12";
                  const classLabel = cls.toString().includes("11") ? "Class 11" : "Class 12";

                  return (
                    <div
                      key={topper._id || idx}
                      className="flex flex-col items-center text-center group"
                    >
                      {/* Photo Frame using IMAGE FIT RULE */}
                      <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-xs border border-slate-100 group-hover:shadow-md transition-shadow">
                        <StudentPhoto
                          src={topper.photoUrl || topper.photo}
                          alt={topper.name}
                          aspectRatio="h-full w-full"
                        />
                      </div>

                      {/* Yellow Score Pill */}
                      <div className="mt-3 inline-flex items-center px-3.5 py-1 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black shadow-2xs select-none">
                        {score}/{outOf}
                      </div>

                      {/* Class Line */}
                      <span className="mt-1 text-xs font-semibold text-slate-500">
                        {classLabel}
                      </span>
                    </div>
                  );
                }

                // Placeholder tile from Reference 1
                const placeholderNum = `0${idx + 1}`;
                const placeholderScores = ["100/100", "99/100", "98/100"];
                const placeholderClasses = ["Class 12", "Class 12", "Class 11"];

                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-full aspect-square rounded-3xl border-2 border-dashed border-slate-300 bg-[#FBF8F3] flex flex-col items-center justify-center p-3 select-none">
                      <span className="text-[11px] sm:text-xs font-extrabold text-slate-500 tracking-wider">
                        TOPPER {placeholderNum}
                      </span>
                    </div>

                    <div className="mt-3 inline-flex items-center px-3.5 py-1 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black shadow-2xs select-none">
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

        {/* Expandable Full Merit List Section */}
        {showFullMeritList && (
          <div className="mt-10 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name or school..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Class Filters */}
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

                {/* Year Filter */}
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

            {/* Merit Grid */}
            {filteredToppers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No merit scorers matched your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredToppers.map((t) => {
                  const score = t.marks || t.score || "100";
                  const outOf = t.outOf || 100;
                  const cls = t.classLevel || t.class || "12";
                  const classLabel = cls.toString().includes("11") ? "Class 11" : "Class 12";

                  return (
                    <div
                      key={t._id}
                      className="rounded-2xl border border-slate-100 bg-[#FFFAF4]/60 p-4 flex flex-col items-center text-center shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden mb-3">
                        <StudentPhoto
                          src={t.photoUrl || t.photo}
                          alt={t.name}
                          aspectRatio="h-full w-full"
                        />
                      </div>
                      <span className="text-sm font-bold text-[#0B1B3A] line-clamp-1">
                        {t.name}
                      </span>
                      <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {t.school}
                      </span>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="px-3 py-0.5 rounded-full bg-[#FFE28A] text-[#0B1B3A] text-xs font-black">
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
        )}
      </section>

      {/* =====================================================================
          CARD 2: OFFICIAL RESULT GAZETTE & PDF LISTS (Matching Reference 1)
          ===================================================================== */}
      <section
        ref={pdfsSectionRef}
        aria-labelledby="pdf-lists-heading"
        className="rounded-[32px] bg-white border border-amber-100/80 shadow-[0_8px_30px_rgba(11,27,58,0.05)] p-6 sm:p-8 lg:p-10 transition-all duration-300"
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
              onClick={scrollToPdfs}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#E65C00] hover:from-[#FFA022] hover:to-[#FF6B00] px-7 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Download Results</span>
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Thin Vertical Divider (Desktop) */}
          <div className="hidden lg:block w-px h-64 bg-slate-200/60 lg:col-span-1 mx-auto" aria-hidden="true" />

          {/* Right Column (span 6): Stack of PDF rows */}
          <div className="lg:col-span-6 w-full space-y-3.5">
            {resultPdfs.length === 0 ? (
              // Friendly fallback PDF list matching Reference 1
              [
                "Class 12 Result Gazette.pdf",
                "Class 11 Result Gazette.pdf",
                "Merit List – Class 12.pdf",
              ].map((fallbackTitle, idx) => (
                <div
                  key={idx}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200/70 bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                    <span className="text-sm font-bold text-[#0B1B3A] truncate">
                      {fallbackTitle}
                    </span>
                  </div>
                  <span className="p-2 rounded-xl bg-slate-50 text-slate-600 shrink-0">
                    <Download className="w-4 h-4" />
                  </span>
                </div>
              ))
            ) : (
              displayedPdfs.map((pdf) => (
                <a
                  key={pdf._id}
                  href={pdf.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  aria-label={`Download ${pdf.title}`}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-slate-200/70 bg-white shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
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

            {/* Show all / Show less toggle if more than 3 PDFs */}
            {resultPdfs.length > 3 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllPdfs((prev) => !prev)}
                  className="text-xs font-bold text-slate-600 hover:text-black inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllPdfs ? "Show Less" : `Show All (${resultPdfs.length} PDFs)`}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showAllPdfs ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

