import mongoose, { Schema } from "mongoose";

const enquirySchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["course-page", "lecture-lock", "notes-lock"],
      default: "course-page",
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "enrolled", "closed"],
      default: "new",
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Enquiry =
  mongoose.models.Enquiry || mongoose.model("Enquiry", enquirySchema);
export default Enquiry;

