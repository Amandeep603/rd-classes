import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local if present
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
  console.log("Connecting to MongoDB to sync indexes...");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  });

  const {
    User,
    Device,
    DeviceRequest,
    Session,
    LoginAttempt,
    Course,
    Lecture,
    Enrollment,
    Progress,
    AuditLog,
    Counter,
    Announcement,
    Test,
    TestResult,
    Settings,
  } = await import("../src/server/db/models/index.js");

  const models = [
    User,
    Device,
    DeviceRequest,
    Session,
    LoginAttempt,
    Course,
    Lecture,
    Enrollment,
    Progress,
    AuditLog,
    Counter,
    Announcement,
    Test,
    TestResult,
    Settings,
  ];

  for (const model of models) {
    try {
      console.log(`Creating indexes for ${model.modelName}...`);
      await model.createIndexes();
      console.log(`✓ ${model.modelName} indexes created.`);
    } catch (err) {
      console.error(`✕ Error creating indexes for ${model.modelName}:`, err.message);
    }
  }

  console.log("All indexes synchronized successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Index synchronization failed:", err);
  process.exit(1);
});
