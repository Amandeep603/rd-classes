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

async function main() {
  await mongoose.connect(uri, { bufferCommands: false });
  const db = mongoose.connection.db;

  console.log("\n========================================================");
  console.log("       DATABASE AUDIT: RD CLASSES (READ-ONLY)           ");
  console.log("========================================================\n");

  const collections = await db.listCollections().toArray();
  const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));

  console.log("📊 Collection Document Counts:");
  console.log("--------------------------------------------------------");
  for (const col of sortedCollections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  • ${col.name.padEnd(25)} : ${count} documents`);
  }
  console.log("--------------------------------------------------------\n");

  const usersCol = db.collection("users");
  const students = await usersCol
    .find({ role: "student" }, { projection: { name: 1, email: 1, loginId: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  console.log(`👥 Students List (Total: ${students.length}):`);
  console.log("------------------------------------------------------------------------------------------------");
  console.log(
    `| ${"Name".padEnd(25)} | ${"Login ID".padEnd(14)} | ${"Email".padEnd(30)} | ${"Created At".padEnd(16)} |`
  );
  console.log("------------------------------------------------------------------------------------------------");

  if (students.length === 0) {
    console.log("| No students found in database.                                                               |");
  } else {
    for (const s of students) {
      const name = String(s.name || "—").slice(0, 25).padEnd(25);
      const loginId = String(s.loginId || "—").slice(0, 14).padEnd(14);
      const email = String(s.email || "—").slice(0, 30).padEnd(30);
      const createdAt = s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0].padEnd(16) : "—".padEnd(16);
      console.log(`| ${name} | ${loginId} | ${email} | ${createdAt} |`);
    }
  }
  console.log("------------------------------------------------------------------------------------------------\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
