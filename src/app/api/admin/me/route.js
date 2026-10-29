import { requireAdminApi } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    await connectDB();
    const user = await User.findById(auth.user._id).select("name email phone role photoUrl avatarUrl").lean();
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name || "Ronak Dugar",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "admin",
        photoUrl: user.photoUrl || user.avatarUrl || "",
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
