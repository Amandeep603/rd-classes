import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Note } from "@/lib/models/Note";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, noteIds, courseId } = body;

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return Response.json({ error: "No notes selected." }, { status: 400 });
    }

    await connectDB();

    switch (action) {
      case "attach": {
        if (!courseId) {
          return Response.json({ error: "Course ID is required to attach." }, { status: 400 });
        }
        await Note.updateMany(
          { _id: { $in: noteIds } },
          { $addToSet: { courseIds: courseId } }
        );
        return Response.json({ success: true, message: `Attached ${noteIds.length} notes to course.` });
      }

      case "mark-free": {
        await Note.updateMany(
          { _id: { $in: noteIds } },
          { $set: { isFree: true } }
        );
        return Response.json({ success: true, message: `Marked ${noteIds.length} notes as free.` });
      }

      case "mark-locked": {
        await Note.updateMany(
          { _id: { $in: noteIds } },
          { $set: { isFree: false } }
        );
        return Response.json({ success: true, message: `Marked ${noteIds.length} notes as locked.` });
      }

      case "publish": {
        await Note.updateMany(
          { _id: { $in: noteIds } },
          { $set: { published: true } }
        );
        return Response.json({ success: true, message: `Published ${noteIds.length} notes.` });
      }

      case "unpublish": {
        await Note.updateMany(
          { _id: { $in: noteIds } },
          { $set: { published: false } }
        );
        return Response.json({ success: true, message: `Unpublished ${noteIds.length} notes.` });
      }

      case "delete": {
        const notes = await Note.find({ _id: { $in: noteIds } }).select("publicId");
        for (const note of notes) {
          if (note.publicId) {
            try {
              await cloudinary.uploader.destroy(note.publicId, {
                resource_type: "raw",
                type: "authenticated",
              });
            } catch (err) {
              console.warn("Failed to delete Cloudinary asset for note:", note._id, err?.message);
            }
          }
        }
        await Note.deleteMany({ _id: { $in: noteIds } });
        return Response.json({ success: true, message: `Deleted ${noteIds.length} notes.` });
      }

      default:
        return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err?.message || "Bulk action failed." }, { status: 500 });
  }
}

