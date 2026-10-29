import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    role: {
      type: String,
      default: "student",
      index: true,
    },
    // Backwards-compatible fields
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export default Session;
