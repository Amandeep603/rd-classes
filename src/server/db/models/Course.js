import "server-only";
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["class12", "class11", "recorded", "test-series", "crash"],
      required: true,
      default: "class12",
      index: true,
    },
    classLabel: {
      type: String,
      default: "Class 12",
      trim: true,
    },
    badgeText: {
      type: String,
      default: "",
      trim: true,
    },
    badgeVariant: {
      type: String,
      enum: ["crown-navy", "yellow", "orange", "green", "purple", "red", ""],
      default: "crown-navy",
    },
    tone: {
      type: String,
      enum: ["sky", "yellow", "orange", "green", "purple", "red"],
      required: true,
      default: "sky",
    },
    illustration: {
      type: String,
      enum: [
        "books-blue",
        "open-book",
        "revision-plan",
        "target",
        "laptop-play",
        "checklist-clock",
        "notebook-red",
        "",
      ],
      default: "books-blue",
    },
    illustrationAssetId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    metaIcon: {
      type: String,
      enum: ["video", "file", "clock"],
      default: "video",
    },
    metaText: {
      type: String,
      default: "",
      trim: true,
    },
    language: {
      type: String,
      default: "Bilingual",
      trim: true,
    },
    facultyName: {
      type: String,
      default: "Ronak Dugar",
      trim: true,
    },
    facultyRole: {
      type: String,
      default: "Lead Accountancy Faculty",
      trim: true,
    },
    facultyAvatarAssetId: {
      type: String,
      default: null,
    },
    whatsappText: {
      type: String,
      default: "",
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    demo: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ published: 1, featured: 1, order: 1 });
courseSchema.index({ published: 1, category: 1, order: 1 });

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;
