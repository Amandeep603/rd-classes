import { NextResponse } from "next/server";
import { logoutUser } from "@/server/auth/authService.js";
import { formatPublicError } from "@/lib/publicError.js";

export async function POST() {
  try {
    await logoutUser("student");
    return NextResponse.json({ success: true, redirectTo: "/student-login" });
  } catch (err) {
    const { userMessage, refCode } = formatPublicError(err);
    return NextResponse.json({ error: userMessage, reference: refCode }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await logoutUser("student");
  } catch {
    // Ignore error on redirect
  }
  return NextResponse.redirect(new URL("/student-login", request.url));
}
