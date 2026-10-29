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

const isDryRun = process.argv.includes("--dry-run");

const CANONICAL_SPECS = [
  {
    targetSlug: "class-12-accountancy",
    allowedSlugs: ["class-12-accountancy", "class-12-accountancy-full-year-batch"],
    titles: ["Class 12 Accountancy", "Class 12 Accountancy Full Year Batch"],
  },
  {
    targetSlug: "class-11-accountancy-foundation",
    allowedSlugs: ["class-11-accountancy-foundation", "class-11-accountancy-foundation-batch"],
    titles: ["Class 11 Accountancy", "Class 11 Accountancy Foundation Batch"],
  },
  {
    targetSlug: "class-12-accountancy-crash-course",
    allowedSlugs: ["class-12-accountancy-crash-course", "class-12-board-revision-crash-course"],
    titles: ["Class 12 Board Revision", "Class 12 Board Revision Crash Course"],
  },
  {
    targetSlug: "class-12-accountancy-recorded-portal",
    allowedSlugs: ["class-12-accountancy-recorded-portal", "class-12-recorded-lecture-portal"],
    titles: ["Class 12 Recorded", "Class 12 Recorded Lecture Portal"],
  },
  {
    targetSlug: "class-12-mock-test-series",
    allowedSlugs: ["class-12-mock-test-series"],
    titles: ["Class 12 Mock", "Class 12 Mock Test Series"],
  },
  {
    targetSlug: "class-11-accountancy-crash-course",
    allowedSlugs: ["class-11-accountancy-crash-course", "class-11-quick-revision-crash-course"],
    titles: ["Class 11 Quick Revision", "Class 11 Quick Revision Crash Course"],
  },
];

async function cleanCourses() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  console.log(`\n================== COURSES CLEANUP ${isDryRun ? "[DRY RUN]" : "[LIVE EXECUTION]"} ==================\n`);

  const courses = await db.collection("courses").find({}).sort({ createdAt: 1 }).toArray();

  const plan = {
    canonicalKept: [],
    canonicalDuplicatesMerged: [],
    testCoursesDeleted: [],
  };

  // 1. Group courses matching canonical specs
  const matchedCanonicalIds = new Set();

  for (const spec of CANONICAL_SPECS) {
    const matchingCourses = courses.filter((c) => {
      const matchSlug = spec.allowedSlugs.includes(c.slug);
      const matchTitle = spec.titles.some(
        (t) => (c.title || "").toLowerCase().trim() === t.toLowerCase().trim()
      );
      return matchSlug || matchTitle;
    });

    if (matchingCourses.length > 0) {
      // Sort oldest first
      matchingCourses.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      const [primary, ...duplicates] = matchingCourses;

      matchedCanonicalIds.add(primary._id.toString());
      plan.canonicalKept.push({
        _id: primary._id.toString(),
        slug: primary.slug,
        title: primary.title,
      });

      for (const dup of duplicates) {
        matchedCanonicalIds.add(dup._id.toString());
        plan.canonicalDuplicatesMerged.push({
          duplicateId: dup._id.toString(),
          duplicateSlug: dup.slug,
          duplicateTitle: dup.title,
          targetPrimaryId: primary._id.toString(),
          targetPrimarySlug: primary.slug,
        });

        if (!isDryRun) {
          // Move enrollments, lectures, notes
          await db.collection("enrollments").updateMany(
            { courseId: dup._id },
            { $set: { courseId: primary._id } }
          );
          await db.collection("lectures").updateMany(
            { courseId: dup._id },
            { $set: { courseId: primary._id } }
          );
          await db.collection("notes").updateMany(
            { courseId: dup._id },
            { $set: { courseId: primary._id } }
          );
          await db.collection("notes").updateMany(
            { courseIds: dup._id },
            { $addToSet: { courseIds: primary._id } }
          );
          await db.collection("notes").updateMany(
            { courseIds: dup._id },
            { $pull: { courseIds: dup._id } }
          );
          // Delete duplicate
          await db.collection("courses").deleteOne({ _id: dup._id });
        }
      }
    }
  }

  // 2. Delete all other non-canonical / test courses
  const otherCourses = courses.filter((c) => !matchedCanonicalIds.has(c._id.toString()));

  for (const c of otherCourses) {
    const [enrollments, lectures, notes] = await Promise.all([
      db.collection("enrollments").countDocuments({ courseId: c._id }),
      db.collection("lectures").countDocuments({ courseId: c._id }),
      db.collection("notes").countDocuments({
        $or: [{ courseId: c._id }, { courseIds: c._id }],
      }),
    ]);

    plan.testCoursesDeleted.push({
      _id: c._id.toString(),
      slug: c.slug,
      title: c.title,
      enrollments,
      lectures,
      notes,
    });

    if (!isDryRun) {
      const courseLectures = await db.collection("lectures").find({ courseId: c._id }).toArray();
      const lectureIds = courseLectures.map((l) => l._id);

      await Promise.all([
        db.collection("enrollments").deleteMany({ courseId: c._id }),
        db.collection("lectures").deleteMany({ courseId: c._id }),
        db.collection("notes").deleteMany({
          $or: [{ courseId: c._id }, { courseIds: c._id }],
        }),
        lectureIds.length > 0
          ? db.collection("lectureprogresses").deleteMany({ lectureId: { $in: lectureIds } })
          : Promise.resolve(),
        lectureIds.length > 0
          ? db.collection("progresses").deleteMany({ lectureId: { $in: lectureIds } })
          : Promise.resolve(),
        db.collection("courses").deleteOne({ _id: c._id }),
      ]);
    }
  }

  // Summary Table
  console.log("1. CANONICAL 6 COURSES TO KEEP:");
  console.table(plan.canonicalKept);

  console.log("\n2. CANONICAL DUPLICATES TO MERGE & DELETE:");
  if (plan.canonicalDuplicatesMerged.length === 0) {
    console.log("  (None found)");
  } else {
    console.table(plan.canonicalDuplicatesMerged);
  }

  console.log("\n3. TEST / FAKE COURSES TO DELETE TOGETHER WITH CONTENT:");
  if (plan.testCoursesDeleted.length === 0) {
    console.log("  (None found)");
  } else {
    console.table(plan.testCoursesDeleted);
  }

  if (!isDryRun) {
    try {
      await db.collection("courses").createIndex({ slug: 1 }, { unique: true });
      console.log("\n✓ Successfully verified unique index on Course.slug");
    } catch (idxErr) {
      console.error("\nIndex creation warning:", idxErr.message);
    }
  }

  const remaining = await db.collection("courses").countDocuments();
  console.log(`\nRemaining courses in database: ${remaining}`);
  console.log(`\n=======================================================================\n`);
  await mongoose.disconnect();
}

cleanCourses().catch((err) => {
  console.error("Clean error:", err);
  process.exit(1);
});
