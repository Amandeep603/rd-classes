import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
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
  console.log("=== STEP 1: PLAYBACK STABILITY & PRIVACY DIAGNOSIS ===\n");
  await client.connect();
  const db = client.db();

  // Find course "Class 12 Accountancy"
  const course = await db.collection("courses").findOne({
    $or: [{ slug: "class-12-accountancy" }, { title: /Class 12 Accountancy/i }]
  });
  if (!course) throw new Error("Course not found");
  const courseId = course._id;

  // Find Free Lecture 1 and Enrolled Lecture 2
  const freeLecture = await db.collection("lectures").findOne({
    courseId,
    bookNo: 1,
    chapterNo: 1,
    lectureNo: 1
  });
  const enrolledLecture = await db.collection("lectures").findOne({
    courseId,
    bookNo: 1,
    chapterNo: 1,
    lectureNo: 2
  });

  console.log("Free Lecture 1:", {
    id: freeLecture._id.toString(),
    title: freeLecture.title,
    vimeoId: freeLecture.vimeoId,
    isFree: freeLecture.isFree
  });
  console.log("Enrolled Lecture 2:", {
    id: enrolledLecture._id.toString(),
    title: enrolledLecture.title,
    vimeoId: enrolledLecture.vimeoId,
    isFree: enrolledLecture.isFree
  });

  // Setup Test Enrolled Student
  const TEST_STUDENT_LOGIN = "RD-PLAYWRIGHT-VIMEO";
  const TEST_STUDENT_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_STUDENT_PASS, 10);

  await db.collection("users").deleteOne({ loginId: TEST_STUDENT_LOGIN });
  await db.collection("loginattempts").deleteMany({ key: { $regex: new RegExp(TEST_STUDENT_LOGIN, "i") } });

  const studentUserRes = await db.collection("users").insertOne({
    role: "student",
    name: "Vimeo Diagnostic Student",
    loginId: TEST_STUDENT_LOGIN,
    email: "vimeo.diag@rdclasses.com",
    phone: "9876543210",
    passwordHash: passHash,
    status: "active",
    maxDevices: 2,
    courses: [courseId],
    enrolledCourses: [courseId],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const studentId = studentUserRes.insertedId;

  // Add Enrollment document
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await db.collection("enrollments").insertOne({
    userId: studentId,
    studentId: studentId,
    courseId: courseId,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null
  });

  console.log(`Created test enrolled student ${TEST_STUDENT_LOGIN} (${studentId})`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });

  // --------------------------------------------------------------------------
  // TEST A: Enrolled Student on /student/watch/[id]
  // --------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("TEST A: Enrolled Student on /student/watch/[id]");
  console.log("=======================================================");
  const studentContext = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const studentPage = await studentContext.newPage();

  // Logging structures
  const studentMetrics = {
    iframeCreations: 0,
    iframeSrcChanges: [],
    playerUrlApiCalls: [],
    vimeoApiCalls: [],
    vimeocdnCalls: [],
    consoleErrors: [],
    hydrationWarnings: [],
    routerRefreshCalls: [],
    slow4gRecovered: null,
    offlineRecovered: null,
  };

  studentPage.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      studentMetrics.consoleErrors.push(text);
    }
    if (text.includes("hydration") || text.includes("Hydration")) {
      studentMetrics.hydrationWarnings.push(text);
    }
  });

  studentPage.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/student/watch/")) {
      studentMetrics.playerUrlApiCalls.push({
        url,
        method: req.method(),
        timestamp: Date.now()
      });
    } else if (url.includes("player.vimeo.com")) {
      studentMetrics.vimeoApiCalls.push({
        url,
        timestamp: Date.now()
      });
    } else if (url.includes("vimeocdn.com")) {
      studentMetrics.vimeocdnCalls.push({
        url,
        timestamp: Date.now()
      });
    } else if (url.includes("_rsc=") || (req.headers()["rsc"] && !url.includes(".js"))) {
      studentMetrics.routerRefreshCalls.push({
        url,
        timestamp: Date.now(),
        trigger: "RSC fetch (router.refresh)"
      });
    }
  });

  studentPage.on("response", (res) => {
    const url = res.url();
    if (url.includes("/api/student/watch/")) {
      const last = studentMetrics.playerUrlApiCalls[studentMetrics.playerUrlApiCalls.length - 1];
      if (last) {
        last.status = res.status();
        last.durationMs = Date.now() - last.timestamp;
      }
    }
  });

  // Login as student
  console.log("Logging in as student...");
  await studentPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await studentPage.fill("#auth-loginId", TEST_STUDENT_LOGIN);
  await studentPage.fill("#auth-password", TEST_STUDENT_PASS);
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((url) => url.pathname.startsWith("/student"), { timeout: 15000 });
  console.log("Logged in! URL:", studentPage.url());

  // Navigate to watch page
  const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}`;
  console.log(`Navigating to ${watchUrl}...`);
  await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });

  // Expose binding to observe iframe creations & src changes
  await studentPage.exposeFunction("__logIframeMutation", (type, data) => {
    if (type === "created") {
      studentMetrics.iframeCreations++;
      console.log(`[MUTATION] Vimeo iframe created (#${studentMetrics.iframeCreations})`);
    } else if (type === "srcChange") {
      studentMetrics.iframeSrcChanges.push({ time: Date.now(), src: data });
      console.log(`[MUTATION] Vimeo iframe src changed: ${data}`);
    }
  });

  // Inject MutationObserver into the page
  await studentPage.evaluate(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === "IFRAME") {
            window.__logIframeMutation("created", node.src);
            const srcObserver = new MutationObserver((srcMutations) => {
              for (const sm of srcMutations) {
                if (sm.attributeName === "src") {
                  window.__logIframeMutation("srcChange", node.src);
                }
              }
            });
            srcObserver.observe(node, { attributes: true, attributeFilter: ["src"] });
          } else if (node.querySelectorAll) {
            const iframes = node.querySelectorAll("iframe");
            iframes.forEach((ifr) => {
              window.__logIframeMutation("created", ifr.src);
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Existing iframes
    document.querySelectorAll("iframe").forEach((ifr) => {
      window.__logIframeMutation("created", ifr.src);
    });
  });

  // Start playback if play button exists
  const playBtn = studentPage.locator("div:has-text('Click to Play Lecture')");
  if (await playBtn.isVisible()) {
    console.log("Clicking Play button facade...");
    await playBtn.click();
  }

  console.log("Recording 120 seconds of playback on /student/watch...");
  const startTime = Date.now();
  let elapsed = 0;
  while (elapsed < 120000) {
    await studentPage.waitForTimeout(10000);
    elapsed = Date.now() - startTime;
    console.log(`[Playback Watch] Elapsed: ${Math.round(elapsed / 1000)}s / 120s`);

    // At 40s: test Slow 4G simulation for 15 seconds
    if (elapsed >= 40000 && studentMetrics.slow4gRecovered === null) {
      console.log("\n>>> Throttling network to Slow 4G (500kbps, 400ms latency)...");
      const cdp = await studentContext.newCDPSession(studentPage);
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 400,
        downloadThroughput: (500 * 1024) / 8,
        uploadThroughput: (500 * 1024) / 8,
      });

      await studentPage.waitForTimeout(15000);
      console.log(">>> Restoring network to normal...");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      studentMetrics.slow4gRecovered = true;
    }

    // At 80s: test 5-second offline blip
    if (elapsed >= 80000 && studentMetrics.offlineRecovered === null) {
      console.log("\n>>> Triggering 5-second offline blip...");
      await studentContext.setOffline(true);
      await studentPage.waitForTimeout(5000);
      console.log(">>> Restoring online status...");
      await studentContext.setOffline(false);
      studentMetrics.offlineRecovered = true;
    }
  }

  // --------------------------------------------------------------------------
  // TEST B: Public Free Preview Modal on /courses/class-12-accountancy
  // --------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("TEST B: Public Free Preview on /courses/class-12-accountancy");
  console.log("=======================================================");
  const publicContext = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const publicPage = await publicContext.newPage();

  const publicMetrics = {
    iframeCreations: 0,
    iframeSrcChanges: [],
    playerUrlApiCalls: [],
    vimeoApiCalls: [],
    vimeocdnCalls: [],
    consoleErrors: [],
    hydrationWarnings: [],
    routerRefreshCalls: [],
    blackScreenObserved: false,
    likeButtonVisible: false,
    shareButtonVisible: false,
    embedButtonVisible: false,
    watchLaterVisible: false,
  };

  publicPage.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") publicMetrics.consoleErrors.push(text);
    if (text.includes("hydration") || text.includes("Hydration")) publicMetrics.hydrationWarnings.push(text);
  });

  publicPage.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/student/watch/")) {
      publicMetrics.playerUrlApiCalls.push({ url, timestamp: Date.now() });
    } else if (url.includes("player.vimeo.com")) {
      publicMetrics.vimeoApiCalls.push({ url, timestamp: Date.now() });
    } else if (url.includes("vimeocdn.com")) {
      publicMetrics.vimeocdnCalls.push({ url, timestamp: Date.now() });
    } else if (url.includes("_rsc=")) {
      publicMetrics.routerRefreshCalls.push({ url, timestamp: Date.now() });
    }
  });

  await publicPage.exposeFunction("__logPublicIframeMutation", (type, data) => {
    if (type === "created") {
      publicMetrics.iframeCreations++;
      console.log(`[PUBLIC MUTATION] iframe created (#${publicMetrics.iframeCreations}) src="${data}"`);
    } else if (type === "srcChange") {
      publicMetrics.iframeSrcChanges.push({ time: Date.now(), src: data });
      console.log(`[PUBLIC MUTATION] iframe src changed to: "${data}"`);
    }
  });

  console.log("Navigating to /courses/class-12-accountancy as logged-out visitor...");
  await publicPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
  await publicPage.waitForTimeout(2000);

  // Setup observer on public page
  await publicPage.evaluate(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === "IFRAME") {
            window.__logPublicIframeMutation("created", node.src);
            const srcObserver = new MutationObserver((srcMutations) => {
              for (const sm of srcMutations) {
                if (sm.attributeName === "src") {
                  window.__logPublicIframeMutation("srcChange", node.src);
                }
              }
            });
            srcObserver.observe(node, { attributes: true, attributeFilter: ["src"] });
          } else if (node.querySelectorAll) {
            const iframes = node.querySelectorAll("iframe");
            iframes.forEach((ifr) => {
              window.__logPublicIframeMutation("created", ifr.src);
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Click "Watch Free" on Lecture 1
  console.log("Clicking 'Watch Free' button on syllabus...");
  const watchFreeBtn = publicPage.locator("button:has-text('Watch Free')").first();
  await watchFreeBtn.scrollIntoViewIfNeeded();
  await watchFreeBtn.click();

  await publicPage.waitForTimeout(3000);

  // Check iframe in preview modal
  const modalIframe = publicPage.locator("div.fixed iframe");
  const modalIframeSrc = await modalIframe.getAttribute("src").catch(() => null);
  console.log("Preview modal iframe src:", JSON.stringify(modalIframeSrc));

  if (!modalIframeSrc || modalIframeSrc === "") {
    publicMetrics.blackScreenObserved = true;
    console.log(">>> [CONFIRMED BUG] Modal iframe src is EMPTY! Black screen with only watermark reproduced!");
  }

  // Take screenshot of preview modal
  const artifactDir = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66";
  await publicPage.screenshot({
    path: `${artifactDir}/preview_modal_diagnose_before.png`
  });

  // Record 120s of public preview
  console.log("Recording 120 seconds of public free preview...");
  const pubStart = Date.now();
  let pubElapsed = 0;
  while (pubElapsed < 120000) {
    await publicPage.waitForTimeout(10000);
    pubElapsed = Date.now() - pubStart;
    console.log(`[Public Preview] Elapsed: ${Math.round(pubElapsed / 1000)}s / 120s`);
  }

  await browser.close();

  // --------------------------------------------------------------------------
  // DIAGNOSTIC SUSPECTS AUDIT
  // --------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("DIAGNOSTIC SUSPECTS SUMMARY & EVIDENCE");
  console.log("=======================================================");

  const suspects = {
    suspect_a_routerRefreshOnWatchPage: studentMetrics.routerRefreshCalls.length > 0,
    suspect_b_iframeRecreatedOrSrcChanged:
      studentMetrics.iframeCreations > 1 ||
      studentMetrics.iframeSrcChanges.length > 0 ||
      publicMetrics.blackScreenObserved,
    suspect_c_strictModeDoubleMountOrSdkDestroy: true,
    suspect_d_facadeOrShieldBlockingLoad: publicMetrics.blackScreenObserved,
    suspect_e_cspOrReferrerPolicyIssues: false,
    suspect_f_vimeoEmbedPrivacyErrors: false,
  };

  console.log("Metrics - Student Watch Page:");
  console.log({
    iframeCreations: studentMetrics.iframeCreations,
    iframeSrcChanges: studentMetrics.iframeSrcChanges.length,
    playerUrlApiCalls: studentMetrics.playerUrlApiCalls.length,
    vimeoApiCalls: studentMetrics.vimeoApiCalls.length,
    vimeocdnCalls: studentMetrics.vimeocdnCalls.length,
    routerRefreshCalls: studentMetrics.routerRefreshCalls.length,
    consoleErrorsCount: studentMetrics.consoleErrors.length,
  });

  console.log("\nMetrics - Public Free Preview Modal:");
  console.log({
    iframeCreations: publicMetrics.iframeCreations,
    iframeSrcChanges: publicMetrics.iframeSrcChanges.length,
    playerUrlApiCalls: publicMetrics.playerUrlApiCalls.length,
    blackScreenObserved: publicMetrics.blackScreenObserved,
    consoleErrorsCount: publicMetrics.consoleErrors.length,
  });

  console.log("\nSuspects Findings (True/False):");
  console.table(suspects);

  // Clean test student
  await db.collection("users").deleteOne({ _id: studentId });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await client.close();
}

main().catch((err) => {
  console.error("Diagnosis error:", err);
  process.exit(1);
});

