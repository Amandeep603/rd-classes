import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

async function migrateCourses() {
  console.log("Connecting to MongoDB for courses migration...");
  await mongoose.connect(MONGODB_URI);

  const { Course } = await import("../src/server/db/models/Course.js");

  const courses = await Course.find();
  console.log(`Found ${courses.length} courses to check/migrate.`);

  let updatedCount = 0;
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    let changed = false;

    if (!c.category) {
      const t = (c.title || "").toLowerCase();
      if (t.includes("crash") && t.includes("11")) c.category = "crash";
      else if (t.includes("crash")) c.category = "crash";
      else if (t.includes("recorded")) c.category = "recorded";
      else if (t.includes("mock") || t.includes("test")) c.category = "test-series";
      else if (t.includes("11")) c.category = "class11";
      else c.category = "class12";
      changed = true;
    }

    if (!c.classLabel) {
      c.classLabel = c.category === "class11" || (c.title && c.title.includes("Class 11")) ? "Class 11" : "Class 12";
      changed = true;
    }

    if (c.subtitle === undefined || c.subtitle === null) {
      c.subtitle = "";
      changed = true;
    }

    if (!c.tone) {
      const categoryTones = {
        class12: "sky",
        class11: "yellow",
        crash: "orange",
        recorded: "green",
        "test-series": "purple",
      };
      c.tone = categoryTones[c.category] || "sky";
      changed = true;
    }

    if (!c.badgeVariant) {
      c.badgeVariant = c.tone === "sky" ? "crown-navy" : c.tone;
      changed = true;
    }

    if (!c.badgeText) {
      const defaultBadges = {
        class12: "Most Popular",
        class11: "Foundation Course",
        crash: "Crash Course",
        recorded: "Recorded Portal",
        "test-series": "Test Series",
      };
      c.badgeText = defaultBadges[c.category] || "Course";
      changed = true;
    }

    if (!c.illustration) {
      const defaultIllustrations = {
        class12: "books-blue",
        class11: "open-book",
        crash: "target",
        recorded: "laptop-play",
        "test-series": "checklist-clock",
      };
      c.illustration = defaultIllustrations[c.category] || "books-blue";
      changed = true;
    }

    if (!c.metaIcon) {
      c.metaIcon = c.category === "test-series" || c.category === "class11" ? "file" : c.category === "crash" ? "clock" : "video";
      changed = true;
    }

    if (!c.metaText) {
      c.metaText = c.metaIcon === "video" ? "Full Year + 136 Videos" : c.metaIcon === "clock" ? "30+ Revision Hours" : "Weekly Sunday Tests";
      changed = true;
    }

    if (!c.language) {
      c.language = "Bilingual";
      changed = true;
    }

    if (!c.facultyName) {
      c.facultyName = "Ronak Dugar";
      changed = true;
    }

    if (!c.facultyRole) {
      c.facultyRole = "Lead Accountancy Faculty";
      changed = true;
    }

    if (c.featured === undefined || c.featured === null) {
      c.featured = c.order <= 3;
      changed = true;
    }

    if (c.order === undefined || c.order === null) {
      c.order = i + 1;
      changed = true;
    }

    if (changed) {
      await c.save();
      updatedCount++;
    }
  }

  console.log(`Course migration complete. Migrated/updated ${updatedCount} documents.`);
  await mongoose.disconnect();
}

migrateCourses().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
