import mongoose, { Schema } from "mongoose";

const noteSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true,
      },
    ],
    category: {
      type: String,
      enum: ["notes", "formula-sheet", "practice-questions", "previous-papers", "other"],
      default: "notes",
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
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    // Backwards-compatible fields
    kind: {
      type: String,
      default: "notes",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.pre("validate", function () {
  if (this.sizeBytes && !this.fileSize) {
    this.fileSize = this.sizeBytes;
  } else if (this.fileSize && !this.sizeBytes) {
    this.sizeBytes = this.fileSize;
  }
  // Safe courseIds migration & two-way sync
  if (this.courseId && (!this.courseIds || this.courseIds.length === 0)) {
    this.courseIds = [this.courseId];
  } else if (this.courseIds && this.courseIds.length > 0 && !this.courseId) {
    this.courseId = this.courseIds[0];
  }
  // Category / kind sync
  if (this.category && !this.kind) {
    this.kind = this.category;
  } else if (this.kind && !this.category) {
    if (["notes", "formula-sheet", "practice-questions", "previous-papers", "other"].includes(this.kind)) {
      (this as any).category = this.kind;
    } else {
      (this as any).category = "notes";
    }
  }
  // SortOrder / order sync
  if (this.sortOrder !== undefined && this.order === 0) {
    this.order = this.sortOrder;
  } else if (this.order !== undefined && this.sortOrder === 0) {
    this.sortOrder = this.order;
  }
});

export const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);
export default Note;
