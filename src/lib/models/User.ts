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
    batch: {
      type: String,
      trim: true,
      default: undefined,
    },
    importSerial: {
      type: Number,
      default: undefined,
    },
    emailStatus: {
      type: String,
      enum: ["not_sent", "sent", "failed", "no_email"],
      default: "not_sent",
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      trim: true,
      default: null,
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
    lastLoginIp: {
      type: String,
      default: null,
    },
    dismissedAnnouncementIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Announcement",
      },
    ],
    savedCourses: [
      {
        type: String,
        trim: true,
      },
    ],
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    validUntil: {
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

userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, batch: 1 });
userSchema.index({ name: 1, phone: 1 });

userSchema.pre("validate", function () {
  if (this.email === "" || this.email === null) {
    this.email = undefined;
  }
  if (this.phone === "" || this.phone === null) {
    this.phone = undefined;
  }
  if (this.batch === "" || this.batch === null) {
    this.batch = undefined;
  }
  if (this.maxDevices !== undefined && this.deviceLimit === undefined) {
    this.deviceLimit = this.maxDevices;
  } else if (this.deviceLimit !== undefined && this.maxDevices === undefined) {
    this.maxDevices = this.deviceLimit;
  }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
