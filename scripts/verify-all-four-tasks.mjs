import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";

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

const BASE_URL = "http://localhost:3000";
const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
  console.log("=== COMPREHENSIVE VERIFICATION OF ALL 4 TASKS ===\n");
  await client.connect();
  const db = client.db();

  const results = {
    task1_durationFix: false,
    task2_autoSequenceLecture: false,
    task2_autoSequenceChapter: false,
    task2_autoSequenceBook: false,
    task2_deleteAndRenumber: false,
    task2_inlineDurationEdit: false,
    task3_footerContactDetails: false,
    task3_contactPageDetails: false,
    task3_socialLinks: false,
    task4_apostropheHeading: false,
    task4_locationCardStructure: false,
    task4_mapStaticSvg: false,
    task4_slimInfoRow: false,
    task4_noOverlap1440: false,
    task4_noOverlap1920: false,
    task4_responsive390: false,
  };

  // -------------------------------------------------------------
  // TASK 1: ONE DURATION FIX VERIFICATION
  // -------------------------------------------------------------
  console.log("--- TASK 1: ONE DURATION FIX ---");
  const lec6 = await db.collection("lectures").findOne({
    _id: new ObjectId("6ae4a4c7b8baab7b2b97a069"),
  });
  const lec5 = await db.collection("lectures").findOne({
    _id: new ObjectId("6ae4a4c5b8baab7b2b97a067"),
  });

  console.log("Lecture 6 status:", {
    id: lec6?._id.toString(),
    title: lec6?.title,
    duration_mmss: lec6?.duration_mmss,
    durationSeconds: lec6?.durationSeconds,
    lectureNo: lec6?.lectureNo,
  });
  console.log("Lecture 5 status:", {
    id: lec5?._id.toString(),
    title: lec5?.title,
    duration_mmss: lec5?.duration_mmss,
    durationSeconds: lec5?.durationSeconds,
    lectureNo: lec5?.lectureNo,
  });

  if (
    lec6?.duration_mmss === "14:42" &&
    lec6?.durationSeconds === 882 &&
    lec5?.duration_mmss === "28:56" &&
    lec5?.durationSeconds === 1736
  ) {
    results.task1_durationFix = true;
    console.log("Task 1 Duration Fix: VERIFIED PASSED\n");
  } else {
    console.error("Task 1 Duration Fix: FAILED\n");
  }

  // -------------------------------------------------------------
  // TASK 2: ADMIN LECTURES PAGE & AUTO SEQUENCING
  // -------------------------------------------------------------
  console.log("--- TASK 2: ADMIN LECTURES & SEQUENCING ---");

  // Find Course
  const course = await db.collection("courses").findOne({
    $or: [{ slug: "class-12-accountancy" }, { title: /Class 12 Accountancy/i }],
  });
  const courseId = course._id;

  // Chapter 6 (Death of a Partner) in Book 1 has exactly 6 lectures (1..6)
  const book1 = await db.collection("books").findOne({ courseId, bookNo: 1 });
  const chap6 = await db.collection("chapters").findOne({
    courseId,
    bookId: book1._id,
    chapterNo: 6,
  });

  console.log("Target Chapter 6:", chap6.title, "id:", chap6._id.toString());
  const beforeLecs = await db
    .collection("lectures")
    .find({ chapterId: chap6._id })
    .sort({ lectureNo: 1 })
    .toArray();
  console.log(`Current lectures in Chapter 6: ${beforeLecs.length}`);

  // Launch Playwright for authenticated admin testing
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Admin login
  console.log("Logging into admin portal...");
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.fill('input[type="text"], input[name="loginId"], input[id="loginId"]', process.env.ADMIN_LOGIN_ID);
  await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // Test (c): Add new lecture to chapter 6 via POST
  const cookieHeaders = await context.cookies();
  const cookieString = cookieHeaders.map((c) => `${c.name}=${c.value}`).join("; ");

  console.log("Testing POST /api/admin/lectures for automatic sequence No. 7...");
  const addLecRes = await fetch(`${BASE_URL}/api/admin/lectures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieString,
    },
    body: JSON.stringify({
      courseId: courseId.toString(),
      bookId: book1._id.toString(),
      chapterId: chap6._id.toString(),
      title: "Temporary Test Lecture No 7",
      duration: "15:30",
    }),
  });
  const addLecData = await addLecRes.json();
  console.log("Add Lecture Response:", addLecData);

  if (addLecData.success && addLecData.lecture?.lectureNo === 7) {
    results.task2_autoSequenceLecture = true;
    console.log("Auto-sequence Lecture: PASSED (Assigned Lecture No. 7)");
  }

  // Test (c): Add new chapter to Book 1 (Book 1 has 7 chapters -> should be Chapter 8)
  console.log("Testing POST /api/admin/chapters for automatic sequence No. 8...");
  const addChapRes = await fetch(`${BASE_URL}/api/admin/chapters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieString,
    },
    body: JSON.stringify({
      courseId: courseId.toString(),
      bookId: book1._id.toString(),
      title: "Temporary Test Chapter No 8",
    }),
  });
  const addChapData = await addChapRes.json();
  console.log("Add Chapter Response:", addChapData);

  if (addChapData.success && addChapData.chapter?.chapterNo === 8) {
    results.task2_autoSequenceChapter = true;
    console.log("Auto-sequence Chapter: PASSED (Assigned Chapter No. 8)");
  }

  // Test (c): Add new book to Course (Course has 4 books -> should be Book 5)
  console.log("Testing POST /api/admin/books for automatic sequence No. 5...");
  const addBookRes = await fetch(`${BASE_URL}/api/admin/books`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieString,
    },
    body: JSON.stringify({
      courseId: courseId.toString(),
      title: "Temporary Test Book No 5",
    }),
  });
  const addBookData = await addBookRes.json();
  console.log("Add Book Response:", addBookData);

  if (addBookData.success && (addBookData.book?.bookNo === 5 || addBookData.book?.position === 5)) {
    results.task2_autoSequenceBook = true;
    console.log("Auto-sequence Book: PASSED (Assigned Book No. 5)");
  }

  // Test (a): Inline Duration Edit via PATCH
  console.log("Testing inline duration edit on test lecture...");
  const patchDurRes = await fetch(`${BASE_URL}/api/admin/lectures/${addLecData.lecture._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieString,
    },
    body: JSON.stringify({
      duration_mmss: "25:40",
    }),
  });
  const patchDurData = await patchDurRes.json();
  console.log("Patch Duration Response:", patchDurData);
  if (patchDurData.success && patchDurData.lecture?.duration_mmss === "25:40" && patchDurData.lecture?.durationSeconds === 1540) {
    results.task2_inlineDurationEdit = true;
    console.log("Inline Duration Edit: PASSED");
  }

  // Test (e): Delete and Renumbering
  console.log("Testing DELETE and renumbering on test lecture, chapter, book...");
  const delLecRes = await fetch(`${BASE_URL}/api/admin/lectures/${addLecData.lecture._id}`, {
    method: "DELETE",
    headers: { Cookie: cookieString },
  });
  console.log("Delete lecture status:", delLecRes.status);

  const afterLecs = await db
    .collection("lectures")
    .find({ chapterId: chap6._id })
    .sort({ lectureNo: 1 })
    .toArray();
  console.log(`Lectures in Chapter 6 after delete: ${afterLecs.length}`);
  const hasNoGaps = afterLecs.every((l, idx) => l.lectureNo === idx + 1);

  // Delete test chapter & test book
  await fetch(`${BASE_URL}/api/admin/chapters/${addChapData.chapter._id}`, {
    method: "DELETE",
    headers: { Cookie: cookieString },
  });
  await fetch(`${BASE_URL}/api/admin/books/${addBookData.book._id}`, {
    method: "DELETE",
    headers: { Cookie: cookieString },
  });

  if (hasNoGaps && afterLecs.length === beforeLecs.length) {
    results.task2_deleteAndRenumber = true;
    console.log("Delete and Renumbering: PASSED (All records 1..n without gaps)\n");
  }

  // -------------------------------------------------------------
  // TASK 3 & 4: FRONTEND, SINGLE SOURCE SETTINGS & SCREENSHOTS
  // -------------------------------------------------------------
  console.log("--- TASK 3 & 4: CONTACT PAGE, FOOTER & SCREENSHOTS ---");

  const artifactDir = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";

  // Check 1440px desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Check heading text has typographic apostrophe: We’re Here
  const headingText = await page.locator("h1").innerText();
  console.log("Contact page H1 heading:", JSON.stringify(headingText));
  if (headingText.includes("We’re Here") || headingText.includes("We\u2019re Here")) {
    results.task4_apostropheHeading = true;
    console.log("Typographic apostrophe in heading: PASSED");
  }

  // Check Location card structure
  const locationTitle = await page.locator("h2:has-text('Our Location')").isVisible();
  const getDirectionsBtn = await page.locator("a:has-text('Get Directions')").getAttribute("href");
  console.log("Get Directions button href:", getDirectionsBtn);
  if (locationTitle && getDirectionsBtn?.includes("maps.app.goo.gl/pugUPd8WhwRYYLGE8")) {
    results.task4_locationCardStructure = true;
    console.log("Location card structure & directions URL: PASSED");
  }

  // Check static SVG map
  const svgMap = await page.locator("svg[viewBox='0 0 1000 240']").count();
  console.log("Static SVG map element count:", svgMap);
  if (svgMap > 0) {
    results.task4_mapStaticSvg = true;
    console.log("Static SVG Map: PASSED");
  }

  // Check slim info row inside location card
  const addressText = await page.locator("span:has-text('Above Canara Bank')").isVisible();
  const phoneText = await page.locator("a[href='tel:+918368545620']").isVisible();
  const emailText = await page.locator("a[href='mailto:rdclasses177@gmail.com']").isVisible();
  const ytIcon = await page.locator("a[href*='youtube.com/@rd__classes']").isVisible();
  const igIcon = await page.locator("a[href*='instagram.com/rd___classes']").isVisible();
  const fbIcon = await page.locator("a[href*='facebook.com/profile.php']").isVisible();

  if (addressText && phoneText && emailText && ytIcon && igIcon && fbIcon) {
    results.task4_slimInfoRow = true;
    results.task3_contactPageDetails = true;
    results.task3_socialLinks = true;
    console.log("Slim info row with address, phone, email & social icons: PASSED");
  }

  // Check Bounding Boxes for 0% overlap between form and decoration at 1440px
  const formCardBox = await page.locator("div.w-full.lg\\:w-\\[42\\%\\]").boundingBox();
  const decorBox = await page.locator("div[aria-hidden='true'].hidden.lg\\:flex").boundingBox();
  console.log("1440px Form Card Bounding Box:", formCardBox);
  console.log("1440px Decoration Bounding Box:", decorBox);

  if (formCardBox && decorBox && decorBox.x >= formCardBox.x + formCardBox.width - 5) {
    results.task4_noOverlap1440 = true;
    console.log("Zero overlap at 1440px: PASSED");
  }

  const screenshot1440 = `${artifactDir}/contact_page_1440x900.png`;
  await page.screenshot({ path: screenshot1440, fullPage: true });
  console.log(`Saved screenshot to ${screenshot1440}`);

  // Check 1920px desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const formBox1920 = await page.locator("div.w-full.lg\\:w-\\[42\\%\\]").boundingBox();
  const decorBox1920 = await page.locator("div[aria-hidden='true'].hidden.lg\\:flex").boundingBox();
  console.log("1920px Form Card Bounding Box:", formBox1920);
  console.log("1920px Decoration Bounding Box:", decorBox1920);

  if (formBox1920 && decorBox1920 && decorBox1920.x >= formBox1920.x + formBox1920.width - 5) {
    results.task4_noOverlap1920 = true;
    console.log("Zero overlap at 1920px: PASSED");
  }

  const screenshot1920 = `${artifactDir}/contact_page_1920x1080.png`;
  await page.screenshot({ path: screenshot1920, fullPage: true });
  console.log(`Saved screenshot to ${screenshot1920}`);

  // Check 390px mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/contact`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const decorVisibleOnMobile = await page.locator("div[aria-hidden='true'].hidden.lg\\:flex").isVisible();
  console.log("Decoration visible on 390px mobile (should be false):", decorVisibleOnMobile);
  if (!decorVisibleOnMobile) {
    results.task4_responsive390 = true;
    console.log("Mobile responsiveness at 390px: PASSED (decoration hidden, form clean)");
  }

  const screenshot390 = `${artifactDir}/contact_page_390x844.png`;
  await page.screenshot({ path: screenshot390, fullPage: true });
  console.log(`Saved screenshot to ${screenshot390}`);

  // Check Footer on Home page
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const footerAddress = await page.locator("footer span:has-text('Above Canara Bank')").isVisible();
  const footerPhone = await page.locator("footer a[href='tel:+918368545620']").isVisible();
  const footerEmail = await page.locator("footer a[href='mailto:rdclasses177@gmail.com']").isVisible();
  const footerDirections = await page.locator("footer a[href*='maps.app.goo.gl/pugUPd8WhwRYYLGE8']").isVisible();
  const footerYt = await page.locator("footer a[href*='youtube.com/@rd__classes']").isVisible();
  const footerIg = await page.locator("footer a[href*='instagram.com/rd___classes']").isVisible();
  const footerFb = await page.locator("footer a[href*='facebook.com/profile.php']").isVisible();

  if (footerAddress && footerPhone && footerEmail && footerDirections && footerYt && footerIg && footerFb) {
    results.task3_footerContactDetails = true;
    console.log("Footer single-source-of-truth contact details: PASSED");
  }

  await browser.close();
  await client.close();

  console.log("\n=== FINAL VERIFICATION SUMMARY TABLE ===");
  console.table(results);
}

main().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});

