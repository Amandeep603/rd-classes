import "server-only";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "../db/connect.js";
import { User } from "../../lib/models/User.ts";
import { Device } from "../../lib/models/Device.ts";
import { DeviceRequest } from "../db/models/DeviceRequest.js";
import { Session } from "../../lib/models/Session.ts";
import { ActivityLog } from "../../lib/models/ActivityLog.ts";
import { DeviceHistory } from "../../lib/models/DeviceHistory.ts";
import { deriveSlot } from "./deviceIdentity.js";
import { createAdminNotification } from "@/server/services/notificationService.js";

/**
 * Checks and triggers non-blocking alert on student (at most 1 per student per day, dismissible).
 */
export async function checkAndTriggerAlert(studentId, alertType, reason) {
  try {
    const student = await User.findById(studentId);
    if (!student) return;
    const now = new Date();
    if (student.lastDeviceAlertAt) {
      const diffHours =
        (now.getTime() - new Date(student.lastDeviceAlertAt).getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) return;
    }
    student.deviceAlert = true;
    student.deviceAlertReason = reason;
    student.lastDeviceAlertAt = now;
    await student.save();

    await createAdminNotification({
      type: "device_alert",
      title: `Device Alert (${alertType}): ${student.name}`,
      message: `${student.name} (${student.loginId}) triggered alert: ${reason}`,
      link: `/admin/students?search=${encodeURIComponent(student.loginId)}`,
      meta: { studentId: student._id.toString(), alertType, reason },
    });
  } catch (err) {
    // Non-blocking
  }
}

/**
 * Approves a pending device request according to policy:
 * - If slot is free: creates device in that slot from request (profile, token, browser)
 * - If slot is occupied: replaces the old device, revokes its sessions immediately, marks it 'replaced',
 *   increments student's swap counter for that slot, and writes history event.
 * - Mode 'rebind': replaces existing device's token(s) with request token, revokes sessions, does NOT count as a swap.
 */
export async function approveDeviceRequest(
  requestId,
  { mode = "additional", replaceDeviceId = null, targetDeviceId = null } = {},
  adminId = null,
  adminName = "admin"
) {
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
  if (!user) {
    throw new Error("Student associated with device request not found.");
  }

  const slot = deriveSlot(req || legacyDevice);
  const reqTokenHash = req?.requestTokenHash || req?.tokenHash || legacyDevice?.browserTokenHashes?.[0] || "";

  // 1. Same device, new browser (rebind)
  if (mode === "rebind" || mode === "same_device") {
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
        slot,
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
      throw new Error("No approved device found in slot to rebind.");
    }

    if (reqTokenHash) {
      target.browserTokenHashes = [reqTokenHash];
      target.tokenHashes = [reqTokenHash];
      target.graceTokenHashes = [];
    }

    const bName = req ? req.browserName : legacyDevice?.browserName;
    if (bName) {
      if (!Array.isArray(target.browsersSeen)) target.browsersSeen = [];
      if (!target.browsersSeen.includes(bName)) {
        target.browsersSeen.push(bName);
      }
    }
    target.lastUsedAt = now;
    if (req?.ip) target.lastIp = req.ip;
    if (req?.city) target.city = req.city;
    await target.save();

    // Revoke sessions of this device
    await Session.updateMany(
      { userId: user._id, deviceId: target.deviceId },
      { $set: { revoked: true, revokedReason: "device_rebound" } }
    );
    await Session.deleteMany({ userId: user._id, deviceId: target.deviceId });

    if (req) {
      req.status = "approved";
      req.decidedAt = now;
      req.decidedBy = adminName;
      req.mode = "rebind";
      await req.save();
    }

    if (legacyDevice) {
      await Device.deleteOne({ _id: legacyDevice._id });
    }

    await DeviceHistory.create({
      studentId: user._id,
      slot,
      event: "rebind",
      deviceId: target.deviceId,
      deviceLabel: target.deviceLabel || target.label,
      ip: req?.ip || "127.0.0.1",
      city: req?.city || "",
      adminName,
    }).catch(() => {});

    return { success: true, mode: "rebind", deviceId: target.deviceId };
  }

  // 2. Check occupied devices in this slot
  const occupiedDevices = await Device.find({
    studentId: user._id,
    slot,
    status: "approved",
  }).sort({ createdAt: 1 });

  const isSlotOccupied = occupiedDevices.length > 0;
  const newDeviceId = "dev_" + crypto.randomBytes(8).toString("hex");

  if (isSlotOccupied || mode === "replace") {
    // If replaceDeviceId specified, find it, else replace oldest in slot
    let oldDev = null;
    if (replaceDeviceId) {
      oldDev = occupiedDevices.find(
        (d) => d.deviceId === replaceDeviceId || d._id.toString() === replaceDeviceId
      );
    }
    if (!oldDev) {
      oldDev = occupiedDevices[0];
    }

    if (oldDev) {
      oldDev.status = "replaced";
      oldDev.replacedAt = now;
      oldDev.replacedByDeviceId = newDeviceId;
      oldDev.decidedAt = now;
      oldDev.decidedBy = adminName;
      await oldDev.save();

      // Revoke all sessions for replaced device immediately
      await Session.updateMany(
        { userId: user._id, deviceId: oldDev.deviceId },
        { $set: { revoked: true, revokedReason: "device_replaced" } }
      );
      await Session.deleteMany({ userId: user._id, deviceId: oldDev.deviceId });

      // Increment student's swap counter for that slot
      if (slot === "handheld") {
        await User.updateOne({ _id: user._id }, { $inc: { handheldSwaps: 1 } });
      } else {
        await User.updateOne({ _id: user._id }, { $inc: { computerSwaps: 1 } });
      }

      // Write history event
      await DeviceHistory.create({
        studentId: user._id,
        slot,
        event: "replaced",
        deviceId: newDeviceId,
        deviceLabel: req?.label || legacyDevice?.label || "Approved Device",
        ip: req?.ip || legacyDevice?.ip || "127.0.0.1",
        city: req?.city || legacyDevice?.city || "",
        adminName,
        details: {
          replacedDeviceId: oldDev.deviceId,
          replacedDeviceLabel: oldDev.deviceLabel || oldDev.label,
        },
      }).catch(() => {});

      // Check Alert S1: same slot replaced >= 3 times in 14 days
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const recentSwaps = await DeviceHistory.countDocuments({
        studentId: user._id,
        slot,
        event: "replaced",
        createdAt: { $gte: fourteenDaysAgo },
      });
      if (recentSwaps >= 3) {
        await checkAndTriggerAlert(
          user._id,
          "S1",
          `The ${slot} slot was replaced ${recentSwaps} times in the last 14 days.`
        );
      }
    }
  } else {
    // Free slot approval
    await DeviceHistory.create({
      studentId: user._id,
      slot,
      event: "approved",
      deviceId: newDeviceId,
      deviceLabel: req?.label || legacyDevice?.label || "Approved Device",
      ip: req?.ip || legacyDevice?.ip || "127.0.0.1",
      city: req?.city || legacyDevice?.city || "",
      adminName,
    }).catch(() => {});
  }

  // Create new approved device from request
  const tokenHash = req?.requestTokenHash || req?.tokenHash || "";
  const deviceData = {
    studentId: user._id,
    userId: user._id,
    deviceId: newDeviceId,
    deviceKey: newDeviceId,
    slot,
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
    browserTokenHashes: tokenHash ? [tokenHash] : legacyDevice?.browserTokenHashes || [],
    tokenHashes: tokenHash ? [tokenHash] : legacyDevice?.tokenHashes || [],
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

  let createdDevice;
  try {
    createdDevice = await Device.findOneAndUpdate(
      { studentId: user._id, deviceId: deviceData.deviceId },
      { $set: deviceData },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (devErr) {
    if (devErr && (devErr.code === 11000 || String(devErr.message).includes("E11000"))) {
      createdDevice = await Device.findOneAndUpdate(
        { studentId: user._id, deviceId: deviceData.deviceId },
        { $set: deviceData },
        { returnDocument: "after" }
      );
    } else {
      throw devErr;
    }
  }

  if (req) {
    req.status = "approved";
    req.decidedAt = now;
    req.decidedBy = adminName;
    req.mode = isSlotOccupied ? "replace" : "approve";
    req.replacedDeviceId = isSlotOccupied ? (replaceDeviceId || occupiedDevices[0]?.deviceId) : null;
    await req.save();
  }

  if (legacyDevice) {
    legacyDevice.status = "approved";
    legacyDevice.decidedAt = now;
    legacyDevice.decidedBy = adminName;
    await legacyDevice.save();
  }

  const approvedCount = await Device.countDocuments({
    studentId: user._id,
    status: "approved",
  });
  user.deviceCount = approvedCount;
  user.maxDevices = Math.max(user.maxDevices || 1, approvedCount);
  await user.save();

  await ActivityLog.create({
    actorId: adminId || user._id,
    action: isSlotOccupied ? "device.replaced" : "device.approved",
    entity: "Device",
    entityId: createdDevice._id,
    meta: {
      studentId: user._id.toString(),
      studentName: user.name,
      loginId: user.loginId,
      deviceId: createdDevice.deviceId,
      slot,
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
  const slot = deriveSlot(req || legacyDevice);

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

  await DeviceHistory.create({
    studentId: userId,
    slot,
    event: "rejected",
    deviceId: req?.deviceId || legacyDevice?.deviceId || "",
    deviceLabel: req?.label || legacyDevice?.label || "Device",
    ip: req?.ip || legacyDevice?.ip || "127.0.0.1",
    city: req?.city || legacyDevice?.city || "",
    adminName,
    details: { note },
  }).catch(() => {});

  // Check Alert S2: 5 or more new or declined requests within 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentReqs = await DeviceRequest.countDocuments({
    studentId: userId,
    $or: [{ status: "pending" }, { status: "rejected" }],
    createdAt: { $gte: sevenDaysAgo },
  });
  if (recentReqs >= 5) {
    await checkAndTriggerAlert(
      userId,
      "S2",
      `${recentReqs} device requests were made or declined within the last 7 days.`
    );
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
 * Revokes / removes an approved device and kills all its active sessions. Frees the slot.
 */
export async function removeDevice(userId, deviceId, adminId = null, adminName = "admin") {
  await connectDB();
  const now = new Date();

  const removeCond = mongoose.isValidObjectId(deviceId)
    ? [{ deviceId }, { _id: deviceId }]
    : [{ deviceId }];

  const dev = await Device.findOne({
    studentId: userId,
    $or: removeCond,
  });

  if (dev) {
    dev.status = "revoked";
    dev.decidedAt = now;
    dev.decidedBy = adminName;
    await dev.save();

    await DeviceHistory.create({
      studentId: userId,
      slot: deriveSlot(dev),
      event: "revoked",
      deviceId: dev.deviceId,
      deviceLabel: dev.deviceLabel || dev.label,
      ip: dev.lastIp || dev.ip || "127.0.0.1",
      city: dev.city || "",
      adminName,
    }).catch(() => {});
  }

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

  const approvedCount = await Device.countDocuments({
    studentId: userId,
    status: "approved",
  });
  await User.updateOne({ _id: userId }, { $set: { deviceCount: approvedCount } });

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
    { $set: { revoked: true, revokedReason: "device_reset_all" } }
  );
  await Session.deleteMany({ userId });
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        deviceCount: 0,
        handheldSwaps: 0,
        computerSwaps: 0,
        deviceAlert: false,
        deviceAlertReason: "",
      },
    }
  );

  await DeviceHistory.create({
    studentId: userId,
    slot: "computer",
    event: "revoked",
    deviceLabel: "All Devices Reset",
    adminName,
  }).catch(() => {});

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
