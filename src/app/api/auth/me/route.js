import { NextResponse } from "next/server";
import { getStudentAuthStatus } from "@/server/auth/session.js";

export async function GET() {
  try {
    const auth = await getStudentAuthStatus();
    if (!auth?.authenticated || !auth?.user) {
      return NextResponse.json(null, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const { name } = auth.user;
    const cleanName = (name || "").trim();
    const firstName = cleanName.split(/\s+/)[0] || "Student";
    const initial = firstName.charAt(0).toUpperCase() || "S";

    return NextResponse.json(
      {
        role: "student",
        name: cleanName,
        firstName,
        initial,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch {
    return NextResponse.json(null, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
