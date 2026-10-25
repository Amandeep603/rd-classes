"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Lock,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Video,
  FileText,
  Bookmark,
  Share2,
  ExternalLink,
  MessageCircle,
  LogIn,
  Check,
  X,
  HelpCircle,
  Award,
  Globe,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Infinity as InfinityIcon,
  BookOpen,
} from "lucide-react";

const SECTION_TONE_CYCLE = [
  { bg: "#EBF5FF", text: "#0066FF" }, // 1. Blue
  { bg: "#FFFBEB", text: "#D97706" }, // 2. Yellow
  { bg: "#FEF2F2", text: "#DC2626" }, // 3. Red
  { bg: "#F0FDF4", text: "#16A34A" }, // 4. Green
  { bg: "#FAF5FF", text: "#9333EA" }, // 5. Purple
  { bg: "#EFF6FF", text: "#2563EB" }, // 6. Blue
  { bg: "#FFF7ED", text: "#EA580C" }, // 7. Orange
];

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTotalTime(lectures) {
  const totalSec = lectures.reduce((acc, l) => acc + (l.durationSec || 0), 0);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function renderItemIcon(iconKey) {
  switch (iconKey) {
    case "video":
      return <Video className="w-4 h-4 text-[#0066FF] flex-shrink-0" />;
    case "notes":
    case "papers":
    case "file":
      return <FileText className="w-4 h-4 text-[#D97706] flex-shrink-0" />;
    case "practice":
      return <BookOpen className="w-4 h-4 text-[#16A34A] flex-shrink-0" />;
    case "tests":
      return <Award className="w-4 h-4 text-[#9333EA] flex-shrink-0" />;
    case "globe":
      return <Globe className="w-4 h-4 text-[#0B2545] flex-shrink-0" />;
    case "infinity":
      return <InfinityIcon className="w-4 h-4 text-[#EA580C] flex-shrink-0" />;
    default:
      return <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />;
  }
}

function subscribeToHash(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot() {
  if (typeof window === "undefined") return "lectures";
  const hash = window.location.hash.replace("#", "");
  return ["lectures", "about", "faculty", "notes", "faqs"].includes(hash) ? hash : "lectures";
}

function getServerHashSnapshot() {
  return "lectures";
}

export default function CourseDetailClient({
  course,
  lectures = [],
  relatedCourses = [],
  siteWhatsapp = "+919876543210",
}) {
  // Tabs: 'lectures' | 'about' | 'faculty' | 'notes' | 'faqs'
  const hashTab = typeof window !== "undefined"
    ? (["lectures", "about", "faculty", "notes", "faqs"].includes(window.location.hash.replace("#", ""))
        ? window.location.hash.replace("#", "")
        : "lectures")
    : "lectures";
  const [activeTabOverride, setActiveTabOverride] = useState(null);
  const activeTab = activeTabOverride || hashTab;

  const [searchQuery, setSearchQuery] = useState("");
  const [previewLecture, setPreviewLecture] = useState(null);

  // Manual section toggle overrides: map of sectionName -> boolean
  const [toggledSections, setToggledSections] = useState({});
  // "View all N lectures" per section: map of sectionName -> boolean
  const [showAllInMap, setShowAllInMap] = useState({});

  // Personalized access state from GET /api/me/course-access?slug=
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isSavedForLater, setIsSavedForLater] = useState(false);

  // Group lectures by section
  const sectionsList = useMemo(() => {
    const map = new Map();
    for (const lec of lectures) {
      const secName = lec.section || "General";
      if (!map.has(secName)) {
        map.set(secName, []);
      }
      map.get(secName).push(lec);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items,
      count: items.length,
      totalTime: formatTotalTime(items),
    }));
  }, [lectures]);

  const handleTabChange = (tab) => {
    setActiveTabOverride(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // Fetch personalized student access
  useEffect(() => {
    let cancelled = false;
    async function fetchCourseAccess() {
      try {
        const res = await fetch(`/api/me/course-access?slug=${encodeURIComponent(course.slug)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setUserData(data);
          }
        }
      } catch {
        // Silently fail to visitor mode
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    }
    fetchCourseAccess();
    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return sectionsList;
    }
    const q = searchQuery.toLowerCase().trim();
    return sectionsList
      .map((sec) => {
        const matchesSecName = sec.name.toLowerCase().includes(q);
        const matchedItems = sec.items.filter((item) =>
          item.title.toLowerCase().includes(q)
        );
        if (matchesSecName || matchedItems.length > 0) {
          return {
            ...sec,
            items: matchesSecName ? sec.items : matchedItems,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [sectionsList, searchQuery]);

  const isSectionExpanded = (name, index) => {
    if (searchQuery.trim()) {
      return true; // auto-expand all when search query is active
    }
    if (toggledSections[name] !== undefined) {
      return toggledSections[name];
    }
    return index === 0; // Section 1 expanded by default (Reference B)
  };

  const toggleSection = (name, index) => {
    const current = isSectionExpanded(name, index);
    setToggledSections((prev) => ({
      ...prev,
      [name]: !current,
    }));
  };

  const toggleShowAll = (name) => {
    setShowAllInMap((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const whatsappHref = `https://wa.me/${siteWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Hello RD Classes, I want to know more about ${course.title} ${course.subtitle || ""}.`
  )}`;

  return (
    <div className="w-full">
      {/* 1. TABS & SEARCH CONTAINER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E2E8F0]">
        {/* Navigation Tabs (role="tablist") */}
        <div
          role="tablist"
          aria-label="Course Sections"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {[
            { id: "lectures", label: "Lectures" },
            { id: "about", label: "About" },
            { id: "faculty", label: "Faculty" },
            { id: "notes", label: "Notes" },
            { id: "faqs", label: "FAQs" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-4 py-2.5 rounded-lg text-sm transition-all whitespace-nowrap min-h-[44px] flex items-center font-semibold ${
                  isActive
                    ? "text-[#0B1B3D] font-bold"
                    : "text-[#556987] hover:text-[#0B1B3D] hover:bg-[#F8FAFC]"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#FFB800] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Curriculum Search Box */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lectures, topics, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0B1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. TWO-COLUMN GRID (Main Content + Sticky Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: LECTURES ACCORDION */}
          {activeTab === "lectures" && (
            <div id="panel-lectures" role="tabpanel" aria-labelledby="tab-lectures" className="space-y-4">
              {filteredSections.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0]">
                  <p className="text-sm text-[#556987]">No lectures found matching &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-xs font-semibold text-[#0066FF] hover:underline"
                  >
                    Clear search query
                  </button>
                </div>
              ) : (
                filteredSections.map((sec, secIdx) => {
                  const isExpanded = isSectionExpanded(sec.name, secIdx);
                  const tone = SECTION_TONE_CYCLE[secIdx % SECTION_TONE_CYCLE.length];
                  const showAll = !!showAllInMap[sec.name];
                  const displayItems = showAll ? sec.items : sec.items.slice(0, 5);

                  return (
                    <div
                      key={sec.name}
                      className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden transition-all shadow-sm"
                    >
                      {/* Section Header Card */}
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.name, secIdx)}
                        className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#F8FAFC]/60 transition-colors min-h-[72px]"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Tone circle with section number */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: tone.bg, color: tone.text }}
                          >
                            {String(secIdx + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D] tracking-tight truncate">
                              {sec.name}
                            </h3>
                            <p className="text-xs text-[#556987] mt-0.5 font-medium">
                              {sec.count} Lectures · {sec.totalTime}
                            </p>
                          </div>
                        </div>

                        <div className="ml-3 p-1.5 rounded-lg text-[#64748B]">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Section Lecture Rows */}
                      {isExpanded && (
                        <div className="border-t border-[#F1F5F9] divide-y divide-[#F8FAFC]">
                          {displayItems.map((lec, lecIdx) => {
                            const isEnrolled = userData?.enrolled;
                            const isCompleted = userData?.completedLectureIds?.includes(lec._id);

                            return (
                              <div
                                key={lec._id}
                                className="px-5 py-3.5 sm:px-6 flex items-center justify-between gap-4 text-xs hover:bg-[#F8FAFC] transition-colors min-h-[52px]"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Icon: Video or Document */}
                                  <div className="w-7 h-7 rounded-lg bg-[#EBF5FF] text-[#0066FF] flex items-center justify-center flex-shrink-0">
                                    <Video className="w-3.5 h-3.5" />
                                  </div>

                                  <div className="min-w-0">
                                    {isEnrolled ? (
                                      <Link
                                        href={`/student/courses/${course.slug}/lectures/${lec._id}`}
                                        className="font-semibold text-[#0B1B3D] hover:text-[#0066FF] transition-colors truncate block"
                                      >
                                        {lecIdx + 1}. {lec.title}
                                      </Link>
                                    ) : (
                                      <span className="font-semibold text-[#0B1B3D] truncate block">
                                        {lecIdx + 1}. {lec.title}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <span className="text-[#64748B] font-mono text-[11px]">
                                    {formatDuration(lec.durationSec)}
                                  </span>

                                  {/* State: Watch Now for preview, locks for visitors, play/check for enrolled */}
                                  {isEnrolled ? (
                                    isCompleted ? (
                                      <span
                                        className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]"
                                        title="Completed"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </span>
                                    ) : (
                                      <Link
                                        href={`/student/courses/${course.slug}/lectures/${lec._id}`}
                                        className="w-7 h-7 rounded-full bg-[#0066FF] text-white flex items-center justify-center hover:bg-[#0052CC] transition-colors shadow-sm"
                                        title="Play lecture"
                                      >
                                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                      </Link>
                                    )
                                  ) : lec.isPreview ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLecture(lec)}
                                      className="px-3 py-1.5 rounded-full bg-[#0B2545] text-white font-semibold text-[11px] hover:bg-[#143565] transition-all shadow-sm flex items-center gap-1.5"
                                    >
                                      <span>Watch Now</span>
                                    </button>
                                  ) : (
                                    <div
                                      className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center"
                                      title="Locked lecture (Enroll to watch)"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Reference B: "View all N lectures" toggle button */}
                          {sec.items.length > 5 && (
                            <div className="p-3 text-center bg-[#F8FAFC]/50">
                              <button
                                type="button"
                                onClick={() => toggleShowAll(sec.name)}
                                className="text-xs font-semibold text-[#0B2545] hover:text-[#0066FF] transition-colors inline-flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-white"
                              >
                                <span>
                                  {showAll
                                    ? "Show fewer lectures"
                                    : `View all ${sec.items.length} lectures`}
                                </span>
                                {showAll ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: ABOUT PANEL */}
          {activeTab === "about" && (
            <div id="panel-about" role="tabpanel" aria-labelledby="tab-about" className="space-y-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-bold text-[#0B1B3D]">About This Course</h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {course.about || course.description}
                </p>
              </div>

              {/* Course Highlights */}
              {course.highlights && course.highlights.length > 0 && (
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-4">
                  <h3 className="text-base font-bold text-[#0B1B3D]">Course Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        {renderItemIcon(h.icon)}
                        <span className="text-xs font-semibold text-[#0B1B3D]">{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACULTY PANEL */}
          {activeTab === "faculty" && (
            <div id="panel-faculty" role="tabpanel" aria-labelledby="tab-faculty" className="space-y-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFB800] to-[#FFE27A] p-0.5 shadow-md flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#0B2545] flex items-center justify-center text-white font-bold text-lg">
                      RD
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0B1B3D]">{course.facultyName || "Ronak Dugar"}</h3>
                    <p className="text-xs text-[#0066FF] font-semibold">{course.facultyRole || "Lead Accountancy Faculty"}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0]">
                  {(course.facultyBullets || [
                    "10+ years of teaching experience",
                    "Specialized in Class 11 & 12 Accountancy",
                    "Concept-based and exam-oriented approach",
                    "Trusted by thousands of students",
                  ]).map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155]">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTES PANEL */}
          {activeTab === "notes" && (
            <div id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" className="space-y-4">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-2">
                <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#0B1B3D]">Chapter Notes & Practice Formula Sheets</h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Enrolled students get instant access to printable chapter PDFs, board question sheets, and quick revision notes.
                </p>
                {userData?.enrolled ? (
                  <Link
                    href={`/student/courses/${course.slug}`}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-semibold hover:bg-[#0052CC] transition-colors"
                  >
                    <span>Open in Student Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-[#475569] text-xs font-medium">
                      <Lock className="w-3 h-3" /> Enroll to download study notes
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FAQS PANEL */}
          {activeTab === "faqs" && (
            <div id="panel-faqs" role="tabpanel" aria-labelledby="tab-faqs" className="space-y-3">
              {(course.faqs && course.faqs.length > 0 ? course.faqs : [
                { q: "Who is this course suitable for?", a: "Designed for CBSE students targeting 95+ in Accountancy." },
                { q: "Can I watch lectures offline or on mobile?", a: "Yes, you can access all high-definition lectures on mobile or desktop anytime." },
                { q: "Are tests evaluated personally by Ronak Sir?", a: "Yes, weekly Sunday mock tests include handwritten evaluation and personalized doubt clearance." },
                { q: "What is the validity of the course?", a: "Access remains active through your board examination cycle with regular updates." },
              ]).map((faq, i) => (
                <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-2">
                  <h4 className="text-sm font-bold text-[#0B1B3D] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#FFB800] flex-shrink-0" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-[#556987] pl-6 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY SIDEBAR */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* 1. PERSONALIZED CARD: Progress for enrolled, Action card for visitors */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-5">
            {userLoading ? (
              // Loading skeleton
              <div className="space-y-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            ) : userData?.enrolled ? (
              // Reference B Progress Card for Enrolled Student
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0B1B3D]">Your Progress</h4>
                  <span className="text-xs font-bold text-[#0066FF]">{userData.progressPercent}%</span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-[#556987]">
                    {userData.completedLectures} of {userData.totalLectures} lectures completed
                  </p>
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0066FF] to-[#0B2545] rounded-full transition-all duration-300"
                      style={{ width: `${userData.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <Link
                    href={`/student/courses/${course.slug}${
                      userData.lastWatchedLectureId ? `/lectures/${userData.lastWatchedLectureId}` : ""
                    }`}
                    className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#143565] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm min-h-[44px]"
                  >
                    <span>Continue Learning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsSavedForLater(!isSavedForLater)}
                    className={`w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] ${
                      isSavedForLater
                        ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                        : "bg-white text-[#556987] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSavedForLater ? "fill-[#D97706]" : ""}`} />
                    <span>{isSavedForLater ? "Saved for Later" : "Save for Later"}</span>
                  </button>
                </div>
              </div>
            ) : (
              // Reference B Visitor Action Card
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-[#0B1B3D]">Start Learning</h4>
                  <p className="text-xs text-[#556987] mt-1">
                    Get full access to all video lectures, notes, mock tests, and mentor guidance.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#143565] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Enquire on WhatsApp</span>
                  </a>

                  <Link
                    href="/student/login"
                    className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] text-[#0B1B3D] hover:bg-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Student Login</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. COURSE INCLUDES CARD (Up to 7 items from A) */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0B1B3D]">Course Includes</h4>
            <div className="space-y-3">
              {(course.includes && course.includes.length > 0
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
              ).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs text-[#334155]">
                  {renderItemIcon(item.icon)}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. FACULTY CARD: One row with chevron when no bullets, or expanded with bullets (Reference A) */}
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#0B1B3D]">Faculty</h4>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFB800] to-[#FFE27A] flex items-center justify-center text-[#0B2545] font-bold text-xs flex-shrink-0">
                  RD
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B1B3D]">{course.facultyName || "Ronak Dugar"}</p>
                  <p className="text-[11px] text-[#556987]">{course.facultyRole || "Lead Accountancy Faculty"}</p>
                </div>
              </div>

              {!course.facultyBullets || course.facultyBullets.length === 0 ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : null}
            </div>

            {/* Bullets when present */}
            {course.facultyBullets && course.facultyBullets.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[#F1F5F9]">
                {course.facultyBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-[#475569]">
                    <Check className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}

                {course.facultyProfileUrl && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange("faculty")}
                      className="text-xs font-semibold text-[#0066FF] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Faculty Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RELATED COURSES STRIP (Reference A) */}
      {relatedCourses.length > 0 && (
        <div className="mt-16 pt-12 border-t border-[#E2E8F0] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#0B1B3D]">Related Courses</h3>
              <p className="text-xs text-[#556987] mt-0.5">Explore more courses to strengthen your preparation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedCourses.map((rel) => (
              <Link
                key={rel._id}
                href={`/courses/${rel.slug}`}
                className="group p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-4 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#0066FF] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#0B1B3D] group-hover:text-[#0066FF] transition-colors truncate">
                      {rel.title}
                    </h4>
                    {rel.subtitle && (
                      <p className="text-[11px] text-[#64748B] font-medium">{rel.subtitle}</p>
                    )}
                    <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                      {rel.lectureCount} Lectures
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#F8FAFC] group-hover:bg-[#0066FF] text-[#64748B] group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. PREVIEW VIDEO MODAL PLAYER */}
      {previewLecture && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewLecture(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewLecture(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl bg-[#0B1B3D] border border-white/20 rounded-2xl overflow-hidden shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#07132B] flex items-center justify-between border-b border-white/10 text-white">
              <div className="min-w-0 pr-4">
                <span className="text-[11px] uppercase tracking-wider text-[#FFB800] font-bold">
                  Free Preview Lecture
                </span>
                <h3 id="preview-modal-title" className="text-sm font-bold truncate text-white mt-0.5">
                  {previewLecture.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLecture(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close preview modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-black">
              {previewLecture.vimeoId ? (
                <iframe
                  src={`https://player.vimeo.com/video/${previewLecture.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={previewLecture.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Video preview unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
