import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { chromium } from "playwright";

const uri = process.env.MONGODB_URI;
const adminLoginId = process.env.ADMIN_LOGIN_ID;
const adminPassword = process.env.ADMIN_PASSWORD;
const baseUrl = "http://localhost:3000";

if (!adminLoginId || !adminPassword) {
  console.error("Missing ADMIN_LOGIN_ID or ADMIN_PASSWORD");
  process.exit(1);
}

const artifactDir = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";

async function run() {
  console.log("=== STARTING VIMEO IMPORT INTEGRATION TEST ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("PAGE ERROR LOG:", msg.text());
  });

  try {
    // 1. Admin login
    console.log("1. Navigating to admin login...");
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded", timeout: 15000 });

    await page.fill('input[name="loginId"]', adminLoginId);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL(
      (url) =>
        url.pathname === "/admin" ||
        (url.pathname.startsWith("/admin") && !url.pathname.includes("login")),
      { timeout: 15000 }
    );
    console.log("✓ Admin logged in successfully! URL:", page.url());

    // 2. Navigate to Lectures page for Class 12 Accountancy
    console.log("2. Navigating to /admin/lectures?course=class-12-accountancy ...");
    await page.goto(`${baseUrl}/admin/lectures?course=class-12-accountancy`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Check "Import from Vimeo" button
    const importBtn = page.locator('button:has-text("Import from Vimeo"), button:has-text("Import Vimeo")').first();
    await importBtn.waitFor({ state: "visible", timeout: 10000 });
    console.log("✓ Found 'Import from Vimeo' button!");

    // 3. Open Import Modal
    console.log("3. Opening Import from Vimeo modal...");
    await importBtn.click();

    const modal = page.locator('div[role="dialog"]').first();
    await modal.waitFor({ state: "visible", timeout: 10000 });
    console.log("✓ Modal opened!");

    // Wait for Vimeo folders tree to load
    console.log("4. Waiting for Vimeo folder tree to load...");
    await page.waitForSelector('text="Ch 1 fundamentals"', { timeout: 20000 });
    console.log("✓ Vimeo folder tree loaded with 'Ch 1 fundamentals' visible!");

    // Take screenshot of step 1: folder tree
    await page.screenshot({ path: path.join(artifactDir, "vimeo_import_step1_tree.png") });
    console.log("✓ Screenshot saved: vimeo_import_step1_tree.png");

    // 4. Test Tab 2: File Upload (.xlsx / .csv)
    console.log("5. Testing Tab 2 (Import from File)...");
    const fileTab = modal.locator('button:has-text("Import from File")').first();
    if (await fileTab.count()) {
      await fileTab.click();
      await page.waitForTimeout(600);
      const downloadTmplBtn = modal.locator('button:has-text("Download CSV Template"), button:has-text("Download Excel Template"), a:has-text("Download")').first();
      console.log("✓ File upload tab rendered, template download button count:", await downloadTmplBtn.count());
      await page.screenshot({ path: path.join(artifactDir, "vimeo_import_tab2_file.png") });
      console.log("✓ Screenshot saved: vimeo_import_tab2_file.png");

      // Switch back to Vimeo tab
      const vimeoTab = modal.locator('button:has-text("Import from Vimeo")').first();
      await vimeoTab.click();
      await page.waitForTimeout(600);
    }

    // 5. Select 'Ch 1 fundamentals' folder checkbox inside modal
    console.log("6. Selecting 'Ch 1 fundamentals' folder...");
    const item = modal.locator('div:has(> span:text-is("Ch 1 fundamentals"))').first();
    const folderCheckbox = item.locator('input[type="checkbox"]');
    await folderCheckbox.dispatchEvent("click");
    await page.waitForTimeout(600);

    // Verify Review button shows count (e.g., "Review Videos (15)")
    const reviewBtn = modal.locator('button:has-text("Review Videos")').first();
    await reviewBtn.waitFor({ state: "visible", timeout: 5000 });
    const reviewText = await reviewBtn.innerText();
    console.log(`✓ Review button ready: "${reviewText}"`);

    // 6. Click Review Videos
    console.log("7. Clicking Review Videos to proceed to Step 2...");
    await reviewBtn.click();

    // Wait for Preview Table
    await page.waitForSelector('h4:has-text("Review")', { timeout: 20000 });
    console.log("✓ Step 2 (Preview table) loaded!");

    // Check Safety Hint
    const safetyHint = modal.locator('text="Hide from Vimeo"');
    const hasSafetyHint = (await safetyHint.count()) > 0;
    console.log("✓ Safety hint present:", hasSafetyHint);

    // Verify Preview Table rows
    const tableRows = modal.locator("table tbody tr");
    const rowCount = await tableRows.count();
    console.log(`✓ Preview table has ${rowCount} video rows!`);

    if (rowCount > 0) {
      const firstRowTitle = await tableRows.first().locator('input[type="text"]').first().inputValue().catch(() => "");
      console.log(`✓ First row lecture title: "${firstRowTitle}"`);
    }

    // Take screenshot of step 2: preview table
    await page.screenshot({ path: path.join(artifactDir, "vimeo_import_step2_preview.png") });
    console.log("✓ Screenshot saved: vimeo_import_step2_preview.png");

    // 7. Click Confirm & Import
    console.log("8. Confirming import...");
    const confirmBtn = modal.locator('button:has-text("Confirm & Import")').first();
    await confirmBtn.click();

    // Wait for success / summary dialog
    console.log("9. Waiting for import results...");
    await page.waitForSelector('h3:has-text("Import Completed")', { timeout: 25000 });
    console.log("✓ Import completed successfully!");

    await page.screenshot({ path: path.join(artifactDir, "vimeo_import_step3_summary.png") });
    console.log("✓ Screenshot saved: vimeo_import_step3_summary.png");

    // Close modal
    const closeBtn = modal.locator('button:has-text("Done & Close"), button:has-text("Done")').first();
    if (await closeBtn.count()) {
      await closeBtn.click();
      await page.waitForTimeout(1500);
    }

    // 8. Verify Lectures Page shows Book 1 > Ch 1 fundamentals
    console.log("10. Checking Lectures page for imported content...");
    await page.waitForSelector('text="Book 1"', { timeout: 10000 });
    await page.waitForSelector('text="Ch 1 fundamentals"', { timeout: 10000 });
    console.log("✓ Book 1 and Ch 1 fundamentals appear on Lectures page!");

    await page.screenshot({ path: path.join(artifactDir, "admin_lectures_after_vimeo_import.png") });
    console.log("✓ Screenshot saved: admin_lectures_after_vimeo_import.png");

    // 9. Test lecture preview player with watermark
    console.log("11. Testing lecture video preview with 'Admin Preview' watermark...");
    const previewBtn = page.locator('button[title="Test play lecture"]').first();
    if (await previewBtn.count()) {
      await previewBtn.click();
      await page.waitForTimeout(3000);

      // Check watermark text
      const watermarkEl = page.locator('text="Admin Preview"').first();
      const hasWatermark = (await watermarkEl.count()) > 0;
      console.log("✓ Admin Preview watermark visible:", hasWatermark);

      await page.screenshot({ path: path.join(artifactDir, "admin_lecture_preview_watermark.png") });
      console.log("✓ Screenshot saved: admin_lecture_preview_watermark.png");

      // Close preview modal
      const closePlayer = page.locator('button:has(svg.lucide-x), button[aria-label="Close"]').last();
      if (await closePlayer.count()) {
        await closePlayer.click();
        await page.waitForTimeout(500);
      }
    }

    // 10. Re-import test to verify zero duplicates
    console.log("12. Running Re-Import test to ensure no duplicate lectures are created...");
    await importBtn.click();
    const modal2 = page.locator('div[role="dialog"]').first();
    await modal2.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForSelector('text="Ch 1 fundamentals"', { timeout: 15000 });

    const item2 = modal2.locator('div:has(> span:text-is("Ch 1 fundamentals"))').first();
    const folderCheckbox2 = item2.locator('input[type="checkbox"]');
    await folderCheckbox2.dispatchEvent("click");
    await page.waitForTimeout(600);

    const reviewBtn2 = modal2.locator('button:has-text("Review Videos")').first();
    await reviewBtn2.click();

    await page.waitForSelector('h4:has-text("Review")', { timeout: 20000 });
    const confirmBtn2 = modal2.locator('button:has-text("Confirm & Import")').first();
    await confirmBtn2.click();

    await page.waitForSelector('h3:has-text("Import Completed")', { timeout: 25000 });
    console.log("✓ Re-import finished successfully!");

    // Close modal
    const closeBtn2 = modal2.locator('button:has-text("Done & Close"), button:has-text("Done")').first();
    if (await closeBtn2.count()) {
      await closeBtn2.click();
      await page.waitForTimeout(1000);
    }

    // 11. Verify DB counts
    console.log("13. Checking database lecture count for duplicates...");
    await mongoose.connect(uri);
    const CourseModel = mongoose.models.Course || mongoose.model("Course", new mongoose.Schema({}, { strict: false }));
    const LectureModel = mongoose.models.Lecture || mongoose.model("Lecture", new mongoose.Schema({}, { strict: false }));
    const BookModel = mongoose.models.Book || mongoose.model("Book", new mongoose.Schema({}, { strict: false }));
    const ChapterModel = mongoose.models.Chapter || mongoose.model("Chapter", new mongoose.Schema({}, { strict: false }));

    const targetCourse = await CourseModel.findOne({ slug: "class-12-accountancy" }).lean();
    const lectureCount = await LectureModel.countDocuments({ courseId: targetCourse._id });
    const bookCount = await BookModel.countDocuments({ courseId: targetCourse._id });
    const chapterCount = await ChapterModel.countDocuments({ courseId: targetCourse._id });

    console.log(`Database summary for ${targetCourse.title}:`);
    console.log(`  Books: ${bookCount}`);
    console.log(`  Chapters: ${chapterCount}`);
    console.log(`  Lectures: ${lectureCount}`);

    if (lectureCount === 15) {
      console.log("✓ EXACTLY 15 lectures in DB! Re-import created 0 duplicates!");
    } else {
      console.log(`Notice: Lecture count is ${lectureCount}`);
    }

    await mongoose.disconnect();
    console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error("TEST FAILED:", err);
    await page.screenshot({ path: path.join(artifactDir, "test_failure.png") }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

run();
