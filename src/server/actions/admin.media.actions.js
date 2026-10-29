"use server";

import { revalidatePath } from "next/cache";
import { requireAdminApi } from "../auth/session.js";
import { isStorageConfigured, getStorageDriver } from "../storage/index.js";
import {
  registerAssetService,
  archiveAssetService,
  restoreAssetService,
  deleteAssetPermanentlyService,
} from "../services/mediaService.js";

export async function checkStorageStatusAction() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { configured: false, driver: "none", error: "Unauthorized" };
  return {
    configured: isStorageConfigured(),
    driver: getStorageDriver(),
  };
}

export async function registerAssetAction({
  url,
  kind = "image",
  originalName = "",
  width = null,
  height = null,
}) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    const asset = await registerAssetService({
      url,
      kind,
      originalName,
      width,
      height,
      adminId: admin.user._id,
    });
    revalidatePath("/admin/media");
    return { success: true, asset };
  } catch (err) {
    return { success: false, error: err?.message || "Failed to register asset" };
  }
}

export async function archiveAssetAction(assetId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await archiveAssetService(assetId, admin.user._id);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || "Failed to archive asset" };
  }
}

export async function restoreAssetAction(assetId) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  try {
    await restoreAssetService(assetId, admin.user._id);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || "Failed to restore asset" };
  }
}

export async function deleteAssetPermanentlyAction(assetId, confirmationText) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return { success: false, error: "Unauthorized" };
  const admin = auth;

  if (confirmationText !== "DELETE") {
    return { success: false, error: "Please type DELETE to confirm permanent deletion." };
  }
  try {
    await deleteAssetPermanentlyService(assetId, admin.user._id);
    revalidatePath("/admin/media");
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || "Failed to permanently delete asset" };
  }
}
