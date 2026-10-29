import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import {
  getStudentsListPaginated,
  createStudent,
} from "@/server/services/studentAdminService.js";

export async function GET(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const deviceFilter = searchParams.get("device") || "";
    const courseId = searchParams.get("course") || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await getStudentsListPaginated({
      search,
      status,
      deviceFilter,
      courseId,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;
  const admin = auth;

  try {
    const body = await request.json();

    const result = await createStudent({
      name: body.name,
      email: body.email,
      phone: body.phone,
      loginId: body.loginId,
      courseIds: body.courseIds || [],
      adminId: admin.user._id,
    });

    return NextResponse.json({ success: true, credentials: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
