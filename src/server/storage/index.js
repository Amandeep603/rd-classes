import "server-only";
import { isBlobConfigured, headBlob, deleteBlob } from "./blobDriver.js";
import { isLocalConfigured, headLocal, deleteLocal } from "./localDriver.js";

export function getStorageDriver() {
  if (process.env.STORAGE_DRIVER === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STORAGE_DRIVER=local is forbidden in production.");
    }
    return "local";
  }
  return "blob";
}

export function isStorageConfigured() {
  const driver = getStorageDriver();
  if (driver === "local") {
    return isLocalConfigured();
  }
  return isBlobConfigured();
}

export function isValidAssetUrl(url) {
  if (!url || typeof url !== "string") return false;
  const driver = getStorageDriver();
  if (driver === "local" || process.env.NODE_ENV !== "production") {
    if (url.startsWith("/api/dev-uploads/")) return true;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export async function headAsset(url) {
  if (!isValidAssetUrl(url)) {
    throw new Error("Invalid or untrusted asset URL host.");
  }
  if (url.startsWith("/api/dev-uploads/")) {
    return headLocal(url);
  }
  return headBlob(url);
}

export async function deleteAssetFile(url) {
  if (!isValidAssetUrl(url)) {
    throw new Error("Invalid or untrusted asset URL host.");
  }
  if (url.startsWith("/api/dev-uploads/")) {
    return deleteLocal(url);
  }
  return deleteBlob(url);
}
