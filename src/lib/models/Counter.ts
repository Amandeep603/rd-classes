import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);
export default Counter;

