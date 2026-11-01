import "server-only";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
import { Session } from "../../lib/models/Session.ts";
import { ActivityLog } from "../../lib/models/ActivityLog.ts";

/**
 * Approves a pending device request.
 * Modes:
 * - "additional" / "add": creates approved device, increments student's maxDevices to approved count
 * - "replace": marks selected old device 'revoked' and kills its sessions; creates approved device
 * - "same_device": adds request profile and tokenHash to an existing approved device as an alias
 */
export async function approveDeviceRequest(
  requestId,
  { mode = "additional", replaceDeviceId = null, targetDeviceId = null } = {},
  adminId = null,
  adminName = "admin"
) {
  await connectDB();
  const now = new Date();

  // Try finding in DeviceRequest first
  let req = await DeviceRequest.findById(requestId);
  let legacyDevice = null;

  if (!req) {
    legacyDevice = await Device.findById(requestId);
    if (!legacyDevice) {
      throw new Error("Device request not found.");
    }
  }

  const userId = req ? req.studentId || req.userId : legacyDevice.studentId || legacyDevice.userId;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Student associated with device request not found.");
  }

  // Handle Mode: same_device (alias)
  if (mode === "same_device") {
    let target = null;
    if (targetDeviceId) {
      const targetCond = mongoose.isValidObjectId(targetDeviceId)
        ? [{ deviceId: targetDeviceId }, { _id: targetDeviceId }]
        : [{ deviceId: targetDeviceId }];
      target = await Device.findOne({
        studentId: user._id,
        $or: targetCond,
        status: "approved",
      });
    }
    if (!target) {
      target = await Device.findOne({
        studentId: user._id,
        status: "approved",
      });
    }

    if (!target) {
      throw new Error("No approved device found to link alias to.");
    }

    const reqProfile = req ? req.profile : legacyDevice?.profile;
    if (reqProfile && reqProfile.screenMajor) {
      if (!Array.isArray(target.aliases)) target.aliases = [];
      target.aliases.push({
        screenMajor: reqProfile.screenMajor,
        screenMinor: reqProfile.screenMinor,
        model: reqProfile.model || null,
        addedAt: now,
        reason: "admin_alias",
      });
    }

    const tokenHash = req ? req.tokenHash : null;
    if (tokenHash) {
      if (!Array.isArray(target.browserTokenHashes)) target.browserTokenHashes = [];
      if (!target.browserTokenHashes.includes(tokenHash)) {
        target.browserTokenHashes.push(tokenHash);
        if (target.browserTokenHashes.length > 10) target.browserTokenHashes.shift();
      }
    }

    const bName = req ? req.browserName : legacyDevice?.browserName;
    if (bName) {
      if (!Array.isArray(target.browsersSeen)) target.browsersSeen = [];
      if (!target.browsersSeen.includes(bName)) {
        target.browsersSeen.push(bName);
      }
    }

    await target.save();

    if (req) {
      req.status = "approved";
      req.decidedAt = now;
      req.decidedBy = adminName;
      req.mode = "same_device";
      await req.save();
    }

    if (legacyDevice) {
      await Device.deleteOne({ _id: legacyDevice._id });
    }

    // Log Activity
    await ActivityLog.create({
      actorId: adminId || user._id,
      action: "device.alias_approved",
      entity: "Device",
      entityId: target._id,
      meta: {
        studentId: user._id.toString(),
        studentName: user.name,
        loginId: user.loginId,
        targetDeviceId: target.deviceId,
        mode: "same_device",
        adminName,
      },
      createdAt: now,
    }).catch(() => {});

    return { success: true, mode: "same_device" };
  }

  // Handle Mode: replace
  if (mode === "replace") {
    if (!replaceDeviceId) {
      throw new Error("A device to replace must be specified.");
    }

    // Revoke old device
    const replaceCond = mongoose.isValidObjectId(replaceDeviceId)
      ? [{ deviceId: replaceDeviceId }, { _id: replaceDeviceId }]
      : [{ deviceId: replaceDeviceId }];
    await Device.updateMany(
      {
        studentId: user._id,
        $or: replaceCond,
      },
      {
        $set: {
          status: "revoked",
          decidedAt: now,
          decidedBy: adminName,
        },
      }
    );

    // Terminate all sessions for replaced device
    await Session.updateMany(
      { userId: user._id, deviceId: replaceDeviceId },
      { $set: { revoked: true, revokedReason: "device_revoked" } }
    );
    await Session.deleteMany({ userId: user._id, deviceId: replaceDeviceId });
  }

  // Create new approved device from request
  const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");
  const deviceData = {
    studentId: user._id,
    userId: user._id,
    deviceId: newDeviceId,
    deviceKey: newDeviceId,
    coarseKey: req ? req.coarseKey : legacyDevice?.coarseKey || "",
    deviceType: req ? req.deviceType : legacyDevice?.deviceType || "desktop",
    osFamily: req ? req.osFamily : legacyDevice?.osFamily || "",
    os: req ? req.osName : legacyDevice?.os || "",
    osVersion: req ? req.osVersion : legacyDevice?.osVersion || "",
    browser: req ? req.browserName : legacyDevice?.browser || "",
    browserName: req ? req.browserName : legacyDevice?.browserName || "",
    browserVersion: req ? req.browserVersion : legacyDevice?.browserVersion || "",
    browsersSeen: req?.browserName ? [req.browserName] : legacyDevice?.browsersSeen || [],
    model: req ? req.model : legacyDevice?.model || "",
    profile: req ? req.profile : legacyDevice?.profile || null,
    aliases: [],
    browserTokenHashes: req?.tokenHash ? [req.tokenHash] : legacyDevice?.browserTokenHashes || [],
    city: req ? req.city : legacyDevice?.city || "",
    region: req ? req.region : legacyDevice?.region || "",
    country: req ? req.country : legacyDevice?.country || "",
    timezone: req ? req.timezone : legacyDevice?.timezone || "",
    firstIp: req ? req.ip : legacyDevice?.firstIp || legacyDevice?.ip || "127.0.0.1",
    lastIp: req ? req.ip : legacyDevice?.lastIp || legacyDevice?.ip || "127.0.0.1",
    ip: req ? req.ip : legacyDevice?.ip || "127.0.0.1",
    firstLoginAt: now,
    lastUsedAt: now,
    approvedAt: now,
    decidedAt: now,
    decidedBy: adminName,
    loginAttempts: req ? req.attemptCount : legacyDevice?.loginAttempts || 1,
    deviceLabel: req ? req.label : legacyDevice?.deviceLabel || legacyDevice?.label || "Approved Device",
    label: req ? req.label : legacyDevice?.label || "Approved Device",
    userAgent: req ? req.userAgent : legacyDevice?.userAgent || "",
    status: "approved",
  };

  const createdDevice = await Device.create(deviceData);

  // Update request record
  if (req) {
    req.status = "approved";
    req.decidedAt = now;
    req.decidedBy = adminName;
    req.mode = mode;
    req.replacedDeviceId = replaceDeviceId;
    await req.save();
  }

  if (legacyDevice) {
    legacyDevice.status = "approved";
    legacyDevice.decidedAt = now;
    legacyDevice.decidedBy = adminName;
    await legacyDevice.save();
  }

  // Count approved devices and update student
  const approvedCount = await Device.countDocuments({
    studentId: user._id,
    status: "approved",
  });

  if (mode === "additional" || mode === "add") {
    user.maxDevices = Math.max(user.maxDevices || 1, approvedCount);
  }
  user.deviceCount = approvedCount;
  await user.save();

  // Activity Log
  await ActivityLog.create({
    actorId: adminId || user._id,
    action: "device.approved",
    entity: "Device",
    entityId: createdDevice._id,
    meta: {
      studentId: user._id.toString(),
      studentName: user.name,
      loginId: user.loginId,
      deviceId: createdDevice.deviceId,
      label: createdDevice.deviceLabel,
      mode,
      replacedDeviceId: replaceDeviceId,
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true, deviceId: createdDevice.deviceId };
}

/**
 * Rejects a pending device request.
 */
export async function rejectDeviceRequest(requestId, note = "", adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  let req = await DeviceRequest.findById(requestId);
  let legacyDevice = null;

  if (!req) {
    legacyDevice = await Device.findById(requestId);
    if (!legacyDevice) {
      throw new Error("Device request not found.");
    }
  }

  const userId = req ? req.studentId || req.userId : legacyDevice.studentId || legacyDevice.userId;
  const user = await User.findById(userId);

  if (req) {
    req.status = "rejected";
    req.rejectionReason = note;
    req.decidedAt = now;
    req.decidedBy = adminName;
    await req.save();
  }

  if (legacyDevice) {
    legacyDevice.status = "rejected";
    legacyDevice.rejectionReason = note;
    legacyDevice.decidedAt = now;
    legacyDevice.decidedBy = adminName;
    await legacyDevice.save();
  }

  await ActivityLog.create({
    actorId: adminId || userId,
    action: "device.rejected",
    entity: "DeviceRequest",
    entityId: req ? req._id : legacyDevice._id,
    meta: {
      studentId: userId.toString(),
      studentName: user?.name,
      loginId: user?.loginId,
      note,
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true };
}

/**
 * Reconsiders a previously rejected device request, moving it back to pending.
 */
export async function reconsiderDeviceRequest(requestId, adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  let req = await DeviceRequest.findById(requestId);
  let legacyDevice = null;

  if (!req) {
    legacyDevice = await Device.findById(requestId);
    if (!legacyDevice) {
      throw new Error("Device request not found.");
    }
  }

  const userId = req ? req.studentId || req.userId : legacyDevice.studentId || legacyDevice.userId;
  const user = await User.findById(userId);

  if (req) {
    req.status = "pending";
    req.rejectionReason = "";
    req.decidedAt = null;
    req.decidedBy = "";
    await req.save();
  }

  if (legacyDevice) {
    legacyDevice.status = "pending";
    legacyDevice.rejectionReason = "";
    legacyDevice.decidedAt = null;
    legacyDevice.decidedBy = "";
    await legacyDevice.save();
  }

  await ActivityLog.create({
    actorId: adminId || userId,
    action: "device.reconsidered",
    entity: "DeviceRequest",
    entityId: req ? req._id : legacyDevice._id,
    meta: {
      studentId: userId.toString(),
      studentName: user?.name,
      loginId: user?.loginId,
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true };
}

/**
 * Revokes / removes an approved device and kills all its active sessions.
 */
export async function removeDevice(userId, deviceId, adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  const removeCond = mongoose.isValidObjectId(deviceId)
    ? [{ deviceId }, { _id: deviceId }]
    : [{ deviceId }];

  await Device.updateMany(
    {
      studentId: userId,
      $or: removeCond,
    },
    {
      $set: {
        status: "revoked",
        decidedAt: now,
        decidedBy: adminName,
      },
    }
  );

  // Terminate all sessions for that device with distinct reason
  await Session.updateMany(
    {
      userId,
      deviceId,
    },
    {
      $set: {
        revoked: true,
        revokedReason: "device_revoked",
      },
    }
  );
  await Session.deleteMany({ userId, deviceId });

  // Update student deviceCount
  const approvedCount = await Device.countDocuments({
    studentId: userId,
    status: "approved",
  });
  await User.updateOne({ _id: userId }, { $set: { deviceCount: approvedCount } });

  // Activity Log
  await ActivityLog.create({
    actorId: adminId || userId,
    action: "device.revoked",
    entity: "Device",
    meta: {
      studentId: userId.toString(),
      deviceId,
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true };
}

/**
 * Resets all devices for a student.
 */
export async function resetAllDevices(userId, adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  await Device.updateMany(
    { studentId: userId },
    { $set: { status: "revoked", decidedAt: now, decidedBy: adminName } }
  );
  await DeviceRequest.deleteMany({ studentId: userId });
  await Session.updateMany(
    { userId },
    { $set: { deviceId: "" } }
  );
  await User.updateOne({ _id: userId }, { $set: { deviceCount: 0 } });

  await ActivityLog.create({
    actorId: adminId || userId,
    action: "device.reset_all",
    entity: "User",
    entityId: userId,
    meta: {
      studentId: userId.toString(),
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true };
}

/**
 * Sets the device limit for a student.
 */
export async function setDeviceLimit(userId, limit, adminId = null, adminName = "admin") {
  await connectDB();
  const safeLimit = Math.max(1, Number(limit) || 1);
  await User.updateOne({ _id: userId }, { $set: { maxDevices: safeLimit } });

  await ActivityLog.create({
    actorId: adminId || userId,
    action: "device.limit_changed",
    entity: "User",
    entityId: userId,
    meta: {
      studentId: userId.toString(),
      limit: safeLimit,
      adminName,
    },
    createdAt: new Date(),
  }).catch(() => {});

  return { success: true };
}

/**
 * Logs out all active sessions for a student across all devices.
 */
export async function logoutAllSessions(userId, adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  await Session.updateMany(
    { userId },
    { $set: { revoked: true, revokedReason: "admin_logout_all" } }
  );
  await Session.deleteMany({ userId });

  await ActivityLog.create({
    actorId: adminId || userId,
    action: "session.logout_all",
    entity: "User",
    entityId: userId,
    meta: {
      studentId: userId.toString(),
      adminName,
    },
    createdAt: now,
  }).catch(() => {});

  return { success: true };
}
