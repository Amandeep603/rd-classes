import mongoose, { Schema } from "mongoose";

const lectureSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      default: null,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    partNumber: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    videoProvider: {
      type: String,
      enum: ["vimeo", "youtube", "bunny", "direct"],
      default: "vimeo",
      trim: true,
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
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
    isFree: {
      type: Boolean,
      default: false,
      index: true,
    },
    sourceKey: {
      type: String,
      default: null,
      trim: true,
    },

    // Legacy backwards-compatible string fields
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
    isFreePreview: {
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
  // Sync duration
  if (this.durationSeconds && !this.durationSec) {
    this.durationSec = this.durationSeconds;
  } else if (this.durationSec && !this.durationSeconds) {
    this.durationSeconds = this.durationSec;
  }

  // Sync position & order
  if (this.position !== undefined && (this.order === 0 || this.order === undefined)) {
    this.order = this.position;
  } else if (this.order !== undefined && (this.position === 0 || this.position === undefined)) {
    this.position = this.order;
  }

  // Sync status & published
  if (this.status === "published") {
    this.published = true;
  } else if (this.status === "draft") {
    this.published = false;
  } else if (this.published) {
    this.status = "published";
  } else {
    this.status = "draft";
  }

  // Sync isFree & legacy flags
  if (this.isFree !== undefined) {
    this.freePreview = this.isFree;
    this.isFreePreview = this.isFree;
    this.isPreview = this.isFree;
  } else if (this.isFreePreview !== undefined) {
    this.isFree = this.isFreePreview;
    this.freePreview = this.isFreePreview;
    this.isPreview = this.isFreePreview;
  } else if (this.freePreview !== undefined) {
    this.isFree = this.freePreview;
    this.isFreePreview = this.freePreview;
    this.isPreview = this.freePreview;
  }
});

lectureSchema.index({ courseId: 1, position: 1 });
lectureSchema.index({ courseId: 1, bookId: 1, chapterId: 1, position: 1 });
lectureSchema.index(
  { courseId: 1, sourceKey: 1 },
  { unique: true, sparse: true }
);

export const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
export default Lecture;
