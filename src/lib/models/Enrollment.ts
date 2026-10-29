import mongoose, { Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    // Backwards-compatible field
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.pre("validate", function () {
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  } else if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
});

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
