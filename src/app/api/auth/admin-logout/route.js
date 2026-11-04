import { logoutUser } from "@/server/auth/authService.js";
import { formatPublicError } from "@/lib/publicError.js";

export async function POST() {
  try {
    await logoutUser("admin");
    return Response.json({ success: true, redirectTo: "/admin-login" });
  } catch (err) {
    const { userMessage, refCode } = formatPublicError(err);
    return Response.json({ error: userMessage, reference: refCode }, { status: 500 });
  }
}
