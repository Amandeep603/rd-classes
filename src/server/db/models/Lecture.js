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
    freePreview: {
      type: Boolean,
      default: false,
      index: true,
    },
    freePreviewOverridden: {
      type: Boolean,
      default: false,
    },
    isPreview: {
      type: Boolean,
      default: false,
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

lectureSchema.index({ courseId: 1, order: 1 });

lectureSchema.pre("validate", function () {
  if (this.freePreview === true) {
    this.isPreview = true;
  } else if (this.isPreview === true && this.freePreview !== true) {
    this.freePreview = true;
  }
});

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
export default Lecture;
