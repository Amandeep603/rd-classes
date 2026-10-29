import mongoose, { Schema } from "mongoose";

const noteSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    book: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: true,
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
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    section: {
      type: String,
      default: "",
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
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
  if (this.courseId && (!this.courseIds || this.courseIds.length === 0)) {
    this.courseIds = [this.courseId];
  } else if (this.courseIds && this.courseIds.length > 0 && !this.courseId) {
    this.courseId = this.courseIds[0];
  }
});

export const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);
export default Note;
