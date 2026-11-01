import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { parseAndValidateImport } from "@/server/services/studentAdminService.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseAndValidateImport(buffer);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
