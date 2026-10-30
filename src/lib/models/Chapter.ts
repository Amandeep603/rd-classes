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
    bookNo: {
      type: Number,
      default: 1,
      index: true,
    },
    chapterNo: {
      type: Number,
      default: 1,
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

chapterSchema.pre("validate", function () {
  if (this.chapterNo !== undefined && (!this.position || this.position === 0)) {
    this.position = this.chapterNo;
  } else if (this.position !== undefined && (!this.chapterNo || this.chapterNo === 1)) {
    this.chapterNo = this.position;
  }
});

chapterSchema.index({ courseId: 1, bookId: 1, position: 1 });
chapterSchema.index({ courseId: 1, bookNo: 1, chapterNo: 1 }, { unique: true });

export const Chapter = mongoose.models.Chapter || mongoose.model("Chapter", chapterSchema);
export default Chapter;
