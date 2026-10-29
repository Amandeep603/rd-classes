import { requireStudentApi } from "@/server/auth/session.js";
import connectDB from "@/server/db/connect.js";
import { Note } from "@/lib/models/Note";
import { Enrollment } from "@/lib/models/Enrollment";
import { Device } from "@/lib/models/Device";
import { cloudinary } from "@/lib/cloudinary";

export async function GET(request, { params }) {
  const auth = await requireStudentApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    await connectDB();

    const note = await Note.findById(id).lean();
    if (!note) {
      return Response.json({ error: "Note not found." }, { status: 404 });
    }

    // 1. Verify Active Enrollment in course (or free note)
    if (!note.isFree) {
      const allCourseIds = [
        ...(Array.isArray(note.courseIds) ? note.courseIds : []),
        ...(note.courseId ? [note.courseId] : []),
      ];

      if (allCourseIds.length > 0) {
        const enrollment = await Enrollment.findOne({
          $or: [
            { studentId: auth.user._id, courseId: { $in: allCourseIds }, status: "active" },
            { userId: auth.user._id, courseId: { $in: allCourseIds }, status: "active" },
          ],
        }).lean();

        if (!enrollment) {
          return Response.json(
            { error: "Access denied. You are not enrolled in this course." },
            { status: 403 }
          );
        }
      }
    }

    // 2. Verify Approved Device
    if (auth.session?.deviceId) {
      const device = await Device.findOne({
        studentId: auth.user._id,
        deviceId: auth.session.deviceId,
        status: "approved",
      }).lean();

      if (!device) {
        return Response.json(
          { error: "Access denied. This device is not approved." },
          { status: 403 }
        );
      }
    }

    // 3. Generate 1-hour signed Cloudinary URL
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    let signedDownloadUrl = note.fileUrl;

    if (note.publicId) {
      try {
        signedDownloadUrl = cloudinary.utils.private_download_url(
          note.publicId,
          "pdf",
          {
            resource_type: "raw",
            type: "authenticated",
            expires_at: expiresAt,
          }
        );
      } catch (signErr) {
        signedDownloadUrl = cloudinary.url(note.publicId, {
          resource_type: "raw",
          type: "authenticated",
          sign_url: true,
          expires_at: expiresAt,
        });
      }
    }

    return Response.json({
      success: true,
      downloadUrl: signedDownloadUrl,
      title: note.title,
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to generate download link." },
      { status: 500 }
    );
  }
}
