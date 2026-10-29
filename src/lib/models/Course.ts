import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
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
    description: {
      type: String,
      default: "",
      trim: true,
    },
    metaLeft: {
      type: String,
      default: "",
      trim: true,
    },
    metaRight: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    theme: {
      type: String,
      enum: ["blue", "yellow", "orange", "emerald", "violet", "rose", "sky", "green", "purple", "red"],
      default: "blue",
    },
    illustrationKey: {
      type: String,
      default: "",
      trim: true,
    },
    illustrationUrl: {
      type: String,
      default: "",
      trim: true,
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    price: {
      type: Schema.Types.Mixed,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    showOnHome: {
      type: Boolean,
      default: false,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    homeOrder: {
      type: Number,
      default: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    // Optional course targets & rewards
    rewardTargetText: {
      type: String,
      default: "",
      trim: true,
    },
    targetScore: {
      type: String,
      default: "",
      trim: true,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    // Course Page Content Controls
    includes: [
      {
        type: String,
        trim: true,
      },
    ],
    highlights: [
      {
        icon: { type: String, default: "video", trim: true },
        label: { type: String, default: "", trim: true },
        text: { type: String, default: "", trim: true },
      },
    ],
    titleHighlight: {
      type: String,
      default: "",
      trim: true,
    },
    heroBooks: [
      {
        type: String,
        trim: true,
      },
    ],
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
    facultyPoints: [
      {
        type: String,
        trim: true,
      },
    ],
    facultyBullets: [
      {
        type: String,
        trim: true,
      },
    ],
    whatsappMessageNote: {
      type: String,
      default: "",
      trim: true,
    },
    whatsappText: {
      type: String,
      default: "",
      trim: true,
    },
    // Backwards-compatible aliases
    published: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.pre("validate", function () {
  if (this.status === "published") {
    this.published = true;
  } else if (this.published) {
    this.status = "published";
  }
  if (this.featured) {
    this.showOnHome = true;
  } else if (this.showOnHome) {
    this.featured = true;
  }
  if (this.sortOrder !== undefined && this.order === 0) {
    this.order = this.sortOrder;
  }
  if (this.facultyPoints && (!this.facultyBullets || this.facultyBullets.length === 0)) {
    this.facultyBullets = this.facultyPoints;
  } else if (this.facultyBullets && (!this.facultyPoints || this.facultyPoints.length === 0)) {
    this.facultyPoints = this.facultyBullets;
  }
  if (this.whatsappMessageNote && !this.whatsappText) {
    this.whatsappText = this.whatsappMessageNote;
  } else if (this.whatsappText && !this.whatsappMessageNote) {
    this.whatsappMessageNote = this.whatsappText;
  }
  if (Array.isArray(this.highlights)) {
    this.highlights.forEach((h) => {
      if (h.label && !h.text) h.text = h.label;
      if (h.text && !h.label) h.label = h.text;
    });
  }
});

export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export default Course;
