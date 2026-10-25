import "server-only";
import { head, del } from "@vercel/blob";

export function isBlobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function headBlob(url) {
  if (!isBlobConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export async function deleteBlob(url) {
  if (!isBlobConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
