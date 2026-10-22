import "server-only";
import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      default: "General",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    vimeoId: {
      type: String,
      required: true,
      trim: true,
    },
    vimeoHash: {
      type: String,
      default: "",
      trim: true,
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lectureSchema.index({ courseId: 1, order: 1 });

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
export default Lecture;
