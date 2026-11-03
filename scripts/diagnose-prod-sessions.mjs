import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load environment variables safely without printing secrets
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [k, ...v] = trimmed.split("=");
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("No MONGODB_URI found");
  process.exit(1);
}

// Strict Read-Only Guard: Monkey patch connection to prevent any write operations
async function runDiagnosis() {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  const db = conn.connection.db;

  // Block any write attempts
  const writeOps = ["insert", "update", "delete", "remove", "drop", "createCollection", "rename"];
  for (const op of writeOps) {
    if (db[op]) {
      db[op] = () => {
        throw new Error(`Write operation ${op} strictly blocked on production!`);
      };
    }
  }

  const sessionsCol = db.collection("sessions");

  // Fetch index information on sessions collection
  const indexes = await sessionsCol.indexes();
  console.log("=== SESSIONS COLLECTION INDEXES ===");
  for (const idx of indexes) {
    console.log(`Index: ${idx.name}, Keys: ${JSON.stringify(idx.key)}, Unique: ${Boolean(idx.unique)}`);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Total sessions count
  const totalSessions = await sessionsCol.countDocuments({});

  // 2. Active sessions: revoked is false (or not true) and expiresAt > now
  const activeSessions = await sessionsCol.countDocuments({
    revoked: { $ne: true },
    expiresAt: { $gt: now },
  });

  // 3. Revoked sessions: revoked: true
  const revokedSessions = await sessionsCol.countDocuments({
    revoked: true,
  });

  // 4. Expired sessions: expiresAt <= now
  const expiredSessions = await sessionsCol.countDocuments({
    expiresAt: { $lte: now },
  });

  // 5. Older than 30 days: createdAt < thirtyDaysAgo
  const olderThan30Days = await sessionsCol.countDocuments({
    createdAt: { $lt: thirtyDaysAgo },
  });

  // 6. How many students have more than one device session
  // Group by userId, count distinct deviceId or total sessions per student
  const multiDeviceStudents = await sessionsCol.aggregate([
    {
      $match: {
        role: "student",
      },
    },
    {
      $group: {
        _id: "$userId",
        deviceCount: { $addToSet: "$deviceId" },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        distinctDevices: { $size: "$deviceCount" },
        sessionCount: 1,
      },
    },
    {
      $group: {
        _id: null,
        studentsWithMultipleDevices: {
          $sum: {
            $cond: [{ $gt: ["$distinctDevices", 1] }, 1, 0],
          },
        },
        studentsWithMultipleSessions: {
          $sum: {
            $cond: [{ $gt: ["$sessionCount", 1] }, 1, 0],
          },
        },
        totalStudentsWithSessions: { $sum: 1 },
      },
    },
  ]).toArray();

  console.log("\n=== SESSION COUNTS (COUNTS ONLY) ===");
  console.log(`Total sessions: ${totalSessions}`);
  console.log(`Active sessions: ${activeSessions}`);
  console.log(`Revoked sessions: ${revokedSessions}`);
  console.log(`Expired sessions (by expiresAt): ${expiredSessions}`);
  console.log(`Older than 30 days: ${olderThan30Days}`);

  if (multiDeviceStudents.length > 0) {
    const stats = multiDeviceStudents[0];
    console.log(`Total students with at least 1 session: ${stats.totalStudentsWithSessions}`);
    console.log(`Students with multiple device sessions: ${stats.studentsWithMultipleDevices}`);
    console.log(`Students with multiple total sessions: ${stats.studentsWithMultipleSessions}`);
  } else {
    console.log("No student sessions found.");
  }

  // Also count total students in users collection
  const totalStudents = await db.collection("users").countDocuments({ role: "student" });
  console.log(`Total student accounts in DB: ${totalStudents}`);

  await mongoose.disconnect();
}

runDiagnosis()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Diagnosis error:", err.message);
    process.exit(1);
  });

