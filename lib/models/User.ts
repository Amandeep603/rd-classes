import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    className: {
      type: String,
      default: "12",
      trim: true,
    },
    loginId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
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
      index: true,
    },
    maxDevices: {
      type: Number,
      default: 1,
      min: 1,
    },
    deviceLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    deviceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordEnc: {
      iv: { type: String, default: null },
      tag: { type: String, default: null },
      ciphertext: { type: String, default: null },
      keyVersion: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function () {
  if (this.maxDevices !== undefined && this.deviceLimit === undefined) {
    this.deviceLimit = this.maxDevices;
  } else if (this.deviceLimit !== undefined && this.maxDevices === undefined) {
    this.maxDevices = this.deviceLimit;
  }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
