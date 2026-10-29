import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "device_request",
        "course_created",
        "course_updated",
        "student_import",
        "lecture_added",
        "note_uploaded",
        "login_blocked",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ readAt: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
