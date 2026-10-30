"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  UserPlus,
  Phone,
  Mail,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Trash2,
  ExternalLink,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import Button from "@/components/portal/ui/Button";
import AddStudentWizard from "./AddStudentWizard";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "enrolled", label: "Enrolled", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "closed", label: "Closed", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

const SOURCE_LABELS = {
  "course-page": { label: "Course Page", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "lecture-lock": { label: "Lecture Lock", color: "bg-rose-50 text-rose-700 border-rose-200" },
  "notes-lock": { label: "Notes Lock", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "Contact page": { label: "Contact page", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "contact-page": { label: "Contact page", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatRelativeTime(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PortalEnquiriesView({
  initialEnquiries = [],
  courses = [],
}) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  // Add Student Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState(null);

  const filteredEnquiries = enquiries.filter((item) => {
    const courseId = item.courseId?._id?.toString() || item.courseId?.toString();
    const matchesCourse = courseFilter === "all" || courseId === courseFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.courseId?.title?.toLowerCase().includes(q) ||
      item.note?.toLowerCase().includes(q);

    return matchesCourse && matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (enquiryId, newStatus) => {
    setBusyId(enquiryId);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setEnquiries((prev) =>
        prev.map((item) =>
          item._id === enquiryId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNote = async (enquiryId) => {
    setBusyId(enquiryId);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });
      if (!res.ok) throw new Error("Failed to save note");

      setEnquiries((prev) =>
        prev.map((item) =>
          item._id === enquiryId ? { ...item, note: noteDraft } : item
        )
      );
      setEditingNoteId(null);
      setNoteDraft("");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (enquiryId) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    setBusyId(enquiryId);
    try {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete enquiry");

      setEnquiries((prev) => prev.filter((item) => item._id !== enquiryId));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenAddStudent = (enquiry) => {
    const courseId =
      enquiry.courseId?._id?.toString() || enquiry.courseId?.toString() || "";
    setWizardPrefill({
      name: enquiry.name || "",
      phone: enquiry.phone || "",
      courseId,
    });
    setWizardOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Enquiries"
        description="Leads and access requests initiated via WhatsApp buttons on the course pages, locked lectures, and handouts."
        action={null}
      />

      {/* Filters Bar */}
      <Card className="p-4 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FFC93C]/40 focus:border-[#FFC93C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="enrolled">Enrolled</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Enquiries Table or Empty State */}
      {filteredEnquiries.length === 0 ? (
        <Card className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {enquiries.length === 0
              ? "No access enquiries yet"
              : "No enquiries matching filters"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {enquiries.length === 0
              ? "When visitors or students click 'Get Access on WhatsApp' on course pages, locked lectures, or notes, their leads will appear here."
              : "Try clearing your search query or switching filters to view all access requests."}
          </p>
        </Card>
      ) : (
        <Card className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Who</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">When</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnquiries.map((item) => {
                  const course = item.courseId;
                  const sourceMeta = SOURCE_LABELS[item.source] || {
                    label: item.source || "Course",
                    color: "bg-slate-50 text-slate-700 border-slate-200",
                  };
                  const isBusy = busyId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/60 transition ${
                        item.status === "new" ? "bg-amber-50/25" : ""
                      }`}
                    >
                      {/* Course / Subject */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                          {course?.title || item.subject || "General Enquiry"}
                        </div>
                        {item.subject && course?.title && (
                          <span className="text-[10px] text-amber-700 font-bold block">
                            {item.subject}
                          </span>
                        )}
                        {course?.classLabel && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {course.classLabel}
                          </span>
                        )}
                        {!course && !item.subject && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            General
                          </span>
                        )}
                      </td>

                      {/* Who */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {item.name || (item.studentId?.name ? item.studentId.name : "Visitor")}
                        </div>
                        {item.phone && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                        {item.email && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{item.email}</span>
                          </div>
                        )}
                        {item.studentId && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                            Enrolled Student
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${sourceMeta.color}`}
                        >
                          {sourceMeta.label}
                        </span>
                      </td>

                      {/* When */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <span title={new Date(item.createdAt).toLocaleString()}>
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <select
                          disabled={isBusy}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${
                            STATUS_OPTIONS.find((s) => s.value === item.status)?.color ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 max-w-xs">
                        {editingNoteId === item._id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              className="px-2 py-1 text-xs border rounded-lg w-full"
                              placeholder="Add follow-up note..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item._id)}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded-lg font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNoteId(item._id);
                              setNoteDraft(item.note || item.message || "");
                            }}
                            className="text-slate-600 hover:text-slate-900 cursor-pointer truncate max-w-[200px] p-1 rounded hover:bg-slate-100"
                            title={item.note || item.message || "Click to add note"}
                          >
                            {item.note || item.message || (
                              <span className="text-slate-400 italic">Click to add note</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Create Student shortcut */}
                          <button
                            type="button"
                            onClick={() => handleOpenAddStudent(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs shadow-2xs transition"
                            title="Create student with prefilled details"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Create Student</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Delete enquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Student Wizard with prefilled values from enquiry */}
      <AddStudentWizard
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setWizardPrefill(null);
        }}
        courses={courses}
        initialValues={wizardPrefill}
      />
    </div>
  );
}

