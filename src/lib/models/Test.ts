import mongoose, { Schema } from "mongoose";

const testSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    startTime: {
      type: String,
      default: "",
      trim: true,
    },
    endTime: {
      type: String,
      default: "",
      trim: true,
    },
    syllabus: {
      type: String,
      default: "",
      trim: true,
    },
    venue: {
      type: String,
      default: "RD Classes, Sector 9 Centre",
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    className: {
      type: String,
      default: "12",
      trim: true,
    },
    durationMin: {
      type: Number,
      default: 180,
    },
    // Backwards-compatible fields
    startsAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

testSchema.pre("validate", function () {
  if (this.testDate && !this.startsAt) {
    this.startsAt = this.testDate;
  } else if (this.startsAt && !this.testDate) {
    this.testDate = this.startsAt;
  }
});

export const Test = mongoose.models.Test || mongoose.model("Test", testSchema);
export default Test;
