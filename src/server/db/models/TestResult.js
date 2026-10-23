import "server-only";
import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

testResultSchema.index({ testId: 1, userId: 1 }, { unique: true });

export const TestResult =
  mongoose.models.TestResult ||
  mongoose.model("TestResult", testResultSchema);
export default TestResult;
