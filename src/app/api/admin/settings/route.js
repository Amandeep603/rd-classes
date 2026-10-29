import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/server/auth/session.js";
import connectDB from "@/lib/mongodb";
import { Setting } from "@/lib/models/Setting";
import { logAuditEvent } from "@/server/services/audit.js";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    let settings = await Setting.findOne().lean();
    if (!settings) {
      settings = await Setting.create({
        instituteName: "RD Classes",
        tagline: "Faridabad's Premier Accountancy Institute for CBSE Class 11 & 12",
        ownerName: "Ronak Dugar",
        phone: "+91 83685 45620",
        whatsapp: "918368545620",
        whatsappNumber: "918368545620",
        email: "contact@rdclasses.com",
        address: "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006",
        city: "Faridabad",
        googleMapsUrl: "https://maps.google.com/?q=RD+Classes+Sector+9+Faridabad",
        workingHours: "Mon - Sat: 9:00 AM - 7:30 PM",
        socialLinks: {
          instagram: "https://instagram.com",
          youtube: "https://youtube.com",
          facebook: "https://facebook.com",
          telegram: "https://telegram.org",
        },
        logoUrl: "",
        defaultMaxDevices: 1,
      });
    }
    return Response.json({ success: true, settings });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to fetch settings." },
      { status: err?.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    await connectDB();
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (body.instituteName !== undefined) {
      settings.instituteName = String(body.instituteName).trim();
      settings.workspaceName = settings.instituteName;
    }
    if (body.tagline !== undefined) settings.tagline = String(body.tagline).trim();
    if (body.ownerName !== undefined) settings.ownerName = String(body.ownerName).trim();
    if (body.phone !== undefined) settings.phone = String(body.phone).trim();
    if (body.whatsapp !== undefined) {
      settings.whatsapp = String(body.whatsapp).trim();
      settings.whatsappNumber = settings.whatsapp;
    }
    if (body.whatsappDefaultMessage !== undefined) {
      settings.whatsappDefaultMessage = String(body.whatsappDefaultMessage).trim();
    }
    if (body.email !== undefined) settings.email = String(body.email).trim();
    if (body.address !== undefined) settings.address = String(body.address).trim();
    if (body.city !== undefined) settings.city = String(body.city).trim();
    if (body.googleMapsUrl !== undefined) settings.googleMapsUrl = String(body.googleMapsUrl).trim();
    if (body.workingHours !== undefined) settings.workingHours = String(body.workingHours).trim();
    if (body.logoUrl !== undefined) settings.logoUrl = String(body.logoUrl).trim();
    if (body.socialLinks !== undefined && typeof body.socialLinks === "object") {
      settings.socialLinks = {
        instagram: body.socialLinks.instagram ? String(body.socialLinks.instagram).trim() : "",
        youtube: body.socialLinks.youtube ? String(body.socialLinks.youtube).trim() : "",
        facebook: body.socialLinks.facebook ? String(body.socialLinks.facebook).trim() : "",
        telegram: body.socialLinks.telegram ? String(body.socialLinks.telegram).trim() : "",
      };
    }
    if (body.defaultMaxDevices !== undefined) {
      settings.defaultMaxDevices = Math.max(1, Number(body.defaultMaxDevices) || 1);
    }
    if (body.deviceLockMode !== undefined && ["relaxed", "strict"].includes(body.deviceLockMode)) {
      settings.deviceLockMode = body.deviceLockMode;
    }

    await settings.save();

    await logAuditEvent({
      actorId: admin.user._id,
      action: "settings.updated",
      entity: "Setting",
      entityId: settings._id.toString(),
      meta: { instituteName: settings.instituteName },
    });

    // Revalidate public pages and cached settings tag
    try {
      revalidateTag("settings");
      revalidatePath("/");
      revalidatePath("/courses");
      revalidatePath("/results");
      revalidatePath("/gallery");
      revalidatePath("/notes");
      revalidatePath("/admin/settings");
    } catch (e) {
      console.warn("Revalidation notice:", e?.message);
    }

    return Response.json({ success: true, settings });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Failed to update settings." },
      { status: 500 }
    );
  }
}
