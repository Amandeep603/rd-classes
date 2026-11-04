import mongoose, { Schema } from "mongoose";

const deviceHistorySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slot: {
      type: String,
      enum: ["handheld", "computer"],
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: ["registered", "approved", "replaced", "rebind", "revoked", "rejected"],
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: "",
    },
    deviceLabel: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    adminName: {
      type: String,
      default: "system",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

deviceHistorySchema.index({ studentId: 1, createdAt: -1 });
deviceHistorySchema.index({ studentId: 1, slot: 1, createdAt: -1 });

export const DeviceHistory =
  mongoose.models.DeviceHistory || mongoose.model("DeviceHistory", deviceHistorySchema);
export default DeviceHistory;

