import { NextResponse } from "next/server";
import { logoutUser } from "@/server/auth/authService.js";

export async function POST() {
  try {
    await logoutUser("student");
    return NextResponse.json({ success: true, redirectTo: "/student-login" });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Failed to log out" }, { status: 500 });
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
