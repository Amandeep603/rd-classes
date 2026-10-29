import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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
  console.error("❌ MONGODB_URI is not defined.");
  process.exit(1);
}

async function fixIndexes() {
  console.log("\n========================================================");
  console.log("       FIX DATABASE INDEXES & CLEAN SCHEMA ARTIFACTS    ");
  console.log("========================================================\n");

  await mongoose.connect(uri, { bufferCommands: false });
  const db = mongoose.connection.db;
  const usersColl = db.collection("users");

  // 1. Print existing indexes
  const beforeIndexes = await usersColl.indexes();
  console.log("Existing indexes on 'users' collection:");
  console.log(JSON.stringify(beforeIndexes.map((i) => ({ name: i.name, key: i.key, unique: i.unique })), null, 2));

  // 2. Unset empty strings in email and phone, and remove studentCode field
  console.log("\nCleaning legacy fields in 'users'...");
  const unsetRes = await usersColl.updateMany(
    {},
    {
      $unset: {
        studentCode: "",
      },
    }
  );
  console.log(`Unset 'studentCode' on ${unsetRes.modifiedCount} documents.`);

  const unsetEmptyEmailRes = await usersColl.updateMany(
    { email: "" },
    { $unset: { email: "" } }
  );
  console.log(`Unset empty string email on ${unsetEmptyEmailRes.modifiedCount} documents.`);

  const unsetEmptyPhoneRes = await usersColl.updateMany(
    { phone: "" },
    { $unset: { phone: "" } }
  );
  console.log(`Unset empty string phone on ${unsetEmptyPhoneRes.modifiedCount} documents.`);

  // Find any duplicate emails among existing records and deduplicate them
  const duplicateEmailGroups = await usersColl
    .aggregate([
      { $match: { email: { $exists: true, $type: "string", $gt: "" } } },
      { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  for (const group of duplicateEmailGroups) {
    const [keepId, ...dupIds] = group.ids;
    console.log(`Found duplicate email '${group._id}' across ${group.count} records. Keeping ${keepId}, unsetting on others.`);
    await usersColl.updateMany(
      { _id: { $in: dupIds } },
      { $unset: { email: "" } }
    );
  }

  // 3. Drop unwanted indexes
  for (const idx of beforeIndexes) {
    if (idx.name === "_id_") continue;
    if (idx.name === "studentCode_1" || idx.key?.studentCode) {
      console.log(`Dropping leftover index: ${idx.name}...`);
      await usersColl.dropIndex(idx.name);
    } else if (idx.name === "demo_1" || idx.name === "email_1") {
      console.log(`Dropping legacy index: ${idx.name}...`);
      await usersColl.dropIndex(idx.name);
    }
  }

  // 4. Sync indexes with User model
  // Register User model schema
  const userSchema = new mongoose.Schema(
    {
      role: {
        type: String,
        enum: ["admin", "student"],
        default: "student",
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        default: undefined,
      },
      phone: {
        type: String,
        trim: true,
        default: undefined,
      },
      photoUrl: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
      className: { type: String, default: "12", trim: true },
      loginId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      passwordHash: { type: String, required: true },
      status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active",
        required: true,
        index: true,
      },
      maxDevices: { type: Number, default: 1, min: 1 },
      deviceLimit: { type: Number, default: 1, min: 1 },
      deviceCount: { type: Number, default: 0, min: 0 },
      lastLoginAt: { type: Date, default: null },
      passwordEnc: {
        iv: { type: String, default: null },
        tag: { type: String, default: null },
        ciphertext: { type: String, default: null },
        keyVersion: { type: Number, default: 1 },
      },
    },
    { timestamps: true }
  );

  userSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: "string", $gt: "" } } }
  );
  userSchema.index({ role: 1, status: 1 });

  const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
  console.log("\nCalling User.syncIndexes()...");
  await UserModel.syncIndexes();
  console.log("✓ User.syncIndexes() completed.");

  // 5. Print final indexes
  const finalIndexes = await usersColl.indexes();
  console.log("\nFinal indexes on 'users' collection:");
  console.log(JSON.stringify(finalIndexes, null, 2));

  await mongoose.disconnect();
  console.log("\n✅ Database indexes successfully fixed.\n");
}

fixIndexes().catch((err) => {
  console.error("❌ Error fixing indexes:", err);
  process.exit(1);
});
