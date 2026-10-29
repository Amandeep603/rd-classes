import fs from "fs";
import crypto from "crypto";
import mongoose from "mongoose";

if (typeof process.loadEnvFile === "function" && fs.existsSync(".env")) {
  process.loadEnvFile(".env");
}

const BASE_URL = "http://localhost:3001";

async function main() {
  console.log("=========================================");
  console.log("STARTING STEP 4 MODULES END-TO-END TESTS");
  console.log("=========================================\n");

  const { deriveIsolatedTestUri } = await import("./lib/testDbIsolation.mjs");
  const { testUri } = deriveIsolatedTestUri();
  await mongoose.connect(testUri);
  console.log("✓ Connected to MongoDB");

  // 1. Obtain or generate an admin session
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    role: String,
    status: String,
    name: String,
    email: String,
    loginId: String,
  }));

  const Session = mongoose.models.Session || mongoose.model("Session", new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    tokenHash: String,
    deviceId: String,
    role: String,
    expiresAt: Date,
    lastSeenAt: Date,
    revoked: Boolean,
  }));

  const admin = await User.findOne({ role: "admin", status: "active" });
  if (!admin) {
    throw new Error("No active admin user found in database. Run npm run seed:admin first.");
  }
  console.log(`✓ Using Admin: ${admin.name} (${admin.loginId})`);

  // Generate a test admin session token
  const rawAdminToken = crypto.randomBytes(32).toString("base64url");
  const adminTokenHash = crypto.createHash("sha256").update(rawAdminToken).digest("hex");

  const adminSession = await Session.create({
    userId: admin._id,
    tokenHash: adminTokenHash,
    deviceId: "test-admin-cli-device",
    role: "admin",
    expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
    lastSeenAt: new Date(),
    revoked: false,
  });
  console.log("✓ Created ephemeral Admin session for tests");

  const adminHeaders = {
    "Content-Type": "application/json",
    Cookie: `rd_admin_session=${rawAdminToken}`,
  };

  try {
    // -------------------------------------------------------------
    // MODULE 1: TOPPERS (/admin/toppers)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 1: Toppers ---");
    const topperPayload = {
      name: "Aarav Sharma (Test)",
      school: "Delhi Public School Sec 19",
      year: 2024,
      marks: "99/100",
      photoUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      publicId: "sample",
      featured: true,
    };

    const createTopperRes = await fetch(`${BASE_URL}/api/admin/toppers`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(topperPayload),
    });
    const createTopperData = await createTopperRes.json();
    if (!createTopperRes.ok || !createTopperData.success) {
      throw new Error(`Failed to create topper: ${JSON.stringify(createTopperData)}`);
    }
    const topperId = createTopperData.topper._id;
    console.log(`✓ Created topper with ID: ${topperId}`);

    // Verify topper appears in list
    const listToppersRes = await fetch(`${BASE_URL}/api/admin/toppers`, {
      headers: adminHeaders,
    });
    const listToppersData = await listToppersRes.json();
    const foundTopper = listToppersData.toppers.find((t) => t._id === topperId);
    if (!foundTopper) {
      throw new Error("Created topper not found in GET /api/admin/toppers list");
    }
    console.log("✓ Verified topper returned in /api/admin/toppers");

    // Verify public /results page contains topper
    const publicResultsRes = await fetch(`${BASE_URL}/results`);
    const publicResultsHtml = await publicResultsRes.text();
    if (!publicResultsHtml.includes("Aarav Sharma (Test)")) {
      throw new Error("Public /results page does not render the created topper");
    }
    console.log("✓ Verified created topper appears on public /results page");

    // Delete topper
    const delTopperRes = await fetch(`${BASE_URL}/api/admin/toppers/${topperId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    const delTopperData = await delTopperRes.json();
    if (!delTopperRes.ok || !delTopperData.success) {
      throw new Error(`Failed to delete topper: ${JSON.stringify(delTopperData)}`);
    }
    console.log("✓ Successfully deleted topper (and triggered Cloudinary cleanup)");

    // -------------------------------------------------------------
    // MODULE 2: RESULT PDFs (/admin/result-pdfs)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 2: Result PDFs ---");
    const resultPdfPayload = {
      title: "Class 12 Board Gazette 2024 (Test)",
      classLabel: "Class 12",
      year: 2024,
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/sample.pdf",
      publicId: "sample_pdf",
      fileSize: 204800,
    };

    const createPdfRes = await fetch(`${BASE_URL}/api/admin/result-pdfs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(resultPdfPayload),
    });
    const createPdfData = await createPdfRes.json();
    if (!createPdfRes.ok || !createPdfData.success) {
      throw new Error(`Failed to create result PDF: ${JSON.stringify(createPdfData)}`);
    }
    const pdfId = createPdfData.resultPdf._id;
    console.log(`✓ Created result PDF with ID: ${pdfId}`);

    // Verify PDF appears in admin list
    const listPdfsRes = await fetch(`${BASE_URL}/api/admin/result-pdfs`, {
      headers: adminHeaders,
    });
    const listPdfsData = await listPdfsRes.json();
    const foundPdf = listPdfsData.resultPdfs.find((p) => p._id === pdfId);
    if (!foundPdf) {
      throw new Error("Created result PDF not found in GET /api/admin/result-pdfs list");
    }
    console.log("✓ Verified result PDF returned in /api/admin/result-pdfs");

    // Verify public /results renders the result PDF
    const publicResultsAfterPdf = await fetch(`${BASE_URL}/results`);
    const publicResultsAfterPdfHtml = await publicResultsAfterPdf.text();
    if (!publicResultsAfterPdfHtml.includes("Class 12 Board Gazette 2024 (Test)")) {
      throw new Error("Public /results page does not render the created result PDF");
    }
    console.log("✓ Verified created result PDF appears on public /results page");

    // Delete result PDF
    const delPdfRes = await fetch(`${BASE_URL}/api/admin/result-pdfs/${pdfId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    const delPdfData = await delPdfRes.json();
    if (!delPdfRes.ok || !delPdfData.success) {
      throw new Error(`Failed to delete result PDF: ${JSON.stringify(delPdfData)}`);
    }
    console.log("✓ Successfully deleted result PDF (and triggered Cloudinary cleanup)");

    // -------------------------------------------------------------
    // MODULE 3: GALLERY (/admin/gallery)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 3: Gallery ---");
    const galleryPayload = {
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
      publicId: "sample_gallery",
      caption: "Classroom Interactive Session 2024 (Test)",
      width: 1600,
      height: 1066,
    };

    const createGalleryRes = await fetch(`${BASE_URL}/api/admin/gallery`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(galleryPayload),
    });
    const createGalleryData = await createGalleryRes.json();
    if (!createGalleryRes.ok || !createGalleryData.success) {
      throw new Error(`Failed to create gallery item: ${JSON.stringify(createGalleryData)}`);
    }
    const galleryId = createGalleryData.item._id;
    console.log(`✓ Created gallery item with ID: ${galleryId}`);

    // Verify public /gallery renders the item
    const publicGalleryRes = await fetch(`${BASE_URL}/gallery`);
    const publicGalleryHtml = await publicGalleryRes.text();
    if (!publicGalleryHtml.includes("Classroom Interactive Session 2024 (Test)")) {
      throw new Error("Public /gallery page does not render the created gallery item");
    }
    console.log("✓ Verified created gallery item appears on public /gallery page");

    // Delete gallery item
    const delGalleryRes = await fetch(`${BASE_URL}/api/admin/gallery/${galleryId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    const delGalleryData = await delGalleryRes.json();
    if (!delGalleryRes.ok || !delGalleryData.success) {
      throw new Error(`Failed to delete gallery item: ${JSON.stringify(delGalleryData)}`);
    }
    console.log("✓ Successfully deleted gallery item (and triggered Cloudinary cleanup)");

    // -------------------------------------------------------------
    // MODULE 4: REVIEWS (/admin/reviews)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 4: Reviews ---");
    const reviewPayload = {
      name: "Rohan Kapoor (Test)",
      role: "student",
      rating: 5,
      meta: "Modern School, CBSE 2024",
      quote: "RD Classes gave me the clarity I needed to score 98% in Accountancy!",
      isPublished: true,
    };

    const createReviewRes = await fetch(`${BASE_URL}/api/admin/reviews`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(reviewPayload),
    });
    const createReviewData = await createReviewRes.json();
    if (!createReviewRes.ok || !createReviewData.success) {
      throw new Error(`Failed to create review: ${JSON.stringify(createReviewData)}`);
    }
    const reviewId = createReviewData.review._id;
    console.log(`✓ Created single review with ID: ${reviewId}`);

    // Test bulk paste helper endpoint
    const bulkPayload = {
      text: "Priya Varma | student | 5 | DPS 2024 | Excellent test series and personal guidance!\nSunil Gupta | parent | 5 | Father of Aman (100/100) | Best coaching institute in Faridabad.",
    };
    const bulkRes = await fetch(`${BASE_URL}/api/admin/reviews/bulk`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(bulkPayload),
    });
    const bulkData = await bulkRes.json();
    if (!bulkRes.ok || !bulkData.success || bulkData.count !== 2) {
      throw new Error(`Bulk review paste failed: ${JSON.stringify(bulkData)}`);
    }
    console.log(`✓ Bulk imported ${bulkData.count} reviews via text paste helper`);

    // Verify Home testimonials section renders the published reviews
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    if (!homeHtml.includes("Rohan Kapoor (Test)")) {
      throw new Error("Home testimonials carousel does not render the published review");
    }
    console.log("✓ Verified published review appears in public Testimonials carousel");

    // Clean up created reviews
    await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    for (const bReview of bulkData.reviews) {
      await fetch(`${BASE_URL}/api/admin/reviews/${bReview._id}`, {
        method: "DELETE",
        headers: adminHeaders,
      });
    }
    console.log("✓ Cleaned up test reviews");

    // -------------------------------------------------------------
    // MODULE 5: ANNOUNCEMENTS (/admin/announcements)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 5: Announcements ---");
    const announcementPayload = {
      title: "Class 12 Mock Test Schedule (Test)",
      body: "Full syllabus mock test will be conducted on Saturday at 10:00 AM.",
      audience: "all",
      pinned: true,
    };

    const createAnnounceRes = await fetch(`${BASE_URL}/api/admin/announcements`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(announcementPayload),
    });
    const createAnnounceData = await createAnnounceRes.json();
    if (!createAnnounceRes.ok || !createAnnounceData.success) {
      throw new Error(`Failed to create announcement: ${JSON.stringify(createAnnounceData)}`);
    }
    const announcementId = createAnnounceData.announcement._id;
    console.log(`✓ Created announcement with ID: ${announcementId}`);

    // Verify in announcements list
    const listAnnounceRes = await fetch(`${BASE_URL}/api/admin/announcements`, {
      headers: adminHeaders,
    });
    const listAnnounceData = await listAnnounceRes.json();
    const foundAnnounce = listAnnounceData.announcements.find((a) => a._id === announcementId);
    if (!foundAnnounce) {
      throw new Error("Created announcement not found in GET /api/admin/announcements");
    }
    console.log("✓ Verified announcement returned in /api/admin/announcements");

    // Clean up announcement
    await fetch(`${BASE_URL}/api/admin/announcements/${announcementId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    console.log("✓ Cleaned up test announcement");

    // -------------------------------------------------------------
    // MODULE 6: SETTINGS (/admin/settings)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 6: Settings ---");
    const originalSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: adminHeaders,
    });
    const originalSettingsData = await originalSettingsRes.json();

    // Patch settings
    const patchSettingsRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        instituteName: "RD Classes Accountancy Institute",
        phone: "+91 83685 45620",
        whatsapp: "918368545620",
        email: "enquiry@rdclasses.com",
      }),
    });
    const patchSettingsData = await patchSettingsRes.json();
    if (!patchSettingsRes.ok || !patchSettingsData.success) {
      throw new Error(`Failed to update settings: ${JSON.stringify(patchSettingsData)}`);
    }
    console.log("✓ Updated settings via /api/admin/settings");

    // Verify public settings endpoint
    const publicSettingsRes = await fetch(`${BASE_URL}/api/settings`);
    const publicSettingsData = await publicSettingsRes.json();
    if (publicSettingsData.settings.instituteName !== "RD Classes Accountancy Institute") {
      throw new Error("Public /api/settings does not reflect updated instituteName");
    }
    console.log("✓ Public /api/settings accurately reflects updated instituteName");

    // Test Log Out All Students
    const logoutStudentsRes = await fetch(`${BASE_URL}/api/admin/settings/logout-all-students`, {
      method: "POST",
      headers: adminHeaders,
    });
    const logoutStudentsData = await logoutStudentsRes.json();
    if (!logoutStudentsRes.ok || !logoutStudentsData.success) {
      throw new Error(`Failed logout-all-students: ${JSON.stringify(logoutStudentsData)}`);
    }
    console.log(`✓ Log out all students succeeded (cleared ${logoutStudentsData.clearedSessionsCount} student sessions)`);

    // Restore original settings
    if (originalSettingsData.settings) {
      await fetch(`${BASE_URL}/api/admin/settings`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify(originalSettingsData.settings),
      });
      console.log("✓ Restored original settings");
    }

    // -------------------------------------------------------------
    // MODULE 7: ACTIVITY LOG (/admin/activity)
    // -------------------------------------------------------------
    console.log("\n--- Testing Module 7: Activity Log ---");
    const activityRes = await fetch(`${BASE_URL}/api/admin/activity?limit=10`, {
      headers: adminHeaders,
    });
    const activityData = await activityRes.json();
    if (!activityRes.ok || !activityData.success) {
      throw new Error(`Failed to fetch activity log: ${JSON.stringify(activityData)}`);
    }
    console.log(`✓ Activity log returned ${activityData.activities.length} recent actions (Total logged: ${activityData.total})`);
    const actions = activityData.activities.map((a) => a.action);
    console.log(`  Recent logged actions: ${actions.slice(0, 5).join(", ")}`);

    console.log("\n=========================================");
    console.log("ALL STEP 4 MODULES VALIDATED SUCCESSFULLY!");
    console.log("=========================================\n");

  } finally {
    // Delete ephemeral test admin session
    await Session.deleteOne({ _id: adminSession._id });
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
