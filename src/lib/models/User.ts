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
      lowercase: true,
      trim: true,
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    photoUrl: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
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
    savedCourses: [
      {
        type: String,
        trim: true,
      },
    ],
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

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string", $gt: "" } } }
);
userSchema.index({ role: 1, status: 1 });

userSchema.pre("validate", function () {
  if (this.email === "" || this.email === null) {
    this.email = undefined;
  }
  if (this.phone === "" || this.phone === null) {
    this.phone = undefined;
  }
  if (this.maxDevices !== undefined && this.deviceLimit === undefined) {
    this.deviceLimit = this.maxDevices;
  } else if (this.deviceLimit !== undefined && this.maxDevices === undefined) {
    this.maxDevices = this.deviceLimit;
  }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
