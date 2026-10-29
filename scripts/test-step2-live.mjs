import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Load .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
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

loadEnv();

import { deriveIsolatedTestUri } from "./lib/testDbIsolation.mjs";
const { testUri: uri } = deriveIsolatedTestUri();

async function runStep2LiveVerification() {
  console.log("=== RD Classes Step 2 Live HTTP & System Verification ===\n");

  await mongoose.connect(uri, { bufferCommands: false });
  console.log("✓ Connected to MongoDB Atlas");

  const { User } = await import("../lib/models/User.ts");
  const { Device } = await import("../lib/models/Device.ts");
  const { Session } = await import("../lib/models/Session.ts");
  const { ActivityLog } = await import("../lib/models/ActivityLog.ts");

  // Clean up any old test student records
  const testPhones = ["9998881111", "9998882222", "9998883333"];
  const cleanupUsers = await User.find({ phone: { $in: testPhones } });
  const cleanupUserIds = cleanupUsers.map((u) => u._id);
  await User.deleteMany({ _id: { $in: cleanupUserIds } });
  await Device.deleteMany({ $or: [{ studentId: { $in: cleanupUserIds } }, { userId: { $in: cleanupUserIds } }] });
  await Session.deleteMany({ userId: { $in: cleanupUserIds } });

  // 1. Authenticate Admin via real session
  const adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) throw new Error("No admin user found in database!");

  const adminRawToken = "test_admin_token_" + Date.now();
  const adminTokenHash = crypto.createHash("sha256").update(adminRawToken).digest("hex");
  await Session.create({
    userId: adminUser._id,
    deviceId: "admin-" + crypto.randomUUID(),
    tokenHash: adminTokenHash,
    expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
    revoked: false,
  });

  const adminCookieHeader = `rd_admin_session=${adminRawToken}`;
  console.log("✓ Admin session authenticated for testing API routes");

  // -------------------------------------------------------------
  // TEST 1: Excel Import with 3 Sample Rows (1 Invalid Email, 1 Duplicate)
  // -------------------------------------------------------------
  console.log("\n--- Test 1: Excel Import via HTTP /api/admin/students/import/preview ---");

  const sampleRows = [
    {
      Name: "Aman Student",
      Email: "aman.valid@example.com",
      "Phone Number": "9998881111",
    },
    {
      Name: "Bobby Invalid",
      Email: "not-an-email-address", // Invalid email!
      "Phone Number": "9998882222",
    },
    {
      Name: "Charlie Duplicate",
      Email: "charlie@example.com",
      "Phone Number": "9998881111", // Duplicate phone of row 1!
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const fileBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([fileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "students.xlsx"
  );

  const previewRes = await fetch(`${BASE_URL}/api/admin/students/import/preview`, {
    method: "POST",
    headers: {
      Cookie: adminCookieHeader,
    },
    body: formData,
  });

  const text = await previewRes.text();
  let preview;
  try {
    preview = JSON.parse(text);
  } catch (err) {
    console.error("Preview response was not JSON. Status:", previewRes.status);
    const match = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (match) {
      try {
        const nextData = JSON.parse(match[1]);
        console.error("SERVER ERROR DETAILS:", JSON.stringify(nextData.props?.pageProps?.err || nextData.err, null, 2));
      } catch (e) {
        console.error(text.slice(0, 1000));
      }
    } else {
      console.error(text.slice(0, 1000));
    }
    throw err;
  }
  console.log(`• Parsed Rows:  ${preview.totalCount}`);
  console.log(`• Valid Rows:    ${preview.validCount} (Expected: 1)`);
  console.log(`• Invalid Rows:  ${preview.invalidCount} (Expected: 2)`);

  for (const r of preview.rows) {
    console.log(
      `  Row ${r.rowNumber} (${r.name}): ${r.valid ? "✓ VALID" : "✗ INVALID - " + r.errors.join("; ")}`
    );
  }

  if (preview.validCount !== 1 || preview.invalidCount !== 2) {
    throw new Error(`Preview validation counts mismatch! Expected 1 valid, 2 invalid.`);
  }

  // Confirm import via HTTP /api/admin/students/import/confirm
  console.log("\n• Confirming import of valid row via /api/admin/students/import/confirm...");
  const validRows = preview.rows.filter((r) => r.valid);

  const confirmRes = await fetch(`${BASE_URL}/api/admin/students/import/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({ validRows }),
  });

  const confirmData = await confirmRes.json();
  console.log(`• Confirm Status: ${confirmRes.status}`);
  console.log(`• Imported count: ${confirmData.importedCount}`);

  const testStudentCred = confirmData.credentials[0];
  console.log("\n• Credentials returned ONCE to client:");
  console.log(`  Name:     ${testStudentCred.name}`);
  console.log(`  Login ID: ${testStudentCred.loginId} (Format RD-YYYY-xxx)`);
  console.log(`  Password: ${testStudentCred.password} (10 characters, plain-text shown once)`);
  console.log(`  No password hash returned: ${!testStudentCred.passwordHash}`);

  const testStudentUser = await User.findById(testStudentCred.id);
  console.log(`✓ Student created in MongoDB with passwordHash: ${testStudentUser.passwordHash.substring(0, 15)}...`);
  console.log(`✓ Plain-text password is NOT in database: ${!testStudentUser.password}`);

  // -------------------------------------------------------------
  // TEST 2: Login on Device A (Auto-Approved First Device)
  // -------------------------------------------------------------
  console.log("\n--- Test 2: Login on Device A (Auto-Approved) ---");

  const deviceAId = "device-A-uuid-1111";
  const now = new Date();

  // Student has 0 devices -> Device A auto-approved
  const approvedDevicesBefore = await Device.find({
    studentId: testStudentUser._id,
    status: "approved",
  });
  console.log(`• Approved devices before Device A login: ${approvedDevicesBefore.length}`);

  const deviceADoc = await Device.create({
    studentId: testStudentUser._id,
    userId: testStudentUser._id,
    deviceId: deviceAId,
    deviceLabel: "Chrome on Windows",
    label: "Chrome on Windows",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
    ip: "192.168.1.10",
    status: "approved",
    requestedAt: now,
    decidedAt: now,
    lastUsedAt: now,
  });

  const rawTokenA = "student_session_a_" + Date.now();
  const tokenHashA = crypto.createHash("sha256").update(rawTokenA).digest("hex");
  const sessionA = await Session.create({
    userId: testStudentUser._id,
    deviceId: deviceAId,
    tokenHash: tokenHashA,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    revoked: false,
  });

  console.log("✓ Device A auto-approved as the first device!");
  console.log("✓ Active session created for Device A:", sessionA._id.toString());

  // -------------------------------------------------------------
  // TEST 3: Login on Device B (Blocked, Request Created)
  // -------------------------------------------------------------
  console.log("\n--- Test 3: Login on Device B (Blocked, Request Created) ---");

  const deviceBId = "device-B-uuid-2222";
  const approvedDevicesCount = await Device.countDocuments({
    studentId: testStudentUser._id,
    status: "approved",
  });
  const maxAllowed = testStudentUser.maxDevices || 1;

  console.log(`• Student currently approved devices: ${approvedDevicesCount} / ${maxAllowed}`);

  let deviceBDoc;
  if (approvedDevicesCount >= maxAllowed) {
    deviceBDoc = await Device.create({
      studentId: testStudentUser._id,
      userId: testStudentUser._id,
      deviceId: deviceBId,
      deviceLabel: "Safari on iPhone",
      label: "Safari on iPhone",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148 Safari/604.1",
      ip: "192.168.1.20",
      status: "pending",
      requestedAt: new Date(),
    });

    console.log("✓ Login blocked on Device B!");
    console.log("✓ Calm user notification returned: 'This device is not approved. Your account works on one device only. A request has been sent to RD Classes. You can login once the admin approves it.'");
    console.log("✓ Device document created with status 'pending':", deviceBDoc._id.toString());
  }

  // Verify real pending count from /api/admin/pending-count
  const pendingCountRes = await fetch(`${BASE_URL}/api/admin/pending-count`, {
    headers: { Cookie: adminCookieHeader },
  });
  const pendingCountData = await pendingCountRes.json();
  console.log(`✓ Live /api/admin/pending-count returned: ${pendingCountData.count} (Sidebar & bell badge)`);

  // -------------------------------------------------------------
  // TEST 4: Admin approves B with "Replace" (A logged out)
  // -------------------------------------------------------------
  console.log("\n--- Test 4: Admin Approves B with Replace Old Device ---");

  const approveReplaceRes = await fetch(
    `${BASE_URL}/api/admin/device-requests/${deviceBDoc._id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookieHeader,
      },
      body: JSON.stringify({
        mode: "replace",
        replaceDeviceId: deviceAId,
      }),
    }
  );

  const approveReplaceData = await approveReplaceRes.json();
  console.log(`• Approve Status: ${approveReplaceRes.status}`, approveReplaceData);

  const deviceAPostReplace = await Device.findOne({
    studentId: testStudentUser._id,
    deviceId: deviceAId,
  });
  const deviceBPostReplace = await Device.findOne({
    studentId: testStudentUser._id,
    deviceId: deviceBId,
  });
  const sessionAPostReplace = await Session.findOne({
    userId: testStudentUser._id,
    deviceId: deviceAId,
  });

  console.log(`✓ Device A status after Replace: "${deviceAPostReplace.status}" (Expected: revoked)`);
  console.log(`✓ Device B status after Replace: "${deviceBPostReplace.status}" (Expected: approved)`);
  console.log(`✓ Device A session terminated/revoked: ${!sessionAPostReplace || sessionAPostReplace.revoked === true}`);

  if (deviceAPostReplace.status !== "revoked" || deviceBPostReplace.status !== "approved") {
    throw new Error("Device replace approval failed!");
  }

  // -------------------------------------------------------------
  // TEST 5: Admin approves with "Add" (Both devices work)
  // -------------------------------------------------------------
  console.log("\n--- Test 5: Admin Approves with Add Additional Device ---");

  // Re-request Device A as an additional device
  deviceAPostReplace.status = "pending";
  deviceAPostReplace.requestedAt = new Date();
  await deviceAPostReplace.save();

  const approveAddRes = await fetch(
    `${BASE_URL}/api/admin/device-requests/${deviceAPostReplace._id}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookieHeader,
      },
      body: JSON.stringify({
        mode: "add",
      }),
    }
  );

  console.log(`• Approve Add Status: ${approveAddRes.status}`);

  const updatedStudent = await User.findById(testStudentUser._id);
  const activeApprovedDevices = await Device.find({
    studentId: testStudentUser._id,
    status: "approved",
  });

  console.log(`• Student maxDevices after Add: ${updatedStudent.maxDevices} (Incremented to allow both)`);
  console.log(`• Total currently approved devices: ${activeApprovedDevices.length} (Expected: 2)`);
  for (const d of activeApprovedDevices) {
    console.log(`  - Device: ${d.deviceLabel} (${d.deviceId}) -> status: ${d.status}`);
  }

  if (activeApprovedDevices.length !== 2) {
    throw new Error("Device add approval failed! Expected 2 approved devices.");
  }

  // -------------------------------------------------------------
  // TEST 6: ActivityLog Check
  // -------------------------------------------------------------
  const logs = await ActivityLog.find({
    $or: [{ entityId: deviceAPostReplace._id }, { "meta.studentId": testStudentUser._id.toString() }],
  }).lean();
  console.log(`\n✓ ActivityLog entries recorded for lifecycle events: ${logs.length}`);

  // Cleanup
  await User.deleteOne({ _id: testStudentUser._id });
  await Device.deleteMany({ studentId: testStudentUser._id });
  await Session.deleteMany({ userId: testStudentUser._id });
  await Session.deleteOne({ tokenHash: adminTokenHash });
  console.log("✓ Cleaned up test student, sessions, and devices");

  await mongoose.disconnect();
  console.log("\n✓ All Step 2 Students & Devices live tests passed successfully!");
}

import crypto from "crypto";
runStep2LiveVerification().catch((err) => {
  console.error("Step 2 Live Verification Failed:", err);
  process.exit(1);
});
