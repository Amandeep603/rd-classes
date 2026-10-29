import mongoose, { Schema } from "mongoose";

const galleryItemSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
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
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

galleryItemSchema.pre("validate", function () {
  if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  } else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  if (this.position !== undefined && this.order === 0) {
    this.order = this.position;
  }
});

export const GalleryItem =
  mongoose.models.GalleryItem || mongoose.model("GalleryItem", galleryItemSchema);
export default GalleryItem;
