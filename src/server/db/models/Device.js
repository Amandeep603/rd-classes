import "server-only";
import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: String,
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);
export default Device;
