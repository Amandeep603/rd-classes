import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User, Enrollment, Session, ActivityLog } from "@/lib/models";
import { deleteStudent } from "@/server/services/studentAdminService.js";

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    await connectDB();
    const student = await User.findById(id);
    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (body.name !== undefined) student.name = body.name.trim();
    if (body.email !== undefined) {
      student.email = body.email ? body.email.toLowerCase().trim() : undefined;
    }
    if (body.phone !== undefined) {
      student.phone = body.phone.replace(/\D/g, "").slice(-10);
    }
    if (body.status !== undefined) {
      student.status = body.status;
      // If blocked, terminate active sessions
      if (body.status === "blocked") {
        await Session.updateMany({ userId: student._id }, { $set: { revoked: true } });
        await Session.deleteMany({ userId: student._id });
      }
    }
    if (body.maxDevices !== undefined) {
      student.maxDevices = Math.max(1, parseInt(body.maxDevices, 10) || 1);
    }

    await student.save();

    // Sync course enrollments if courseIds provided
    if (Array.isArray(body.courseIds)) {
      await Enrollment.deleteMany({
        $or: [{ studentId: student._id }, { userId: student._id }],
      });
      if (body.courseIds.length > 0) {
        const enrollments = body.courseIds.map((cId) => ({
          studentId: student._id,
          userId: student._id,
          courseId: cId,
          status: "active",
        }));
        await Enrollment.insertMany(enrollments, { ordered: false }).catch(() => {});
      }
    }

    try {
      await ActivityLog.create({
        actorId: admin.user._id,
        action: "student.updated",
        entity: "User",
        entityId: student._id,
        meta: {
          name: student.name,
          loginId: student.loginId,
          status: student.status,
        },
        createdAt: new Date(),
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ success: true, student });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await deleteStudent(id, admin.user._id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
