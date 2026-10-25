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

const STANDARD_FACULTY_BULLETS = [
  "10+ years of teaching experience",
  "Specialized in Class 11 & 12 Accountancy",
  "Concept-based and exam-oriented approach",
  "Trusted by thousands of students",
];

const STANDARD_INCLUDES = [
  { icon: "video", text: "136 HD Video Lectures" },
  { icon: "notes", text: "Chapter-wise Notes (PDF)" },
  { icon: "practice", text: "Practice Questions with Solutions" },
  { icon: "tests", text: "Board-style Mock Tests" },
  { icon: "papers", text: "Previous Year Question Papers" },
  { icon: "globe", text: "Bilingual (Hindi + English)" },
  { icon: "infinity", text: "Lifetime Access" },
];

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
      "Comprehensive CBSE Class 12 coaching covering Partnership, Company Accounts, and Analysis of Financial Statements with concept clarity, practice questions, and exam-focused strategies.",
    about:
      "Comprehensive CBSE Class 12 Accountancy coaching covering Partnership, Company Accounts, and Analysis of Financial Statements with concept clarity, practice questions, and exam-focused strategies. Students receive step-by-step guidance, ledger drills, and board examination preparation directly from Ronak Sir.",
    highlights: [
      { icon: "video", text: "136 HD Lectures" },
      { icon: "notes", text: "Chapter-wise Notes" },
      { icon: "practice", text: "Practice Questions" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "Who is this course suitable for?",
        a: "Designed for CBSE Class 12 Commerce students targeting 95+ in Accountancy.",
      },
      {
        q: "Can I watch lectures offline or on mobile?",
        a: "Yes, you can access all high-definition lectures on mobile or desktop anytime.",
      },
      {
        q: "Are tests evaluated personally by Ronak Sir?",
        a: "Yes, weekly Sunday mock tests include handwritten evaluation and personalized doubt clearance.",
      },
      {
        q: "What is the validity of the course?",
        a: "Access remains active through your board examination cycle with regular updates.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-subjects",
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
    about:
      "Master the foundational roots of Commerce: Journal entries, Ledger posting, Trial Balance, Depreciation, Bank Reconciliation, and Financial Statements.",
    highlights: [
      { icon: "video", text: "90 HD Lectures" },
      { icon: "notes", text: "Formula & Concept Sheets" },
      { icon: "practice", text: "Practice Worksheets" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "Is this suitable for beginners in Commerce?",
        a: "Yes, this course starts from absolute basics of accounting terms, rules of debit/credit, and journal entries.",
      },
      {
        q: "Are study notes provided with every chapter?",
        a: "Yes, comprehensive printable PDF chapter notes with solved examples are included.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-light",
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
    about:
      "Rapid full-syllabus revision covering Partnership, Company Accounts, and Financial Analysis before exams with time-tested shortcut techniques and expected board questions.",
    highlights: [
      { icon: "clock", text: "30+ Revision Hours" },
      { icon: "practice", text: "Expected Board Questions" },
      { icon: "tests", text: "5 Full Mock Papers" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "When should I take this crash course?",
        a: "Ideal for the last 60 days before your pre-boards or final board exams for rapid revision.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-subjects",
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
    about:
      "Complete on-demand video access to all Class 12 Accountancy chapters. Watch at your own pace with chapter-by-chapter progression tracking.",
    highlights: [
      { icon: "video", text: "136 HD Lectures" },
      { icon: "notes", text: "Downloadable Notes" },
      { icon: "device", text: "Mobile & Desktop Portal" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "Can I watch recorded lectures at 1.5x speed?",
        a: "Yes, our high-performance player supports variable playback speeds and chapter seeking.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-light",
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
    about:
      "Rigorous board-pattern test series simulating actual exam pressure, time management, and presentation standards with detailed teacher feedback.",
    highlights: [
      { icon: "tests", text: "Weekly Sunday Tests" },
      { icon: "notes", text: "Detailed Answer Keys" },
      { icon: "check", text: "Personal Paper Evaluation" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "How are papers evaluated?",
        a: "Each mock test paper is marked step-by-step according to CBSE marking scheme with teacher remarks.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-subjects",
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
    about:
      "Fast revision of Class 11 accounting concepts, designed to secure top marks in school annual examinations.",
    highlights: [
      { icon: "clock", text: "20+ Revision Hours" },
      { icon: "notes", text: "Short Notes & Formulas" },
      { icon: "practice", text: "Important Exam Questions" },
      { icon: "globe", text: "Bilingual (Hindi + English)" },
    ],
    includes: STANDARD_INCLUDES,
    faqs: [
      {
        q: "Does this cover Financial Statements with adjustments?",
        a: "Yes, complete coverage of Trading, P&L, and Balance Sheet with typical 10-mark examination adjustments.",
      },
    ],
    facultyBullets: STANDARD_FACULTY_BULLETS,
    facultyProfileUrl: "#faculty",
    heroIllustration: "books-light",
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

const SEED_LECTURES_PLAN = [
  {
    section: "Partnership Fundamentals",
    lectures: [
      { title: "Introduction to Partnership", durationSec: 1455, isPreview: true, vimeoId: "76979871" },
      { title: "Partnership Deed: Features and Contents", durationSec: 1120, isPreview: false, vimeoId: "76979872" },
      { title: "Profit & Loss Appropriation Account", durationSec: 1930, isPreview: false, vimeoId: "76979873" },
      { title: "Past Adjustments", durationSec: 1685, isPreview: false, vimeoId: "76979874" },
      { title: "Goodwill: Nature and Valuation", durationSec: 1590, isPreview: false, vimeoId: "76979875" },
      { title: "Change in Profit Sharing Ratio", durationSec: 1880, isPreview: false, vimeoId: "76979876" },
    ],
  },
  {
    section: "Change in Profit Sharing Ratio",
    lectures: [
      { title: "Sacrificing Ratio and Gaining Ratio", durationSec: 1350, isPreview: false, vimeoId: "76979877" },
      { title: "Accounting Treatment of Reserves and Accumulated Profits", durationSec: 1620, isPreview: false, vimeoId: "76979878" },
      { title: "Revaluation of Assets and Reassessment of Liabilities", durationSec: 1740, isPreview: false, vimeoId: "76979879" },
    ],
  },
  {
    section: "Admission of a Partner",
    lectures: [
      { title: "New Profit Sharing Ratio Calculations", durationSec: 1510, isPreview: false, vimeoId: "76979880" },
      { title: "Hidden Goodwill & Capital Adjustments", durationSec: 1980, isPreview: false, vimeoId: "76979881" },
    ],
  },
  {
    section: "Retirement and Death of a Partner",
    lectures: [
      { title: "Ascertainment of Amount Due to Retiring Partner", durationSec: 1650, isPreview: false, vimeoId: "76979882" },
      { title: "Settlement of Loan Account", durationSec: 1410, isPreview: false, vimeoId: "76979883" },
    ],
  },
  {
    section: "Dissolution of Partnership Firm",
    lectures: [
      { title: "Realisation Account and Settlement of Accounts", durationSec: 1820, isPreview: false, vimeoId: "76979884" },
      { title: "Journal Entries on Dissolution", durationSec: 1530, isPreview: false, vimeoId: "76979885" },
    ],
  },
  {
    section: "Company Accounts",
    lectures: [
      { title: "Issue of Shares at Par, Premium and Pro-rata", durationSec: 2240, isPreview: false, vimeoId: "76979886" },
      { title: "Forfeiture and Re-issue of Shares", durationSec: 2110, isPreview: false, vimeoId: "76979887" },
      { title: "Issue of Debentures with Terms of Redemption", durationSec: 1950, isPreview: false, vimeoId: "76979888" },
    ],
  },
  {
    section: "Analysis of Financial Statements",
    lectures: [
      { title: "Comparative and Common Size Statements", durationSec: 1490, isPreview: false, vimeoId: "76979889" },
      { title: "Accounting Ratios: Liquidity and Solvency", durationSec: 1840, isPreview: false, vimeoId: "76979890" },
      { title: "Cash Flow Statement (Indirect Method)", durationSec: 2420, isPreview: false, vimeoId: "76979891" },
    ],
  },
];

async function seedCourses() {
  console.log("Connecting to MongoDB to seed real offerings...");
  await mongoose.connect(MONGODB_URI);

  const { Course } = await import("../src/server/db/models/Course.js");
  const { Lecture } = await import("../src/server/db/models/Lecture.js");

  let class12CourseId = null;

  for (const item of REAL_COURSES) {
    let course = await Course.findOne({ slug: item.slug });
    if (course) {
      console.log(`Updating existing course: ${item.slug}`);
      Object.assign(course, item);
      await course.save();
    } else {
      console.log(`Creating course: ${item.slug}`);
      course = await Course.create(item);
    }
    if (item.slug === "class-12-accountancy") {
      class12CourseId = course._id;
    }
  }

  // Seed sample lectures for class-12-accountancy if not present
  if (class12CourseId) {
    const existingCount = await Lecture.countDocuments({ courseId: class12CourseId });
    if (existingCount === 0) {
      console.log("Seeding reference curriculum sections and lectures for Class 12 Accountancy...");
      let lectureOrder = 1;
      for (const sec of SEED_LECTURES_PLAN) {
        for (const lec of sec.lectures) {
          await Lecture.create({
            courseId: class12CourseId,
            section: sec.section,
            title: lec.title,
            durationSec: lec.durationSec,
            vimeoId: lec.vimeoId,
            published: true,
            isPreview: !!lec.isPreview,
            order: lectureOrder++,
          });
        }
      }
      console.log(`Seeded ${lectureOrder - 1} lectures across ${SEED_LECTURES_PLAN.length} sections.`);
    }
  }

  console.log("All 6 courses seeded successfully with rich detail data.");
  await mongoose.disconnect();
}

seedCourses().catch((err) => {
  console.error("seed:courses failed:", err);
  process.exit(1);
});
