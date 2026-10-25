import "server-only";
import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["credentials", "device-approved", "test"],
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
      required: true,
      index: true,
    },
    error: {
      type: String,
      default: null,
      maxlength: 500, // Truncated, never containing secrets
    },
    attempts: {
      type: Number,
      default: 1,
    },
    sentAt: {
      type: Date,
      default: null,
      index: true,
    },
    batchId: {
      type: String,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ sentAt: -1, status: 1 });

export const EmailLog =
  mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
