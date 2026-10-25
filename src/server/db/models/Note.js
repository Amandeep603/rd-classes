import "server-only";
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ["notes", "practice", "formula", "paper"],
      default: "notes",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["file", "link"],
      default: "file",
      required: true,
      index: true,
    },
    externalUrl: {
      type: String,
      default: "",
      trim: true,
    },
    fileKey: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    contentType: {
      type: String,
      default: "application/pdf",
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    section: {
      type: String,
      default: "General",
      trim: true,
    },
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        index: true,
      },
    ],
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    demo: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ courseIds: 1, published: 1, kind: 1 });
noteSchema.index({ published: 1, createdAt: -1 });

export const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);
export default Note;
