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
    deviceKey: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "desktop",
    },
    os: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    model: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    lastIp: {
      type: String,
      default: "",
    },
    firstLoginAt: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
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
  if (this.deviceKey && !this.deviceId) {
    this.deviceId = this.deviceKey;
  } else if (this.deviceId && !this.deviceKey) {
    this.deviceKey = this.deviceId;
  }
  if (this.lastIp && !this.ip) {
    this.ip = this.lastIp;
  } else if (this.ip && !this.lastIp) {
    this.lastIp = this.ip;
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
deviceSchema.index({ studentId: 1, deviceKey: 1 });

export const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);
export default Device;
