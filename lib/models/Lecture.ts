import mongoose, { Schema } from "mongoose";

const lectureSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    book: {
      type: String,
      default: "",
      trim: true,
    },
    chapter: {
      type: String,
      default: "",
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    videoProvider: {
      type: String,
      default: "vimeo",
      trim: true,
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    // Backwards-compatible fields
    vimeoId: {
      type: String,
      default: "",
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
    order: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    freePreview: {
      type: Boolean,
      default: false,
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

lectureSchema.pre("validate", function () {
  if (this.durationSeconds && !this.durationSec) {
    this.durationSec = this.durationSeconds;
  } else if (this.durationSec && !this.durationSeconds) {
    this.durationSeconds = this.durationSec;
  }
  if (this.position !== undefined && this.order === 0) {
    this.order = this.position;
  }
  if (this.status === "published") {
    this.published = true;
  } else if (this.published) {
    this.status = "published";
  }
  if (this.isPreview) {
    this.freePreview = true;
  } else if (this.freePreview) {
    this.isPreview = true;
  }
});

lectureSchema.index({ courseId: 1, position: 1 });

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
export default Lecture;
