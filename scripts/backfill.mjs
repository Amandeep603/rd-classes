import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function loadEnv() {
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
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Error: MONGODB_URI is not set. Please configure .env.local");
  process.exit(1);
}

async function run() {
  console.log("Connecting to MongoDB for studentCode backfill...");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  });

  const { User, Counter, Settings } = await import(
    "../src/server/db/models/index.js"
  );

  // 1. Ensure default settings exist
  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      workspaceName: "Ronak Sir Workspace",
      whatsappNumber: "+91 99999 99999",
      defaultDeviceLimit: 1,
      watermarkEnabled: true,
      rewardTargetText: "₹5,100 Cash Reward Target",
    });
    console.log("✓ Initialized default Settings singleton.");
  }

  // 2. Backfill loginIds if missing
  const studentsWithoutLoginId = await User.find({
    role: "student",
    $or: [{ loginId: null }, { loginId: { $exists: false } }],
  }).sort({ createdAt: 1 });

  console.log(`Found ${studentsWithoutLoginId.length} students without loginId.`);

  const currentYear = new Date().getFullYear();
  for (const student of studentsWithoutLoginId) {
    const studentYear = student.createdAt
      ? new Date(student.createdAt).getFullYear()
      : currentYear;
    const counterId = `studentLoginId:${studentYear}`;

    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const seqNumber = String(counter.seq).padStart(3, "0");
    const generatedCode = `RD-${studentYear}-${seqNumber}`;

    student.loginId = generatedCode;
    if (!student.className) {
      student.className = "12";
    }
    await student.save();
    console.log(`✓ Backfilled ${student.name} -> ${generatedCode}`);
  }

  console.log("Backfill completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
