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
    bookNo: {
      type: Number,
      default: 1,
      index: true,
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

bookSchema.pre("validate", function () {
  if (this.bookNo !== undefined && (!this.position || this.position === 0)) {
    this.position = this.bookNo;
  } else if (this.position !== undefined && (!this.bookNo || this.bookNo === 1)) {
    this.bookNo = this.position;
  }
});

bookSchema.index({ courseId: 1, position: 1 });
bookSchema.index({ courseId: 1, bookNo: 1 }, { unique: true });

export const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);
export default Book;
