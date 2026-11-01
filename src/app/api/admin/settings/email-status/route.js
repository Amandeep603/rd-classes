import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { getSmtpConfig } from "@/server/email/mailer.js";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const config = getSmtpConfig();

    return NextResponse.json({
      isConfigured: config.isConfigured,
      host: config.host,
      port: config.port,
      user: config.user,
      displayName: config.displayName,
      fromHeader: config.fromHeader,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

