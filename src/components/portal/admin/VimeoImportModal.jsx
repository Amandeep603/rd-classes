"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Video,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import { parseVimeoUrl } from "@/lib/vimeoUtils";

function cleanTitle(rawName) {
  if (!rawName) return "Untitled Lecture";
  return rawName.replace(/\.(mp4|mov|avi|mkv|webm|m4v)$/i, "").trim();
}

function parsePart(title, defaultIdx = 1) {
  if (!title) return defaultIdx;
  const matchClass = title.match(
    /(?:class|part|lecture|lec|session|ch|no\.?|#)\s*(\d+)/i
  );
  if (matchClass && matchClass[1]) {
    const num = parseInt(matchClass[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  const matchTrailing = title.match(/\b(\d+)\b/);
  if (matchTrailing && matchTrailing[1]) {
    const num = parseInt(matchTrailing[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return defaultIdx;
}

function formatDurationSec(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseDurationString(str) {
  if (!str) return 0;
  if (typeof str === "number") return str;
  const parts = String(str).trim().split(":").map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const parsed = parseInt(str, 10);
  return !isNaN(parsed) ? parsed : 0;
}

export default function VimeoImportModal({
  isOpen,
  onClose,
  courseId,
  courseTitle = "Selected Course",
  defaultBookId,
  defaultChapterId,
  books = [],
  chapters = [],
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState("vimeo"); // 'vimeo' | 'file'
  const [step, setStep] = useState(1); // 1: Folders, 2: Preview, 3: Result

  // Vimeo Folder State
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [foldersError, setFoldersError] = useState("");
  const [folders, setFolders] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [folderSearch, setFolderSearch] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState(new Set());

  // Videos Preview State
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // File Upload State
  const [fileData, setFileData] = useState(null);
  const [fileError, setFileError] = useState("");
  const [filePreviewRows, setFilePreviewRows] = useState([]);
  const fileInputRef = useRef(null);

  // Load Vimeo folders on modal open
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedFolderIds(new Set());
      setPreviewVideos([]);
      setImportResult(null);
      setFilePreviewRows([]);
      setFileData(null);
      setFileError("");
      return;
    }

    async function loadFolders() {
      setLoadingFolders(true);
      setFoldersError("");
      try {
        const res = await fetch("/api/admin/vimeo/folders");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load Vimeo folders");
        }
        setFolders(data.folders || []);
        setFolderTree(data.tree || []);

        // Expand top 2 levels by default for easy navigation
        const initialExpanded = new Set();
        function markExpanded(nodes, depth = 0) {
          nodes.forEach((n) => {
            initialExpanded.add(n.id);
            if (depth < 2 && n.children && n.children.length > 0) {
              markExpanded(n.children, depth + 1);
            }
          });
        }
        markExpanded(data.tree || []);
        setExpandedFolders(initialExpanded);
      } catch (err) {
        setFoldersError(err.message);
      } finally {
        setLoadingFolders(false);
      }
    }

    loadFolders();
  }, [isOpen]);

  // Map of folder id -> node for descendant traversal
  const folderMap = useMemo(() => {
    const map = new Map();
    function walk(node) {
      map.set(node.id, node);
      if (node.children) {
        node.children.forEach(walk);
      }
    }
    folderTree.forEach(walk);
    return map;
  }, [folderTree]);

  // Toggle folder expansion
  const toggleExpand = (id) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper: get all descendant IDs of a folder node
  const getDescendantIds = (nodeId) => {
    const ids = [];
    const root = folderMap.get(nodeId);
    if (!root) return ids;

    function collect(n) {
      ids.push(n.id);
      if (n.children && n.children.length > 0) {
        n.children.forEach(collect);
      }
    }
    collect(root);
    return ids;
  };

  // Handle folder checkbox change (propagates down to all subfolders)
  const handleToggleFolderCheckbox = (nodeId) => {
    const targetIds = getDescendantIds(nodeId);
    const isCurrentlyChecked = selectedFolderIds.has(nodeId);

    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyChecked) {
        targetIds.forEach((id) => next.delete(id));
      } else {
        targetIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Count total videos selected across all checked folders
  const totalSelectedVideos = useMemo(() => {
    let sum = 0;
    selectedFolderIds.forEach((id) => {
      const f = folders.find((item) => item.id === id);
      if (f) sum += f.videoCount || 0;
    });
    return sum;
  }, [selectedFolderIds, folders]);

  // Step 1 -> Step 2: Fetch videos for all selected folders
  const handleProceedToPreview = async () => {
    if (selectedFolderIds.size === 0) return;
    setLoadingVideos(true);
    setFoldersError("");

    try {
      const folderIdList = Array.from(selectedFolderIds);
      const allFetched = [];

      for (const fId of folderIdList) {
        const folderDoc = folders.find((f) => f.id === fId);
        if (!folderDoc) continue;

        // Skip parent container folders with 0 videos
        if (folderDoc.videoCount === 0) continue;

        const res = await fetch(`/api/admin/vimeo/folders/${fId}/videos`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to fetch videos for ${folderDoc.name}`);
        }

        // Infer Book and Chapter from folder and its ancestors
        // Ancestors are e.g. ['Book 1', 'Class 12th']
        const ancestors = folderDoc.ancestors || [];
        const bookName = ancestors[0] || folderDoc.name || "Book 1";
        const chapterName = folderDoc.name || "General";

        const videosWithMeta = (data.videos || []).map((v, vIdx) => {
          const cleaned = cleanTitle(v.name);
          const part = parsePart(cleaned, vIdx + 1);

          return {
            vimeoId: v.vimeoId,
            vimeoHash: v.vimeoHash,
            originalName: v.name,
            title: cleaned,
            partNumber: part,
            book: bookName,
            chapter: chapterName,
            duration: v.duration,
            thumbnail: v.thumbnail,
            link: v.link,
            privacyView: v.privacyView,
            embedPrivacy: v.embedPrivacy,
            isPublicWarning: v.isPublicWarning,
          };
        });

        allFetched.push(...videosWithMeta);
      }

      // Natural sort by Title so "class 2" comes before "class 10"
      allFetched.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

      setPreviewVideos(allFetched);
      setStep(2);
    } catch (err) {
      setFoldersError(err.message || "Failed to load videos");
    } finally {
      setLoadingVideos(false);
    }
  };

  // Editable cell update in preview table
  const handleUpdatePreviewCell = (index, field, value) => {
    setPreviewVideos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Step 2 -> Step 3: Execute Import
  const handleExecuteImport = async () => {
    if (previewVideos.length === 0) return;
    setImporting(true);
    try {
      const payload = {
        courseId,
        defaultBookId,
        defaultChapterId,
        items: previewVideos.map((v) => ({
          book: v.book,
          chapter: v.chapter,
          title: v.title,
          partNumber: Number(v.partNumber) || 1,
          vimeoId: v.vimeoId,
          vimeoHash: v.vimeoHash,
          duration: v.duration,
          link: v.link,
          isPublicWarning: v.isPublicWarning,
        })),
      };

      const res = await fetch("/api/admin/lectures/import-vimeo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data);
      setStep(3);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      alert("Error importing lectures: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // File Upload Handlers (Tab 2)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setFileData(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (rows.length === 0) {
          throw new Error("File contains no data rows.");
        }

        // Validate and normalize rows
        const normalized = rows.map((r, rIdx) => {
          const bookVal = r.book || r.Book || r["Book Name"] || "Book 1";
          const chapterVal = r.chapter || r.Chapter || r["Chapter Name"] || "General";
          const titleVal = r.title || r.Title || r["Lecture Title"] || `Lecture ${rIdx + 1}`;
          const linkVal = r.link || r.Link || r.url || r.URL || r.vimeoId || "";
          const durRaw = r.duration || r.Duration || r["Duration (mm:ss)"] || "";
          const durSec = parseDurationString(durRaw);
          const freeVal = String(r.free || r.Free || r.isFree || "").toLowerCase();
          const isFree = freeVal === "yes" || freeVal === "true" || freeVal === "1";

          const parsed = parseVimeoUrl(linkVal);

          return {
            book: bookVal.trim(),
            chapter: chapterVal.trim(),
            title: cleanTitle(titleVal),
            partNumber: parsePart(titleVal, rIdx + 1),
            link: linkVal.trim(),
            vimeoId: parsed.vimeoId || "",
            vimeoHash: parsed.vimeoHash || "",
            duration: durSec,
            isFree,
            valid: Boolean(titleVal && (parsed.vimeoId || linkVal)),
          };
        });

        // Natural sort
        normalized.sort((a, b) =>
          a.title.localeCompare(b.title, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );

        setFilePreviewRows(normalized);
      } catch (err) {
        setFileError("Error parsing file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteFileImport = async () => {
    const validRows = filePreviewRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      alert("No valid rows to import.");
      return;
    }

    setImporting(true);
    try {
      const payload = {
        courseId,
        defaultBookId,
        defaultChapterId,
        items: validRows.map((v) => ({
          book: v.book,
          chapter: v.chapter,
          title: v.title,
          partNumber: Number(v.partNumber) || 1,
          vimeoId: v.vimeoId,
          vimeoHash: v.vimeoHash,
          duration: v.duration,
          link: v.link,
          isFree: v.isFree,
        })),
      };

      const res = await fetch("/api/admin/lectures/import-vimeo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "File import failed");
      }

      setImportResult(data);
      setStep(3);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      alert("Error importing file lectures: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Render a folder node in tree view
  const renderFolderNode = (node, depth = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isChecked = selectedFolderIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => {
            if (e.target.closest("button") || e.target.closest("input")) return;
            handleToggleFolderCheckbox(node.id);
          }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer ${
            isChecked ? "bg-amber-50/70" : ""
          }`}
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
        >
          {/* Expand / Collapse Icon */}
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className={`w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer ${
              hasChildren ? "visible" : "invisible"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleToggleFolderCheckbox(node.id)}
            className="w-4 h-4 rounded border-neutral-300 text-[#0B2A4A] focus:ring-[#FFB800] cursor-pointer"
          />

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          )}

          {/* Folder Name */}
          <span className="text-xs font-semibold text-[#1B2B4B] truncate flex-1">
            {node.name}
          </span>

          {/* Video Count Badge */}
          {node.videoCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 shrink-0">
              {node.videoCount} {node.videoCount === 1 ? "video" : "videos"}
            </span>
          )}
        </div>

        {/* Children Subfolders */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                Curriculum Importer
              </span>
              <span className="text-xs font-medium text-neutral-500 truncate max-w-xs">
                {courseTitle}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0B2A4A] mt-0.5">
              Import Lectures &amp; Chapters
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Vimeo Folders vs Import from File */}
        {step !== 3 && (
          <div className="flex items-center border-b border-neutral-200 px-6 bg-white shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab("vimeo");
                setStep(1);
              }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "vimeo"
                  ? "border-[#0B2A4A] text-[#0B2A4A]"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Video className="w-4 h-4 text-sky-600" />
              <span>Import from Vimeo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("file");
                setStep(1);
              }}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "file"
                  ? "border-[#0B2A4A] text-[#0B2A4A]"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Import from File (.xlsx / .csv)</span>
            </button>
          </div>
        )}

        {/* Safety Hint Banner */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5 text-xs text-amber-900 shrink-0">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="leading-snug">
            <strong>Security Tip:</strong> Set videos to <em>Hide from Vimeo</em> and restrict embedding to your domain in Vimeo privacy settings.
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: VIMEO IMPORT */}
          {activeTab === "vimeo" && (
            <>
              {/* STEP 1: FOLDER TREE */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-neutral-600">
                      Select the Vimeo folders to import. Selecting a parent folder automatically selects its subfolders.
                    </p>
                    <span className="text-xs font-bold text-[#0B2A4A] shrink-0">
                      {selectedFolderIds.size} folders · {totalSelectedVideos} videos selected
                    </span>
                  </div>

                  {foldersError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{foldersError}</span>
                    </div>
                  )}

                  {loadingFolders ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-2 text-neutral-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0B2A4A]" />
                      <span className="text-xs font-medium">Fetching folders from Vimeo...</span>
                    </div>
                  ) : folderTree.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
                      <Folder className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-neutral-700">No folders found on Vimeo account.</p>
                      <p className="text-[11px] text-neutral-500 mt-1">Make sure your Vimeo account has folders created.</p>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 rounded-2xl p-3 max-h-[380px] overflow-y-auto bg-white space-y-1">
                      {folderTree.map((node) => renderFolderNode(node, 0))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: PREVIEW TABLE */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2A4A]">
                        Review &amp; Edit Video Mapping ({previewVideos.length} Videos)
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Review Books, Chapters, Titles, and Part numbers before importing. All fields are editable.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Folders</span>
                    </button>
                  </div>

                  <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-neutral-100 border-b border-neutral-200 z-10 text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">Thumb</th>
                            <th className="py-2.5 px-3 w-36">Book</th>
                            <th className="py-2.5 px-3 w-36">Chapter</th>
                            <th className="py-2.5 px-3 w-16 text-center">Part</th>
                            <th className="py-2.5 px-3">Cleaned Title</th>
                            <th className="py-2.5 px-3 w-16 text-right">Duration</th>
                            <th className="py-2.5 px-3 w-12 text-center">Warn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          {previewVideos.map((item, idx) => (
                            <tr key={item.vimeoId || idx} className="hover:bg-neutral-50/70 transition-colors">
                              {/* Thumbnail */}
                              <td className="py-2 px-3 text-center">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt=""
                                    className="w-10 h-7 object-cover rounded shadow-2xs mx-auto"
                                  />
                                ) : (
                                  <div className="w-10 h-7 bg-neutral-200 rounded flex items-center justify-center mx-auto text-neutral-400">
                                    <Video className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </td>

                              {/* Book */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.book}
                                  onChange={(e) => handleUpdatePreviewCell(idx, "book", e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-neutral-200 text-xs font-medium focus:outline-none focus:border-[#FFB800]"
                                />
                              </td>

                              {/* Chapter */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.chapter}
                                  onChange={(e) => handleUpdatePreviewCell(idx, "chapter", e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-neutral-200 text-xs font-medium focus:outline-none focus:border-[#FFB800]"
                                />
                              </td>

                              {/* Part Number */}
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.partNumber}
                                  onChange={(e) => handleUpdatePreviewCell(idx, "partNumber", e.target.value)}
                                  className="w-14 px-1.5 py-1 rounded border border-neutral-200 text-xs text-center font-bold text-[#0B2A4A] focus:outline-none focus:border-[#FFB800]"
                                />
                              </td>

                              {/* Title */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleUpdatePreviewCell(idx, "title", e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-neutral-200 text-xs text-neutral-800 font-medium focus:outline-none focus:border-[#FFB800]"
                                />
                              </td>

                              {/* Duration */}
                              <td className="py-2 px-3 text-right font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                {formatDurationSec(item.duration)}
                              </td>

                              {/* Warning Icon if public or public embed */}
                              <td className="py-2 px-3 text-center">
                                {item.isPublicWarning ? (
                                  <span
                                    title="Video is public or unrestricted embed. Set to Hide from Vimeo."
                                    className="inline-flex text-amber-500 cursor-help"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </span>
                                ) : (
                                  <span className="text-emerald-500" title="Protected privacy">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: IMPORT FROM FILE */}
          {activeTab === "file" && step !== 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-neutral-600">
                  Upload an Excel (<code>.xlsx</code>) or <code>.csv</code> spreadsheet with columns: <strong>book, chapter, title, link, duration, free</strong>.
                </p>

                {/* Template Downloads */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/api/admin/lectures/import-template?format=xlsx"
                    download="rd_classes_lectures_template.xlsx"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-[#0B2A4A] hover:bg-neutral-50 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template (.xlsx)</span>
                  </a>

                  <a
                    href="/api/admin/lectures/import-template?format=csv"
                    download="rd_classes_lectures_template.csv"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-[#0B2A4A] hover:bg-neutral-50 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>Template (.csv)</span>
                  </a>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 hover:border-[#0B2A4A] rounded-2xl p-6 text-center bg-neutral-50 hover:bg-neutral-100/60 transition-all cursor-pointer space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-neutral-800">
                  {fileData ? fileData.name : "Click to select or drop an Excel (.xlsx) or CSV file"}
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Default: All imported lectures are set to <strong>draft</strong> and <strong>locked</strong>.
                </p>
              </div>

              {fileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Preview Rows from File */}
              {filePreviewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span>Parsed {filePreviewRows.length} Rows</span>
                    <span className="text-emerald-700">
                      {filePreviewRows.filter((r) => r.valid).length} valid rows ready
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                        <tr>
                          <th className="py-2 px-3">Book</th>
                          <th className="py-2 px-3">Chapter</th>
                          <th className="py-2 px-3 w-12 text-center">Part</th>
                          <th className="py-2 px-3">Title</th>
                          <th className="py-2 px-3">Link / Vimeo ID</th>
                          <th className="py-2 px-3 w-16 text-right">Duration</th>
                          <th className="py-2 px-3 w-14 text-center">Free</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {filePreviewRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="py-1.5 px-3 font-medium text-neutral-700">{r.book}</td>
                            <td className="py-1.5 px-3 font-medium text-neutral-700">{r.chapter}</td>
                            <td className="py-1.5 px-3 text-center font-bold text-[#0B2A4A]">{r.partNumber}</td>
                            <td className="py-1.5 px-3 font-semibold text-neutral-900">{r.title}</td>
                            <td className="py-1.5 px-3 font-mono text-[11px] text-neutral-500 truncate max-w-xs">{r.link}</td>
                            <td className="py-1.5 px-3 text-right font-mono text-[11px] text-neutral-500">{formatDurationSec(r.duration)}</td>
                            <td className="py-1.5 px-3 text-center">
                              {r.isFree ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">FREE</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">LOCKED</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULT SUMMARY */}
          {step === 3 && importResult && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0B2A4A]">Import Completed Successfully!</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                  All imported lectures have been added as <strong>drafts</strong>. Books and chapters were created or updated automatically.
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-2xl font-black text-emerald-700">{importResult.created || 0}</div>
                  <div className="text-xs font-semibold text-emerald-900 mt-0.5">New Lectures Created</div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <div className="text-2xl font-black text-sky-700">{importResult.skipped || 0}</div>
                  <div className="text-xs font-semibold text-sky-900 mt-0.5">Existing Updated / Skipped</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="text-2xl font-black text-amber-700">{importResult.warnings || 0}</div>
                  <div className="text-xs font-semibold text-amber-900 mt-0.5">Privacy Warnings</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between shrink-0">
          {step === 3 ? (
            <div className="w-full flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-10 rounded-xl bg-[#0B2A4A] text-white text-xs font-bold hover:bg-[#152B52] transition-colors cursor-pointer"
              >
                Done &amp; Close
              </button>
            </div>
          ) : activeTab === "vimeo" ? (
            <>
              {step === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 h-10 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPreview}
                    disabled={selectedFolderIds.size === 0 || loadingVideos}
                    className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#0B2A4A] hover:bg-[#152B52] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {loadingVideos ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading Videos...</span>
                      </>
                    ) : (
                      <>
                        <span>Review Videos ({totalSelectedVideos})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing || previewVideos.length === 0}
                    className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#0B2A4A] hover:bg-[#152B52] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Importing Lectures...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm &amp; Import ({previewVideos.length} Lectures)</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            // File Tab Footer
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteFileImport}
                disabled={importing || filePreviewRows.filter((r) => r.valid).length === 0}
                className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#0B2A4A] hover:bg-[#152B52] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing from File...</span>
                  </>
                ) : (
                  <>
                    <span>Import from File ({filePreviewRows.filter((r) => r.valid).length} Lectures)</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

