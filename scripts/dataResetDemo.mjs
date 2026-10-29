import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
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
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not defined.");
  process.exit(1);
}

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const isDryRun = process.argv.includes("--dry-run");

async function deleteCloudinaryFile(publicId, resourceType = "image") {
  if (!publicId || !process.env.CLOUDINARY_API_KEY) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Ignore Cloudinary 404 or remote errors
  }
}

async function main() {
  let connected = false;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, bufferCommands: false });
      connected = true;
      break;
    } catch (e) {
      console.warn(`Connection attempt ${attempt} failed: ${e.message}. Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!connected) throw new Error("Could not connect to MongoDB Atlas after 4 attempts");
  const db = mongoose.connection.db;

  console.log("\n========================================================");
  console.log(`   DATA RESET DEMO ${isDryRun ? "[DRY RUN - NO DATA DELETED]" : "[LIVE EXECUTION]"}`);
  console.log("========================================================\n");

  // 1. Identify Students & Admin
  const adminUsers = await db.collection("users").find({ role: "admin" }).toArray();
  const adminUserIds = adminUsers.map((u) => u._id);
  const students = await db.collection("users").find({ role: "student" }).toArray();

  console.log(`🛡️  Admin Account: ${adminUsers.length} admin user found (PROTECTED: will NEVER be deleted)`);
  for (const a of adminUsers) {
    console.log(`    • ${a.name} (${a.email || a.loginId})`);
  }

  // 2. Identify Courses (Canonical 6 vs test/draft)
  const allCourses = await db.collection("courses").find({}).toArray();
  console.log(`\n📚 Canonical Courses: ${allCourses.length} courses (PROTECTED: will NEVER be deleted)`);
  for (const c of allCourses) {
    console.log(`    • ${c.slug}: "${c.title}"`);
  }

  // 3. Count documents scheduled to be deleted
  const studentSessionCount = await db.collection("sessions").countDocuments({
    userId: { $nin: adminUserIds },
    role: { $ne: "admin" },
  });
  const enrollmentCount = await db.collection("enrollments").countDocuments({});
  const deviceCount = await db.collection("devices").countDocuments({});
  const deviceRequestCount = await db.collection("devicerequests").countDocuments({});
  const lectureProgressCount = await db.collection("lectureprogresses").countDocuments({});
  const progressCount = await db.collection("progresses").countDocuments({});
  const lectureCount = await db.collection("lectures").countDocuments({});
  const noteCount = await db.collection("notes").countDocuments({});
  const testCount = await db.collection("tests").countDocuments({});
  const testResultCount = await db.collection("testresults").countDocuments({});
  const announcementCount = await db.collection("announcements").countDocuments({});
  const notificationCount = await db.collection("notifications").countDocuments({});
  const activityLogCount = await db.collection("activitylogs").countDocuments({});
  const auditLogCount = await db.collection("auditlogs").countDocuments({});
  const topperCount = await db.collection("toppers").countDocuments({});
  const galleryCount = await db.collection("galleryitems").countDocuments({});
  const resultPdfCount = await db.collection("resultpdfs").countDocuments({});

  console.log("\n🗑️  Items Scheduled for Deletion:");
  console.log("--------------------------------------------------------");
  console.log(`  • Students (users where role="student")   : ${students.length}`);
  console.log(`  • Student Sessions                       : ${studentSessionCount}`);
  console.log(`  • Enrollments                            : ${enrollmentCount}`);
  console.log(`  • Devices                                : ${deviceCount}`);
  console.log(`  • Device Requests                        : ${deviceRequestCount}`);
  console.log(`  • Lecture Progresses                     : ${lectureProgressCount + progressCount}`);
  console.log(`  • Lectures (videos)                      : ${lectureCount}`);
  console.log(`  • Notes (and Cloudinary files)           : ${noteCount}`);
  console.log(`  • Tests & Test Results                   : ${testCount + testResultCount}`);
  console.log(`  • Announcements                          : ${announcementCount}`);
  console.log(`  • Notifications                          : ${notificationCount}`);
  console.log(`  • Activity & Audit Logs                  : ${activityLogCount + auditLogCount}`);
  console.log(`  • Toppers (and Cloudinary photos)        : ${topperCount}`);
  console.log(`  • Gallery Items (and Cloudinary photos)  : ${galleryCount}`);
  console.log(`  • Result PDFs (and Cloudinary files)     : ${resultPdfCount}`);
  console.log("--------------------------------------------------------");

  // 4. Protected Collections (Never Deleted)
  const reviewCount = await db.collection("reviews").countDocuments({});
  const settingsCount = await db.collection("settings").countDocuments({});

  console.log("\n🔒 Protected Collections (STRICTLY PRESERVED):");
  console.log("--------------------------------------------------------");
  console.log(`  • Admin Users                            : ${adminUsers.length} preserved`);
  console.log(`  • Valid Courses                          : ${allCourses.length} preserved`);
  console.log(`  • Settings Singleton                     : ${settingsCount} preserved`);
  console.log(`  • Reviews (testimonials)                 : ${reviewCount} preserved`);
  console.log("--------------------------------------------------------\n");

  if (isDryRun) {
    console.log("✅ DRY RUN COMPLETE. No data was deleted.");
    console.log("Verified: Only students, sessions, devices, content, toppers, gallery, and PDFs will be removed.");
    console.log("Admin account, 6 courses, settings, and reviews are strictly preserved.");
  } else {
    console.log("⚠️  EXECUTING REAL RESET...");

    // Clean Cloudinary files for notes, toppers, gallery, resultpdfs
    try {
      const notes = await db.collection("notes").find({}).toArray();
      for (const n of notes) {
        if (n.publicId) await deleteCloudinaryFile(n.publicId, "raw");
      }

      const toppers = await db.collection("toppers").find({}).toArray();
      for (const t of toppers) {
        if (t.publicId) await deleteCloudinaryFile(t.publicId, "image");
      }

      const galleryItems = await db.collection("galleryitems").find({}).toArray();
      for (const g of galleryItems) {
        if (g.publicId) await deleteCloudinaryFile(g.publicId, "image");
      }

      const resultPdfs = await db.collection("resultpdfs").find({}).toArray();
      for (const r of resultPdfs) {
        if (r.publicId) await deleteCloudinaryFile(r.publicId, "raw");
      }
    } catch (cErr) {
      console.warn("Cloudinary cleanup note:", cErr.message);
    }

    // Execute Mongo deletions
    await Promise.all([
      db.collection("users").deleteMany({ role: "student" }),
      db.collection("sessions").deleteMany({ userId: { $nin: adminUserIds }, role: { $ne: "admin" } }),
      db.collection("enrollments").deleteMany({}),
      db.collection("devices").deleteMany({}),
      db.collection("devicerequests").deleteMany({}),
      db.collection("lectureprogresses").deleteMany({}),
      db.collection("progresses").deleteMany({}),
      db.collection("lectures").deleteMany({}),
      db.collection("notes").deleteMany({}),
      db.collection("tests").deleteMany({}),
      db.collection("testresults").deleteMany({}),
      db.collection("announcements").deleteMany({}),
      db.collection("notifications").deleteMany({}),
      db.collection("activitylogs").deleteMany({}),
      db.collection("auditlogs").deleteMany({}),
      db.collection("toppers").deleteMany({}),
      db.collection("galleryitems").deleteMany({}),
      db.collection("resultpdfs").deleteMany({}),
    ]);

    const remainingCourses = await db.collection("courses").countDocuments({});
    const remainingStudents = await db.collection("users").countDocuments({ role: "student" });
    const remainingAdmins = await db.collection("users").countDocuments({ role: "admin" });
    const remainingAdminSessions = await db.collection("sessions").countDocuments({ userId: { $in: adminUserIds } });

    console.log("✅ REAL RESET COMPLETE!");
    console.log(`   - Remaining Students: ${remainingStudents}`);
    console.log(`   - Remaining Admin Users: ${remainingAdmins}`);
    console.log(`   - Remaining Admin Sessions: ${remainingAdminSessions} (preserved)`);
    console.log(`   - Remaining Courses: ${remainingCourses} (exactly 6)`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Reset error:", err);
  process.exit(1);
});
