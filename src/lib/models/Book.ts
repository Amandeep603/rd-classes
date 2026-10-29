import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
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

bookSchema.index({ courseId: 1, position: 1 });

export const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export default Book;

