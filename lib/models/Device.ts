import mongoose, { Schema } from "mongoose";

const deviceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    deviceLabel: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    ip: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected", "revoked", "active"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    // Backwards-compatible fields
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    label: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.pre("validate", function () {
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  } else if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
  if (this.deviceLabel && !this.label) {
    this.label = this.deviceLabel;
  } else if (this.label && !this.deviceLabel) {
    this.deviceLabel = this.label;
  }
  if (this.status === "approved" && !this.decidedAt && this.approvedAt) {
    this.decidedAt = this.approvedAt;
  }
});

deviceSchema.index({ studentId: 1, status: 1 });
deviceSchema.index({ studentId: 1, deviceId: 1 }, { unique: true });

export const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);
export default Device;
