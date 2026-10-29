"use server";

import { revalidatePath } from "next/cache";
import { requireAdminApi } from "../auth/session.js";
import { deviceApproveSchema } from "../validation/schemas.js";
import {
  approveDeviceRequest,
  rejectDeviceRequest,
  removeDevice,
  resetAllDevices,
  setDeviceLimit,
  logoutAllSessions,
} from "../auth/deviceService.js";

export async function approveDeviceRequestAction(requestId, formData) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  const raw = {
    mode: formData.get("mode") || "add",
    replaceDeviceId: formData.get("replaceDeviceId") || null,
  };

  const parsed = deviceApproveSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid approval options.",
    };
  }

  try {
    await approveDeviceRequest(requestId, parsed.data, admin.user._id);
    revalidatePath("/admin");
    revalidatePath("/admin/device-requests");
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectDeviceRequestAction(requestId, formData) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;
  const note = formData.get("note") || "";

  try {
    await rejectDeviceRequest(requestId, note, admin.user._id);
    revalidatePath("/admin");
    revalidatePath("/admin/device-requests");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function removeDeviceAction(userId, deviceId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await removeDevice(userId, deviceId, admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function resetAllDevicesAction(userId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await resetAllDevices(userId, admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function setDeviceLimitAction(userId, limit) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await setDeviceLimit(userId, Number(limit), admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function logoutAllSessionsAction(userId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await logoutAllSessions(userId, admin.user._id);
    revalidatePath(`/admin/students/${userId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
