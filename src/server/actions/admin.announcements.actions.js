"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import connectDB from "../db/connect.js";
import { Announcement } from "../db/models/Announcement.js";
import { logAuditEvent } from "../services/audit.js";

export async function createAnnouncementAction(payload) {
  const admin = await requireAdmin();

  if (!payload.title || !payload.title.trim()) {
    return { success: false, error: "Title is required." };
  }
  if (!payload.body || !payload.body.trim()) {
    return { success: false, error: "Announcement body is required." };
  }

  await connectDB();

  const announcement = await Announcement.create({
    title: payload.title.trim(),
    body: payload.body.trim(),
    audience: {
      all: payload.audience?.all !== false,
      courseIds: Array.isArray(payload.audience?.courseIds) ? payload.audience.courseIds : [],
    },
    startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
    endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
    active: payload.active !== false,
    dismissible: payload.dismissible !== false,
    createdBy: admin.user._id,
  });

  await logAuditEvent({
    actorId: admin.user._id,
    action: "announcement.created",
    targetType: "announcement",
    targetId: announcement._id.toString(),
    meta: { title: announcement.title },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/student");

  return { success: true, announcement: JSON.parse(JSON.stringify(announcement)) };
}

export async function updateAnnouncementAction(id, payload) {
  const admin = await requireAdmin();

  if (!payload.title || !payload.title.trim()) {
    return { success: false, error: "Title is required." };
  }
  if (!payload.body || !payload.body.trim()) {
    return { success: false, error: "Announcement body is required." };
  }

  await connectDB();

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    {
      title: payload.title.trim(),
      body: payload.body.trim(),
      audience: {
        all: payload.audience?.all !== false,
        courseIds: Array.isArray(payload.audience?.courseIds) ? payload.audience.courseIds : [],
      },
      startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
      endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      active: payload.active !== false,
      dismissible: payload.dismissible !== false,
    },
    { new: true }
  );

  if (!announcement) {
    return { success: false, error: "Announcement not found." };
  }

  await logAuditEvent({
    actorId: admin.user._id,
    action: "announcement.updated",
    targetType: "announcement",
    targetId: id,
    meta: { title: announcement.title },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/student");

  return { success: true };
}

export async function deleteAnnouncementAction(id) {
  const admin = await requireAdmin();

  await connectDB();
  const deleted = await Announcement.findByIdAndDelete(id);

  if (deleted) {
    await logAuditEvent({
      actorId: admin.user._id,
      action: "announcement.deleted",
      targetType: "announcement",
      targetId: id,
      meta: { title: deleted.title },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/student");

  return { success: true };
}
