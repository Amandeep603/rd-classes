import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "parent"],
      default: "student",
      index: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    quote: {
      type: String,
      required: true,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Backwards-compatible fields
    studentName: {
      type: String,
      default: "",
    },
    school: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.pre("validate", function () {
  if (this.name && !this.studentName) {
    this.studentName = this.name;
  }
  if (this.quote && !this.text) {
    this.text = this.quote;
  }
  if (this.published !== undefined && this.isVisible === undefined) {
    this.isVisible = this.published;
  }
});

reviewSchema.index({ published: 1, rating: -1 });

export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
