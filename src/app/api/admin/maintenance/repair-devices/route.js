import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb.ts";
import { User, Device, Session, ActivityLog } from "@/lib/models/index.ts";
import { parseDeviceDetails } from "@/server/auth/device.js";

/**
 * GET: Dry Run for Repair Devices
 * Finds students who have logged in (lastLoginAt != null) but have no approved device.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    await connectDB();

    const loggedStudents = await User.find(
      {
        role: "student",
        lastLoginAt: { $ne: null },
      },
      { loginId: 1, name: 1, lastLoginAt: 1, lastLoginIp: 1, maxDevices: 1 }
    ).lean();

    const studentIds = loggedStudents.map((s) => s._id);

    const approvedDevices = await Device.find({
      $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
      status: "approved",
    }).lean();

    const approvedStudentIdSet = new Set(
      approvedDevices.map((d) => (d.studentId || d.userId).toString())
    );

    const missingStudents = loggedStudents.filter(
      (s) => !approvedStudentIdSet.has(s._id.toString())
    );

    // Check session data for missing students
    const missingDetails = [];
    for (const s of missingStudents) {
      const latestSession = await Session.findOne({
        userId: s._id,
      })
        .sort({ lastSeenAt: -1, createdAt: -1 })
        .lean();

      let devType = "unknown";
      let os = "unknown";
      if (latestSession?.userAgent) {
        const parsed = parseDeviceDetails(latestSession.userAgent);
        devType = parsed.deviceType;
        os = parsed.osName;
      }

      missingDetails.push({
        studentId: s._id.toString(),
        loginId: s.loginId,
        lastLoginAt: s.lastLoginAt,
        hasSession: Boolean(latestSession),
        deviceType: devType,
        os,
        deviceId: latestSession?.deviceId ? latestSession.deviceId.slice(0, 8) + "..." : null,
      });
    }

    return NextResponse.json({
      success: true,
      dryRun: true,
      count: missingDetails.length,
      totalLoggedIn: loggedStudents.length,
      students: missingDetails,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Apply Device Repairs
 * Creates approved Device documents for students who logged in but had no device.
 */
export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;
  const adminId = auth.user._id;

  try {
    await connectDB();
    const now = new Date();

    const loggedStudents = await User.find(
      {
        role: "student",
        lastLoginAt: { $ne: null },
      },
      { loginId: 1, name: 1, lastLoginAt: 1, lastLoginIp: 1, maxDevices: 1, deviceLimit: 1 }
    );

    const studentIds = loggedStudents.map((s) => s._id);

    const approvedDevices = await Device.find({
      $or: [{ studentId: { $in: studentIds } }, { userId: { $in: studentIds } }],
      status: "approved",
    }).lean();

    const approvedStudentIdSet = new Set(
      approvedDevices.map((d) => (d.studentId || d.userId).toString())
    );

    const missingStudents = loggedStudents.filter(
      (s) => !approvedStudentIdSet.has(s._id.toString())
    );

    let repairedCount = 0;
    const repairedLoginIds = [];

    for (const student of missingStudents) {
      const sId = student._id;

      // Check if student has a recent session with device details
      const latestSession = await Session.findOne({ userId: sId })
        .sort({ lastSeenAt: -1, createdAt: -1 })
        .lean();

      let deviceKey = latestSession?.deviceId;
      let userAgent = latestSession?.userAgent || "";
      let ip = latestSession?.ip || student.lastLoginIp || "127.0.0.1";

      const details = parseDeviceDetails(userAgent);
      if (!deviceKey) {
        // Fallback default deviceKey for student
        deviceKey = `dev_${sId.toString().slice(-8)}`;
      }

      await Device.findOneAndUpdate(
        {
          studentId: sId,
          $or: [{ deviceId: deviceKey }, { deviceKey: deviceKey }],
        },
        {
          $set: {
            studentId: sId,
            userId: sId,
            deviceId: deviceKey,
            deviceKey: deviceKey,
            deviceType: details.deviceType || "desktop",
            os: details.osName || "",
            browser: details.browserName || "",
            model: details.model || "",
            deviceLabel: details.label || "Approved Device",
            label: details.label || "Approved Device",
            ip,
            lastIp: ip,
            userAgent,
            status: "approved",
            firstLoginAt: student.lastLoginAt || now,
            approvedAt: now,
            decidedAt: now,
            lastUsedAt: latestSession?.lastSeenAt || student.lastLoginAt || now,
            approvedBy: auth.user.loginId,
          },
        },
        { upsert: true, new: true }
      );

      // Ensure student maxDevices >= 1
      if (!student.maxDevices || student.maxDevices < 1) {
        student.maxDevices = 1;
        student.deviceLimit = 1;
      }
      student.deviceCount = 1;
      await student.save();

      repairedCount++;
      repairedLoginIds.push(student.loginId);
    }

    await ActivityLog.create({
      actorId: adminId,
      action: "device.repair_devices",
      entity: "Device",
      meta: {
        repairedCount,
        studentLoginIds: repairedLoginIds,
        adminLoginId: auth.user.loginId,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      repairedCount,
      repairedLoginIds,
      message: `Successfully repaired and registered approved devices for ${repairedCount} student(s).`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

