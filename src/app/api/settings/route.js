import connectDB from "@/lib/mongodb";
import { Setting } from "@/lib/models/Setting";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    return Response.json({
      success: true,
      settings: {
        instituteName: settings?.instituteName || "RD Classes",
        phone: settings?.phone || "+91 83685 45620",
        whatsapp: settings?.whatsapp || "918368545620",
        email: settings?.email || "contact@rdclasses.com",
        address: settings?.address || "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006",
        socialLinks: settings?.socialLinks || {},
      },
    });
  } catch {
    return Response.json({
      success: true,
      settings: {
        instituteName: "RD Classes",
        phone: "+91 83685 45620",
        whatsapp: "918368545620",
        email: "contact@rdclasses.com",
        address: "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006",
        socialLinks: {},
      },
    });
  }
}
