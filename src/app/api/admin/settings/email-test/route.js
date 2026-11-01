import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/session.js";
import { sendTestEmail } from "@/server/email/mailer.js";

export async function POST(request) {
  const auth = await requireAdminApi();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const recipient = body.recipient || auth.user.email;

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json(
        { error: "Admin email address is not configured. Please provide a recipient email." },
        { status: 400 }
      );
    }

    const result = await sendTestEmail({
      to: recipient,
      adminId: auth.user._id,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${recipient}.`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          error: `Test email failed with code: ${result.errorCode}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

