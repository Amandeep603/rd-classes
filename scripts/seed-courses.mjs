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

if (process.env.NODE_ENV === "production" && !process.argv.includes("--yes-production")) {
  console.error("ERROR: In production, seed:courses requires the --yes-production flag.");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

const REAL_COURSES = [
  {
    title: "Class 12 Accountancy",
    subtitle: "(Full Year)",
    slug: "class-12-accountancy",
    category: "class12",
    classLabel: "Class 12",
    badgeText: "Most Popular",
    badgeVariant: "crown-navy",
    tone: "sky",
    illustration: "books-blue",
    description:
      "Comprehensive CBSE Class 12 coaching covering Partnership, Company Accounts, and Analysis of Financial Statements.",
    metaIcon: "video",
    metaText: "Full Year + 136 Videos",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: true,
    order: 1,
  },
  {
    title: "Class 11 Accountancy",
    subtitle: "Foundation",
    slug: "class-11-accountancy-foundation",
    category: "class11",
    classLabel: "Class 11",
    badgeText: "Foundation Course",
    badgeVariant: "yellow",
    tone: "yellow",
    illustration: "open-book",
    description:
      "Master the foundational roots of Commerce: Journal entries, Ledger posting, Trial Balance, and Basic Financial Statements.",
    metaIcon: "file",
    metaText: "Full Year Syllabus",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: true,
    order: 2,
  },
  {
    title: "Class 12 Accountancy",
    subtitle: "Crash Course",
    slug: "class-12-accountancy-crash-course",
    category: "crash",
    classLabel: "Class 12",
    badgeText: "Crash Course",
    badgeVariant: "orange",
    tone: "orange",
    illustration: "target",
    description:
      "Rapid full-syllabus revision, time management training, expected board questions, and master problem-solving sessions.",
    metaIcon: "clock",
    metaText: "30+ Revision Hours",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: true,
    order: 3,
  },
  {
    title: "Class 12 Accountancy",
    subtitle: "Recorded Portal",
    slug: "class-12-accountancy-recorded-portal",
    category: "recorded",
    classLabel: "Class 12",
    badgeText: "Recorded Portal",
    badgeVariant: "green",
    tone: "green",
    illustration: "laptop-play",
    description:
      "Learn anytime with 136 HD chapter-wise lectures, notes and practice questions, available on mobile and desktop.",
    metaIcon: "video",
    metaText: "136 HD Lectures",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: false,
    order: 4,
  },
  {
    title: "Class 12 Mock Test Series",
    subtitle: "",
    slug: "class-12-mock-test-series",
    category: "test-series",
    classLabel: "Class 12",
    badgeText: "Test Series",
    badgeVariant: "purple",
    tone: "purple",
    illustration: "checklist-clock",
    description:
      "Weekly Sunday board-pattern tests with personal evaluation, feedback and doubt solving by the faculty.",
    metaIcon: "file",
    metaText: "Weekly Sunday Tests",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: false,
    order: 5,
  },
  {
    title: "Class 11 Accountancy",
    subtitle: "Crash Course",
    slug: "class-11-accountancy-crash-course",
    category: "crash",
    classLabel: "Class 11",
    badgeText: "Crash Course",
    badgeVariant: "red",
    tone: "red",
    illustration: "notebook-red",
    description:
      "Fast revision of Journal, Ledger, Subsidiary Books, BRS, Depreciation and Trial Balance before exams.",
    metaIcon: "clock",
    metaText: "20+ Revision Hours",
    language: "Bilingual",
    facultyName: "Ronak Dugar",
    facultyRole: "Lead Accountancy Faculty",
    published: true,
    featured: false,
    order: 6,
  },
];

async function seedCourses() {
  console.log("Connecting to MongoDB to seed real offerings...");
  await mongoose.connect(MONGODB_URI);

  const { Course } = await import("../src/server/db/models/Course.js");

  for (const item of REAL_COURSES) {
    const existing = await Course.findOne({ slug: item.slug });
    if (existing) {
      console.log(`Updating existing course: ${item.slug}`);
      Object.assign(existing, item);
      await existing.save();
    } else {
      console.log(`Creating course: ${item.slug}`);
      await Course.create(item);
    }
  }

  console.log("All 6 courses seeded successfully (idempotent by slug).");
  await mongoose.disconnect();
}

seedCourses().catch((err) => {
  console.error("seed:courses failed:", err);
  process.exit(1);
});
