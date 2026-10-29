import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: Schema.Types.Mixed,
      default: "all",
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // Backwards-compatible fields
    content: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    dismissible: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.pre("validate", function () {
  if (this.body && !this.content) {
    this.content = this.body;
  } else if (this.content && !this.body) {
    this.body = this.content;
  }
  if (this.expiresAt && !this.endsAt) {
    this.endsAt = this.expiresAt;
  } else if (this.endsAt && !this.expiresAt) {
    this.expiresAt = this.endsAt;
  }
});

export const Announcement =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
export default Announcement;
