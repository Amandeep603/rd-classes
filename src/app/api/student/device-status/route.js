import crypto from "crypto";
import { NextResponse } from "next/server";
import connectDB from "@/server/db/connect.js";
import { DeviceRequest } from "@/server/db/models/DeviceRequest.js";
import { getCookie, COOKIE_NAMES } from "@/server/auth/cookies.js";
import { formatPublicError } from "@/lib/publicError.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryDeviceId = searchParams.get("deviceId") || searchParams.get("token");
    const cookieDevice = await getCookie(COOKIE_NAMES.DEVICE);
    const cookiePending = await getCookie(COOKIE_NAMES.PENDING);

    const identifier = queryDeviceId || cookieDevice || cookiePending;
    if (!identifier) {
      return NextResponse.json({ error: "Missing deviceId or token" }, { status: 400 });
    }

    await connectDB();
    const tokenHash = crypto.createHash("sha256").update(identifier).digest("hex");

    const req = await DeviceRequest.findOne({
      $or: [
        { deviceId: identifier },
        { tokenHash: identifier },
        { tokenHash },
        { requestTokenHash: identifier },
        { requestTokenHash: tokenHash },
        { pendingId: identifier },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!req) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({
      status: req.status, // "pending" | "approved" | "rejected"
      note: req.note || "",
      studentNote: req.studentNote || "",
      label: req.label || "",
      requestId: req._id.toString(),
    });
  } catch (error) {
    const { userMessage, refCode, isKnown } = formatPublicError(error);
    return NextResponse.json(
      { error: userMessage, reference: refCode },
      { status: isKnown ? 400 : 500 }
    );
  }
}
