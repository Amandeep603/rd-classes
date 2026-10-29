import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectDB();
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Database connection failed";
    // Never expose any connection string
    const sanitizedError = errorMessage.replace(/mongodb(\+srv)?:\/\/[^\s'"]+/gi, "[REDACTED_URI]");
    return NextResponse.json(
      { ok: false, error: sanitizedError },
      { status: 500 }
    );
  }
}
