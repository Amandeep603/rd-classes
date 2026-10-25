import "server-only";
import connectDB from "../db/connect.js";
import { MediaAsset } from "../db/models/MediaAsset.js";
import { Course } from "../db/models/Course.js";
import { headAsset, deleteAssetFile, isValidAssetUrl } from "../storage/index.js";
import { logAuditEvent } from "./audit.js";

export async function getAssetUsageCount(assetId) {
  await connectDB();
  const mongoose = (await import("mongoose")).default;
  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    return 0;
  }
  const id = new mongoose.Types.ObjectId(assetId);

  // Check Course references
  const courseCount = await Course.countDocuments({
    $or: [
      { illustrationAssetId: assetId.toString() },
      { facultyAvatarAssetId: assetId.toString() },
      { thumbnail: assetId.toString() },
    ],
  });

  // Check other models if registered in mongoose
  let topperCount = 0;
  if (mongoose.models.Topper) {
    topperCount = await mongoose.models.Topper.countDocuments({ photoAssetId: id });
  }

  let resultPdfCount = 0;
  if (mongoose.models.ResultPdf) {
    resultPdfCount = await mongoose.models.ResultPdf.countDocuments({ fileAssetId: id });
  }

  let galleryCount = 0;
  if (mongoose.models.GalleryItem) {
    galleryCount = await mongoose.models.GalleryItem.countDocuments({ assetId: id });
  }

  let noteCount = 0;
  if (mongoose.models.Note) {
    noteCount = await mongoose.models.Note.countDocuments({ fileAssetId: id });
  }

  return courseCount + topperCount + resultPdfCount + galleryCount + noteCount;
}

export async function registerAssetService({
  url,
  kind = "image",
  originalName = "",
  width = null,
  height = null,
  adminId,
}) {
  await connectDB();

  if (!isValidAssetUrl(url)) {
    throw new Error("Foreign or invalid storage URL.");
  }

  // Confirm file metadata with head()
  const headData = await headAsset(url);

  // Check if asset already exists by url
  let asset = await MediaAsset.findOne({ url });
  if (!asset) {
    asset = await MediaAsset.create({
      kind,
      url,
      pathname: headData.pathname || url,
      contentType: headData.contentType || (kind === "pdf" ? "application/pdf" : "image/webp"),
      size: headData.size || 0,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      originalName: originalName || "",
      uploadedBy: adminId || null,
    });

    await logAuditEvent({
      actorId: adminId,
      action: "media.uploaded",
      targetType: "media",
      targetId: asset._id.toString(),
      meta: { url, kind, originalName, size: asset.size },
    });
  }

  return JSON.parse(JSON.stringify(asset));
}

export async function getMediaAssetsService({
  kind,
  search = "",
  showArchived = false,
  page = 1,
  limit = 24,
}) {
  await connectDB();

  const query = {};
  if (kind && kind !== "all") {
    query.kind = kind;
  }
  if (!showArchived) {
    query.archivedAt = null;
  } else {
    query.archivedAt = { $ne: null };
  }
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { originalName: { $regex: s, $options: "i" } },
      { pathname: { $regex: s, $options: "i" } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [total, assets] = await Promise.all([
    MediaAsset.countDocuments(query),
    MediaAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const assetsWithUsage = await Promise.all(
    assets.map(async (a) => {
      const usageCount = await getAssetUsageCount(a._id);
      return {
        ...a,
        usageCount,
      };
    })
  );

  return {
    assets: JSON.parse(JSON.stringify(assetsWithUsage)),
    total,
    totalPages: Math.ceil(total / limit) || 1,
    page,
  };
}

export async function archiveAssetService(assetId, adminId) {
  await connectDB();
  const asset = await MediaAsset.findById(assetId);
  if (!asset) throw new Error("Asset not found");

  asset.archivedAt = new Date();
  await asset.save();

  await logAuditEvent({
    actorId: adminId,
    action: "media.archived",
    targetType: "media",
    targetId: asset._id.toString(),
    meta: { url: asset.url },
  });

  return { success: true };
}

export async function restoreAssetService(assetId, adminId) {
  await connectDB();
  const asset = await MediaAsset.findById(assetId);
  if (!asset) throw new Error("Asset not found");

  asset.archivedAt = null;
  await asset.save();

  await logAuditEvent({
    actorId: adminId,
    action: "media.restored",
    targetType: "media",
    targetId: asset._id.toString(),
    meta: { url: asset.url },
  });

  return { success: true };
}

export async function deleteAssetPermanentlyService(assetId, adminId) {
  await connectDB();
  const asset = await MediaAsset.findById(assetId);
  if (!asset) throw new Error("Asset not found");

  const usageCount = await getAssetUsageCount(assetId);
  if (usageCount > 0) {
    throw new Error(
      `Cannot delete asset: it is currently referenced by ${usageCount} content record(s).`
    );
  }

  // Delete actual file from storage
  try {
    await deleteAssetFile(asset.url);
  } catch (err) {
    console.warn("Storage file deletion warning:", err?.message || err);
  }

  await MediaAsset.findByIdAndDelete(assetId);

  await logAuditEvent({
    actorId: adminId,
    action: "media.permanently_deleted",
    targetType: "media",
    targetId: assetId.toString(),
    meta: { url: asset.url, originalName: asset.originalName },
  });

  return { success: true };
}
