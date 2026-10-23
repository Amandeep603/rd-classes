import "server-only";
import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    positionSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSec: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

progressSchema.index({ userId: 1, lectureId: 1 }, { unique: true });

export const Progress =
  mongoose.models.Progress || mongoose.model("Progress", progressSchema);
export default Progress;
