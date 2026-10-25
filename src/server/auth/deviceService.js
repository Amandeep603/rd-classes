import "server-only";
import connectDB from "../db/connect.js";
import { User } from "../db/models/User.js";
import { Device } from "../db/models/Device.js";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
import { Session } from "../db/models/Session.js";
import { logAuditEvent } from "../services/audit.js";

/**
 * Approves a pending device request.
 * Modes:
 * - "add": requires free slot (deviceCount < deviceLimit)
 * - "replace": removes an existing device and its sessions, then registers the new device without altering count
 * - "raise-and-add": increases deviceLimit (up to 3) and approves as "add"
 */
export async function approveDeviceRequest(
  requestId,
  { mode = "add", replaceDeviceId = null } = {},
  adminId
) {
  await connectDB();
  const request = await DeviceRequest.findById(requestId);
  if (!request || request.status !== "pending") {
    throw new Error("Device request not found or already resolved.");
  }

  const user = await User.findById(request.userId);
  if (!user) {
    throw new Error("User associated with device request not found.");
  }

  const now = new Date();

  if (mode === "raise-and-add") {
    if (user.deviceLimit >= 3) {
      throw new Error("Device limit cannot exceed 3.");
    }
    user.deviceLimit += 1;
    await user.save();
    mode = "add";
  }

  if (mode === "add") {
    // Atomic slot claim
    const updateResult = await User.updateOne(
      { _id: user._id, deviceCount: { $lt: user.deviceLimit } },
      { $inc: { deviceCount: 1 } }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error(
        `Device limit (${user.deviceLimit}) reached. Increase the limit or choose 'Replace an existing device'.`
      );
    }
  } else if (mode === "replace") {
    if (!replaceDeviceId) {
      throw new Error("A device to replace must be specified.");
    }

    // Delete the replaced device and all its active sessions
    await Device.deleteOne({ userId: user._id, deviceId: replaceDeviceId });
    await Session.deleteMany({ userId: user._id, deviceId: replaceDeviceId });

    // Counter remains unchanged since one was removed and one is being added
  } else {
    throw new Error(`Unsupported approval mode: ${mode}`);
  }

  // Register the new Device
  await Device.create({
    userId: user._id,
    deviceId: request.deviceId,
    label: request.label,
    userAgent: request.userAgent,
    ip: request.ip,
    approvedAt: now,
    approvedBy: adminId.toString(),
    lastUsedAt: now,
  });

  // Mark request as approved
  request.status = "approved";
  request.resolvedAt = now;
  request.resolvedBy = adminId.toString();
  await request.save();

  await logAuditEvent({
    actorId: adminId,
    action: "device.approved",
    targetType: "student",
    targetId: user._id.toString(),
    meta: {
      requestId: request._id.toString(),
      deviceId: request.deviceId,
      mode,
      label: request.label,
    },
  });

  // Optional email notification when user has email and setting is ON
  if (user.email) {
    try {
      const { Settings } = await import("../db/models/Settings.js");
      const { isEmailConfigured } = await import("../email/emailConfig.js");
      const { sendEmail } = await import("../email/emailService.js");
      const { renderDeviceApprovedTemplate } = await import("../email/templates/deviceApproved.js");

      if (isEmailConfigured()) {
        const settings = await Settings.findById("global").lean();
        if (settings?.emailOnDeviceApproved !== false) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";
          const { subject, html, text } = renderDeviceApprovedTemplate({
            studentName: user.name,
            loginId: user.loginId,
            deviceLabel: request.label,
            loginUrl: `${siteUrl}/student/login`,
            whatsappPhone: settings?.whatsappNumber || "918368545620",
          });

          await sendEmail({
            to: user.email,
            subject,
            html,
            text,
            kind: "device-approved",
            studentId: user._id,
            createdBy: adminId,
          });
        }
      }
    } catch {
      // Email failure should never roll back device approval
    }
  }

  return { success: true };
}

/**
 * Rejects a pending device request.
 */
export async function rejectDeviceRequest(requestId, note = "", adminId) {
  await connectDB();
  const request = await DeviceRequest.findById(requestId);
  if (!request || request.status !== "pending") {
    throw new Error("Device request not found or already resolved.");
  }

  const now = new Date();
  request.status = "rejected";
  request.resolvedAt = now;
  request.resolvedBy = adminId.toString();
  request.note = note || "";
  await request.save();

  await logAuditEvent({
    actorId: adminId,
    action: "device.rejected",
    targetType: "student",
    targetId: request.userId.toString(),
    meta: {
      requestId: request._id.toString(),
      deviceId: request.deviceId,
      note,
    },
  });

  return { success: true };
}

/**
 * Removes an approved device and revokes its session.
 */
export async function removeDevice(userId, deviceId, adminId) {
  await connectDB();

  const device = await Device.findOne({ userId, deviceId });
  if (!device) {
    throw new Error("Device not found.");
  }

  await Device.deleteOne({ _id: device._id });
  await Session.deleteMany({ userId, deviceId });

  // Decrement deviceCount atomically, but never below 0
  await User.updateOne(
    { _id: userId, deviceCount: { $gt: 0 } },
    { $inc: { deviceCount: -1 } }
  );

  await logAuditEvent({
    actorId: adminId,
    action: "device.removed",
    targetType: "student",
    targetId: userId.toString(),
    meta: { deviceId, label: device.label },
  });

  return { success: true };
}

/**
 * Resets all approved devices and sessions for a student.
 * Their next login will auto-register their current device.
 */
export async function resetAllDevices(userId, adminId) {
  await connectDB();

  await Device.deleteMany({ userId });
  await Session.deleteMany({ userId });
  await User.updateOne({ _id: userId }, { $set: { deviceCount: 0 } });

  await logAuditEvent({
    actorId: adminId,
    action: "device.reset_all",
    targetType: "student",
    targetId: userId.toString(),
    meta: {},
  });

  return { success: true };
}

/**
 * Sets device limit for a student (1..3).
 */
export async function setDeviceLimit(userId, limit, adminId) {
  if (limit < 1 || limit > 3) {
    throw new Error("Device limit must be between 1 and 3.");
  }

  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { deviceLimit: limit } });

  await logAuditEvent({
    actorId: adminId,
    action: "student.device_limit_updated",
    targetType: "student",
    targetId: userId.toString(),
    meta: { newLimit: limit },
  });

  return { success: true };
}

/**
 * Logs out all active sessions for a student.
 */
export async function logoutAllSessions(userId, adminId) {
  await connectDB();
  await Session.deleteMany({ userId });

  await logAuditEvent({
    actorId: adminId,
    action: "student.all_sessions_revoked",
    targetType: "student",
    targetId: userId.toString(),
    meta: {},
  });

  return { success: true };
}
