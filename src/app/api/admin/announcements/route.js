import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Announcement } from "@/lib/models/Announcement";
import { logAuditEvent } from "@/server/services/audit.js";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  body: z.string().min(1, "Body content is required").trim(),
  audience: z.union([z.string(), z.record(z.any())]).default("all"),
  pinned: z.boolean().default(false),
  expiresAt: z.string().nullable().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const announcements = await Announcement.find()
      .sort({ pinned: -1, createdAt: -1 })
      .lean();
    return Response.json({ success: true, announcements });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch announcements." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid data." },
        { status: 400 }
      );
    }

    await connectDB();
    const expDate = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    const announcement = await Announcement.create({
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience || "all",
      pinned: parsed.data.pinned,
      expiresAt: expDate,
      endsAt: expDate,
      startsAt: new Date(),
      active: true,
      dismissible: true,
    });

    await logAuditEvent({
      actorId: admin.user._id,
      action: "announcement.created",
      entity: "Announcement",
      entityId: announcement._id.toString(),
      meta: { title: announcement.title, audience: announcement.audience, pinned: announcement.pinned },
    });

    try {
      const { createStudentNotification } = await import("@/server/services/notificationService.js");
      await createStudentNotification({
        type: "announcement_posted",
        title: `Announcement: ${announcement.title}`,
        message: announcement.body,
        courseId: null,
        link: "/student",
        entityId: announcement._id.toString(),
      });
    } catch {
      // ignore
    }

    return Response.json({ success: true, announcement }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to create announcement." },
      { status: 500 }
    );
  }
}
