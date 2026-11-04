import "server-only";
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    screenMajor: { type: Number, default: 0 },
    screenMinor: { type: Number, default: 0 },
    model: { type: String, default: null },
  },
  { _id: false }
);

const deviceRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    deviceId: {
      type: String,
      trim: true,
      default: "",
    },
    coarseKey: {
      type: String,
      default: "",
      trim: true,
    },
    slot: {
      type: String,
      enum: ["handheld", "computer"],
      index: true,
      default: "computer",
    },
    deviceType: {
      type: String,
      default: "desktop",
    },
    osFamily: {
      type: String,
      default: "",
    },
    osName: {
      type: String,
      default: "",
    },
    osVersion: {
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
    model: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    profile: {
      type: profileSchema,
      default: null,
    },
    bucketKey: {
      type: String,
      default: "",
    },
    tokenHash: {
      type: String,
      default: "",
    },
    requestTokenHash: {
      type: String,
      default: "",
    },
    userAgent: {
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
    flags: {
      type: [String],
      default: [],
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    firstAttemptAt: {
      type: Date,
      default: Date.now,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
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
    decidedAt: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    mode: {
      type: String,
      default: null,
    },
    replacedDeviceId: {
      type: String,
      default: null,
    },
    previousDeviceId: {
      type: String,
      default: null,
    },
    targetDeviceId: {
      type: String,
      default: null,
    },
    pendingId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    escalationReason: {
      type: String,
      default: null,
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

deviceRequestSchema.pre("validate", function () {
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  } else if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
  if (this.decidedAt && !this.resolvedAt) {
    this.resolvedAt = this.decidedAt;
  } else if (this.resolvedAt && !this.decidedAt) {
    this.decidedAt = this.resolvedAt;
  }
  if (this.decidedBy && !this.resolvedBy) {
    this.resolvedBy = this.decidedBy;
  } else if (this.resolvedBy && !this.decidedBy) {
    this.decidedBy = this.resolvedBy;
  }
  if (this.rejectionReason && !this.note) {
    this.note = this.rejectionReason;
  } else if (this.note && !this.rejectionReason) {
    this.rejectionReason = this.note;
  }
  if (!this.slot) {
    const isHandheld =
      this.deviceType === "mobile" ||
      this.deviceType === "tablet" ||
      (this.osFamily &&
        (this.osFamily.toLowerCase().includes("ipad") ||
          this.osFamily.toLowerCase().includes("ios") ||
          this.osFamily.toLowerCase().includes("android")));
    this.slot = isHandheld ? "handheld" : "computer";
  }
  if (this.tokenHash && !this.requestTokenHash) {
    this.requestTokenHash = this.tokenHash;
  } else if (this.requestTokenHash && !this.tokenHash) {
    this.tokenHash = this.requestTokenHash;
  }
});

deviceRequestSchema.index({ studentId: 1, dedupeKey: 1, status: 1 });
deviceRequestSchema.index({ studentId: 1, slot: 1, status: 1 });
deviceRequestSchema.index({ requestTokenHash: 1 });
deviceRequestSchema.index({ status: 1, createdAt: -1 });

export const DeviceRequest =
  mongoose.models.DeviceRequest || mongoose.model("DeviceRequest", deviceRequestSchema);
export default DeviceRequest;
