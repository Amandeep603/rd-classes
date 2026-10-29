import mongoose, { Schema } from "mongoose";

const activityLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entity: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    entityId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Backwards-compatible fields
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.pre("validate", function () {
  if (this.actorId && !this.userId) {
    this.userId = this.actorId;
  } else if (this.userId && !this.actorId) {
    this.actorId = this.userId;
  }
});

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.models.AuditLog ||
  mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
