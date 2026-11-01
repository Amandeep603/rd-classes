import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb.ts";
import { User, Device, DeviceRequest, Session, ActivityLog } from "@/lib/models/index.ts";
import { comparePassword } from "@/server/auth/password.js";

function getArchiveTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

/**
 * GET: Dry Run for Reset Devices
 * Reports counts and safe untouched fields.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    await connectDB();

    const [devicesCount, requestsCount, activeSessionsCount, studentsAffected] =
      await Promise.all([
        Device.countDocuments(),
        DeviceRequest.countDocuments(),
        Session.countDocuments({ revoked: { $ne: true } }),
        User.countDocuments({ role: "student", lastLoginAt: { $ne: null } }),
      ]);

    return NextResponse.json({
      success: true,
      dryRun: true,
      counts: {
        devices: devicesCount,
        requests: requestsCount,
        sessionsToUnbind: activeSessionsCount,
        studentsAffected,
      },
      notTouched: [
        "Student accounts",
        "Student passwords and credential hashes",
        "Course enrollments",
        "Email delivery statuses",
        "Batch assignments",
        "Video learning progress and completions",
        "Courses, lectures, tests and notes content",
      ],
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Apply Reset Devices
 * Requires typed confirmation "RESET DEVICES" and admin password.
 * Archives to devices_archive_<YYYYMMDD_HHmm>, deletes records, unbinds sessions.
 */
export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const { confirmation, adminPassword } = body;

    // 1. Validate typed confirmation
    if ((confirmation || "").trim() !== "RESET DEVICES") {
      return NextResponse.json(
        { error: 'Typed confirmation must match "RESET DEVICES" exactly.' },
        { status: 400 }
      );
    }

    // 2. Validate admin password
    const adminUser = await User.findById(auth.user._id);
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found." }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(adminPassword || "", adminUser.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect admin password. Action aborted." },
        { status: 403 }
      );
    }

    const timestamp = getArchiveTimestamp();
    const archiveDevicesName = `devices_archive_${timestamp}`;
    const archiveRequestsName = `device_requests_archive_${timestamp}`;

    const db = mongoose.connection.db;

    // 3. Backup & Archive Device collection
    const rawDevices = await Device.find().lean();
    if (rawDevices.length > 0) {
      await db.collection(archiveDevicesName).insertMany(rawDevices);
      const archivedDeviceCount = await db.collection(archiveDevicesName).countDocuments();
      if (archivedDeviceCount !== rawDevices.length) {
        throw new Error(
          `Archive verification failed: expected ${rawDevices.length} devices, archived ${archivedDeviceCount}.`
        );
      }
    }

    // 4. Backup & Archive DeviceRequest collection
    const rawRequests = await DeviceRequest.find().lean();
    if (rawRequests.length > 0) {
      await db.collection(archiveRequestsName).insertMany(rawRequests);
      const archivedReqCount = await db.collection(archiveRequestsName).countDocuments();
      if (archivedReqCount !== rawRequests.length) {
        throw new Error(
          `Archive verification failed: expected ${rawRequests.length} requests, archived ${archivedReqCount}.`
        );
      }
    }

    // 5. Delete all device and device-request records
    await Device.deleteMany({});
    await DeviceRequest.deleteMany({});

    // 6. Unbind active sessions (set deviceId to null/empty string)
    // Nobody is logged out! The adoption rule will bind the device at their next request.
    const unbindResult = await Session.updateMany(
      { revoked: { $ne: true } },
      { $set: { deviceId: "" } }
    );

    // 7. Clear only device-derived display fields on students
    await User.updateMany(
      { role: "student" },
      { $set: { deviceCount: 0 } }
    );

    // 8. Audit log (who, when, counts, no personal data)
    await ActivityLog.create({
      actorId: auth.user._id,
      action: "device.reset_all",
      entity: "Device",
      meta: {
        adminLoginId: auth.user.loginId,
        archiveDevicesName,
        archiveRequestsName,
        deletedDevicesCount: rawDevices.length,
        deletedRequestsCount: rawRequests.length,
        unboundSessionsCount: unbindResult.modifiedCount || 0,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Reset complete. Archived ${rawDevices.length} devices and ${rawRequests.length} requests. Unbound ${unbindResult.modifiedCount || 0} active sessions for automatic re-adoption.`,
      archiveDevicesName,
      archiveRequestsName,
      counts: {
        devices: rawDevices.length,
        requests: rawRequests.length,
        unboundSessions: unbindResult.modifiedCount || 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

