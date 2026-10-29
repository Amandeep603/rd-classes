import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env and .env.local safely without printing secrets
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
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
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Error: MONGODB_URI is not set in environment or .env. Refusing to run seed:admin.");
  process.exit(1);
}

const adminEmail = (
  process.env.ADMIN_EMAIL ||
  (process.env.ADMIN_LOGIN_ID && process.env.ADMIN_LOGIN_ID.includes("@")
    ? process.env.ADMIN_LOGIN_ID
    : "admin@rdclasses.com")
).trim().toLowerCase();

const adminLoginId = (
  process.env.ADMIN_LOGIN_ID ||
  adminEmail.split("@")[0] ||
  "admin"
).trim().toLowerCase();

const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword || adminPassword.length < 8) {
  console.error(
    "Error: ADMIN_PASSWORD must be set in .env (or .env.local) and be at least 8 characters long."
  );
  process.exit(1);
}

async function run() {
  console.log("Connecting to MongoDB for admin verification/seeding...");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  // Import User model
  const { User } = await import("../lib/models/User.ts");

  // Check if admin user already exists (by email or loginId or role)
  const existing = await User.findOne({
    $or: [
      { email: adminEmail },
      { loginId: adminLoginId },
      { role: "admin" },
    ],
  });

  if (existing) {
    console.log(
      `✓ Admin user already exists (email: "${existing.email || adminEmail}", loginId: "${existing.loginId}"). Skipping creation.`
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  // Create hashed password
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await User.create({
    name: "RD Classes Administrator",
    email: adminEmail,
    loginId: adminLoginId,
    passwordHash,
    role: "admin",
    status: "active",
    maxDevices: 1,
    deviceLimit: 1,
    deviceCount: 0,
  });

  console.log(
    `✓ Successfully created ONE admin user (email: "${adminEmail}", loginId: "${adminLoginId}") in database "${dbName}".`
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  const sanitized = (err?.message || String(err)).replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, "[REDACTED_URI]");
  console.error("Admin seed failed:", sanitized);
  process.exit(1);
});
