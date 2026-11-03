import "server-only";
import mongoose from "mongoose";

const deviceRecoveryOtpSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loginId: {
      type: String,
      required: true,
      trim: true,
    },
    pendingId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetDeviceId: {
      type: String,
      default: "",
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    candidateSignals: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    candidateProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    maskedDestination: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

deviceRecoveryOtpSchema.index({ studentId: 1, pendingId: 1 });
deviceRecoveryOtpSchema.index({ studentId: 1, createdAt: -1 });

export const DeviceRecoveryOtp =
  mongoose.models.DeviceRecoveryOtp ||
  mongoose.model("DeviceRecoveryOtp", deviceRecoveryOtpSchema);

export default DeviceRecoveryOtp;

