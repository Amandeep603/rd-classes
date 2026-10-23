import "server-only";
import mongoose from "mongoose";

const deviceRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },
    studentNote: {
      type: String,
      maxlength: 140,
      default: "",
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceRequestSchema.index(
  { userId: 1, deviceId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

export const DeviceRequest =
  mongoose.models.DeviceRequest || mongoose.model("DeviceRequest", deviceRequestSchema);
export default DeviceRequest;
