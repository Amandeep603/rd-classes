import mongoose, { Schema } from "mongoose";

const settingSchema = new Schema(
  {
    instituteName: {
      type: String,
      default: "RD Classes",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Faridabad's Premier Accountancy Institute for CBSE Class 11 & 12",
      trim: true,
    },
    ownerName: {
      type: String,
      default: "Ronak Dugar",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "Faridabad",
      trim: true,
    },
    googleMapsUrl: {
      type: String,
      default: "",
      trim: true,
    },
    workingHours: {
      type: String,
      default: "Mon - Sat: 9:00 AM - 7:30 PM",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    socialLinks: {
      type: Schema.Types.Mixed,
      default: {},
    },
    defaultMaxDevices: {
      type: Number,
      default: 1,
      min: 1,
    },
    workspaceName: {
      type: String,
      default: "RD Classes",
    },
    whatsappNumber: {
      type: String,
      default: "918368545620",
    },
    whatsappDefaultMessage: {
      type: String,
      default:
        "Hello Ronak Sir, I would like to get access to *{course}* at RD Classes.\n{studentLine}Course link: {link}\nPlease guide me about the next steps.",
    },
    rewardTargetText: {
      type: String,
      default: "",
    },
    // Backwards-compatible fields
    key: {
      type: String,
      default: "global",
    },
    value: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

settingSchema.pre("validate", function () {
  if (this.instituteName && !this.workspaceName) {
    this.workspaceName = this.instituteName;
  } else if (this.workspaceName && !this.instituteName) {
    this.instituteName = this.workspaceName;
  }
  if (this.whatsapp && !this.whatsappNumber) {
    this.whatsappNumber = this.whatsapp;
  } else if (this.whatsappNumber && !this.whatsapp) {
    this.whatsapp = this.whatsappNumber;
  }
});

export const Setting =
  mongoose.models.Setting ||
  mongoose.models.Settings ||
  mongoose.model("Setting", settingSchema);

if (!mongoose.models.Settings) {
  mongoose.models.Settings = Setting;
}
if (!mongoose.models.Setting) {
  mongoose.models.Setting = Setting;
}

export const Settings = Setting;
export default Setting;
