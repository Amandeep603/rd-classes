import "server-only";
import mongoose from "mongoose";

const loginAttemptSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    firstAt: {
      type: Date,
      default: Date.now,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const LoginAttempt =
  mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", loginAttemptSchema);
export default LoginAttempt;
