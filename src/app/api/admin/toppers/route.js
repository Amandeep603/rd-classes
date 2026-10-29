import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Topper } from "@/lib/models/Topper";
import { logAuditEvent } from "@/server/services/audit.js";

const topperSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  school: z.string().min(1, "School is required").trim(),
  year: z.coerce.string().trim().default("2025"),
  marks: z.coerce.string().min(1, "Marks/Score is required").trim(),
  photoUrl: z.string().optional().default(""),
  publicId: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const toppers = await Topper.find().sort({ year: -1, marks: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, toppers });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch toppers." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const parsed = topperSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = parsed.error.issues[0]?.message || "Invalid data.";
      return NextResponse.json({ error: firstErr }, { status: 400 });
    }

    await connectDB();
    const topper = await Topper.create(parsed.data);

    await logAuditEvent({
      actorId: admin.user._id,
      action: "topper.created",
      targetType: "Topper",
      targetId: topper._id.toString(),
      meta: { name: topper.name, marks: topper.marks, year: topper.year },
    });

    return NextResponse.json({ success: true, topper }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Failed to create topper." },
      { status: err?.message === "UNAUTHORIZED_ADMIN" ? 401 : 500 }
    );
  }
}
