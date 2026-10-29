import { logoutUser } from "@/server/auth/authService.js";

export async function POST() {
  try {
    await logoutUser("admin");
    return Response.json({ success: true, redirectTo: "/admin-login" });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
