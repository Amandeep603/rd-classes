import "server-only";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "admin"],
      required: true,
      default: "student",
    },
    loginId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9._-]{4,30}$/, "Invalid login ID format"],
    },
    studentCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      enum: ["11", "12", null],
      default: null,
    },
    school: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    passwordHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      required: true,
    },
    deviceLimit: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
      required: true,
    },
    deviceCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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

userSchema.index({ role: 1, status: 1 });
userSchema.index({ studentCode: 1 }, { unique: true, sparse: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
