"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Video,
  Clock,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  createLectureAction,
  updateLectureAction,
  deleteLectureAction,
  reorderLecturesAction,
  fetchVimeoMetadataAction,
} from "@/server/actions/admin.lectures.actions.js";

export default function LecturesManager({ course, lectures = [] }) {
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeLecture, setActiveLecture] = useState(null);

  const [section, setSection] = useState("General");
  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [isPreview, setIsPreview] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingVimeo, setIsFetchingVimeo] = useState(false);
  const [error, setError] = useState("");
  const [vimeoMsg, setVimeoMsg] = useState("");

  const openCreateModal = () => {
    setActiveLecture(null);
    setSection(lectures[lectures.length - 1]?.section || "Chapter 1");
    setTitle("");
    setVimeoUrl("");
    setDurationSec(0);
    setDescription("");
    setPublished(true);
    setIsPreview(false);
    setError("");
    setVimeoMsg("");
    setModalMode("create");
  };

  const openEditModal = (lec) => {
    setActiveLecture(lec);
    setSection(lec.section || "General");
    setTitle(lec.title);
    setVimeoUrl(lec.vimeoHash ? `https://vimeo.com/${lec.vimeoId}/${lec.vimeoHash}` : lec.vimeoId);
    setDurationSec(lec.durationSec || 0);
    setDescription(lec.description || "");
    setPublished(!!lec.published);
    setIsPreview(Boolean(lec.freePreview ?? lec.isPreview));
    setError("");
    setVimeoMsg("");
    setModalMode("edit");
  };

  const handleFetchVimeo = async () => {
    if (!vimeoUrl) {
      setError("Please enter a Vimeo URL or video ID first.");
      return;
    }
    setIsFetchingVimeo(true);
    setError("");
    setVimeoMsg("");

    // Extract digits for Vimeo ID
    const digitsMatch = vimeoUrl.match(/(\d+)/);
    const id = digitsMatch ? digitsMatch[1] : vimeoUrl;

    const res = await fetchVimeoMetadataAction(id);
    setIsFetchingVimeo(false);

    if (res?.success) {
      if (res.title && !title) setTitle(res.title);
      if (res.durationSec) setDurationSec(res.durationSec);
      if (res.description && !description) setDescription(res.description);
      setVimeoMsg("✓ Metadata fetched from Vimeo successfully!");
    } else {
      setError(res?.error || "Could not fetch metadata from Vimeo.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("section", section);
    fd.append("title", title);
    fd.append("vimeoUrl", vimeoUrl);
    fd.append("durationSec", durationSec.toString());
    fd.append("description", description);
    if (published) fd.append("published", "on");
    if (isPreview) {
      fd.append("freePreview", "on");
      fd.append("isPreview", "on");
    }

    let res;
    if (modalMode === "create") {
      res = await createLectureAction(course._id, null, fd);
    } else {
      res = await updateLectureAction(activeLecture._id, course._id, null, fd);
    }

    setIsSubmitting(false);
    if (res?.success) {
      setModalMode(null);
    } else {
      setError(res?.error || "Failed to save lecture.");
    }
  };

  const handleDelete = async (lecId) => {
    if (confirm("Delete this lecture? This will remove all associated student progress.")) {
      await deleteLectureAction(lecId, course._id);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= lectures.length) return;

    const reordered = [...lectures];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const orderedIds = reordered.map((l) => l._id);
    await reorderLecturesAction(course._id, orderedIds);
  };

  const formatDuration = (sec) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Courses</span>
      </Link>

      {/* Header */}
      <div className="bg-[#131316] border border-[#222226] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#FFB800] bg-[#FFB800]/10 px-2 py-0.5 rounded">
            /{course.slug}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            {course.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {lectures.length} lecture{lectures.length === 1 ? "" : "s"} in curriculum
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lecture</span>
        </button>
      </div>

      {lectures.length === 0 ? (
        <div className="bg-[#131316] border border-[#222226] rounded-2xl p-10 text-center">
          <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No lectures added yet</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Add Vimeo videos to build the curriculum for this course.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#FFB800] text-[#0A0A0B] text-xs font-bold rounded-xl"
          >
            Add First Lecture
          </button>
        </div>
      ) : (
        <div className="bg-[#131316] border border-[#222226] rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-[#1D1D23]">
            {lectures.map((lec, idx) => (
              <div
                key={lec._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#16161B] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex flex-col gap-0.5 pt-0.5 sm:pt-0">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === lectures.length - 1}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#FFB800] uppercase tracking-wider">
                      {lec.section}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                      <span>{lec.title}</span>
                      {Boolean(lec.freePreview ?? lec.isPreview) && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                          Free
                        </span>
                      )}
                      {!lec.published && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono flex items-center gap-3">
                      <span>Vimeo ID: {lec.vimeoId}</span>
                      {lec.durationSec > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lec.durationSec)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={`https://vimeo.com/${lec.vimeoId}${lec.vimeoHash ? `/${lec.vimeoHash}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#202028]"
                    title="Open in Vimeo"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openEditModal(lec)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#202028]"
                    title="Edit lecture"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(lec._id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-950/30"
                    title="Delete lecture"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Add / Edit Lecture */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141418] border border-[#2B2B33] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalMode(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {modalMode === "create" ? "Add Lecture to Curriculum" : "Edit Lecture"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-xs text-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {vimeoMsg && (
              <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 rounded-xl">
                {vimeoMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Section / Chapter Name *
                </label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Chapter 1: Introduction to Partnership"
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Profit and Loss Appropriation Account Basics"
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-300 font-semibold">
                    Vimeo URL or Video ID *
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchVimeo}
                    disabled={isFetchingVimeo}
                    className="text-[11px] text-[#FFB800] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {isFetchingVimeo ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>Fetch from Vimeo</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={vimeoUrl}
                  onChange={(e) => setVimeoUrl(e.target.value)}
                  placeholder="https://vimeo.com/123456789/abcdef1234 or 123456789"
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Automatically parses video ID and unlisted privacy hash.
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={durationSec}
                  onChange={(e) => setDurationSec(Number(e.target.value))}
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Description / Lecture Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts covered in this class..."
                  className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="accent-[#FFB800]"
                  />
                  <span>Published</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    name="freePreview"
                    checked={isPreview}
                    onChange={(e) => setIsPreview(e.target.checked)}
                    className="accent-[#FFB800]"
                  />
                  <span>Free preview</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222228]">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-300 hover:bg-[#202028] rounded-xl border border-[#303038]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] font-bold rounded-xl flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Lecture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
