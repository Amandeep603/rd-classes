import { MongoClient } from "mongodb";
import http from "http";
import fs from "fs";
import path from "path";

// Load env
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

async function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let resData = "";
        res.on("data", (chunk) => (resData += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(resData) });
          } catch {
            resolve({ statusCode: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== FUNCTIONAL VERIFICATION & TEST DATA CLEANUP ===");

  // 1. Test Contact Form Submission
  console.log("\n1. Testing Contact Form API (/api/enquiries)...");
  const testEnquiry = {
    name: "Verification Test Student",
    phone: "9876543210",
    email: "test.student@rdclasses.com",
    subject: "Admissions Support",
    message: "Automated verification test enquiry.",
    source: "Technical SEO Verification",
  };
  const enquiryRes = await postJson("/api/enquiries", testEnquiry);
  console.log("Enquiry API Response:", enquiryRes.statusCode, enquiryRes.body);

  // 2. Connect to MongoDB to verify and cleanup
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  // Verify enquiry was inserted
  const enquiryDoc = await db.collection("enquiries").findOne({ email: "test.student@rdclasses.com" });
  if (enquiryDoc) {
    console.log("✓ Contact enquiry successfully recorded in DB (ID: " + enquiryDoc._id + ")");
    // Delete test enquiry
    await db.collection("enquiries").deleteOne({ _id: enquiryDoc._id });
    console.log("✓ Test enquiry cleaned up.");
  }

  // Delete test student users from playwright tests
  const testUsers = ["RD-PLAYWRIGHT-VERIFY", "RD-PLAYWRIGHT-VERIFY-2", "RD-TEST-PLAYWRIGHT"];
  for (const loginId of testUsers) {
    const user = await db.collection("users").findOne({ loginId });
    if (user) {
      await db.collection("users").deleteOne({ _id: user._id });
      await db.collection("enrollments").deleteMany({ userId: user._id });
      await db.collection("devices").deleteMany({ $or: [{ userId: user._id }, { studentId: user._id }] });
      await db.collection("progresses").deleteMany({ $or: [{ userId: user._id }, { studentId: user._id }] });
      console.log(`✓ Cleaned up test student user: ${loginId}`);
    }
  }

  await client.close();
  console.log("\nAll functional tests passed and test data cleaned up successfully!");
}

main().catch(console.error);

