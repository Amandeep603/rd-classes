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

// Partial unique index so a user only has at most one pending request per deviceId
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
