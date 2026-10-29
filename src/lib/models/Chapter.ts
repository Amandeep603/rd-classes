import mongoose, { Schema } from "mongoose";

const chapterSchema = new Schema(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ courseId: 1, bookId: 1, position: 1 });

export const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);
export default Chapter;

