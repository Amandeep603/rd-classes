import "server-only";
import mongoose from "mongoose";

const mediaAssetSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["image", "pdf"],
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    pathname: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    originalName: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
      index: true,
    },
    demo: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

mediaAssetSchema.index({ archivedAt: 1, kind: 1, createdAt: -1 });

export const MediaAsset =
  mongoose.models.MediaAsset || mongoose.model("MediaAsset", mediaAssetSchema);
