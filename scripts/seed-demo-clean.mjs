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
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.name;
  console.log(`Connected database name: ${dbName}`);

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

  // seed:demo:clean deletes ONLY documents with demo: true
  const resUsers = await User.deleteMany({ demo: true });
  const resDevices = await Device.deleteMany({ demo: true });
  const resRequests = await DeviceRequest.deleteMany({ demo: true });
  const resEnrollments = await Enrollment.deleteMany({ demo: true });
  const resProgress = await Progress.deleteMany({ demo: true });
  const resAnnouncements = await Announcement.deleteMany({ demo: true });
  const resTests = await Test.deleteMany({ demo: true });
  const resTestResults = await TestResult.deleteMany({ demo: true });
  const resLectures = await Lecture.deleteMany({ demo: true });
  const resCourses = await Course.deleteMany({ demo: true });

  console.log("Demo documents deleted (demo: true):", {
    users: resUsers.deletedCount,
    devices: resDevices.deletedCount,
    deviceRequests: resRequests.deletedCount,
    enrollments: resEnrollments.deletedCount,
    progress: resProgress.deletedCount,
    announcements: resAnnouncements.deletedCount,
    tests: resTests.deletedCount,
    testResults: resTestResults.deletedCount,
    lectures: resLectures.deletedCount,
    courses: resCourses.deletedCount,
  });

  await mongoose.disconnect();
}

cleanDemo().catch((err) => {
  console.error("Clean error:", err);
  process.exit(1);
});
