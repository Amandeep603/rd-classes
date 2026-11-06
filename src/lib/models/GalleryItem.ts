import mongoose, { Schema } from "mongoose";

const galleryItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    url: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    showOnHome: {
      type: Boolean,
      default: true,
      index: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    // Backwards-compatible fields
    title: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General",
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

galleryItemSchema.pre("validate", function () {
  // Sync url, imageUrl, image
  const primaryUrl = this.url || this.imageUrl || this.image;
  if (primaryUrl) {
    if (!this.url) this.url = primaryUrl;
    if (!this.imageUrl) this.imageUrl = primaryUrl;
    if (!this.image) this.image = primaryUrl;
  }

  // Auto-detect type if not explicitly set
  if (!this.type || this.type === "image") {
    if (this.url && this.url.match(/\.(mp4|mov|m4v|webm)$/i)) {
      this.type = "video";
    }
  }

  // Sync order & position
  if (this.position !== undefined && this.order === 0) {
    this.order = this.position;
  } else if (this.order !== undefined && this.position === 0) {
    this.position = this.order;
  }
});

export const GalleryItem =
  mongoose.models.GalleryItem || mongoose.model("GalleryItem", galleryItemSchema);
export default GalleryItem;
