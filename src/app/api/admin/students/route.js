import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import {
  getStudentsListPaginated,
  createStudent,
} from "@/server/services/studentAdminService.js";
import { formatPublicError } from "@/lib/publicError.js";

export async function GET(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const batch = searchParams.get("batch") || "";
    const deviceFilter = searchParams.get("device") || "";
    const courseId = searchParams.get("course") || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const limit = parseInt(searchParams.get("limit") || "20", 10) || 20;

    const data = await getStudentsListPaginated({
      search,
      status,
      batch,
      deviceFilter,
      courseId,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    const { userMessage, refCode, isKnown } = formatPublicError(error);
    return NextResponse.json(
      { error: userMessage, reference: refCode },
      { status: isKnown ? 400 : 500 }
    );
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
      batch: body.batch,
      loginId: body.loginId,
      courseIds: body.courseIds || [],
      sendEmail: body.sendEmail !== false,
      adminId: admin.user._id,
    });

    return NextResponse.json({ success: true, credentials: result });
  } catch (error) {
    const { userMessage, refCode, isKnown } = formatPublicError(error);
    return NextResponse.json(
      { error: userMessage, reference: refCode },
      { status: isKnown ? 400 : 500 }
    );
  }
}
