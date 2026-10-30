import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import connectDB from "@/server/db/connect.js";
import { Course } from "@/lib/models/Course";
import { Enquiry } from "@/lib/models/Enquiry";
import { getCurrentStudent } from "@/server/auth/session.js";
import { createAdminNotification } from "@/server/services/notificationService.js";

// Validation schema for general course access dialog
const courseAccessInputSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  studentId: z.string().nullable().optional(),
  name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  note: z.string().optional().default(""),
  source: z.string().default("course-page"),
});

// Validation schema for Contact page
const contactPageInputSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, "Please enter a valid 10-digit Indian phone number"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  website: z.string().optional(), // Honeypot field
  source: z.string().default("Contact page"),
});

// In-memory rate limiter for general course access (15 requests per minute per IP)
const accessIpMap = new Map();
function checkCourseAccessRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 15;
  const history = accessIpMap.get(ip) || [];
  const recent = history.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  accessIpMap.set(ip, recent);
  return true;
}

// In-memory rate limiter for Contact Page (5 requests per hour per IP)
const contactIpMap = new Map();
function checkContactRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const max = 5;
  const history = contactIpMap.get(ip) || [];
  const recent = history.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  contactIpMap.set(ip, recent);
  return true;
}

export async function POST(request) {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const body = await request.json().catch(() => ({}));

    // Distinguish Contact page submission vs course-specific access request
    const isContactPage =
      body.source === "Contact page" ||
      body.source === "contact-page" ||
      (Boolean(body.subject) && Boolean(body.message) && !body.courseId);

    await connectDB();

    if (isContactPage) {
      // 1. Contact Page Rate Limiting (5 per hour)
      if (!checkContactRateLimit(ip)) {
        return NextResponse.json(
          { error: "Too many enquiries from your IP. Please try again in an hour." },
          { status: 429 }
        );
      }

      // 2. Honeypot check (if filled, bot detected -> silently return success)
      if (body.website && body.website.trim() !== "") {
        return NextResponse.json({
          success: true,
          message: "Thank you! We'll get back to you shortly.",
        });
      }

      // 3. Validation
      const parsed = contactPageInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid input" },
          { status: 400 }
        );
      }

      const { name, phone, email, subject, message } = parsed.data;

      // 4. Save Enquiry
      const enquiry = await Enquiry.create({
        courseId: null,
        studentId: null,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        note: message.trim(),
        source: "Contact page",
        status: "new",
        createdAt: new Date(),
      });

      // 5. Notify admin in real-time
      try {
        await createAdminNotification({
          type: "enquiry",
          title: "New Contact Enquiry",
          message: `${name.trim()} sent an enquiry: "${subject.trim()}"`,
          link: "/admin/enquiries",
          entityId: enquiry._id.toString(),
        });
      } catch (nErr) {
        console.warn("Failed to create admin notification for enquiry:", nErr);
      }

      return NextResponse.json({
        success: true,
        message: "Thank you! We'll get back to you shortly.",
        enquiryId: enquiry._id.toString(),
      });
    }

    // Otherwise, Course Access Request
    if (!checkCourseAccessRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many enquiries. Please try again in a minute." },
        { status: 429 }
      );
    }

    const parsed = courseAccessInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { courseId, source, note } = parsed.data;
    let { name, phone, studentId } = parsed.data;

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

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
      source: source || "course-page",
      status: "new",
      createdAt: new Date(),
    });

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
