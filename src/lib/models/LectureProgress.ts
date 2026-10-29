import mongoose, { Schema } from "mongoose";

const lectureProgressSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    positionSec: {
      type: Number,
      default: 0,
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
    // Backwards-compatible fields
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  {
    timestamps: true,
  }
);

lectureProgressSchema.pre("validate", function () {
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  } else if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
  if (this.watchedSeconds && !this.positionSec) {
    this.positionSec = this.watchedSeconds;
  } else if (this.positionSec && !this.watchedSeconds) {
    this.watchedSeconds = this.positionSec;
  }
});

lectureProgressSchema.index({ studentId: 1, lectureId: 1 }, { unique: true });

export const LectureProgress =
  mongoose.models.LectureProgress ||
  mongoose.models.Progress ||
  mongoose.model("LectureProgress", lectureProgressSchema);

if (!mongoose.models.Progress) {
  mongoose.models.Progress = LectureProgress;
}
if (!mongoose.models.LectureProgress) {
  mongoose.models.LectureProgress = LectureProgress;
}

export const Progress = LectureProgress;
export default LectureProgress;
