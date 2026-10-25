"use client";

import { useState, useId } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Mail,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  BookOpen,
} from "lucide-react";
import { importStudentsFromCSVAction } from "@/server/actions/admin.students.actions.js";
import BulkEmailProgressModal from "./BulkEmailProgressModal";

export default function CSVImportWizard({ availableCourses = [] }) {
  const fileInputId = useId();
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [parsingError, setParsingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results after server action completes
  const [importResults, setImportResults] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Available course lookup map
  const courseMap = new Map();
  availableCourses.forEach((c) => {
    courseMap.set(c.slug.toLowerCase(), c);
    courseMap.set(c._id.toString(), c);
    courseMap.set(c.title.toLowerCase().trim(), c);
  });

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = "name,email,phone,class,courses,validUntil,deviceLimit,loginId,password";
    const sampleCourse = availableCourses[0]?.slug || "physics-class-12";
    const row1 = `Rahul Sharma,rahul@example.com,9876543210,12,${sampleCourse},2026-03-31,1,,`;
    const row2 = `Pooja Verma,pooja@example.com,9876543211,12,${sampleCourse},2026-03-31,1,,`;
    const content = `${headers}\n${row1}\n${row2}\n`;

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "rd_students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV Parser
  const parseCSVContent = (text) => {
    setParsingError("");
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setParsingError("CSV must contain a header row and at least one data row.");
      setParsedRows([]);
      return;
    }

    const headerTokens = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

    const nameIdx = headerTokens.indexOf("name");
    if (nameIdx === -1) {
      setParsingError("Header must include a 'name' column.");
      setParsedRows([]);
      return;
    }

    const emailIdx = headerTokens.indexOf("email");
    const phoneIdx = headerTokens.indexOf("phone");
    const classIdx = headerTokens.indexOf("class") !== -1 ? headerTokens.indexOf("class") : headerTokens.indexOf("classname");
    const coursesIdx = headerTokens.indexOf("courses");
    const validUntilIdx = headerTokens.indexOf("validuntil");
    const deviceLimitIdx = headerTokens.indexOf("devicelimit");
    const loginIdIdx = headerTokens.indexOf("loginid");
    const passwordIdx = headerTokens.indexOf("password");

    const rows = [];
    const seenLogins = new Set();

    for (let i = 1; i < lines.length; i++) {
      // Split respecting quotes
      const rawLine = lines[i];
      const tokens = [];
      let current = "";
      let inQuotes = false;

      for (let c = 0; c < rawLine.length; c++) {
        const char = rawLine[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          tokens.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      tokens.push(current.trim().replace(/^["']|["']$/g, ""));

      const rowNum = i + 1;
      const name = (tokens[nameIdx] || "").trim();
      const email = emailIdx !== -1 ? (tokens[emailIdx] || "").trim().toLowerCase() : "";
      const phone = phoneIdx !== -1 ? (tokens[phoneIdx] || "").trim() : "";
      const className = classIdx !== -1 ? (tokens[classIdx] || "").trim() || "12" : "12";
      const coursesStr = coursesIdx !== -1 ? (tokens[coursesIdx] || "").trim() : "";
      const validUntil = validUntilIdx !== -1 ? (tokens[validUntilIdx] || "").trim() : "";
      const deviceLimit = deviceLimitIdx !== -1 ? parseInt(tokens[deviceLimitIdx], 10) || 1 : 1;
      const loginId = loginIdIdx !== -1 ? (tokens[loginIdIdx] || "").trim().toLowerCase() : "";
      const password = passwordIdx !== -1 ? (tokens[passwordIdx] || "").trim() : "";

      const errors = [];

      if (!name) {
        errors.push("Name is required");
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Invalid email format");
      }

      if (validUntil) {
        const d = new Date(validUntil);
        if (isNaN(d.getTime())) {
          errors.push("Invalid date format (use YYYY-MM-DD)");
        } else if (d < new Date()) {
          errors.push("Validity date cannot be in the past");
        }
      }

      if (loginId) {
        if (seenLogins.has(loginId)) {
          errors.push(`Duplicate loginId "${loginId}" in CSV`);
        } else {
          seenLogins.add(loginId);
        }
      }

      if (password && password.length < 6) {
        errors.push("Password must be at least 6 characters");
      }

      // Validate course tokens
      const matchedCourses = [];
      if (coursesStr) {
        const courseTokens = coursesStr
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

        for (const ct of courseTokens) {
          const match = courseMap.get(ct);
          if (!match) {
            errors.push(`Unknown course "${ct}"`);
          } else if (!matchedCourses.some((mc) => mc._id === match._id)) {
            matchedCourses.push(match);
          }
        }
      }

      rows.push({
        rowNum,
        name,
        email,
        phone,
        className,
        courses: coursesStr,
        matchedCourses,
        validUntil,
        deviceLimit,
        loginId,
        password,
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setCsvText(text);
        parseCSVContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    setParsingError("");

    try {
      const res = await importStudentsFromCSVAction({
        rows: validRows.map((r) => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          className: r.className,
          courses: r.courses,
          validUntil: r.validUntil,
          deviceLimit: r.deviceLimit,
          loginId: r.loginId,
          password: r.password,
        })),
      });

      if (!res.success) {
        setParsingError(res.error || "Import failed.");
      } else {
        setImportResults(res);
      }
    } catch (err) {
      setParsingError(err.message || "An unexpected error occurred during import.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadResultsCSV = () => {
    if (!importResults?.created) return;
    const rows = [["Name", "Login ID", "Password", "Email", "Class", "Courses"]];
    importResults.created.forEach((c) => {
      rows.push([
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.loginId.replace(/"/g, '""')}"`,
        `"${c.rawPassword.replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${c.className || ""}"`,
        `"${(c.courses || []).join("; ").replace(/"/g, '""')}"`,
      ]);
    });
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rd_imported_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5">
        <div>
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Students List</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            Bulk Student Import
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Upload CSV to batch-create accounts, assign courses, and auto-email credentials
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 transition-colors self-start sm:self-center"
        >
          <Download className="h-4 w-4 text-amber-600" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Available Courses Reference Chips */}
      {availableCourses.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-amber-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
            <BookOpen className="h-4 w-4 text-amber-700" />
            <span>Available Course Slugs (Use in &quot;courses&quot; column):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableCourses.map((c) => (
              <span
                key={c._id}
                className="rounded-lg bg-white border border-amber-200/80 px-2.5 py-1 text-[11px] font-mono font-bold text-neutral-800 shadow-2xs"
                title={c.title}
              >
                {c.slug}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* If Import Succeeded: Show Results & Email Credentials Action */}
      {importResults ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                <CheckCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-emerald-950">
                  Import Successful!
                </h2>
                <p className="text-xs text-emerald-800">
                  Created {importResults.created?.length || 0} student account(s)
                  {importResults.skipped?.length > 0 ? ` (${importResults.skipped.length} skipped)` : ""}.
                </p>
              </div>
            </div>

            {/* Crucial Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmailModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-5 py-3 text-sm font-extrabold text-neutral-950 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] transition-all cursor-pointer"
              >
                <Mail className="h-4 w-4 stroke-[2.5]" />
                <span>Email Credentials to All Students</span>
              </button>

              <button
                type="button"
                onClick={downloadResultsCSV}
                className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-colors shadow-2xs"
              >
                <Download className="h-4 w-4 text-emerald-700" />
                <span>Download Credentials CSV Backup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportResults(null);
                  setParsedRows([]);
                  setCsvText("");
                }}
                className="rounded-2xl px-4 py-3 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors ml-auto"
              >
                Import More Students
              </button>
            </div>
          </div>

          {/* Credentials Display Table */}
          <div className="rounded-3xl border border-black/5 bg-white shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">
                  Generated Credentials (Shown Once)
                </h3>
                <p className="text-xs text-neutral-500">
                  Passwords are encrypted on the server. Download CSV or email them now.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 font-mono">
                {importResults.created?.length || 0} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-black/5 font-extrabold text-neutral-500 uppercase text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Login ID</th>
                    <th className="px-6 py-3">Password</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Enrolled Courses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {importResults.created?.map((st) => (
                    <tr key={st.studentId} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-3 font-bold text-neutral-900">{st.name}</td>
                      <td className="px-6 py-3 font-mono font-bold text-neutral-700">
                        {st.loginId}
                      </td>
                      <td className="px-6 py-3">
                        <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-xl px-2.5 py-1 font-mono font-bold text-neutral-900">
                          <span>
                            {showPasswords[st.studentId]
                              ? st.rawPassword
                              : "••••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(st.studentId)}
                            className="text-neutral-400 hover:text-neutral-800"
                          >
                            {showPasswords[st.studentId] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(st.rawPassword, st.studentId)}
                            className="text-neutral-400 hover:text-neutral-800"
                          >
                            {copiedId === st.studentId ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {st.email ? (
                          <span className="font-mono text-neutral-700">{st.email}</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            No email (Skipped)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-neutral-600">
                        {st.courses?.length > 0 ? st.courses.join(", ") : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* If Not Yet Submitted: Upload & Validation Phase */
        <div className="space-y-6">
          {/* Upload / Paste Area */}
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-neutral-900">
              1. Upload CSV File or Paste Contents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Dropzone */}
              <label
                htmlFor={fileInputId}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/60 p-8 text-center hover:border-amber-400 hover:bg-amber-50/20 transition-all cursor-pointer group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-600 shadow-2xs group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6 text-amber-600" />
                </div>
                <div className="mt-3 text-xs font-bold text-neutral-800">
                  Click to browse or drag & drop CSV file
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Standard comma-separated format (.csv) up to 500 rows
                </p>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Paste Text Area */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-500 font-bold">
                  <span>Or paste CSV raw text:</span>
                  {csvText && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvText("");
                        setParsedRows([]);
                        setParsingError("");
                      }}
                      className="text-neutral-400 hover:text-red-600 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    parseCSVContent(e.target.value);
                  }}
                  placeholder="name,email,phone,class,courses,validUntil&#10;Rahul Sharma,rahul@example.com,9876543210,12,physics-class-12,2026-03-31"
                  className="w-full flex-1 rounded-2xl border border-black/10 p-3 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:border-[#FFC21A] focus:outline-none"
                />
              </div>
            </div>

            {parsingError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{parsingError}</span>
              </div>
            )}
          </div>

          {/* Validation & Preview Table */}
          {parsedRows.length > 0 && (
            <div className="rounded-3xl border border-black/5 bg-white shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-neutral-900">
                    2. Data Verification Preview
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Review parsed rows before committing to database
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700">
                    Total: {parsedRows.length}
                  </span>
                  <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                    Ready: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800">
                      Errors: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-2xl border border-black/5 max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-black/5 font-extrabold text-neutral-500 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Courses</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNum}
                        className={r.isValid ? "hover:bg-neutral-50/50" : "bg-red-50/30"}
                      >
                        <td className="px-4 py-3 font-mono text-neutral-400">{r.rowNum}</td>
                        <td className="px-4 py-3 font-bold text-neutral-900">{r.name || "—"}</td>
                        <td className="px-4 py-3 font-mono text-neutral-700">
                          {r.email || (
                            <span className="text-neutral-400 italic">No email</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-600">{r.phone || "—"}</td>
                        <td className="px-4 py-3 font-bold">Class {r.className}</td>
                        <td className="px-4 py-3">
                          {r.matchedCourses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.matchedCourses.map((mc) => (
                                <span
                                  key={mc._id}
                                  className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900"
                                >
                                  {mc.title}
                                </span>
                              ))}
                            </div>
                          ) : r.courses ? (
                            <span className="text-red-600 font-mono">{r.courses}</span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle className="h-3 w-3" />
                              <span>Ready</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {r.errors.map((err, eIdx) => (
                                <span
                                  key={eIdx}
                                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 mr-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{err}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setCsvText("");
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-100 transition-colors"
                >
                  Cancel / Re-upload
                </button>

                <button
                  type="button"
                  disabled={validCount === 0 || isSubmitting}
                  onClick={handleImportSubmit}
                  className="flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-6 py-3 text-sm font-extrabold text-neutral-950 shadow-[0_4px_14px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-950" />
                      <span>Creating Accounts...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 stroke-[2.5]" />
                      <span>Import {validCount} Valid Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Email Modal */}
      {importResults && (
        <BulkEmailProgressModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          mode="import"
          items={importResults.created || []}
        />
      )}
    </div>
  );
}
