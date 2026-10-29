import mongoose, { Schema } from "mongoose";

const resultPdfSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      default: "2025",
      trim: true,
      index: true,
    },
    classLabel: {
      type: String,
      default: "Class 12",
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    // Backwards-compatible fields
    examYear: {
      type: String,
      default: "2025",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

resultPdfSchema.pre("validate", function () {
  if (this.year && !this.examYear) {
    this.examYear = this.year;
  } else if (this.examYear && !this.year) {
    this.year = this.examYear;
  }
  if (this.sizeBytes && !this.fileSize) {
    this.fileSize = this.sizeBytes;
  } else if (this.fileSize && !this.sizeBytes) {
    this.sizeBytes = this.fileSize;
  }
});

resultPdfSchema.index({ year: -1 });

export const ResultPdf =
  mongoose.models.ResultPdf || mongoose.model("ResultPdf", resultPdfSchema);
export default ResultPdf;
