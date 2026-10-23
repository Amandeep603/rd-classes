import "server-only";
import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      default: "Sunday Mock",
      trim: true,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMin: {
      type: Number,
      default: 180,
      min: 1,
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
    className: {
      type: String,
      enum: ["11", "12", "All"],
      default: "12",
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    published: {
      type: Boolean,
      default: true,
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

testSchema.index({ published: 1, startsAt: 1 });

export const Test =
  mongoose.models.Test || mongoose.model("Test", testSchema);
export default Test;
