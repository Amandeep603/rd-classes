import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/lib/models/Course";
import { Enquiry } from "@/lib/models/Enquiry";
import { getCurrentStudent } from "@/server/auth/session.js";
import { createAdminNotification } from "@/server/services/notificationService.js";

const enquiryInputSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  studentId: z.string().nullable().optional(),
  name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  note: z.string().optional().default(""),
  source: z.enum(["course-page", "lecture-lock", "notes-lock"]).default("course-page"),
});

// In-memory sliding window rate limiter (15 requests per minute per IP)
const ipMap = new Map();
function checkEnquiryRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 15;
  const history = ipMap.get(ip) || [];
  const recent = history.filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return false;
  }
  recent.push(now);
  ipMap.set(ip, recent);
  return true;
}

export async function POST(request) {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (!checkEnquiryRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many enquiries. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = enquiryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { courseId, source, note } = parsed.data;
    let { name, phone, studentId } = parsed.data;

    await connectDB();

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Auto-detect logged-in student if not explicitly provided
    if (!studentId || !name) {
      const auth = await getCurrentStudent();
      if (auth?.user) {
        if (!studentId) studentId = auth.user._id;
        if (!name) name = auth.user.name || "";
        if (!phone) phone = auth.user.phone || "";
      }
    }

    const enquiry = await Enquiry.create({
      courseId,
      studentId: studentId || null,
      name: (name || "").trim(),
      phone: (phone || "").trim(),
      note: (note || "").trim(),
      source,
      status: "new",
    });

    // Notify admin in real-time
    try {
      await createAdminNotification({
        type: "enquiry",
        title: "New Access Request",
        message: `New access request for ${course.title}${name ? ` by ${name}` : ""}`,
        link: "/admin/enquiries",
        entityId: enquiry._id.toString(),
      });
    } catch (nErr) {
      console.warn("Failed to create admin notification for enquiry:", nErr);
    }

    return NextResponse.json({
      success: true,
      enquiryId: enquiry._id.toString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to record enquiry." },
      { status: 500 }
    );
  }
}

