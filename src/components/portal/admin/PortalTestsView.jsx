"use client";

import { useState } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Clock,
  MapPin,
  Award,
  Users,
  CheckCircle2,
  Save,
  BookOpen,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Dialog from "../ui/Dialog";
import FormField from "../ui/FormField";
import Avatar from "../ui/Avatar";
import {
  createTestAction,
  updateTestAction,
  deleteTestAction,
  saveTestMarksAction,
} from "@/server/actions/admin.tests.actions.js";

export default function PortalTestsView({
  tests = [],
  courses = [],
  students = [],
  initialResultsMap = {}, // testId -> { userId: { score, maxScore } }
}) {
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [activeTest, setActiveTest] = useState(null);

  // Test form state
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Sunday Mock");
  const [startsAt, setStartsAt] = useState("");
  const [durationMin, setDurationMin] = useState(180);
  const [syllabus, setSyllabus] = useState("");
  const [venue, setVenue] = useState("RD Classes, Sector 9 Centre");
  const [className, setClassName] = useState("12");
  const [courseId, setCourseId] = useState("");
  const [published, setPublished] = useState(true);

  const [savingTest, setSavingTest] = useState(false);
  const [testError, setTestError] = useState("");

  // Marks Entry state
  const [marksModalTest, setMarksModalTest] = useState(null);
  const [marksState, setMarksState] = useState({}); // userId -> { score, maxScore }
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState("");

  const openCreate = () => {
    setActiveTest(null);
    setTitle("");
    setKind("Sunday Mock");
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay()) % 7 || 7));
    nextSunday.setHours(9, 0, 0, 0);
    setStartsAt(nextSunday.toISOString().slice(0, 16));
    setDurationMin(180);
    setSyllabus("");
    setVenue("RD Classes, Sector 9 Centre");
    setClassName("12");
    setCourseId("");
    setPublished(true);
    setTestError("");
    setModalMode("create");
  };

  const openEdit = (t) => {
    setActiveTest(t);
    setTitle(t.title || "");
    setKind(t.kind || "Sunday Mock");
    setStartsAt(
      t.startsAt ? new Date(t.startsAt).toISOString().slice(0, 16) : ""
    );
    setDurationMin(t.durationMin || 180);
    setSyllabus(t.syllabus || "");
    setVenue(t.venue || "RD Classes, Sector 9 Centre");
    setClassName(t.className || "12");
    setCourseId(t.courseId?._id || t.courseId || "");
    setPublished(t.published !== false);
    setTestError("");
    setModalMode("edit");
  };

  const openMarksEntry = (t) => {
    setMarksModalTest(t);
    setMarksSuccess("");

    // Pre-populate with existing results
    const existing = initialResultsMap[t._id] || {};
    const initialMarks = {};
    students.forEach((s) => {
      initialMarks[s._id] = {
        score: existing[s._id]?.score !== undefined ? existing[s._id].score : "",
        maxScore: existing[s._id]?.maxScore || 100,
      };
    });
    setMarksState(initialMarks);
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setSavingTest(true);
    setTestError("");

    const payload = {
      title,
      kind,
      startsAt,
      durationMin,
      syllabus,
      venue,
      className,
      courseId: courseId || null,
      published,
    };

    try {
      let res;
      if (modalMode === "create") {
        res = await createTestAction(payload);
      } else {
        res = await updateTestAction(activeTest._id, payload);
      }

      if (res?.success) {
        setModalMode(null);
        window.location.reload();
      } else {
        setTestError(res?.error || "Failed to save test.");
      }
    } finally {
      setSavingTest(false);
    }
  };

  const handleDeleteTest = async (t) => {
    if (!confirm(`Delete test "${t.title}" and its score records?`)) return;
    const res = await deleteTestAction(t._id);
    if (res?.success) {
      window.location.reload();
    }
  };

  const handleSaveMarks = async () => {
    if (!marksModalTest) return;
    setSavingMarks(true);
    setMarksSuccess("");

    const list = Object.entries(marksState)
      .filter(([_, val]) => val.score !== "" && val.score !== undefined)
      .map(([uId, val]) => ({
        userId: uId,
        score: Number(val.score),
        maxScore: Number(val.maxScore) || 100,
      }));

    try {
      const res = await saveTestMarksAction(marksModalTest._id, list);
      if (res?.success) {
        setMarksSuccess(`Successfully saved marks for ${res.count} student(s)!`);
        setTimeout(() => {
          setMarksModalTest(null);
          window.location.reload();
        }, 1200);
      }
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Sunday Mock Tests & Marks</h1>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1">
            Schedule offline mock tests, define syllabus coverage, and record student marks.
          </p>
        </div>

        <Button variant="yellow" size="md" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span>Schedule Test</span>
        </Button>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-10 h-10 mx-auto text-[var(--portal-accent-yellow)] mb-3" />
          <h3 className="text-base font-bold text-[var(--portal-text-main)]">No mock tests scheduled</h3>
          <p className="text-xs text-[var(--portal-text-muted)] mt-1 mb-4">
            Schedule a Sunday test so students see reporting times and venues on their dashboard.
          </p>
          <Button variant="yellow" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            <span>Schedule First Test</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((t) => {
            const dateObj = new Date(t.startsAt);
            const monthStr = dateObj.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).toUpperCase();
            const dayNum = dateObj.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
            const weekday = dateObj.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
            const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

            return (
              <Card key={t._id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3.5">
                      {/* Date Badge */}
                      <div className="w-16 h-20 rounded-2xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-extrabold tracking-wider text-[var(--portal-text-muted)]">
                          {monthStr}
                        </span>
                        <span className="text-2xl font-black text-[var(--portal-text-main)] leading-none my-0.5">
                          {dayNum}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--portal-text-muted)]">
                          {weekday}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--portal-accent-yellow)] text-[var(--portal-accent-yellow-text)]">
                            {t.kind || "Sunday Mock"}
                          </span>
                          <span className="text-xs font-bold text-[var(--portal-text-muted)]">Class {t.className}</span>
                          {!t.published && <Badge tone="yellow">Draft</Badge>}
                        </div>

                        <h3 className="text-base font-bold text-[var(--portal-text-main)] mt-1.5 line-clamp-1">
                          {t.title}
                        </h3>

                        <div className="space-y-1 mt-2 text-xs text-[var(--portal-text-muted)]">
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeStr} ({t.durationMin} mins)</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{t.venue || "Sector 9 Centre"}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => openEdit(t)} title="Edit test">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="soft-red" size="sm" onClick={() => handleDeleteTest(t)} title="Delete test">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {t.syllabus && (
                    <div className="p-3 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] text-xs text-[var(--portal-text-muted)] mb-4">
                      <strong className="text-[var(--portal-text-main)] block mb-0.5">Syllabus:</strong>
                      {t.syllabus}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--portal-card-border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--portal-text-muted)]">
                    Target: 100/100 Board Series
                  </span>

                  <Button
                    variant="yellow"
                    size="sm"
                    onClick={() => openMarksEntry(t)}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Enter Marks</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Test Modal */}
      <Dialog
        isOpen={!!modalMode}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Schedule Mock Test" : "Edit Test Details"}
        description="Configure test date, duration, venue, and syllabus."
      >
        <form onSubmit={handleTestSubmit} className="space-y-4 pt-2">
          {testError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {testError}
            </div>
          )}

          <FormField label="Test Title" required hint="e.g. Sunday Mock Test #15 (Pre-Board Series)">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="portal-input"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Test Kind" hint="e.g. Sunday Mock, Unit Test">
              <input
                type="text"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="portal-input"
              />
            </FormField>

            <FormField label="Target Class">
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="portal-input"
              >
                <option value="12">Class 12</option>
                <option value="11">Class 11</option>
                <option value="All">All Classes</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date and Start Time" required>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="portal-input text-xs"
                required
              />
            </FormField>

            <FormField label="Duration (Minutes)">
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="portal-input"
                min="1"
              />
            </FormField>
          </div>

          <FormField label="Venue Location">
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="portal-input"
            />
          </FormField>

          <FormField label="Syllabus Topics">
            <textarea
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              className="portal-input min-h-[60px]"
              placeholder="e.g. Accounting for Share Capital (Pro-rata & Forfeiture)..."
            />
          </FormField>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)] pt-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded accent-[var(--portal-accent-yellow)]"
            />
            <span>Published and visible to students</span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" size="sm" disabled={savingTest}>
              {savingTest ? "Saving..." : modalMode === "create" ? "Schedule Test" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Enter Marks Dialog */}
      <Dialog
        isOpen={!!marksModalTest}
        onClose={() => setMarksModalTest(null)}
        title={`Enter Marks: ${marksModalTest?.title}`}
        description="Record individual student test scores out of maximum marks."
      >
        <div className="space-y-4 pt-2">
          {marksSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{marksSuccess}</span>
            </div>
          )}

          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {students.length === 0 ? (
              <p className="text-xs text-[var(--portal-text-muted)] py-4 text-center">
                No active students registered.
              </p>
            ) : (
              students.map((st) => {
                const cur = marksState[st._id] || { score: "", maxScore: 100 };
                return (
                  <div
                    key={st._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={st.name} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-[var(--portal-text-main)] block">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-[var(--portal-text-muted)] font-mono">
                          {st.studentCode || st.loginId} • Class {st.className || "12"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Score"
                        value={cur.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMarksState((prev) => ({
                            ...prev,
                            [st._id]: { ...prev[st._id], score: val },
                          }));
                        }}
                        className="portal-input !w-20 !py-1.5 text-xs text-center font-bold"
                        min="0"
                        max={cur.maxScore || 100}
                      />
                      <span className="text-xs text-[var(--portal-text-muted)] font-bold">/</span>
                      <input
                        type="number"
                        value={cur.maxScore}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMarksState((prev) => ({
                            ...prev,
                            [st._id]: { ...prev[st._id], maxScore: Number(val) || 100 },
                          }));
                        }}
                        className="portal-input !w-16 !py-1.5 text-xs text-center font-bold"
                        min="1"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--portal-card-border)]">
            <Button variant="outline" size="sm" onClick={() => setMarksModalTest(null)}>
              Close
            </Button>
            <Button variant="yellow" size="sm" onClick={handleSaveMarks} disabled={savingMarks}>
              <Save className="w-3.5 h-3.5" />
              <span>{savingMarks ? "Saving..." : "Save All Marks"}</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
