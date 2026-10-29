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
  console.error("MONGODB_URI is not set");
  process.exit(1);
}

async function auditCourses() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const courses = await db.collection("courses").find({}).sort({ createdAt: 1 }).toArray();

  console.log(`\n================== COURSES AUDIT (${courses.length} courses found) ==================\n`);

  const results = [];

  for (const c of courses) {
    const [enrollments, lectures, notes] = await Promise.all([
      db.collection("enrollments").countDocuments({ courseId: c._id }),
      db.collection("lectures").countDocuments({ courseId: c._id }),
      db.collection("notes").countDocuments({
        $or: [{ courseId: c._id }, { courseIds: c._id }],
      }),
    ]);

    results.push({
      _id: c._id.toString(),
      slug: c.slug || "(no slug)",
      title: c.title || "(no title)",
      status: c.status || (c.published ? "published" : "draft"),
      showOnHome: !!c.showOnHome,
      enrollments,
      lectures,
      notes,
    });
  }

  console.table(results);
  console.log(`Total courses: ${results.length}`);
  console.log(`\n=======================================================================\n`);

  await mongoose.disconnect();
}

auditCourses().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
