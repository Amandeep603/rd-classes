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
  console.error("Error: MONGODB_URI is not set.");
  process.exit(1);
}

async function runBackup() {
  console.log("=== RD Classes Database Backup Utility ===");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups", `backup_${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const {
    User,
    Course,
    Lecture,
    Note,
    Enrollment,
    Announcement,
    Test,
    TestResult,
    Settings,
    AuditLog,
    EmailLog,
    Counter,
  } = await import("../src/server/db/models/index.js");

  const targets = [
    { name: "courses", model: Course, projection: {} },
    { name: "lectures", model: Lecture, projection: {} },
    { name: "notes", model: Note, projection: {} },
    { name: "enrollments", model: Enrollment, projection: {} },
    { name: "announcements", model: Announcement, projection: {} },
    { name: "tests", model: Test, projection: {} },
    { name: "test_results", model: TestResult, projection: {} },
    { name: "settings", model: Settings, projection: {} },
    { name: "audit_logs", model: AuditLog, projection: {} },
    { name: "email_logs", model: EmailLog, projection: {} },
    { name: "counters", model: Counter, projection: {} },
    // User collection: explicitly omit sensitive credentials (passwordHash)
    {
      name: "users",
      model: User,
      projection: { passwordHash: 0, resetToken: 0, tokenHash: 0 },
    },
  ];

  const manifest = {
    timestamp: new Date().toISOString(),
    database: mongoose.connection.name,
    collections: {},
    note: "Sessions and login attempts excluded. Password and token hashes sanitized.",
  };

  for (const target of targets) {
    try {
      const docs = await target.model.find({}, target.projection).lean();
      const filePath = path.join(backupDir, `${target.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
      manifest.collections[target.name] = docs.length;
      console.log(`✓ Exported ${docs.length} ${target.name} to ${target.name}.json`);
    } catch (err) {
      console.error(`✕ Error exporting ${target.name}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\n✓ Backup complete! Saved in: ${backupDir}`);
  console.log("Tip: Run this weekly. Free tier MongoDB Atlas does not provide automated point-in-time restores.");

  await mongoose.disconnect();
  process.exit(0);
}

runBackup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
