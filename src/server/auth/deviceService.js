import "server-only";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { Session } from "../../lib/models/Session.ts";
import { ActivityLog } from "../../lib/models/ActivityLog.ts";

/**
 * Approves a pending device request.
 * Modes:
 * - "replace": marks old device 'revoked' and kills its sessions; approves new device
 * - "add": increments student's maxDevices and approves new device
 */
export async function approveDeviceRequest(
  requestId,
  { mode = "add", replaceDeviceId = null } = {},
  adminId
) {
  await connectDB();
  const now = new Date();

  // Try finding in Device collection
  let device = await Device.findById(requestId);
  let userId = device?.studentId || device?.userId;

  // Fallback to legacy DeviceRequest if necessary
  if (!device) {
    const { DeviceRequest } = await import("../db/models/DeviceRequest.js").catch(() => ({}));
    if (DeviceRequest) {
      const req = await DeviceRequest.findById(requestId);
      if (req) {
        userId = req.userId;
        device = await Device.findOne({
          $or: [{ studentId: userId }, { userId }],
          deviceId: req.deviceId,
        });
        if (!device) {
          device = await Device.create({
            studentId: userId,
            userId,
            deviceId: req.deviceId,
            deviceLabel: req.label,
            label: req.label,
            userAgent: req.userAgent,
            ip: req.ip,
            status: "pending",
          });
        }
        req.status = "approved";
        req.resolvedAt = now;
        req.resolvedBy = adminId ? adminId.toString() : "admin";
        await req.save();
      }
    }
  }

  if (!device) {
    throw new Error("Device request not found.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Student associated with device not found.");
  }

  if (mode === "replace") {
    if (!replaceDeviceId) {
      throw new Error("A device to replace must be specified.");
    }

    // Revoke old device
    await Device.updateMany(
      {
        $or: [{ studentId: user._id }, { userId: user._id }],
        deviceId: replaceDeviceId,
      },
      {
        $set: {
          status: "revoked",
          decidedAt: now,
        },
      }
    );

    // Terminate all sessions for replaced device
    await Session.updateMany(
      { userId: user._id, deviceId: replaceDeviceId },
      { $set: { revoked: true } }
    );
    await Session.deleteMany({ userId: user._id, deviceId: replaceDeviceId });
  } else if (mode === "add") {
    // Increase allowed maxDevices
    user.maxDevices = (user.maxDevices || 1) + 1;
    await user.save();
  }

  // Approve this device
  device.status = "approved";
  device.decidedAt = now;
  device.approvedAt = now;
  device.approvedBy = adminId ? adminId.toString() : "admin";
  device.lastUsedAt = now;
  await device.save();

  // Log in ActivityLog
  try {
    await ActivityLog.create({
      actorId: adminId || user._id,
      action: "device.approved",
      entity: "Device",
      entityId: device._id,
      meta: {
        studentId: user._id.toString(),
        studentName: user.name,
        loginId: user.loginId,
        deviceId: device.deviceId,
        label: device.deviceLabel || device.label,
        mode,
        replacedDeviceId: replaceDeviceId,
      },
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to write ActivityLog for device approval:", e);
  }

  return { success: true };
}

/**
 * Rejects a pending device request.
 */
export async function rejectDeviceRequest(requestId, note = "", adminId) {
  await connectDB();
  const now = new Date();

  let device = await Device.findById(requestId);
  let userId = device?.studentId || device?.userId;

  if (!device) {
    const { DeviceRequest } = await import("../db/models/DeviceRequest.js").catch(() => ({}));
    if (DeviceRequest) {
      const req = await DeviceRequest.findById(requestId);
      if (req) {
        userId = req.userId;
        device = await Device.findOne({
          $or: [{ studentId: userId }, { userId }],
          deviceId: req.deviceId,
        });
        req.status = "rejected";
        req.resolvedAt = now;
        req.note = note || "";
        req.resolvedBy = adminId ? adminId.toString() : "admin";
        await req.save();
      }
    }
  }

  if (device) {
    device.status = "rejected";
    device.decidedAt = now;
    await device.save();
  }

  // Log in ActivityLog
  try {
    await ActivityLog.create({
      actorId: adminId || userId,
      action: "device.rejected",
      entity: "Device",
      entityId: device ? device._id : requestId,
      meta: {
        studentId: userId ? userId.toString() : null,
        note,
      },
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to write ActivityLog for device rejection:", e);
  }

  return { success: true };
}

/**
 * Revokes an approved device and kills its active sessions.
 */
export async function removeDevice(userId, deviceId, adminId) {
  await connectDB();
  const now = new Date();

  await Device.updateMany(
    {
      $or: [{ studentId: userId }, { userId }],
      deviceId,
    },
    {
      $set: {
        status: "revoked",
        decidedAt: now,
      },
    }
  );

  await Session.updateMany(
    { userId, deviceId },
    { $set: { revoked: true } }
  );
  await Session.deleteMany({ userId, deviceId });

  try {
    await ActivityLog.create({
      actorId: adminId || userId,
      action: "device.revoked",
      entity: "Device",
      entityId: null,
      meta: {
        studentId: userId.toString(),
        deviceId,
      },
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to write ActivityLog for device revocation:", e);
  }

  return { success: true };
}

/**
 * Resets all approved devices and sessions for a student.
 */
export async function resetAllDevices(userId, adminId) {
  await connectDB();
  const now = new Date();

  await Device.updateMany(
    { $or: [{ studentId: userId }, { userId }] },
    { $set: { status: "revoked", decidedAt: now } }
  );
  await Session.updateMany({ userId }, { $set: { revoked: true } });
  await Session.deleteMany({ userId });

  try {
    await ActivityLog.create({
      actorId: adminId || userId,
      action: "device.reset_all",
      entity: "User",
      entityId: userId,
      meta: { studentId: userId.toString() },
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to write ActivityLog for device reset:", e);
  }

  return { success: true };
}

/**
 * Logs out all active sessions for a student across all devices.
 */
export async function logoutAllSessions(userId, adminId) {
  await connectDB();
  const now = new Date();

  await Session.updateMany({ userId }, { $set: { revoked: true } });
  await Session.deleteMany({ userId });

  try {
    await ActivityLog.create({
      actorId: adminId || userId,
      action: "student.logged_out_everywhere",
      entity: "User",
      entityId: userId,
      meta: { studentId: userId.toString() },
      createdAt: now,
    });
  } catch (e) {
    console.error("Failed to write ActivityLog for logout everywhere:", e);
  }

  return { success: true };
}

/**
 * Sets device limit for a student.
 */
export async function setDeviceLimit(userId, limit, adminId) {
  await connectDB();
  const num = Math.max(1, Math.min(5, Number(limit) || 1));
  await User.updateOne({ _id: userId }, { $set: { maxDevices: num } });
  return { success: true };
}
