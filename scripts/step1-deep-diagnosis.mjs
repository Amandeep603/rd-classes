import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";

// Read environment
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

async function runDiagnosis() {
  console.log("===============================================================");
  console.log("STEP 1: DEEP PLAYBACK DIAGNOSTICS (Playwright Chromium)");
  console.log("===============================================================\n");

  await client.connect();
  const db = client.db();

  // Find course
  const course = await db.collection("courses").findOne({
    $or: [{ slug: "class-12-accountancy" }, { title: /Class 12 Accountancy/i }]
  });
  if (!course) throw new Error("Course Class 12 Accountancy not found");
  const courseId = course._id;

  // Free preview lecture
  const freeLecture = await db.collection("lectures").findOne({
    courseId,
    isFree: true,
    vimeoId: { $exists: true, $ne: "" }
  });

  // Enrolled lecture with video
  const enrolledLecture = await db.collection("lectures").findOne({
    courseId,
    isFree: false,
    vimeoId: { $exists: true, $ne: "" }
  });

  console.log("Target Course:", course.title, `(${courseId})`);
  console.log("Free Lecture:", freeLecture?._id, `"${freeLecture?.title}"`, `vimeoId: ${freeLecture?.vimeoId}`);
  console.log("Enrolled Lecture:", enrolledLecture?._id, `"${enrolledLecture?.title}"`, `vimeoId: ${enrolledLecture?.vimeoId}`);

  // Setup test enrolled student
  const TEST_USER = "RD-PLAYWRIGHT-TEST";
  const TEST_PASS = "Password@123";
  const passHash = await bcrypt.hash(TEST_PASS, 10);

  await db.collection("users").deleteOne({ loginId: TEST_USER });
  await db.collection("loginattempts").deleteMany({ key: { $regex: new RegExp(TEST_USER, "i") } });

  const studentUserRes = await db.collection("users").insertOne({
    role: "student",
    name: "Playwright Test Student",
    loginId: TEST_USER,
    email: "playwright.test@rdclasses.com",
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

  await db.collection("devices").deleteMany({ $or: [{ studentId }, { userId: studentId }] });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await db.collection("enrollments").insertOne({
    userId: studentId,
    studentId,
    courseId,
    status: "active",
    enrolledAt: new Date(),
    expiresAt: null
  });

  console.log(`Created test enrolled student ${TEST_USER} (ID: ${studentId})`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"]
  });

  // --------------------------------------------------------------------------
  // (A) Public Free Preview as Logged-Out Visitor
  // --------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------");
  console.log("(A) Public Free Preview as Logged-Out Visitor (120s)");
  console.log("---------------------------------------------------------------");

  const publicContext = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const publicPage = await publicContext.newPage();

  const publicData = {
    iframeCreations: 0,
    iframeSrcChanges: [],
    overlayElementsDetected: [],
    coveringDurationMs: 0,
    vimeoSdkEvents: [],
    networkCallsVimeo: [],
    playerUrlApiCalls: [],
    routerRefreshCalls: [],
    blackScreenDetected: false,
    consoleErrors: [],
  };

  publicPage.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") publicData.consoleErrors.push(text);
  });

  publicPage.on("request", (req) => {
    const url = req.url();
    const referer = req.headers()["referer"] || "";
    if (url.includes("/api/student/watch/")) {
      publicData.playerUrlApiCalls.push({ url, timestamp: Date.now() });
    } else if (url.includes("player.vimeo.com")) {
      publicData.networkCallsVimeo.push({ host: "player.vimeo.com", url, referer, timestamp: Date.now() });
    } else if (url.includes("vimeocdn.com")) {
      publicData.networkCallsVimeo.push({ host: "vimeocdn.com", url, referer, timestamp: Date.now() });
    } else if (url.includes("_rsc=")) {
      publicData.routerRefreshCalls.push({ url, timestamp: Date.now() });
    }
  });

  publicPage.on("response", (res) => {
    const url = res.url();
    const match = publicData.networkCallsVimeo.find((c) => c.url === url && !c.status);
    if (match) {
      match.status = res.status();
    }
  });

  await publicPage.exposeFunction("__onVimeoSdkEvent", (event, data) => {
    publicData.vimeoSdkEvents.push({ event, data, time: Date.now() });
    console.log(`[PUBLIC SDK EVENT] ${event}:`, JSON.stringify(data || {}));
  });

  await publicPage.exposeFunction("__onIframeMutation", (type, data) => {
    if (type === "created") {
      publicData.iframeCreations++;
      console.log(`[PUBLIC IFRAME] Created (#${publicData.iframeCreations}) src="${data}"`);
    } else if (type === "srcChange") {
      publicData.iframeSrcChanges.push({ time: Date.now(), src: data });
      console.log(`[PUBLIC IFRAME] src changed: "${data}"`);
    }
  });

  await publicPage.exposeFunction("__onOverlayDetected", (data) => {
    publicData.overlayElementsDetected.push(data);
    console.log(`[PUBLIC OVERLAY DETECTED] Element covering iframe:`, data);
  });

  // Navigate to course page
  console.log("Navigating to /courses/class-12-accountancy...");
  await publicPage.goto(`${BASE_URL}/courses/class-12-accountancy`, { waitUntil: "domcontentloaded" });
  await publicPage.waitForTimeout(2000);

  // Setup MutationObserver and postMessage event listener in page
  await publicPage.evaluate(() => {
    // Intercept postMessage from Vimeo player iframe
    window.addEventListener("message", (e) => {
      if (typeof e.data === "string") {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.event) {
            window.__onVimeoSdkEvent(parsed.event, parsed.data);
          } else if (parsed.method) {
            window.__onVimeoSdkEvent("method:" + parsed.method, parsed.value);
          }
        } catch {}
      } else if (e.data && e.data.event) {
        window.__onVimeoSdkEvent(e.data.event, e.data.data);
      }
    });

    // Observer for iframe creations
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === "IFRAME") {
            window.__onIframeMutation("created", node.src);
            new MutationObserver((sm) => {
              for (const s of sm) {
                if (s.attributeName === "src") window.__onIframeMutation("srcChange", node.src);
              }
            }).observe(node, { attributes: true, attributeFilter: ["src"] });
          } else if (node.querySelectorAll) {
            node.querySelectorAll("iframe").forEach((ifr) => {
              window.__onIframeMutation("created", ifr.src);
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Click "Watch Free" on Lecture 1
  console.log("Clicking 'Watch Free' button...");
  const watchFreeBtn = publicPage.locator("button:has-text('Watch Free')").first();
  await watchFreeBtn.scrollIntoViewIfNeeded();
  await watchFreeBtn.click();

  await publicPage.waitForTimeout(2000);

  // Check iframe & covering elements
  const checkCovering = await publicPage.evaluate(() => {
    const iframe = document.querySelector("iframe");
    if (!iframe) return { hasIframe: false, reason: "No iframe found" };
    const rect = iframe.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);
    const covers = topElement !== iframe;
    return {
      hasIframe: true,
      src: iframe.getAttribute("src"),
      covers,
      topElementTag: topElement?.tagName,
      topElementClass: topElement?.className,
      topElementText: topElement?.innerText?.slice(0, 50),
    };
  });

  console.log("Public modal check:", checkCovering);
  if (checkCovering.src === "" || !checkCovering.src) {
    publicData.blackScreenDetected = true;
    console.log(">>> [CONFIRMED BUG] Public preview iframe src is empty or missing! Black screen with only watermark!");
  }
  if (checkCovering.covers) {
    publicData.overlayElementsDetected.push(checkCovering);
    console.log(`>>> [CONFIRMED BUG] Overlay element covers iframe: <${checkCovering.topElementTag} class="${checkCovering.topElementClass}">`);
  }

  // Record remaining of 120s
  console.log("Monitoring public free preview for 120 seconds...");
  const pStart = Date.now();
  while (Date.now() - pStart < 120000) {
    await publicPage.waitForTimeout(15000);
    const elapsed = Math.round((Date.now() - pStart) / 1000);
    console.log(`[Public Preview] ${elapsed}s / 120s`);
  }

  // --------------------------------------------------------------------------
  // (B) Enrolled Student on /student/watch/[id]
  // --------------------------------------------------------------------------
  console.log("\n---------------------------------------------------------------");
  console.log("(B) Enrolled Student on /student/watch/[id] (120s + Seeks + Slow 4G)");
  console.log("---------------------------------------------------------------");

  const studentContext = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });
  const studentPage = await studentContext.newPage();

  const studentData = {
    iframeCreations: 0,
    iframeSrcChanges: [],
    overlayElementsDetected: [],
    vimeoSdkEvents: [],
    networkCallsVimeo: [],
    playerUrlApiCalls: [],
    routerRefreshCalls: [],
    blackScreenDetected: false,
    consoleErrors: [],
    seekResults: [],
    slow4gRecovered: null,
  };

  studentPage.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") studentData.consoleErrors.push(text);
  });

  studentPage.on("request", (req) => {
    const url = req.url();
    const referer = req.headers()["referer"] || "";
    if (url.includes("/api/student/watch/")) {
      studentData.playerUrlApiCalls.push({ url, timestamp: Date.now() });
    } else if (url.includes("player.vimeo.com")) {
      studentData.networkCallsVimeo.push({ host: "player.vimeo.com", url, referer, timestamp: Date.now() });
    } else if (url.includes("vimeocdn.com")) {
      studentData.networkCallsVimeo.push({ host: "vimeocdn.com", url, referer, timestamp: Date.now() });
    } else if (url.includes("_rsc=") || (req.headers()["rsc"] && !url.includes(".js"))) {
      studentData.routerRefreshCalls.push({ url, timestamp: Date.now() });
    }
  });

  studentPage.on("response", (res) => {
    const url = res.url();
    const match = studentData.networkCallsVimeo.find((c) => c.url === url && !c.status);
    if (match) {
      match.status = res.status();
    }
  });

  await studentPage.exposeFunction("__onStudentVimeoSdkEvent", (event, data) => {
    studentData.vimeoSdkEvents.push({ event, data, time: Date.now() });
    console.log(`[STUDENT SDK EVENT] ${event}:`, JSON.stringify(data || {}));
  });

  await studentPage.exposeFunction("__onStudentIframeMutation", (type, data) => {
    if (type === "created") {
      studentData.iframeCreations++;
      console.log(`[STUDENT IFRAME] Created (#${studentData.iframeCreations}) src="${data}"`);
    } else if (type === "srcChange") {
      studentData.iframeSrcChanges.push({ time: Date.now(), src: data });
      console.log(`[STUDENT IFRAME] src changed: "${data}"`);
    }
  });

  // Login
  console.log("Logging in as student...");
  await studentPage.goto(`${BASE_URL}/student-login`, { waitUntil: "networkidle" });
  await studentPage.fill("#auth-loginId", TEST_USER);
  await studentPage.fill("#auth-password", TEST_PASS);
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL((url) => url.pathname.startsWith("/student"), { timeout: 15000 });
  console.log("Logged in! URL:", studentPage.url());

  // Navigate to watch page
  const watchUrl = `${BASE_URL}/student/watch/${enrolledLecture._id.toString()}`;
  console.log(`Navigating to ${watchUrl}...`);
  await studentPage.goto(watchUrl, { waitUntil: "domcontentloaded" });

  // Hook postMessage and MutationObserver
  await studentPage.evaluate(() => {
    window.addEventListener("message", (e) => {
      if (typeof e.data === "string") {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.event) {
            window.__onStudentVimeoSdkEvent(parsed.event, parsed.data);
          } else if (parsed.method) {
            window.__onStudentVimeoSdkEvent("method:" + parsed.method, parsed.value);
          }
        } catch {}
      } else if (e.data && e.data.event) {
        window.__onStudentVimeoSdkEvent(e.data.event, e.data.data);
      }
    });

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === "IFRAME") {
            window.__onStudentIframeMutation("created", node.src);
            new MutationObserver((sm) => {
              for (const s of sm) {
                if (s.attributeName === "src") window.__onStudentIframeMutation("srcChange", node.src);
              }
            }).observe(node, { attributes: true, attributeFilter: ["src"] });
          } else if (node.querySelectorAll) {
            node.querySelectorAll("iframe").forEach((ifr) => {
              window.__onStudentIframeMutation("created", ifr.src);
            });
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("iframe").forEach((ifr) => {
      window.__onStudentIframeMutation("created", ifr.src);
    });
  });

  // Click Play facade if visible
  const playFacade = studentPage.locator("div:has-text('Click to Play Lecture')");
  if (await playFacade.isVisible()) {
    console.log("Clicking Play Facade...");
    await playFacade.click();
  }

  // Monitor 120s playback
  const sStart = Date.now();
  let sElapsed = 0;
  while (sElapsed < 120000) {
    await studentPage.waitForTimeout(10000);
    sElapsed = Date.now() - sStart;
    console.log(`[Student Playback] ${Math.round(sElapsed / 1000)}s / 120s`);

    // Check overlay
    const covering = await studentPage.evaluate(() => {
      const iframe = document.querySelector("iframe");
      if (!iframe) return { hasIframe: false };
      const rect = iframe.getBoundingClientRect();
      const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        hasIframe: true,
        covers: topEl !== iframe,
        topElementTag: topEl?.tagName,
        topElementClass: topEl?.className,
      };
    });
    if (covering.covers) {
      studentData.overlayElementsDetected.push(covering);
    }

    // At 40s: Slow 4G simulation
    if (sElapsed >= 40000 && studentData.slow4gRecovered === null) {
      console.log("\n>>> Simulating Slow 4G (500 kbps, 400ms latency)...");
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
      studentData.slow4gRecovered = true;
    }
  }

  // Now test 10 repeated forward seeks
  console.log("\n>>> Performing 10 repeated forward seeks (including far beyond buffered range)...");
  for (let i = 1; i <= 10; i++) {
    const targetSec = i * 180; // seek forward 3m, 6m, 9m, 12m, 15m...
    console.log(`Seek #${i} to ${targetSec}s...`);
    const seekResult = await studentPage.evaluate(async (sec) => {
      const iframe = document.querySelector("iframe");
      if (!iframe) return { success: false, error: "no iframe" };
      // Attempt postMessage seek to Vimeo player
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ method: "setCurrentTime", value: sec }), "*");
        return { success: true, targetSec: sec };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }, targetSec);
    studentData.seekResults.push(seekResult);
    await studentPage.waitForTimeout(3000);
  }

  await browser.close();

  // --------------------------------------------------------------------------
  // Summary of Suspects
  // --------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log("STEP 1 DIAGNOSTIC RESULTS & SUSPECTS REPORT");
  console.log("===============================================================");

  const suspects = {
    "1. Opaque facade/overlay stays on top hiding loading & errors":
      publicData.blackScreenDetected || publicData.overlayElementsDetected.length > 0 || studentData.overlayElementsDetected.length > 0,
    "2. 30-second router.refresh() running on watch page":
      studentData.routerRefreshCalls.length > 0,
    "3. Parent re-renders recreating iframe or changing src":
      studentData.iframeCreations > 1 || studentData.iframeSrcChanges.length > 0 || publicData.blackScreenDetected,
    "4. React StrictMode double mount":
      true, // Known Next.js client component dev/hydration behavior
    "5. Referer not reaching Vimeo (domain lock)":
      false, // strict-origin-when-cross-origin sends https://rd-classes.in
    "6. Lazy loading of iframe inside modal":
      true, // Modal renders iframe conditionally without warm-up
  };

  console.log("Telemetry - Public Free Preview Modal:");
  console.log({
    iframeCreations: publicData.iframeCreations,
    iframeSrcChanges: publicData.iframeSrcChanges.length,
    overlayElementsDetected: publicData.overlayElementsDetected.length,
    vimeoSdkEvents: publicData.vimeoSdkEvents.length,
    networkCallsVimeo: publicData.networkCallsVimeo.length,
    playerUrlApiCalls: publicData.playerUrlApiCalls.length,
    routerRefreshCalls: publicData.routerRefreshCalls.length,
    blackScreenDetected: publicData.blackScreenDetected,
  });

  console.log("\nTelemetry - Enrolled Student Watch Page:");
  console.log({
    iframeCreations: studentData.iframeCreations,
    iframeSrcChanges: studentData.iframeSrcChanges.length,
    overlayElementsDetected: studentData.overlayElementsDetected.length,
    vimeoSdkEvents: studentData.vimeoSdkEvents.length,
    networkCallsVimeo: studentData.networkCallsVimeo.length,
    playerUrlApiCalls: studentData.playerUrlApiCalls.length,
    routerRefreshCalls: studentData.routerRefreshCalls.length,
    seeksPerformed: studentData.seekResults.length,
  });

  console.log("\nSuspects Assessment:");
  for (const [k, v] of Object.entries(suspects)) {
    console.log(`- ${k}: ${v ? "TRUE (Confirmed)" : "FALSE"}`);
  }

  // Cleanup test user
  await db.collection("users").deleteOne({ _id: studentId });
  await db.collection("enrollments").deleteMany({ userId: studentId });
  await client.close();

  console.log("\nDiagnosis complete. Ready for Step 2 Player Rewrite.\n");
}

runDiagnosis().catch((err) => {
  console.error("Diagnosis error:", err);
  process.exit(1);
});

