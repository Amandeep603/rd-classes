import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

async function cleanDemo() {
  console.log("Connecting to MongoDB to clean demo data...");
  await mongoose.connect(MONGODB_URI);

  const {
    User,
    Course,
    Lecture,
    Enrollment,
    Progress,
    Announcement,
    Test,
    TestResult,
    Device,
    DeviceRequest,
  } = await import("../src/server/db/models/index.js");

  const demoLogins = [
    "tanvi.agarwal",
    "vardaan.agarwal",
    "kunal.sethi",
    "aditi.prakash",
  ];

  const demoUsers = await User.find({ loginId: { $in: demoLogins } });
  const demoUserIds = demoUsers.map((u) => u._id);

  await Enrollment.deleteMany({ userId: { $in: demoUserIds } });
  await Progress.deleteMany({ userId: { $in: demoUserIds } });
  await Device.deleteMany({ userId: { $in: demoUserIds } });
  await DeviceRequest.deleteMany({ userId: { $in: demoUserIds } });
  await TestResult.deleteMany({ userId: { $in: demoUserIds } });
  await User.deleteMany({ _id: { $in: demoUserIds } });

  console.log("Demo data cleaned successfully.");
  await mongoose.disconnect();
}

cleanDemo().catch((err) => {
  console.error("Clean error:", err);
  process.exit(1);
});
