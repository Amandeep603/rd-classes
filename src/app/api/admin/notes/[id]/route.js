import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Note } from "@/lib/models/Note";
import { Course } from "@/lib/models/Course";
import { cloudinary } from "@/lib/cloudinary";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();
    const note = await Note.findById(id);
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // Delete from Cloudinary if publicId exists
    if (note.publicId) {
      try {
        await cloudinary.uploader.destroy(note.publicId, {
          resource_type: "raw",
          type: "authenticated",
        });
      } catch (cErr) {
        console.warn("Cloudinary asset deletion error:", cErr?.message);
      }
    }

    await Note.findByIdAndDelete(id);

    try {
      revalidateTag("notes");
      revalidateTag("courses");
      revalidatePath("/notes");
    } catch {
      // ignore
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectDB();
    const note = await Note.findById(id);
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (body.title !== undefined) note.title = body.title.trim();
      if (body.book !== undefined) note.book = body.book.trim();
      if (body.chapter !== undefined) note.chapter = body.chapter.trim();
      if (body.category !== undefined) {
        note.category = body.category;
        note.kind = body.category;
      }
      if (body.description !== undefined) note.description = body.description.trim();
      if (body.isFree !== undefined) note.isFree = Boolean(body.isFree);
      if (body.published !== undefined) note.published = Boolean(body.published);
      if (body.courseIds !== undefined) {
        note.courseIds = body.courseIds;
        if (body.courseIds.length > 0) note.courseId = body.courseIds[0];
      }
      if (body.courseId !== undefined) {
        note.courseId = body.courseId;
        if (!note.courseIds.includes(body.courseId)) {
          note.courseIds.push(body.courseId);
        }
      }

      await note.save();
      try {
        revalidateTag("notes");
        revalidateTag("courses");
        revalidatePath("/notes");
      } catch {
        // ignore
      }
      return Response.json({ success: true, note });
    }

    // FormData (with optional file replacement)
    const formData = await request.formData();

    const title = formData.get("title");
    const book = formData.get("book");
    const chapter = formData.get("chapter");
    const category = formData.get("category");
    const description = formData.get("description");
    const isFree = formData.get("isFree");
    const published = formData.get("published");
    const file = formData.get("file");

    if (title) note.title = title.toString().trim();
    if (book !== null && book !== undefined) note.book = book.toString().trim();
    if (chapter !== null && chapter !== undefined) note.chapter = chapter.toString().trim();
    if (category) {
      note.category = category.toString().trim();
      note.kind = note.category;
    }
    if (description !== null && description !== undefined) {
      note.description = description.toString().trim();
    }
    if (isFree !== null && isFree !== undefined) {
      note.isFree = isFree === "true" || isFree === "on" || isFree === "1";
    }
    if (published !== null && published !== undefined) {
      note.published = published === "true" || published === "on" || published === "1";
    }

    const courseIdsRaw = formData.get("courseIds");
    if (courseIdsRaw) {
      try {
        const parsed = JSON.parse(courseIdsRaw.toString());
        note.courseIds = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        note.courseIds = courseIdsRaw.toString().split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (note.courseIds.length > 0) note.courseId = note.courseIds[0];
    } else {
      const singleCourseId = formData.get("courseId");
      if (singleCourseId) {
        note.courseId = singleCourseId.toString().trim();
        note.courseIds = [note.courseId];
      }
    }

    // If replacement file provided:
    if (file && typeof file === "object" && file.size > 0) {
      if (file.size > MAX_PDF_SIZE_BYTES) {
        return Response.json(
          { error: "File size exceeds the 10 MB limit." },
          { status: 400 }
        );
      }

      const mime = file.type || "";
      if (!mime.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        return Response.json(
          { error: "Invalid file type. Only PDF files are allowed." },
          { status: 400 }
        );
      }

      // Delete old file from Cloudinary
      if (note.publicId) {
        try {
          await cloudinary.uploader.destroy(note.publicId, {
            resource_type: "raw",
            type: "authenticated",
          });
        } catch (cErr) {
          console.warn("Could not delete old Cloudinary asset:", cErr?.message);
        }
      }

      // Upload replacement file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

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

      note.fileUrl = uploadResult.secure_url;
      note.publicId = uploadResult.public_id;
      note.sizeBytes = file.size;
      note.fileSize = file.size;
    }

    await note.save();

    try {
      revalidateTag("notes");
      revalidateTag("courses");
      revalidatePath("/notes");
    } catch {
      // ignore
    }

    return Response.json({ success: true, note });
  } catch (err) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
