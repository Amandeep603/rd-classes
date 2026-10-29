import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env or .env.local
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
  console.error("MONGODB_URI is not set in environment or .env");
  process.exit(1);
}

const SIX_CORE_COURSES = [
  {
    title: "Class 12 Accountancy",
    subtitle: "Full Year Batch",
    slug: "class-12-accountancy",
    classLabel: "Class 12",
    badgeText: "Most Popular",
    description:
      "Comprehensive CBSE Class 12 coaching covering Partnership, Company Accounts, and Analysis of Financial Statements.",
    metaLeft: "Full Year Batch",
    metaRight: "136 HD Videos",
    rating: 4.9,
    ratingCount: 120,
    theme: "blue",
    tone: "sky",
    illustrationKey: "books",
    illustration: "books-blue",
    categories: ["Class 12 CBSE"],
    price: "₹14,999",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 1,
    sortOrder: 1,
    order: 1,
    about:
      "Comprehensive CBSE Class 12 Accountancy coaching covering Partnership, Company Accounts, and Analysis of Financial Statements with concept clarity, practice questions, and exam-focused strategies.",
    highlights: [
      { icon: "video", text: "136 HD Lectures" },
      { icon: "notes", text: "Chapter-wise Notes" },
      { icon: "practice", text: "Practice Questions" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
  {
    title: "Class 11 Accountancy",
    subtitle: "Foundation Batch",
    slug: "class-11-accountancy-foundation",
    classLabel: "Class 11",
    badgeText: "Foundation Course",
    description:
      "Master the foundational roots of Commerce: Journal entries, Ledger posting, Trial Balance, and Basic Financial Statements.",
    metaLeft: "Full Year Syllabus",
    metaRight: "90 HD Lectures",
    rating: 4.9,
    ratingCount: 85,
    theme: "yellow",
    tone: "yellow",
    illustrationKey: "open-book",
    illustration: "open-book",
    categories: ["Class 11 Foundation"],
    price: "₹11,999",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 2,
    sortOrder: 2,
    order: 2,
    about:
      "Master the foundational roots of Commerce: Journal entries, Ledger posting, Trial Balance, Depreciation, Bank Reconciliation, and Financial Statements.",
    highlights: [
      { icon: "video", text: "90 HD Lectures" },
      { icon: "notes", text: "Formula & Concept Sheets" },
      { icon: "practice", text: "Practice Worksheets" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
  {
    title: "Class 12 Board Revision",
    subtitle: "Crash Course",
    slug: "class-12-accountancy-crash-course",
    classLabel: "Class 12",
    badgeText: "Rapid Revision",
    description:
      "Rapid revision covering high-weightage adjustments, cash flow statements, and partnership revaluation for board exams.",
    metaLeft: "Crash Course",
    metaRight: "30+ Revision Hours",
    rating: 4.9,
    ratingCount: 140,
    theme: "orange",
    tone: "orange",
    illustrationKey: "revision-notepad",
    illustration: "revision-plan",
    categories: ["Class 12 CBSE", "Crash Courses"],
    price: "₹4,999",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 3,
    sortOrder: 3,
    order: 3,
    about:
      "Rapid 60-day revision series focused on high-scoring chapters, cash flow adjustments, share forfeiture, and revaluation drills.",
    highlights: [
      { icon: "clock", text: "30+ Revision Hours" },
      { icon: "notes", text: "Formula Cheat Sheets" },
      { icon: "tests", text: "3 Full Length Mock Papers" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
  {
    title: "Class 12 Recorded",
    subtitle: "Lecture Portal",
    slug: "class-12-accountancy-recorded-portal",
    classLabel: "Class 12",
    badgeText: "Self-Paced",
    description:
      "Learn anytime with 136 HD chapter-wise lectures, notes and practice questions, available on mobile and desktop.",
    metaLeft: "Recorded Portal",
    metaRight: "136 HD Lectures",
    rating: 4.9,
    ratingCount: 120,
    theme: "emerald",
    tone: "emerald",
    illustrationKey: "laptop",
    illustration: "laptop-play",
    categories: ["Class 12 CBSE", "Recorded Portal"],
    price: "₹7,999",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 4,
    sortOrder: 4,
    order: 4,
    about:
      "Complete on-demand video access to all Class 12 Accountancy chapters. Watch at your own pace with chapter-by-chapter progression tracking.",
    highlights: [
      { icon: "video", text: "136 HD Lectures" },
      { icon: "notes", text: "Downloadable Notes" },
      { icon: "device", text: "Mobile & Desktop Portal" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
  {
    title: "Class 12 Mock",
    subtitle: "Test Series",
    slug: "class-12-mock-test-series",
    classLabel: "Class 12",
    badgeText: "Test Series",
    description:
      "Weekly Sunday board-pattern tests with personal evaluation, feedback and doubt solving by the faculty.",
    metaLeft: "Sunday Mock Series",
    metaRight: "Weekly Evaluation",
    rating: 4.9,
    ratingCount: 95,
    theme: "violet",
    tone: "violet",
    illustrationKey: "test-paper",
    illustration: "checklist-clock",
    categories: ["Class 12 CBSE"],
    price: "₹2,999",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 5,
    sortOrder: 5,
    order: 5,
    about:
      "Rigorous board-pattern test series simulating actual exam pressure, time management, and presentation standards with detailed teacher feedback.",
    highlights: [
      { icon: "tests", text: "Weekly Sunday Tests" },
      { icon: "notes", text: "Detailed Answer Keys" },
      { icon: "check", text: "Personal Paper Evaluation" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
  {
    title: "Class 11 Quick Revision",
    subtitle: "Crash Course",
    slug: "class-11-accountancy-crash-course",
    classLabel: "Class 11",
    badgeText: "Exam Booster",
    description:
      "Last-minute concept polish: Financial Statements of Sole Proprietorship, Depreciation, and Rectification of Errors.",
    metaLeft: "Crash Course",
    metaRight: "20 Revision Hours",
    rating: 4.8,
    ratingCount: 70,
    theme: "rose",
    tone: "rose",
    illustrationKey: "textbook",
    illustration: "notebook-red",
    categories: ["Class 11 Foundation", "Crash Courses"],
    price: "₹3,499",
    status: "published",
    published: true,
    showOnHome: true,
    featured: true,
    homeOrder: 6,
    sortOrder: 6,
    order: 6,
    about:
      "Targeted Class 11 revision program focusing on the most scoring final exam units: Financial Statements with Adjustments, Trial Balance, and BRS.",
    highlights: [
      { icon: "clock", text: "20 Revision Hours" },
      { icon: "notes", text: "Summary Concept Sheets" },
      { icon: "practice", text: "High-Yield Practice Sets" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
  },
];

async function seedCourses() {
  console.log("=== RD Classes: Migrating 6 Core Courses ===");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
  console.log("✓ Connected to MongoDB Atlas");

  const { Course } = await import("../src/lib/models/Course.ts");

  let upsertedCount = 0;

  for (const item of SIX_CORE_COURSES) {
    const res = await Course.updateOne(
      { slug: item.slug },
      { $set: item },
      { upsert: true }
    );
    if (res.upsertedCount > 0) {
      console.log(`+ Upserted new course: "${item.title} / ${item.subtitle}" (${item.slug})`);
      upsertedCount++;
    } else {
      console.log(`• Updated existing course: "${item.title} / ${item.subtitle}" (${item.slug})`);
    }
  }

  // Ensure unique index on Course.slug
  try {
    await Course.collection.createIndex({ slug: 1 }, { unique: true });
    console.log("✓ Verified unique index on Course.slug");
  } catch (idxErr) {
    console.warn("Index warning:", idxErr.message);
  }

  console.log(`\n✓ Courses Migration Complete: ${upsertedCount} newly created, rest idempotently updated.`);
  console.log("All 6 courses configured with showOnHome=true, homeOrder=1..6, themes, and illustrations.");

  await mongoose.disconnect();
}

seedCourses().catch((err) => {
  console.error("seed:courses failed:", err);
  process.exit(1);
});
