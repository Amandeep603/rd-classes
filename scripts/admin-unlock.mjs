import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local without printing secrets
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

const adminLoginId = (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();

async function unlock() {
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const { LoginAttempt } = await import("../src/server/db/models/index.js");

  const userKey = `admin:u:${adminLoginId}`;
  const deleteResult = await LoginAttempt.deleteMany({
    $or: [
      { key: userKey },
      { key: { $regex: /^admin:ip:/ } },
    ],
  });

  console.log(`✓ Admin unlocked successfully in database "${dbName}". Removed ${deleteResult.deletedCount} login attempt / lock record(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

unlock().catch((err) => {
  console.error("Unlock failed:", err.message);
  process.exit(1);
});
