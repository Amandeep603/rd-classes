import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Enrollment } from "@/server/db/models/Enrollment.js";
import { Course } from "@/server/db/models/Course.js";
import { getStudentAccessibleNotes } from "@/server/services/noteService.js";
import PortalNotesView from "@/components/portal/student/PortalNotesView";
import { StudentDashboardSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Notes & Handouts | RD Classes Student Portal",
  description: "Browse and download chapter notes, practice sheets, and board papers for your enrolled courses.",
};

async function StudentNotesContent() {
  const auth = await getCurrentUser();
  if (!auth?.user) return null;

  await connectDB();
  const now = new Date();

  // Find active enrollments to get active courses
  const enrollments = await Enrollment.find({
    userId: auth.user._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .populate("courseId", "title slug published")
    .lean();

  const activeCourses = enrollments
    .map((e) => e.courseId)
    .filter((c) => c && c.published)
    .map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
    }));

  const notes = await getStudentAccessibleNotes(auth.user._id);

  // Serialize notes for client component
  const serializedNotes = notes.map((note) => ({
    _id: note._id.toString(),
    title: note.title,
    kind: note.kind,
    source: note.source,
    externalUrl: note.externalUrl || null,
    fileKey: note.fileKey || null,
    contentType: note.contentType || "application/pdf",
    fileSize: note.fileSize || 0,
    pageCount: note.pageCount || null,
    book: note.book || note.section || "General Handout",
    section: note.section || "",
    published: note.published,
    courseIds: (note.courseIds || []).map((c) => ({
      _id: c._id?.toString() || c.toString(),
      title: c.title || "",
      slug: c.slug || "",
    })),
    createdAt: note.createdAt?.toISOString() || null,
  }));

  return (
    <PortalNotesView
      initialNotes={serializedNotes}
      activeCourses={activeCourses}
    />
  );
}

export default function StudentNotesPage() {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentNotesContent />
    </Suspense>
  );
}
