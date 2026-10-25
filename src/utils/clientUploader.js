import { upload } from "@vercel/blob/client";
import { optimizeImageForUpload } from "./imageOptimizer.js";
import { registerAssetAction, checkStorageStatusAction } from "@/server/actions/admin.media.actions.js";

/**
 * Universal client uploader handling both Vercel Blob and local development driver.
 */
export async function uploadClientFile(file, {
  kind = "image",
  onProgress = () => {},
  abortSignal = null,
} = {}) {
  // Check storage configuration first
  const status = await checkStorageStatusAction();
  if (!status.configured) {
    throw new Error("Storage is not configured.");
  }

  // 1. Optimize image client-side if it's an image
  let uploadFile = file;
  let imgWidth = null;
  let imgHeight = null;
  if (kind === "image" && file.type.startsWith("image/")) {
    const opt = await optimizeImageForUpload(file);
    uploadFile = opt.file;
    imgWidth = opt.width;
    imgHeight = opt.height;
  }

  // 2. Handle Local Storage Driver
  if (status.driver === "local") {
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("kind", kind);

    const xhr = new XMLHttpRequest();
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            reject(new Error("Invalid server response"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      if (abortSignal) {
        abortSignal.addEventListener("abort", () => {
          xhr.abort();
          reject(new Error("Upload cancelled"));
        });
      }
    });

    xhr.open("POST", "/api/admin/upload");
    xhr.send(formData);

    const localResult = await uploadPromise;

    // Register asset in DB
    const reg = await registerAssetAction({
      url: localResult.url,
      kind,
      originalName: file.name,
      width: imgWidth,
      height: imgHeight,
    });

    if (!reg.success) {
      throw new Error(reg.error || "Failed to register local asset");
    }

    return reg.asset;
  }

  // 3. Handle Production Vercel Blob Direct Client Upload
  const blob = await upload(uploadFile.name, uploadFile, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
    clientPayload: JSON.stringify({ kind }),
    abortSignal,
    onUploadProgress: (progress) => {
      onProgress(Math.round(progress.percentage));
    },
  });

  // 4. Register asset in DB
  const reg = await registerAssetAction({
    url: blob.url,
    kind,
    originalName: file.name,
    width: imgWidth,
    height: imgHeight,
  });

  if (!reg.success) {
    throw new Error(reg.error || "Failed to register uploaded asset");
  }

  return reg.asset;
}
