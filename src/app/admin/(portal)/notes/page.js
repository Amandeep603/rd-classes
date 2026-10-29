import { Suspense } from "react";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/server/db/models/Course.js";
import { getNotesList } from "@/server/services/noteService.js";
import PortalNotesView from "@/components/portal/admin/PortalNotesView";
import { AdminTableSkeleton } from "@/components/portal/ui/Skeleton";

export const metadata = {
  title: "Notes & Materials | Admin Portal",
};

async function NotesContent({ searchParams }) {
  await requireAdmin();
  await connectDB();

  const sp = await searchParams;
  const q = sp?.q || "";
  const courseId = sp?.courseId || "";
  const kind = sp?.kind || "";

  const [coursesDocs, notesData] = await Promise.all([
    Course.find().select("title slug").sort({ title: 1 }).lean(),
    getNotesList({
      search: q,
      courseId: courseId === "all" ? "" : courseId,
      kind: kind === "all" ? "" : kind,
      publishedOnly: false,
      page: 1,
      limit: 100,
    }),
  ]);

  const courses = coursesDocs.map((c) => ({
    _id: c._id.toString(),
    title: c.title,
    slug: c.slug,
  }));

  const serializedNotes = notesData.notes.map((note) => ({
    _id: note._id.toString(),
    title: note.title,
    section: note.section || "",
    kind: note.kind,
    source: note.source,
    externalUrl: note.externalUrl || null,
    fileKey: note.fileKey || null,
    fileUrl: note.fileUrl || null,
    fileSize: note.fileSize || 0,
    pageCount: note.pageCount || null,
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
      courses={courses}
      currentFilters={{ q, courseId, kind }}
    />
  );
}

export default function AdminNotesPage(props) {
  return (
    <Suspense fallback={<AdminTableSkeleton />}>
      <NotesContent searchParams={props.searchParams} />
    </Suspense>
  );
}
