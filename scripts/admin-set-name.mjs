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
  console.error("❌ MONGODB_URI is not set.");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(uri, { bufferCommands: false });
    const db = mongoose.connection.db;
    const usersColl = db.collection("users");

    const admin = await usersColl.findOne({ role: "admin" });
    if (!admin) {
      console.error("❌ No admin user found with role 'admin' in database.");
      process.exit(1);
    }

    const previousName = admin.name;
    await usersColl.updateOne(
      { _id: admin._id },
      { $set: { name: "Ronak Dugar" } }
    );

    console.log(`\n========================================================`);
    console.log(`✅ Admin user name updated successfully:`);
    console.log(`   - Previous Name : "${previousName}"`);
    console.log(`   - New Name      : "Ronak Dugar"`);
    console.log(`   - Login ID      : ${admin.loginId}`);
    console.log(`   - Email         : ${admin.email || "—"}`);
    console.log(`   (Passwords and emails were NOT modified)`);
    console.log(`========================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to update admin name:", err);
    process.exit(1);
  }
}

run();
