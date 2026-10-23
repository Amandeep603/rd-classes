import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
  console.error("Error: MONGODB_URI is not set. Refusing to run seed:admin.");
  process.exit(1);
}

const adminLoginId = (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword || adminPassword.length < 8) {
  console.error(
    "Error: ADMIN_PASSWORD must be set in .env.local and be at least 8 characters long."
  );
  process.exit(1);
}

async function run() {
  console.log("Connecting to MongoDB for admin seeding...");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
  });

  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const { User, LoginAttempt } = await import("../src/server/db/models/index.js");

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existing = await User.findOne({ loginId: adminLoginId });
  if (existing) {
    existing.role = "admin";
    existing.passwordHash = passwordHash;
    existing.status = "active";
    existing.deviceLimit = 3;
    await existing.save();
    console.log(`✓ Admin user "${adminLoginId}" updated successfully in database "${dbName}".`);
  } else {
    await User.create({
      role: "admin",
      loginId: adminLoginId,
      name: "RD Classes Administrator",
      passwordHash,
      status: "active",
      deviceLimit: 3,
      deviceCount: 0,
      mustChangePassword: false,
    });
    console.log(`✓ Admin user "${adminLoginId}" created successfully in database "${dbName}".`);
  }

  // Clear any existing failed login attempts for this admin to ensure immediate access
  await LoginAttempt.deleteMany({
    $or: [
      { key: `admin:u:${adminLoginId}` },
      { key: { $regex: /^admin:ip:/ } },
    ],
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Admin seed failed:", err);
  process.exit(1);
});
