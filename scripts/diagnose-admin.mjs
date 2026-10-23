import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env.local without logging its contents
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
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const adminLoginId = (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

async function diagnose() {
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const dbName = mongoose.connection.name;

  const { User, LoginAttempt } = await import("../src/server/db/models/index.js");

  // (a) Database name and user existence
  console.log(`[DIAGNOSIS] Connected Database Name: ${dbName}`);
  const adminUser = await User.findOne({ loginId: adminLoginId });
  if (!adminUser) {
    console.log(`[DIAGNOSIS] Admin user matching ADMIN_LOGIN_ID exists: NO`);
  } else {
    console.log(`[DIAGNOSIS] Admin user matching ADMIN_LOGIN_ID exists: YES`);
    console.log(`[DIAGNOSIS] User Role: ${adminUser.role}`);
    console.log(`[DIAGNOSIS] User Status: ${adminUser.status}`);
  }

  // (b) bcrypt compare
  if (adminUser && adminPassword) {
    const isMatch = await bcrypt.compare(adminPassword, adminUser.passwordHash);
    console.log(`[DIAGNOSIS] Stored hash matches ADMIN_PASSWORD: ${isMatch}`);
  } else {
    console.log(`[DIAGNOSIS] Stored hash matches ADMIN_PASSWORD: false (User or password missing)`);
  }

  // (c) LoginAttempt lock status
  const userKey = `admin:u:${adminLoginId}`;
  const userAttempt = await LoginAttempt.findOne({ key: userKey });
  const now = new Date();

  console.log(`--- Lock Status Check ---`);
  if (!userAttempt) {
    console.log(`[DIAGNOSIS] LoginAttempt for user key: NONE (Not locked)`);
  } else {
    const isLocked = Boolean(userAttempt.lockedUntil && userAttempt.lockedUntil > now);
    console.log(`[DIAGNOSIS] User Key Attempts Count: ${userAttempt.attempts}`);
    console.log(`[DIAGNOSIS] User Key Locked: ${isLocked}`);
    if (isLocked) {
      console.log(`[DIAGNOSIS] Locked until: ${userAttempt.lockedUntil.toISOString()}`);
    }
  }

  // Check any active IP locks for admin
  const ipAttempts = await LoginAttempt.find({ key: { $regex: /^admin:ip:/ } });
  console.log(`[DIAGNOSIS] Total active admin IP attempt records: ${ipAttempts.length}`);
  for (const ipAtt of ipAttempts) {
    const isIpLocked = Boolean(ipAtt.lockedUntil && ipAtt.lockedUntil > now);
    console.log(`[DIAGNOSIS] IP Record key: ${ipAtt.key}, attempts: ${ipAtt.attempts}, locked: ${isIpLocked}${isIpLocked ? `, unlock time: ${ipAtt.lockedUntil.toISOString()}` : ""}`);
  }

  await mongoose.disconnect();
}

diagnose().catch((err) => {
  console.error("Diagnosis error:", err);
  process.exit(1);
});
