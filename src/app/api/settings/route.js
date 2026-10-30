import connectDB from "@/lib/mongodb";
import { Setting } from "@/lib/models/Setting";
import { SITE_CONFIG } from "@/constants/site";

export async function GET() {
  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    return Response.json({
      success: true,
      settings: {
        instituteName: settings?.instituteName || SITE_CONFIG.name,
        businessName: settings?.businessName || SITE_CONFIG.businessName,
        phone: settings?.phone || SITE_CONFIG.contact.phone,
        phoneDisplay: settings?.phoneDisplay || SITE_CONFIG.contact.phoneDisplay,
        whatsapp: settings?.whatsapp || SITE_CONFIG.contact.whatsappPhone,
        whatsappNumber: settings?.whatsappNumber || SITE_CONFIG.contact.whatsappPhone,
        email: settings?.email || SITE_CONFIG.contact.email,
        address: settings?.address || SITE_CONFIG.address,
        googleMapsUrl: settings?.googleMapsUrl || SITE_CONFIG.googleMapsUrl,
        website: settings?.website || SITE_CONFIG.website,
        socialLinks: settings?.socialLinks || SITE_CONFIG.socialLinks,
      },
    });
  } catch {
    return Response.json({
      success: true,
      settings: {
        instituteName: SITE_CONFIG.name,
        businessName: SITE_CONFIG.businessName,
        phone: SITE_CONFIG.contact.phone,
        phoneDisplay: SITE_CONFIG.contact.phoneDisplay,
        whatsapp: SITE_CONFIG.contact.whatsappPhone,
        whatsappNumber: SITE_CONFIG.contact.whatsappPhone,
        email: SITE_CONFIG.contact.email,
        address: SITE_CONFIG.address,
        googleMapsUrl: SITE_CONFIG.googleMapsUrl,
        website: SITE_CONFIG.website,
        socialLinks: SITE_CONFIG.socialLinks,
      },
    });
  }
}
