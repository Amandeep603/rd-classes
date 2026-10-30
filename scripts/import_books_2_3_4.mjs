import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";

// Load .env
for (const envFile of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || "").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[match[1]]) {
          process.env[match[1]] = val;
        }
      }
    }
  }
}

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let inQuotes = false;
    let curVal = "";
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(curVal.trim().replace(/^"|"$/g, ""));
        curVal = "";
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim().replace(/^"|"$/g, ""));

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

export async function runImport(client, isDryRun = false) {
  const db = client.db();

  // 1. Locate Course "Class 12 Accountancy"
  const course =
    (await db.collection("courses").findOne({ slug: "class-12-accountancy" })) ||
    (await db.collection("courses").findOne({ title: /Class 12.*Accountancy/i }));

  if (!course) {
    throw new Error("Course 'Class 12 Accountancy' not found!");
  }
  console.log(`[Target Course] "${course.title}" (_id: ${course._id})`);

  // 2. Pre-Import Safety Check on Book 1
  const b1LecturesBefore = await db.collection("lectures").find({ courseId: course._id, bookNo: 1 }).toArray();
  const b1VideosBefore = b1LecturesBefore.filter((l) => l.vimeoId && l.vimeoId.trim() !== "");
  const b1FreeBefore = b1LecturesBefore.filter((l) => l.isFree);

  console.log(`[Safety Check Book 1 Before] Lectures: ${b1LecturesBefore.length}, With Vimeo: ${b1VideosBefore.length}, Free: ${b1FreeBefore.length}`);
  if (b1LecturesBefore.length !== 67) {
    console.warn(`WARNING: Book 1 has ${b1LecturesBefore.length} lectures (expected 67).`);
  }

  // 3. Read and Parse CSV
  const csvPath = path.resolve(process.cwd(), "class12_accountancy_books2_3_4_lectures.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csvContent);
  console.log(`[CSV] Parsed ${rows.length} rows from ${path.basename(csvPath)}`);

  // Verify all rows are for Book 2, 3, or 4
  for (const r of rows) {
    const bNo = parseInt(r.book_no, 10);
    if (bNo === 1) {
      throw new Error(`CRITICAL: CSV row contains book_no = 1! Book 1 must NOT be touched.`);
    }
  }

  // 4. Ensure Books 2, 3, 4 exist
  const bookDefs = [
    { bookNo: 2, title: "Company Accounts — Shares and Debentures" },
    { bookNo: 3, title: "Analysis of Financial Statements" },
    { bookNo: 4, title: "Theory: Partnership, Shares and Debentures" },
  ];

  const bookMap = {}; // bookNo -> book._id
  for (const bDef of bookDefs) {
    const filter = { courseId: course._id, bookNo: bDef.bookNo };
    const doc = {
      courseId: course._id,
      bookNo: bDef.bookNo,
      title: bDef.title,
      position: bDef.bookNo,
      status: "published",
      updatedAt: new Date(),
    };
    await db.collection("books").updateOne(
      filter,
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    const savedBook = await db.collection("books").findOne(filter);
    bookMap[bDef.bookNo] = savedBook._id;
    console.log(`[Book ${bDef.bookNo}] "${savedBook.title}" (_id: ${savedBook._id})`);
  }

  // 5. Ensure Chapters exist
  const chapterMap = {}; // `${bookNo}_${chapterNo}` -> chapter._id
  // Collect unique chapters from rows
  const uniqueChapters = [];
  const seenCh = new Set();
  for (const r of rows) {
    const bNo = parseInt(r.book_no, 10);
    const chNo = parseInt(r.chapter_no, 10);
    const key = `${bNo}_${chNo}`;
    if (!seenCh.has(key)) {
      seenCh.add(key);
      uniqueChapters.push({
        bookNo: bNo,
        chapterNo: chNo,
        title: r.chapter_title.trim(),
      });
    }
  }

  for (const ch of uniqueChapters) {
    const bookId = bookMap[ch.bookNo];
    const filter = { courseId: course._id, bookId: bookId, chapterNo: ch.chapterNo };
    const doc = {
      courseId: course._id,
      bookId: bookId,
      chapterNo: ch.chapterNo,
      title: ch.title,
      position: ch.chapterNo,
      status: "published",
      updatedAt: new Date(),
    };
    await db.collection("chapters").updateOne(
      filter,
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    const savedCh = await db.collection("chapters").findOne(filter);
    chapterMap[`${ch.bookNo}_${ch.chapterNo}`] = savedCh._id;
    console.log(`[Chapter] Book ${ch.bookNo} Ch ${ch.chapterNo}: "${savedCh.title}" (_id: ${savedCh._id})`);
  }

  // 6. Upsert Lectures
  let upsertedCount = 0;
  let modifiedCount = 0;
  let matchedCount = 0;

  for (const row of rows) {
    const bookNo = parseInt(row.book_no, 10);
    const chapterNo = parseInt(row.chapter_no, 10);
    const lectureNo = parseInt(row.lecture_no, 10);
    const bookId = bookMap[bookNo];
    const chapterId = chapterMap[`${bookNo}_${chapterNo}`];

    if (!bookId || !chapterId) {
      throw new Error(`Missing bookId or chapterId for row Book ${bookNo} Ch ${chapterNo}`);
    }

    const rawDurSec = row.duration_seconds ? row.duration_seconds.trim() : "";
    const durationSeconds = rawDurSec ? parseInt(rawDurSec, 10) || 0 : 0;
    const duration_mmss = row.duration_mmss ? row.duration_mmss.trim() : "";
    const title = row.title.trim();
    const sourceKey = `c12_b${bookNo}_ch${chapterNo}_lec${lectureNo}`;
    const checkTitle = Boolean(row.check_title === "YES" || title.endsWith("..."));

    // Filter by (course, book_no, chapter_no, lecture_no)
    const filter = {
      courseId: course._id,
      bookNo: bookNo,
      chapterNo: chapterNo,
      lectureNo: lectureNo,
    };

    const lectureDoc = {
      courseId: course._id,
      bookId: bookId,
      bookNo: bookNo,
      bookTitle: row.book_title.trim(),
      chapterId: chapterId,
      chapterNo: chapterNo,
      chapterTitle: row.chapter_title.trim(),
      lectureNo: lectureNo,
      order: lectureNo,
      position: lectureNo,
      partNumber: lectureNo,
      title: title,
      duration_mmss: duration_mmss,
      durationSeconds: durationSeconds,
      durationSec: durationSeconds,
      vimeoId: "",
      vimeoHash: "",
      vimeoUrl: "",
      videoUrl: "",
      videoProvider: "vimeo",
      isFree: false,
      freePreview: false,
      isFreePreview: false,
      isPreview: false,
      checkTitle: checkTitle,
      status: "draft",
      published: false,
      sourceKey: sourceKey,
      book: "",
      chapter: "",
      description: "",
      section: "",
      updatedAt: new Date(),
    };

    const res = await db.collection("lectures").updateOne(
      filter,
      {
        $set: lectureDoc,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) upsertedCount++;
    else if (res.modifiedCount > 0) modifiedCount++;
    else if (res.matchedCount > 0) matchedCount++;
  }

  // 7. Update Course highlights / includes / metaText to reflect 136 total lectures
  const totalLecturesInCourse = await db.collection("lectures").countDocuments({
    courseId: course._id,
    status: { $ne: "archived" },
  });

  const updatedHighlights = Array.isArray(course.highlights)
    ? course.highlights.map((h) => {
        if (h.icon === "video" || /^\d+\s*hd\s*lectures$/i.test(h.text || "")) {
          return { ...h, text: `${totalLecturesInCourse} HD Lectures` };
        }
        return h;
      })
    : course.highlights;

  const updatedIncludes = Array.isArray(course.includes)
    ? course.includes.map((inc) => {
        if (inc.icon === "video" || /video\s*lectures/i.test(inc.text || "")) {
          return { ...inc, text: `${totalLecturesInCourse} HD Video Lectures` };
        }
        return inc;
      })
    : course.includes;

  await db.collection("courses").updateOne(
    { _id: course._id },
    {
      $set: {
        metaText: `${totalLecturesInCourse} HD Lectures`,
        highlights: updatedHighlights,
        includes: updatedIncludes,
        updatedAt: new Date(),
      },
    }
  );

  return {
    upsertedCount,
    modifiedCount,
    matchedCount,
    totalLecturesInCourse,
  };
}

async function verifyCounts(client) {
  const db = client.db();
  const course = await db.collection("courses").findOne({ slug: "class-12-accountancy" });

  console.log("\n=======================================================");
  console.log("               VERIFICATION REPORT                    ");
  console.log("=======================================================");

  // Book 1 invariant check
  const b1Lectures = await db.collection("lectures").find({ courseId: course._id, bookNo: 1 }).toArray();
  const b1Videos = b1Lectures.filter((l) => l.vimeoId && l.vimeoId.trim() !== "");
  const b1Free = b1Lectures.filter((l) => l.isFree);

  console.log(`Book 1 Invariant:`);
  console.log(`- Total lectures: ${b1Lectures.length} (expected 67)`);
  console.log(`- Lectures with Vimeo links: ${b1Videos.length} (expected 67)`);
  console.log(`- Free lecture: "${b1Free[0]?.title}" (ID: ${b1Free[0]?._id})`);

  // Chapters breakdown for Books 2, 3, 4
  const expectedPerBook = {
    2: { name: "Company Accounts — Shares and Debentures", expected: [23, 6, 5], totalExpected: 34 },
    3: { name: "Analysis of Financial Statements", expected: [6, 2, 9, 9], totalExpected: 26 },
    4: { name: "Theory: Partnership, Shares and Debentures", expected: [3, 6], totalExpected: 9 },
  };

  const results = {};

  for (const [bNoStr, info] of Object.entries(expectedPerBook)) {
    const bNo = parseInt(bNoStr, 10);
    const chLectures = await db
      .collection("lectures")
      .aggregate([
        { $match: { courseId: course._id, bookNo: bNo } },
        { $group: { _id: "$chapterNo", count: { $sum: 1 }, chTitle: { $first: "$chapterTitle" } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const actualCounts = chLectures.map((c) => c.count);
    const totalBookLectures = actualCounts.reduce((a, b) => a + b, 0);

    console.log(`\nBook ${bNo}: "${info.name}"`);
    for (const c of chLectures) {
      console.log(`  - Chapter ${c._id} ("${c.chTitle}"): ${c.count} lectures`);
    }
    console.log(`  => Total Book ${bNo}: ${totalBookLectures} (expected ${info.totalExpected})`);

    const matchesExpected =
      actualCounts.length === info.expected.length &&
      actualCounts.every((cnt, idx) => cnt === info.expected[idx]);

    results[`book${bNo}`] = {
      actual: actualCounts,
      expected: info.expected,
      totalActual: totalBookLectures,
      totalExpected: info.totalExpected,
      passed: matchesExpected && totalBookLectures === info.totalExpected,
    };
  }

  // Row with blank duration
  const blankDurLec = await db.collection("lectures").findOne({
    courseId: course._id,
    bookNo: 4,
    chapterNo: 2,
    lectureNo: 6,
  });
  console.log(`\nBlank Duration Row Check (Book 4, Ch 2, Lec 6):`);
  console.log(`- Title: "${blankDurLec?.title}"`);
  console.log(`- duration_mmss: "${blankDurLec?.duration_mmss}" (expected "")`);
  console.log(`- durationSeconds: ${blankDurLec?.durationSeconds} (expected 0)`);
  console.log(`- vimeoId: "${blankDurLec?.vimeoId}" (expected "")`);
  console.log(`- isFree: ${blankDurLec?.isFree} (expected false)`);

  // Total in course
  const totalInCourse = await db.collection("lectures").countDocuments({ courseId: course._id });
  console.log(`\nTotal Course Lectures: ${totalInCourse} (expected 136)`);

  const allPassed =
    b1Lectures.length === 67 &&
    b1Videos.length === 67 &&
    totalInCourse === 136 &&
    Object.values(results).every((r) => r.passed);

  return { allPassed, totalInCourse, results };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to MongoDB:", client.db().databaseName);

  try {
    console.log("\n>>> RUN 1: INITIAL IMPORT <<<");
    const run1 = await runImport(client);
    console.log(`Run 1 Results: Upserted=${run1.upsertedCount}, Modified=${run1.modifiedCount}, Matched=${run1.matchedCount}`);

    console.log("\n>>> VERIFYING COUNTS AFTER RUN 1 <<<");
    const verify1 = await verifyCounts(client);
    if (!verify1.allPassed) {
      throw new Error("Verification failed after Run 1!");
    }
    console.log("✓ Run 1 verification passed 100%!");

    console.log("\n>>> RUN 2: IDEMPOTENCY TEST (RUNNING SAME IMPORT AGAIN) <<<");
    const run2 = await runImport(client);
    console.log(`Run 2 Results: Upserted=${run2.upsertedCount}, Modified=${run2.modifiedCount}, Matched=${run2.matchedCount}`);

    console.log("\n>>> VERIFYING COUNTS AFTER RUN 2 <<<");
    const verify2 = await verifyCounts(client);
    if (!verify2.allPassed) {
      throw new Error("Verification failed after Run 2!");
    }

    if (run2.upsertedCount !== 0) {
      throw new Error(`Idempotency failed! Run 2 inserted ${run2.upsertedCount} new records instead of 0.`);
    }
    console.log("✓ Run 2 idempotency verified: 0 new records inserted, counts identical!");

    console.log("\n=======================================================");
    console.log("            ALL IMPORT AND IDEMPOTENCY TESTS PASSED!   ");
    console.log("=======================================================");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

