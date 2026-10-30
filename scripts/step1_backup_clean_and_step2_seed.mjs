import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

// Load environment variables
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

const client = new MongoClient(uri);

const CSV_DATA = `course,book_no,book_title,chapter_no,chapter_title,lecture_no,title,duration_mmss,duration_seconds,vimeo_url,is_free,check_title
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,1,Introduction to Class 12th,21:04,1264,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,2,"Basics of Partnership, P&L Appropriation",23:48,1428,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,3,"Partner's Capital, Comprehensive Questions",32:24,1944,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,4,"Journal Entries, Fixed & Fluctuating Capitals",28:40,1720,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,5,"Comprehensive Question, Treatment of Charge Against Profits",25:53,1553,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,6,Interest on Drawings,29:03,1743,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,7,Past Adjustments Basics,20:08,1208,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,8,Past Adjustments Comprehensive Questions,33:46,2026,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,9,Guarantee to a Partner,20:00,1200,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,10,"Comprehensive Question of Guarantee, Net Loss in Case of Guarantee",24:37,1477,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,11,"Questions of Charge Against Profits, Net loss in the firm",14:14,854,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,12,"When Appropriation are more than Profits, Interest on Capital Cases",15:05,905,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,13,Additional Questions of Past Adjustments,21:40,1300,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,14,Additional Questions of Guarantee to a Partner,13:04,784,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,1,Fundamentals of a Partnership Firm,15,Journal entries for Partner Loan cases,11:18,678,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,2,Valuation of Goodwill,1,"Meaning, Types, Factors affecting, Average Profit Method, Weighted Average Prof...",18:38,1118,,FALSE,YES
Class 12 Accountancy,1,Accounting for Partnership Firms,2,Valuation of Goodwill,2,"Super Profit Method, Capitalization Method",19:24,1164,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,2,Valuation of Goodwill,3,Adjustments in Valuation of Goodwill,28:29,1709,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,2,Valuation of Goodwill,4,Practice Questions with Adjustments,14:51,891,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,2,Valuation of Goodwill,5,Additional Questions,13:26,806,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,1,"Basics, Cases of New Ratio",29:06,1746,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,2,"Sacrificing Ratio, Cases of Premium for Goodwill",18:18,1098,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,3,"Cases for Premium for Goodwill, Practice Questions",21:23,1283,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,4,"Revaluation A/c, W.C.R. Cases",23:17,1397,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,5,I.F.R. Cases,10:24,624,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,6,"Treatment of Accumulated Profits, Accumulated Losses. Provision for Doubtful De...",26:39,1599,,FALSE,YES
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,7,"Treatment of Purchased Goodwill, Extraordinary points of Revaluation A/c",18:18,1098,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,8,Comprehensive Question,24:44,1484,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,9,Comprehensive Question,26:27,1587,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,10,Hidden Goodwill,10:54,654,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,11,Comprehensive Question of Hidden Goodwill,17:52,1072,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,12,Proportionate Capital,23:36,1416,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,13,Capital Adjustment,24:23,1463,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,14,Additional Extraordinary Questions,11:23,683,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,15,Additional Comprehensive Question,23:49,1429,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,3,Admission of a Partner,16,Capital Adjustment with Current account,19:58,1198,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,4,Change in Profit Sharing Ratio,1,"Basics, Gainer to Sacrificer Entry & Cases",18:42,1122,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,4,Change in Profit Sharing Ratio,2,Practical Question of Journal entry,20:20,1220,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,4,Change in Profit Sharing Ratio,3,Comprehensive Question,22:25,1345,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,4,Change in Profit Sharing Ratio,4,Comprehensive Question where partners do not want to alter/show new values in B...,13:48,828,,FALSE,YES
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,1,"New Ratio, Gaining Ratio",16:18,978,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,2,Entry for Self Generated Goodwill.,22:22,1342,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,3,Comprehensive Question,20:27,1227,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,4,Comprehensive Question,20:45,1245,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,5,Capital Adjustment,11:59,719,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,6,Partner's Loan A/c Cases,29:47,1787,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,7,Extraordinary Comprehensive Question,17:09,1029,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,8,Extraordinary Comprehensive Question,16:21,981,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,9,Capital Adjustment with Minimum Maintainable Balance,25:09,1509,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,5,Retirement of a Partner,10,Practical Question of Loan A/c,15:57,957,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,6,Death of a Partner,1,"Basics, Methods of Computing Profits of Deceased Partner, Journal Entry for the...",32:55,1975,,FALSE,YES
Class 12 Accountancy,1,Accounting for Partnership Firms,6,Death of a Partner,2,"Practice Questions, Comprehensive Question",23:53,1433,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,6,Death of a Partner,3,Additional Comprehensive Question,25:24,1524,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,6,Death of a Partner,4,Extraordinary Comprehensive Question,13:36,816,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,1,Basics of Realisation A/c with a Question,30:55,1855,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,2,"Partner's Capital, Bank A/c, WCR & IFR Cases",19:54,1194,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,3,Comprehensive Questions,27:12,1632,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,4,Realisation Expenses Cases,24:07,1447,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,5,"Realisation expenses cases, Practical Question",23:21,1401,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,6,Partner's Loan Cases,17:02,1022,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,7,Comprehensive Question with Realisation Expenses & Partner Loan cases. Topic of...,23:49,1429,,FALSE,YES
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,8,Questions of Journal Entries,28:56,1736,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,9,2 Full Fledged Comprehensive Questions,28:44,1724,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,10,Comprehensive Question of Realisation A/c,14:51,891,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,11,Comprehensive Question of Realisation A/c,14:03,843,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,12,"Memorandum Balance Sheet, Journal Entries Questions",24:51,1491,,FALSE,
Class 12 Accountancy,1,Accounting for Partnership Firms,7,Dissolution of a Partnership Firm,13,Comprehensive Full Fledged Question with negative capital balance,20:04,1204,,FALSE,`;

function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Regex for CSV with quoted fields
    const values = [];
    let inQuotes = false;
    let curVal = "";
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' && (c === 0 || line[c-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = "";
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim().replace(/^"|"$/g, ''));

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

async function main() {
  await client.connect();
  const db = client.db();
  console.log("Connected to MongoDB:", db.databaseName);

  // ==========================================
  // STEP 1: EXPORT AND CLEAN OLD LECTURES
  // ==========================================
  console.log("\n--- STEP 1: EXPORT AND CLEAN OLD LECTURES ---");
  const oldLectures = await db.collection("lectures").find({}).toArray();
  const oldLectureProgress = await db.collection("lectureprogresses").find({}).toArray();
  const oldProgress = await db.collection("progresses").find({}).toArray();
  const oldBooks = await db.collection("books").find({}).toArray();
  const oldChapters = await db.collection("chapters").find({}).toArray();

  const backupData = {
    exportedAt: new Date().toISOString(),
    counts: {
      lectures: oldLectures.length,
      lectureProgresses: oldLectureProgress.length,
      progresses: oldProgress.length,
      books: oldBooks.length,
      chapters: oldChapters.length,
    },
    lectures: oldLectures,
    lectureProgresses: oldLectureProgress,
    progresses: oldProgress,
    books: oldBooks,
    chapters: oldChapters,
  };

  const backupFilename = "backup-lectures-20261030.json";
  fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`✓ Backed up to ${backupFilename} (${(fs.statSync(backupFilename).size / 1024).toFixed(1)} KB)`);

  // Delete all lectures, lecture progress, books, chapters
  const delLectures = await db.collection("lectures").deleteMany({});
  const delLecProg = await db.collection("lectureprogresses").deleteMany({});
  const delBooks = await db.collection("books").deleteMany({});
  const delChapters = await db.collection("chapters").deleteMany({});
  // Clean lecture progress in progresses collection if any
  const delProgress = await db.collection("progresses").deleteMany({ lectureId: { $exists: true } });

  console.log("Deleted Counts:");
  console.log(`- lectures deleted: ${delLectures.deletedCount}`);
  console.log(`- lectureprogresses deleted: ${delLecProg.deletedCount}`);
  console.log(`- progresses (lecture records) deleted: ${delProgress.deletedCount}`);
  console.log(`- books deleted: ${delBooks.deletedCount}`);
  console.log(`- chapters deleted: ${delChapters.deletedCount}`);
  console.log("Kept untouched: courses, users/students, notes, tests, settings.");

  // ==========================================
  // STEP 2: SEED BOOK 1 FROM THE CSV
  // ==========================================
  console.log("\n--- STEP 2: SEED BOOK 1 FROM THE CSV ---");
  // Find Class 12 Accountancy course
  let course = await db.collection("courses").findOne({ slug: "class-12-accountancy" }) ||
               await db.collection("courses").findOne({ title: /Class 12.*Accountancy/i });

  if (!course) {
    console.log("Course not found, creating 'Class 12 Accountancy'...");
    const ins = await db.collection("courses").insertOne({
      title: "Class 12 Accountancy",
      slug: "class-12-accountancy",
      description: "Structured Accountancy Course for CBSE Class 12 Board Exam Preparation.",
      classLevel: 12,
      isPublished: true,
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    course = await db.collection("courses").findOne({ _id: ins.insertedId });
  }
  console.log(`Target Course: "${course.title}" (ID: ${course._id})`);

  // Parse CSV
  const csvRows = parseCsv(CSV_DATA);
  console.log(`Parsed ${csvRows.length} lecture rows from CSV.`);

  // 1. Create Book 1: "Accounting for Partnership Firms"
  const bookDoc = {
    courseId: course._id,
    bookNo: 1,
    title: "Accounting for Partnership Firms",
    position: 1,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let book = await db.collection("books").findOne({
    courseId: course._id,
    bookNo: 1,
  });
  if (!book) {
    const bIns = await db.collection("books").insertOne(bookDoc);
    book = await db.collection("books").findOne({ _id: bIns.insertedId });
    console.log(`✓ Created Book 1: "${book.title}" (ID: ${book._id})`);
  } else {
    console.log(`✓ Existing Book 1 found: "${book.title}" (ID: ${book._id})`);
  }

  // 2. Create the 7 Chapters
  const chapterDefinitions = [
    { no: 1, title: "Fundamentals of a Partnership Firm" },
    { no: 2, title: "Valuation of Goodwill" },
    { no: 3, title: "Admission of a Partner" },
    { no: 4, title: "Change in Profit Sharing Ratio" },
    { no: 5, title: "Retirement of a Partner" },
    { no: 6, title: "Death of a Partner" },
    { no: 7, title: "Dissolution of a Partnership Firm" },
  ];

  const chapterIdMap = {};
  for (const chDef of chapterDefinitions) {
    let ch = await db.collection("chapters").findOne({
      courseId: course._id,
      bookId: book._id,
      chapterNo: chDef.no,
    });
    if (!ch) {
      const cIns = await db.collection("chapters").insertOne({
        courseId: course._id,
        bookId: book._id,
        chapterNo: chDef.no,
        title: chDef.title,
        position: chDef.no,
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      ch = await db.collection("chapters").findOne({ _id: cIns.insertedId });
      console.log(`✓ Created Chapter ${chDef.no}: "${ch.title}" (ID: ${ch._id})`);
    }
    chapterIdMap[chDef.no] = ch._id;
  }

  // 3. Insert 67 lectures
  let insertedCount = 0;
  let updatedCount = 0;

  for (const row of csvRows) {
    const bookNo = parseInt(row.book_no, 10) || 1;
    const chapterNo = parseInt(row.chapter_no, 10);
    const lectureNo = parseInt(row.lecture_no, 10);
    const chapterId = chapterIdMap[chapterNo];
    const durationSeconds = parseInt(row.duration_seconds, 10) || 0;
    const title = row.title.trim();
    const sourceKey = `c12_b${bookNo}_ch${chapterNo}_lec${lectureNo}`;

    // Access rule from instructions:
    // "No video links yet. All lectures locked (is_free = false) EXCEPT Chapter 1, Class 1 'Introduction to Class 12th', which is seeded as is_free = true."
    const isFree = (chapterNo === 1 && lectureNo === 1);
    const checkTitle = Boolean(row.check_title === "YES" || title.endsWith("..."));

    const lectureDoc = {
      courseId: course._id,
      bookId: book._id,
      bookNo: bookNo,
      bookTitle: row.book_title || "Accounting for Partnership Firms",
      chapterId: chapterId,
      chapterNo: chapterNo,
      chapterTitle: row.chapter_title,
      lectureNo: lectureNo,
      order: lectureNo,
      position: lectureNo,
      title: title,
      duration_mmss: row.duration_mmss,
      durationSeconds: durationSeconds,
      durationSec: durationSeconds,
      vimeoId: "",
      vimeoHash: "",
      vimeoUrl: "",
      videoProvider: "vimeo",
      isFree: isFree,
      checkTitle: checkTitle,
      status: "draft", // no video link yet -> draft
      sourceKey: sourceKey,
      updatedAt: new Date(),
    };

    const res = await db.collection("lectures").updateOne(
      { courseId: course._id, sourceKey: sourceKey },
      {
        $set: lectureDoc,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) insertedCount++;
    else if (res.modifiedCount > 0) updatedCount++;
  }

  console.log(`\nSeeding summary: Inserted: ${insertedCount}, Updated: ${updatedCount}`);

  // Verification of seeded counts
  const totalInDb = await db.collection("lectures").countDocuments({ courseId: course._id });
  console.log(`Total lectures in DB for course: ${totalInDb} (expected 67)`);

  const freeLectures = await db.collection("lectures").find({ courseId: course._id, isFree: true }).toArray();
  console.log(`Free lectures count: ${freeLectures.length} (expected 1: "${freeLectures[0]?.title}")`);

  const breakdown = await db.collection("lectures").aggregate([
    { $match: { courseId: course._id } },
    { $group: { _id: { chNo: "$chapterNo", chTitle: "$chapterTitle" }, count: { $sum: 1 }, totalDurSec: { $sum: "$durationSeconds" } } },
    { $sort: { "_id.chNo": 1 } }
  ]).toArray();

  console.log("\nChapter Breakdown:");
  for (const b of breakdown) {
    const mins = Math.floor(b.totalDurSec / 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    console.log(`- Chapter ${b._id.chNo}: "${b._id.chTitle}" -> ${b.count} lectures (${h}h ${m}m)`);
  }

  console.log("\n✅ STEP 1 & STEP 2 COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
}).finally(() => client.close());

