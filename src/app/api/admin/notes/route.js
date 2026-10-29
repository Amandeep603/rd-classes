import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Note } from "@/lib/models/Note";
import { Course } from "@/lib/models/Course";
import { cloudinary } from "@/lib/cloudinary";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const category = searchParams.get("category");
    const free = searchParams.get("free");
    const published = searchParams.get("published");
    const book = searchParams.get("book");

    await connectDB();
    const filter = {};

    if (courseId && courseId !== "all") {
      filter.$or = [{ courseId }, { courseIds: courseId }];
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (free && free !== "all") {
      filter.isFree = free === "true" || free === "free";
    }
    if (published && published !== "all") {
      filter.published = published === "true" || published === "published";
    }
    if (book && book !== "all") {
      filter.book = book;
    }

    const notes = await Note.find(filter)
      .populate("courseId", "title slug theme")
      .populate("courseIds", "title slug theme")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ success: true, notes });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const formData = await request.formData();

    const title = formData.get("title")?.toString().trim();
    const category = formData.get("category")?.toString().trim() || "notes";
    const description = formData.get("description")?.toString().trim() || "";
    const book = formData.get("book")?.toString().trim() || "";
    const chapter = formData.get("chapter")?.toString().trim() || "";
    const isFree = formData.get("isFree") === "true" || formData.get("isFree") === "on";
    const published = formData.get("published") !== "false" && formData.get("published") !== "0";

    // Parse courseIds (could be JSON array or single courseId)
    let courseIds = [];
    const courseIdsRaw = formData.get("courseIds");
    if (courseIdsRaw) {
      try {
        const parsed = JSON.parse(courseIdsRaw.toString());
        if (Array.isArray(parsed)) courseIds = parsed;
        else courseIds = [parsed];
      } catch {
        courseIds = courseIdsRaw.toString().split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    const singleCourseId = formData.get("courseId")?.toString().trim();
    if (singleCourseId && !courseIds.includes(singleCourseId)) {
      courseIds.push(singleCourseId);
    }

    // Handle "all" courses flag if selected
    if (formData.get("allCourses") === "true" || courseIds.includes("all")) {
      await connectDB();
      const allCourses = await Course.find({}).select("_id").lean();
      courseIds = allCourses.map((c) => c._id.toString());
    }

    const file = formData.get("file");

    if (!title) {
      return Response.json({ error: "Title is required." }, { status: 400 });
    }
    if (courseIds.length === 0) {
      return Response.json({ error: "Please attach to at least one course." }, { status: 400 });
    }
    if (!file || typeof file !== "object" || !file.name) {
      return Response.json({ error: "PDF file is required." }, { status: 400 });
    }

    // 1. Validate size <= 10MB
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return Response.json(
        { error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    // 2. Validate PDF format
    const mime = file.type || "";
    const isPdf = mime.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return Response.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Upload with resource_type "raw", type "authenticated", folder "rd-classes/notes"
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "rd-classes/notes",
          resource_type: "raw",
          type: "authenticated",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    await connectDB();

    const note = await Note.create({
      courseId: courseIds[0],
      courseIds,
      category,
      kind: category,
      book,
      chapter,
      section: chapter || book || "General",
      title,
      description,
      isFree,
      published,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      sizeBytes: file.size,
      fileSize: file.size,
    });

    try {
      const { createAdminNotification, createStudentNotification } = await import("@/server/services/notificationService.js");
      await createAdminNotification({
        type: "note_uploaded",
        title: "Note Uploaded",
        message: `Note "${note.title}" was uploaded and attached to ${courseIds.length} course(s)`,
        link: "/admin/notes",
        entityId: note._id.toString(),
      });
      if (published) {
        await createStudentNotification({
          type: "note_uploaded",
          title: `New Note: ${note.title}`,
          message: `${note.book ? `${note.book} · ` : ""}${note.chapter || "New study material uploaded"}`,
          courseId: courseIds[0] || null,
          link: "/student/notes",
          entityId: note._id.toString(),
        });
      }
    } catch {
      // ignore
    }

    try {
      revalidateTag("notes");
      revalidateTag("courses");
      revalidatePath("/notes");
    } catch {
      // ignore
    }

    return Response.json({ success: true, note }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err?.message || "Upload failed." }, { status: 500 });
  }
}
