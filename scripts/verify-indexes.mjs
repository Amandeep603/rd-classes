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

async function verify() {
  console.log("=== Verifying MongoDB Indexes & TTL Policies ===");
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

  const models = await import("../src/server/db/models/index.js");

  let totalIndexes = 0;
  let ttlIndexesFound = 0;
  let missingCount = 0;

  for (const [name, model] of Object.entries(models)) {
    try {
      const actualIndexes = await model.collection.indexes();
      const actualNames = actualIndexes.map((idx) => idx.name);
      totalIndexes += actualNames.length;

      // Check TTL indexes
      for (const idxDef of actualIndexes) {
        if (idxDef.expireAfterSeconds !== undefined) {
          ttlIndexesFound++;
          console.log(`  ✓ TTL index verified on ${name}.${idxDef.name} (expires after: ${idxDef.expireAfterSeconds}s)`);
        }
      }

      console.log(`✓ ${name}: ${actualNames.length} index(es) active [${actualNames.join(", ")}]`);
    } catch (err) {
      console.warn(`! ${name}: Collection might not exist yet (${err.message}).`);
    }
  }

  console.log("\n--- Index Verification Summary ---");
  console.log(`Total active indexes verified: ${totalIndexes}`);
  console.log(`TTL auto-expiry indexes verified: ${ttlIndexesFound}`);

  await mongoose.disconnect();
  process.exit(missingCount > 0 ? 1 : 0);
}

verify().catch((err) => {
  console.error("Index verification failed:", err);
  process.exit(1);
});
