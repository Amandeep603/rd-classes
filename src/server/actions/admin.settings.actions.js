"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/session.js";
import connectDB from "../db/connect.js";
import { Settings } from "../db/models/Settings.js";
import { User } from "../db/models/User.js";
import { logAuditEvent } from "../services/audit.js";

export async function updateSettingsAction(payload) {
  const admin = await requireAdmin();

  await connectDB();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  if (payload.workspaceName) settings.workspaceName = payload.workspaceName.trim();
  if (payload.whatsappNumber) settings.whatsappNumber = payload.whatsappNumber.trim();
  if (payload.defaultDeviceLimit) settings.defaultDeviceLimit = Number(payload.defaultDeviceLimit) || 1;
  if (typeof payload.watermarkEnabled === "boolean") settings.watermarkEnabled = payload.watermarkEnabled;
  if (payload.rewardTargetText) settings.rewardTargetText = payload.rewardTargetText.trim();
  if (typeof payload.allowStudentPasswordChange === "boolean") {
    settings.allowStudentPasswordChange = payload.allowStudentPasswordChange;
  }
  if (payload.websiteNumbers && typeof payload.websiteNumbers === "object") {
    settings.websiteNumbers = {
      studentsMentored: payload.websiteNumbers.studentsMentored?.toString().trim() || "",
      boardSuccessRate: payload.websiteNumbers.boardSuccessRate?.toString().trim() || "",
      testsEvaluated: payload.websiteNumbers.testsEvaluated?.toString().trim() || "",
      recordedLectures: payload.websiteNumbers.recordedLectures?.toString().trim() || "",
    };
  }

  await settings.save();

  await logAuditEvent({
    actorId: admin.user._id,
    action: "settings.updated",
    targetType: "settings",
    targetId: settings._id.toString(),
    meta: { workspaceName: settings.workspaceName },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/student");
  revalidatePath("/student/profile");

  return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
}

export async function updateAdminPasswordAction({ currentPassword, newPassword }) {
  const admin = await requireAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  await connectDB();
  const adminUser = await User.findById(admin.user._id);
  if (!adminUser) {
    return { success: false, error: "Admin user not found." };
  }

  const isValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect." };
  }

  adminUser.passwordHash = await bcrypt.hash(newPassword, 10);
  await adminUser.save();

  await logAuditEvent({
    actorId: admin.user._id,
    action: "admin.password_changed",
    targetType: "user",
    targetId: admin.user._id.toString(),
  });

  return { success: true };
}
