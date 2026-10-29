import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, "utf-8").split("\n");
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment or .env/.env.local");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  console.log(`\n=================== LECTURES RESET SCRIPT ===================`);
  console.log(`Mode: ${isDryRun ? "DRY RUN (No data will be deleted)" : "LIVE EXECUTION (Data will be deleted)"}`);
  console.log(`Target Collections ONLY: lectures, lectureprogresses, progresses, books, chapters`);
  console.log(`SAFEGUARD: courses, users, notes, settings will NEVER be modified.\n`);

  // Helper to safely count collection
  async function safeCount(collName) {
    try {
      const colls = await db.listCollections({ name: collName }).toArray();
      if (colls.length === 0) return 0;
      return await db.collection(collName).countDocuments({});
    } catch {
      return 0;
    }
  }

  // Count target collections
  const counts = {
    lectures: await safeCount("lectures"),
    lectureprogresses: await safeCount("lectureprogresses"),
    progresses: await safeCount("progresses"),
    books: await safeCount("books"),
    chapters: await safeCount("chapters"),
  };

  // Verify protected collections
  const protectedCounts = {
    courses: await safeCount("courses"),
    users: await safeCount("users"),
    notes: await safeCount("notes"),
    settings: await safeCount("settings"),
  };

  console.log("Documents found in TARGET collections to be reset:");
  console.table(counts);

  console.log("\nProtected collections (WILL NOT BE TOUCHED):");
  console.table(protectedCounts);

  if (isDryRun) {
    console.log("\n[DRY RUN COMPLETE] Zero documents were deleted.");
    console.log("To perform the real reset, run: npm run lectures:reset\n");
    await mongoose.disconnect();
    return;
  }

  // Live delete execution
  console.log("\nExecuting deletion on target collections...");

  const results = {};
  for (const collName of ["lectures", "lectureprogresses", "progresses", "books", "chapters"]) {
    try {
      const colls = await db.listCollections({ name: collName }).toArray();
      if (colls.length > 0) {
        const delRes = await db.collection(collName).deleteMany({});
        results[collName] = delRes.deletedCount;
      } else {
        results[collName] = 0;
      }
    } catch (err) {
      console.error(`Error deleting from ${collName}:`, err.message);
      results[collName] = "error";
    }
  }

  console.log("\nDeletion Results:");
  console.table(results);

  // Verify post-deletion counts
  const postCounts = {
    lectures: await safeCount("lectures"),
    lectureprogresses: await safeCount("lectureprogresses"),
    progresses: await safeCount("progresses"),
    books: await safeCount("books"),
    chapters: await safeCount("chapters"),
  };

  console.log("\nPost-reset target counts (should all be 0):");
  console.table(postCounts);

  // Re-verify protected collections are intact
  const postProtectedCounts = {
    courses: await safeCount("courses"),
    users: await safeCount("users"),
    notes: await safeCount("notes"),
    settings: await safeCount("settings"),
  };

  console.log("\nProtected collections verification (intact):");
  console.table(postProtectedCounts);

  console.log("\n=================== RESET COMPLETED SUCCESSFULLY ===================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Reset script error:", err);
  process.exit(1);
});

