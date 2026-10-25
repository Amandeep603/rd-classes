import "server-only";
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "global",
    },
    workspaceName: {

      type: String,
      default: "Ronak Sir Workspace",
      trim: true,
    },
    whatsappNumber: {
      type: String,
      default: "+91 99999 99999",
      trim: true,
    },
    defaultDeviceLimit: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    watermarkEnabled: {
      type: Boolean,
      default: true,
    },
    rewardTargetText: {
      type: String,
      default: "₹5,100 Cash Reward Target",
      trim: true,
    },
    allowStudentPasswordChange: {
      type: Boolean,
      default: true,
    },
    emailOnDeviceApproved: {
      type: Boolean,
      default: true,
    },
    websiteNumbers: {
      studentsMentored: { type: String, default: "", trim: true },
      boardSuccessRate: { type: String, default: "", trim: true },
      testsEvaluated: { type: String, default: "", trim: true },
      recordedLectures: { type: String, default: "", trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;
