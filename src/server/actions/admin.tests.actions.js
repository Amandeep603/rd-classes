"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import connectDB from "../db/connect.js";
import { Test } from "../db/models/Test.js";
import { TestResult } from "../db/models/TestResult.js";
import { logAuditEvent } from "../services/audit.js";

export async function createTestAction(payload) {
  const admin = await requireAdmin();

  if (!payload.title || !payload.title.trim()) {
    return { success: false, error: "Test title is required." };
  }
  if (!payload.startsAt) {
    return { success: false, error: "Test date and time is required." };
  }

  await connectDB();

  const test = await Test.create({
    title: payload.title.trim(),
    kind: payload.kind?.trim() || "Sunday Mock",
    startsAt: new Date(payload.startsAt),
    durationMin: Number(payload.durationMin) || 180,
    syllabus: (payload.syllabus || "").trim(),
    venue: (payload.venue || "RD Classes, Sector 9 Centre").trim(),
    className: payload.className || "12",
    courseId: payload.courseId || null,
    published: payload.published !== false,
    createdBy: admin.user._id,
  });

  await logAuditEvent({
    actorId: admin.user._id,
    action: "test.created",
    targetType: "test",
    targetId: test._id.toString(),
    meta: { title: test.title, startsAt: test.startsAt },
  });

  revalidatePath("/admin/tests");
  revalidatePath("/student");
  revalidatePath("/student/tests");

  return { success: true, test: JSON.parse(JSON.stringify(test)) };
}

export async function updateTestAction(id, payload) {
  const admin = await requireAdmin();

  if (!payload.title || !payload.title.trim()) {
    return { success: false, error: "Test title is required." };
  }

  await connectDB();

  const test = await Test.findByIdAndUpdate(
    id,
    {
      title: payload.title.trim(),
      kind: payload.kind?.trim() || "Sunday Mock",
      startsAt: new Date(payload.startsAt),
      durationMin: Number(payload.durationMin) || 180,
      syllabus: (payload.syllabus || "").trim(),
      venue: (payload.venue || "RD Classes, Sector 9 Centre").trim(),
      className: payload.className || "12",
      courseId: payload.courseId || null,
      published: payload.published !== false,
    },
    { new: true }
  );

  if (!test) {
    return { success: false, error: "Test not found." };
  }

  await logAuditEvent({
    actorId: admin.user._id,
    action: "test.updated",
    targetType: "test",
    targetId: id,
    meta: { title: test.title },
  });

  revalidatePath("/admin/tests");
  revalidatePath("/student");
  revalidatePath("/student/tests");

  return { success: true };
}

export async function deleteTestAction(id) {
  const admin = await requireAdmin();

  await connectDB();
  const deleted = await Test.findByIdAndDelete(id);
  if (deleted) {
    await TestResult.deleteMany({ testId: id });
    await logAuditEvent({
      actorId: admin.user._id,
      action: "test.deleted",
      targetType: "test",
      targetId: id,
      meta: { title: deleted.title },
    });
  }

  revalidatePath("/admin/tests");
  revalidatePath("/student");
  revalidatePath("/student/tests");

  return { success: true };
}

export async function saveTestMarksAction(testId, results = []) {
  const admin = await requireAdmin();

  if (!testId || !Array.isArray(results)) {
    return { success: false, error: "Invalid test marks submission." };
  }

  await connectDB();

  const ops = results
    .filter((r) => r.userId && r.score !== undefined && r.score !== null && r.score !== "")
    .map((r) => ({
      updateOne: {
        filter: { testId, userId: r.userId },
        update: {
          $set: {
            score: Number(r.score),
            maxScore: Number(r.maxScore) || 100,
          },
        },
        upsert: true,
      },
    }));

  if (ops.length > 0) {
    await TestResult.bulkWrite(ops);
  }

  await logAuditEvent({
    actorId: admin.user._id,
    action: "test.marks_updated",
    targetType: "test",
    targetId: testId,
    meta: { count: ops.length },
  });

  revalidatePath("/admin/tests");
  revalidatePath("/student");
  revalidatePath("/student/tests");

  return { success: true, count: ops.length };
}
