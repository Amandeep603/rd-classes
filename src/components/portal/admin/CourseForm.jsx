"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  BookOpen,
  Crown,
  Palette,
  Layers,
  FileText,
  Video,
  Clock,
  Globe,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import CourseCard from "@/components/courses/CourseCard";
import {
  createCourseAction,
  updateCourseAction,
} from "@/server/actions/admin.courses.actions.js";

const CATEGORY_DEFAULTS = {
  class12: {
    tone: "sky",
    illustration: "books-blue",
    badgeText: "Most Popular",
    badgeVariant: "crown-navy",
    classLabel: "Class 12",
    metaIcon: "video",
    metaText: "Full Year + 136 Videos",
  },
  class11: {
    tone: "yellow",
    illustration: "open-book",
    badgeText: "Foundation Course",
    badgeVariant: "yellow",
    classLabel: "Class 11",
    metaIcon: "file",
    metaText: "Full Year Syllabus",
  },
  crash: {
    tone: "orange",
    illustration: "target",
    badgeText: "Crash Course",
    badgeVariant: "orange",
    classLabel: "Class 12",
    metaIcon: "clock",
    metaText: "30+ Revision Hours",
  },
  recorded: {
    tone: "green",
    illustration: "laptop-play",
    badgeText: "Recorded Portal",
    badgeVariant: "green",
    classLabel: "Class 12",
    metaIcon: "video",
    metaText: "136 HD Lectures",
  },
  "test-series": {
    tone: "purple",
    illustration: "checklist-clock",
    badgeText: "Test Series",
    badgeVariant: "purple",
    classLabel: "Class 12",
    metaIcon: "file",
    metaText: "Weekly Sunday Tests",
  },
};

export default function CourseForm({ course = null, mode = "new" }) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!course;

  const [title, setTitle] = useState(course?.title || "");
  const [subtitle, setSubtitle] = useState(course?.subtitle || "");
  const [slug, setSlug] = useState(course?.slug || "");
  const [category, setCategory] = useState(course?.category || "class12");
  const [classLabel, setClassLabel] = useState(course?.classLabel || "Class 12");
  const [badgeText, setBadgeText] = useState(course?.badgeText || "Most Popular");
  const [badgeVariant, setBadgeVariant] = useState(course?.badgeVariant || "crown-navy");
  const [tone, setTone] = useState(course?.tone || "sky");
  const [illustration, setIllustration] = useState(course?.illustration || "books-blue");
  const [description, setDescription] = useState(course?.description || "");
  const [metaIcon, setMetaIcon] = useState(course?.metaIcon || "video");
  const [metaText, setMetaText] = useState(course?.metaText || "Full Year + 136 Videos");
  const [language, setLanguage] = useState(course?.language || "Bilingual");
  const [facultyName, setFacultyName] = useState(course?.facultyName || "Ronak Dugar");
  const [facultyRole, setFacultyRole] = useState(course?.facultyRole || "Lead Accountancy Faculty");
  const [whatsappText, setWhatsappText] = useState(course?.whatsappText || "");
  const [published, setPublished] = useState(course ? !!course.published : true);
  const [featured, setFeatured] = useState(course ? !!course.featured : false);
  const [order, setOrder] = useState(course?.order ?? 0);

  const [previewVariant, setPreviewVariant] = useState("home"); // "home" | "catalog"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-fill slug if user types title and slug is empty or pristine
  const handleTitleChange = (val) => {
    setTitle(val);
    if (!isEdit && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Category switch suggestion
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const defaults = CATEGORY_DEFAULTS[newCat];
    if (defaults) {
      setTone(defaults.tone);
      setIllustration(defaults.illustration);
      setBadgeText(defaults.badgeText);
      setBadgeVariant(defaults.badgeVariant);
      setClassLabel(defaults.classLabel);
      setMetaIcon(defaults.metaIcon);
      setMetaText(defaults.metaText);
    }
  };

  // Simulated live course object
  const previewCourse = {
    title: title || "Course Title Preview",
    subtitle,
    slug: slug || "course-slug",
    category,
    classLabel,
    badgeText,
    badgeVariant,
    tone,
    illustration,
    description: description || "Course description will appear here as you type.",
    metaIcon,
    metaText: metaText || "Syllabus Details",
    language,
    facultyName,
    facultyRole,
    whatsappText,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("subtitle", subtitle);
    fd.append("slug", slug);
    fd.append("category", category);
    fd.append("classLabel", classLabel);
    fd.append("badgeText", badgeText);
    fd.append("badgeVariant", badgeVariant);
    fd.append("tone", tone);
    fd.append("illustration", illustration);
    fd.append("description", description);
    fd.append("metaIcon", metaIcon);
    fd.append("metaText", metaText);
    fd.append("language", language);
    fd.append("facultyName", facultyName);
    fd.append("facultyRole", facultyRole);
    fd.append("whatsappText", whatsappText);
    fd.append("published", published ? "true" : "false");
    fd.append("featured", featured ? "true" : "false");
    if (order !== undefined && order !== null) {
      fd.append("order", String(order));
    }

    try {
      let res;
      if (isEdit) {
        res = await updateCourseAction(course._id, null, fd);
      } else {
        res = await createCourseAction(null, fd);
      }

      if (res?.success) {
        setSuccess(true);
        router.push("/admin/courses");
        router.refresh();
      } else {
        setError(res?.error || "Failed to save course.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/8 bg-white text-slate-700 hover:text-slate-900 hover:bg-neutral-50 shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">
              {isEdit ? "Edit Course" : "New Course"}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Single source of truth for public website and student portal
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-black/8 shadow-2xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                published ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <span className="text-xs font-bold text-slate-800">
              {published ? "Publicly Published" : "Draft / Hidden"}
            </span>
          </div>
          {featured && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200 shadow-2xs">
              Home Featured
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-sm font-semibold text-red-800"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-sm font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Course saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Main Grid: Form Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 space-y-6 rounded-[26px] border border-black/8 bg-white p-6 sm:p-8 shadow-xs"
        >
          {/* Section 1: Core Details */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span>Basic Information</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Class 12 Accountancy"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Subtitle (in lighter font weight)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. (Full Year) or Foundation"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    URL Slug * (unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. class-12-accountancy"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] font-mono focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required={published}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive CBSE Class 12 coaching covering Partnership, Company Accounts, and Analysis of Financial Statements."
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 2: Category & Suggestions */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-500" />
              <span>Category & Theme</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                >
                  <option value="class12">Class 12 CBSE</option>
                  <option value="class11">Class 11 Foundation</option>
                  <option value="recorded">Recorded Portal</option>
                  <option value="test-series">Test Series</option>
                  <option value="crash">Crash Courses</option>
                </select>
                <p className="mt-1 text-[11px] text-[#6B7280]">
                  Changing category automatically suggests tone, illustration and badge defaults.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Tone Color *
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  >
                    <option value="sky">Sky (Blue)</option>
                    <option value="yellow">Yellow</option>
                    <option value="orange">Orange</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Illustration *
                  </label>
                  <select
                    value={illustration}
                    onChange={(e) => setIllustration(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  >
                    <option value="books-blue">books-blue (Accountancy Stack)</option>
                    <option value="open-book">open-book (Open with Gold Pen)</option>
                    <option value="revision-plan">revision-plan (Notepad)</option>
                    <option value="target">target (Orange Bullseye)</option>
                    <option value="laptop-play">laptop-play (Laptop with Play)</option>
                    <option value="checklist-clock">checklist-clock (Checklist + Clock)</option>
                    <option value="notebook-red">notebook-red (Red Spiral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Class Label
                  </label>
                  <input
                    type="text"
                    value={classLabel}
                    onChange={(e) => setClassLabel(e.target.value)}
                    placeholder="e.g. Class 12"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. Most Popular"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Badge Variant
                  </label>
                  <select
                    value={badgeVariant}
                    onChange={(e) => setBadgeVariant(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  >
                    <option value="crown-navy">crown-navy (Navy Pill with Crown)</option>
                    <option value="yellow">yellow</option>
                    <option value="orange">orange</option>
                    <option value="green">green</option>
                    <option value="purple">purple</option>
                    <option value="red">red</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 3: Meta & Faculty */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              <span>Features & Faculty</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Meta Icon
                  </label>
                  <select
                    value={metaIcon}
                    onChange={(e) => setMetaIcon(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  >
                    <option value="video">video</option>
                    <option value="file">file</option>
                    <option value="clock">clock</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Meta Text *
                  </label>
                  <input
                    type="text"
                    required={published}
                    value={metaText}
                    onChange={(e) => setMetaText(e.target.value)}
                    placeholder="e.g. Full Year + 136 Videos"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Bilingual"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Faculty Name
                  </label>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="Ronak Dugar"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Faculty Role
                  </label>
                  <input
                    type="text"
                    value={facultyRole}
                    onChange={(e) => setFacultyRole(e.target.value)}
                    placeholder="Lead Accountancy Faculty"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  WhatsApp Prefilled Message (optional override)
                </label>
                <input
                  type="text"
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                  placeholder="Defaults to: Hello RD Classes, I want to know more about [Title]."
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 4: Publishing & Switches */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Visibility & Switches</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-3.5 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-bold text-[#111827]">
                    Published
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Visible on website and student portal
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-black/10 p-3.5 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-bold text-[#111827]">
                    Home Featured
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Showcase in homepage top 3 cards
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <Link
              href="/admin/courses"
              className="rounded-2xl border border-black/10 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC21A] px-6 py-2.5 text-xs font-extrabold text-neutral-950 shadow-md hover:bg-[#ffd54a] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEdit ? "Update Course" : "Create Course"}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-black/8 shadow-2xs">
            <div className="flex items-center gap-2 px-2 text-xs font-extrabold text-slate-800">
              <Eye className="h-4 w-4 text-amber-500" />
              <span>LIVE PREVIEW</span>
            </div>

            {/* Toggle Preview Variant */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewVariant("home")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  previewVariant === "home"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Home Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewVariant("catalog")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  previewVariant === "catalog"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Catalog Card
              </button>
            </div>
          </div>

          {/* Render Course Card Live */}
          <div className="p-4 bg-neutral-50/60 rounded-[30px] border border-dashed border-black/10">
            <CourseCard
              course={previewCourse}
              variant={previewVariant}
              className="w-full max-w-[480px] mx-auto pointer-events-none"
            />
          </div>

          <p className="text-[11px] text-center text-[#6B7280]">
            This is an exact preview of how visitors see this card on {previewVariant === "home" ? "the Homepage" : "the /courses page"}.
          </p>
        </div>
      </div>
    </div>
  );
}
