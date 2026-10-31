import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoClient, ObjectId } from "mongodb";

// Load .env.local
for (const envFile of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || "").trim().replace(/^["']|["']$/g, "");
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    }
  }
}

const client = new MongoClient(process.env.MONGODB_URI);

async function inspectDb() {
  await client.connect();
  const db = client.db();

  // Find lectures with vimeoId
  const lecsWithVideo = await db.collection("lectures").find({
    vimeoId: { $exists: true, $nin: ["", null] }
  }).toArray();

  console.log(`Lectures with video: ${lecsWithVideo.length}`);
  for (const l of lecsWithVideo) {
    console.log({
      id: l._id.toString(),
      title: l.title,
      isFree: l.isFree,
      vimeoId: l.vimeoId,
      vimeoHash: l.vimeoHash,
      bookNo: l.bookNo,
      chapterNo: l.chapterNo,
      lectureNo: l.lectureNo
    });
  }

  // Free lectures
  const freeLecs = await db.collection("lectures").find({
    isFree: true
  }).toArray();
  console.log(`Free lectures: ${freeLecs.length}`);
  for (const l of freeLecs) {
    console.log({
      id: l._id.toString(),
      title: l.title,
      vimeoId: l.vimeoId,
      vimeoHash: l.vimeoHash
    });
  }

  const cols = await db.listCollections().toArray();
  console.log("Collections:", cols.map(c => c.name));

  // Check users collection
  const bcrypt = await import("bcryptjs");
  const u = await db.collection("users").findOne({ loginId: "RD-2026-001" });
  const candidates = [
    "Password@123",
    "RDClasses@2026",
    "Amandeep@123",
    "student",
    "student123",
    "123456",
    "amandeep",
    "rdclasses",
    "admin"
  ];
  for (const c of candidates) {
    const match = await bcrypt.default.compare(c, u.passwordHash);
    if (match) {
      console.log("MATCH FOUND for RD-2026-001:", c);
      break;
    }
  }

  await client.close();
}

inspectDb().catch(console.error);
