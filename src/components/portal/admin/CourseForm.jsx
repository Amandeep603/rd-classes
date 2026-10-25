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
  Plus,
  Trash2,
  HelpCircle,
  ListPlus,
  Check,
} from "lucide-react";
import Link from "next/link";
import CourseCard from "@/components/courses/CourseCard";
import CourseIllustration from "@/components/courses/illustrations";
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

const ICON_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "notes", label: "Notes / PDF" },
  { value: "practice", label: "Practice / Book" },
  { value: "tests", label: "Mock Tests / Award" },
  { value: "papers", label: "Question Papers" },
  { value: "globe", label: "Language / Globe" },
  { value: "infinity", label: "Lifetime / Infinity" },
];

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

  // Phase C1 Fields
  const [about, setAbout] = useState(course?.about || "");
  const [heroIllustration, setHeroIllustration] = useState(
    course?.heroIllustration || "books-subjects"
  );
  const [highlights, setHighlights] = useState(
    course?.highlights && course.highlights.length > 0
      ? course.highlights
      : [
          { icon: "video", text: "136 HD Lectures" },
          { icon: "notes", text: "Chapter-wise Notes" },
          { icon: "practice", text: "Practice Questions" },
          { icon: "globe", text: "Bilingual (Hindi + English)" },
        ]
  );
  const [includes, setIncludes] = useState(
    course?.includes && course.includes.length > 0
      ? course.includes
      : [
          { icon: "video", text: "136 HD Video Lectures" },
          { icon: "notes", text: "Chapter-wise Notes (PDF)" },
          { icon: "practice", text: "Practice Questions with Solutions" },
          { icon: "tests", text: "Board-style Mock Tests" },
          { icon: "papers", text: "Previous Year Question Papers" },
          { icon: "globe", text: "Bilingual (Hindi + English)" },
          { icon: "infinity", text: "Lifetime Access" },
        ]
  );
  const [faqs, setFaqs] = useState(
    course?.faqs && course.faqs.length > 0
      ? course.faqs
      : [
          {
            q: "Who is this course suitable for?",
            a: "Designed for CBSE students targeting 95+ in Accountancy.",
          },
          {
            q: "Can I watch lectures offline or on mobile?",
            a: "Yes, you can access all high-definition lectures on mobile or desktop anytime.",
          },
        ]
  );
  const [facultyBullets, setFacultyBullets] = useState(
    course?.facultyBullets && course.facultyBullets.length > 0
      ? course.facultyBullets
      : [
          "10+ years of teaching experience",
          "Specialized in Class 11 & 12 Accountancy",
          "Concept-based and exam-oriented approach",
          "Trusted by thousands of students",
        ]
  );
  const [facultyProfileUrl, setFacultyProfileUrl] = useState(
    course?.facultyProfileUrl || ""
  );

  const [previewVariant, setPreviewVariant] = useState("hero"); // "hero" | "home" | "catalog"
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

    // Phase C1 Fields
    fd.append("about", about);
    fd.append("heroIllustration", heroIllustration);
    fd.append("highlights", JSON.stringify(highlights.filter((h) => h.text.trim())));
    fd.append("includes", JSON.stringify(includes.filter((inc) => inc.text.trim())));
    fd.append("faqs", JSON.stringify(faqs.filter((f) => f.q.trim() && f.a.trim())));
    fd.append("facultyBullets", JSON.stringify(facultyBullets.filter((b) => b.trim())));
    fd.append("facultyProfileUrl", facultyProfileUrl);

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
        <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Course saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8 bg-white p-6 sm:p-8 rounded-[28px] border border-black/8 shadow-2xs">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span>Basic Course Information</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Class 12 Accountancy"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Highlighted Subtitle (e.g. (Full Year))
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="(Full Year)"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1">
                    Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="class-12-accountancy"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] font-mono focus:border-[#FFC21A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Brief Overview / Description (Card & Hero snippet)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive CBSE coaching covering Partnership, Company Accounts..."
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 2: Phase C1 Detail Page Content */}
          <div className="space-y-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0066FF]" />
              <span>Detail Page Content (/courses/[slug])</span>
            </h3>

            {/* Hero Illustration */}
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1.5">
                Detail Page Hero Illustration
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "books-subjects",
                    title: "Subject Books (A)",
                    desc: "Three books: Partnership, Company Accounts, Financial Statements",
                  },
                  {
                    id: "books-light",
                    title: "Light Waves & Books (B)",
                    desc: "Pale blue waves with Accounts, Practice, Results",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHeroIllustration(item.id)}
                    className={`p-3 text-left rounded-xl border transition-all text-xs ${
                      heroIllustration === item.id
                        ? "border-[#0066FF] bg-[#EBF5FF] text-[#0066FF] font-bold"
                        : "border-black/10 bg-white text-[#374151] hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.title}</span>
                      {heroIllustration === item.id && (
                        <Check className="w-3.5 h-3.5 text-[#0066FF]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1 font-normal">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* About Long Description */}
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Full About Description (About tab)
              </label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Detailed syllabus overview, methodology, mentor approach..."
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none"
              />
            </div>

            {/* Hero Highlights (max 4) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#374151]">
                  Hero Highlights Row (up to 4 items)
                </label>
                {highlights.length < 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      setHighlights([...highlights, { icon: "video", text: "" }])
                    }
                    className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Highlight
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={hl.icon}
                      onChange={(e) => {
                        const next = [...highlights];
                        next[idx].icon = e.target.value;
                        setHighlights(next);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-2 py-1.5 text-xs text-[#111827]"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={hl.text}
                      onChange={(e) => {
                        const next = [...highlights];
                        next[idx].text = e.target.value;
                        setHighlights(next);
                      }}
                      placeholder="e.g. 136 HD Lectures"
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setHighlights(highlights.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Includes (max 8) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#374151]">
                  Course Includes (sidebar card, up to 8 items)
                </label>
                {includes.length < 8 && (
                  <button
                    type="button"
                    onClick={() =>
                      setIncludes([...includes, { icon: "practice", text: "" }])
                    }
                    className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {includes.map((inc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={inc.icon}
                      onChange={(e) => {
                        const next = [...includes];
                        next[idx].icon = e.target.value;
                        setIncludes(next);
                      }}
                      className="rounded-xl border border-black/10 bg-white px-2 py-1.5 text-xs text-[#111827]"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={inc.text}
                      onChange={(e) => {
                        const next = [...includes];
                        next[idx].text = e.target.value;
                        setIncludes(next);
                      }}
                      placeholder="e.g. Chapter-wise Notes (PDF)"
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIncludes(includes.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty Bullets & Profile Link */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#374151]">
                  Faculty Experience Bullets (up to 4)
                </label>
                {facultyBullets.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setFacultyBullets([...facultyBullets, ""])}
                    className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bullet
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {facultyBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => {
                        const next = [...facultyBullets];
                        next[idx] = e.target.value;
                        setFacultyBullets(next);
                      }}
                      placeholder="e.g. 10+ years of teaching experience"
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-[#111827]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFacultyBullets(facultyBullets.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mt-2 mb-1">
                  Faculty Profile URL (optional link on faculty card)
                </label>
                <input
                  type="text"
                  value={facultyProfileUrl}
                  onChange={(e) => setFacultyProfileUrl(e.target.value)}
                  placeholder="/about or external link"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-[#111827]"
                />
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#374151]">
                  Frequently Asked Questions (FAQs tab)
                </label>
                <button
                  type="button"
                  onClick={() => setFaqs([...faqs, { q: "", a: "" }])}
                  className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-black/10 bg-neutral-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[idx].q = e.target.value;
                        setFaqs(next);
                      }}
                      placeholder="Question..."
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-1 text-xs text-[#111827]"
                    />
                    <textarea
                      rows={2}
                      value={faq.a}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[idx].a = e.target.value;
                        setFaqs(next);
                      }}
                      placeholder="Answer..."
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-1 text-xs text-[#111827]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Section 3: Visual Identity & Badges */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#111827] flex items-center gap-2">
              <Palette className="h-4 w-4 text-emerald-500" />
              <span>Card Styling & Tone</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827]"
                >
                  <option value="class12">Class 12 (Board)</option>
                  <option value="class11">Class 11 (Foundation)</option>
                  <option value="crash">Crash Course</option>
                  <option value="recorded">Recorded Portal</option>
                  <option value="test-series">Test Series</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">
                  Card Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827]"
                >
                  <option value="sky">Sky (Blue)</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                </select>
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
                  <div className="text-xs font-bold text-[#111827]">Published</div>
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
                  <div className="text-xs font-bold text-[#111827]">Home Featured</div>
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
                onClick={() => setPreviewVariant("hero")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  previewVariant === "hero"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Hero
              </button>
              <button
                type="button"
                onClick={() => setPreviewVariant("home")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  previewVariant === "home"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setPreviewVariant("catalog")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  previewVariant === "catalog"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Catalog
              </button>
            </div>
          </div>

          {/* Render Preview */}
          {previewVariant === "hero" ? (
            <div className="rounded-2xl border border-black/10 bg-gradient-to-b from-[#FFFDF9] via-[#F9FAFC] to-[#F0F5FD] p-5 shadow-sm space-y-3">
              <span className="inline-flex rounded-full bg-[#EBF5FF] px-2.5 py-0.5 text-[10px] font-bold text-[#0066FF] border border-[#BFDBFE]">
                {classLabel}
              </span>
              <h2 className="text-lg font-extrabold text-[#0B1B3D] leading-tight">
                {title || "Course Title"}{" "}
                {subtitle && (
                  <span className="relative inline-block ml-1">
                    <span className="relative z-10">{subtitle}</span>
                    <span className="absolute left-0 right-0 bottom-0.5 h-2 bg-[#FFD84D] -z-0 rounded-xs" />
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#475569] line-clamp-2">
                {description || "Course description overview..."}
              </p>

              {/* Illustration preview */}
              <div className="w-full h-32 flex items-center justify-center p-2 bg-white/60 rounded-xl border border-black/5">
                <div className="w-36 h-28">
                  <CourseIllustration name={heroIllustration} className="w-full h-full" />
                </div>
              </div>

              {/* Highlights row preview */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-700 pt-2 border-t border-black/5">
                {highlights.slice(0, 3).map((h, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white rounded border border-black/5">
                    {h.text || "Highlight item"}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50/60 rounded-[30px] border border-dashed border-black/10">
              <CourseCard
                course={previewCourse}
                variant={previewVariant}
                className="w-full max-w-[480px] mx-auto pointer-events-none"
              />
            </div>
          )}

          <p className="text-[11px] text-center text-[#6B7280]">
            Live preview of {previewVariant === "hero" ? "the Course Detail Hero banner" : previewVariant === "home" ? "the Homepage Card" : "the /courses Catalog Card"}.
          </p>
        </div>
      </div>
    </div>
  );
}
