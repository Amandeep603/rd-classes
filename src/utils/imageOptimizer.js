/**
 * Client-side canvas image optimization.
 * - Longest edge clamped to 1800px.
 * - Exported as WebP at 0.85 quality.
 * - EXIF orientation handled via createImageBitmap({ imageOrientation: 'from-image' }).
 * - Keeps original file if conversion fails or isn't smaller.
 * - PDFs and non-images pass through unchanged.
 */
export async function optimizeImageForUpload(file) {
  if (!file || typeof window === "undefined") {
    return { file, width: null, height: null };
  }

  // Non-images (e.g. PDFs) go as they are
  if (file.type === "application/pdf" || !file.type.startsWith("image/")) {
    return { file, width: null, height: null };
  }

  try {
    let imgBitmap;
    if (typeof createImageBitmap === "function") {
      try {
        imgBitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        // Fallback below
      }
    }

    let origWidth, origHeight;
    if (imgBitmap) {
      origWidth = imgBitmap.width;
      origHeight = imgBitmap.height;
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      origWidth = img.naturalWidth || img.width;
      origHeight = img.naturalHeight || img.height;
      URL.revokeObjectURL(url);
    }

    const maxEdge = 1800;
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (origWidth > maxEdge || origHeight > maxEdge) {
      if (origWidth >= origHeight) {
        targetWidth = maxEdge;
        targetHeight = Math.round((origHeight * maxEdge) / origWidth);
      } else {
        targetHeight = maxEdge;
        targetWidth = Math.round((origWidth * maxEdge) / origHeight);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { alpha: true });

    if (imgBitmap) {
      ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);
      if (typeof imgBitmap.close === "function") imgBitmap.close();
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((res) => {
        img.onload = res;
      });
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(url);
    }

    const convertedBlob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.85);
    });

    if (convertedBlob && convertedBlob.size < file.size) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const optimizedFile = new File([convertedBlob], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
      return {
        file: optimizedFile,
        width: targetWidth,
        height: targetHeight,
        optimized: true,
      };
    }

    return {
      file,
      width: origWidth,
      height: origHeight,
      optimized: false,
    };
  } catch (err) {
    console.warn("Client image optimization fallback to original:", err);
    return { file, width: null, height: null, optimized: false };
  }
}
