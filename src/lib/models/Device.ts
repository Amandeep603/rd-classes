import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    screenMajor: { type: Number, default: 0 },
    screenMinor: { type: Number, default: 0 },
    model: { type: String, default: null },
  },
  { _id: false }
);

const aliasSchema = new Schema(
  {
    screenMajor: { type: Number, default: 0 },
    screenMinor: { type: Number, default: 0 },
    model: { type: String, default: null },
    addedAt: { type: Date, default: Date.now },
    reason: { type: String, default: "admin_alias" },
  },
  { _id: false }
);

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
    coarseKey: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "desktop",
    },
    osFamily: {
      type: String,
      default: "",
      trim: true,
    },
    os: {
      type: String,
      default: "",
    },
    osVersion: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    browserName: {
      type: String,
      default: "",
    },
    browserVersion: {
      type: String,
      default: "",
    },
    browsersSeen: {
      type: [String],
      default: [],
    },
    model: {
      type: String,
      default: "",
    },
    profile: {
      type: profileSchema,
      default: null,
    },
    aliases: {
      type: [aliasSchema],
      default: [],
    },
    browserTokenHashes: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      default: "",
    },
    region: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "",
    },
    firstIp: {
      type: String,
      default: "",
    },
    lastIp: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
      trim: true,
    },
    firstLoginAt: {
      type: Date,
      default: null,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 1,
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
    status: {
      type: String,
      enum: ["approved", "pending", "rejected", "revoked", "active"],
      default: "approved",
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
    decidedBy: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
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
  if (!this.firstIp && this.ip) {
    this.firstIp = this.ip;
  }
  if (this.deviceLabel && !this.label) {
    this.label = this.deviceLabel;
  } else if (this.label && !this.deviceLabel) {
    this.deviceLabel = this.label;
  }
  if (!this.browser && this.browserName) {
    this.browser = this.browserName;
  } else if (!this.browserName && this.browser) {
    this.browserName = this.browser;
  }
  if (this.status === "approved" && !this.decidedAt && this.approvedAt) {
    this.decidedAt = this.approvedAt;
  }
});

deviceSchema.index({ studentId: 1, status: 1 });
deviceSchema.index({ studentId: 1, deviceId: 1 }, { unique: true });
deviceSchema.index({ studentId: 1, coarseKey: 1 });
deviceSchema.index({ browserTokenHashes: 1 });

export const Device = mongoose.models.Device || mongoose.model("Device", deviceSchema);
export default Device;
