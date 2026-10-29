import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "student"],
      default: "admin",
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
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
        "mock_test_scheduled",
        "result_published",
        "topper_published",
        "announcement_posted",
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
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientRole: 1, studentId: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, courseId: 1, createdAt: -1 });
notificationSchema.index({ readAt: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
