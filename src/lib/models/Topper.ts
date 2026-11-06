import mongoose, { Schema } from "mongoose";

const topperSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    school: {
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
    marks: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredOnHome: {
      type: Boolean,
      default: false,
      index: true,
    },
    outOf: {
      type: Number,
      default: 100,
    },
    classLevel: {
      type: String,
      default: "12",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    // Backwards-compatible fields
    score: {
      type: String,
      default: "",
    },
    examYear: {
      type: String,
      default: "2025",
    },
    photo: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

topperSchema.pre("validate", function () {
  if (this.marks && !this.score) {
    this.score = this.marks;
  } else if (this.score && !this.marks) {
    this.marks = this.score;
  }
  if (this.year && !this.examYear) {
    this.examYear = this.year;
  } else if (this.examYear && !this.year) {
    this.year = this.examYear;
  }
  if (this.photoUrl && !this.photo) {
    this.photo = this.photoUrl;
  } else if (this.photo && !this.photoUrl) {
    this.photoUrl = this.photo;
  }
  // Sync featured, isFeatured and featuredOnHome
  if (this.featuredOnHome !== undefined) {
    this.featured = this.featuredOnHome;
    this.isFeatured = this.featuredOnHome;
  } else if (this.featured !== undefined) {
    this.featuredOnHome = this.featured;
    this.isFeatured = this.featured;
  } else if (this.isFeatured !== undefined) {
    this.featured = this.isFeatured;
    this.featuredOnHome = this.isFeatured;
  }
  if (!this.outOf) {
    this.outOf = 100;
  }
});

topperSchema.index({ featured: 1, year: -1 });

export const Topper = mongoose.models.Topper || mongoose.model("Topper", topperSchema);
export default Topper;
