import "server-only";
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      all: {
        type: Boolean,
        default: true,
      },
      courseIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
      ],
    },
    startsAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    dismissible: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

announcementSchema.index({ active: 1, startsAt: -1 });

export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);
export default Announcement;
