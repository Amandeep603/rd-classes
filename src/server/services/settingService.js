import "server-only";
import { cacheTag, cacheLife } from "next/cache";
import connectDB from "../db/connect.js";
import { Settings } from "../db/models/Settings.js";

/**
 * Cached public settings for site shell and footer.
 */
export async function getCachedSettings() {
  "use cache";
  cacheTag("settings");
  cacheLife("max");
  try {
    await connectDB();
    const setting = await Settings.findOne().lean();
    return setting ? JSON.parse(JSON.stringify(setting)) : null;
  } catch {
    return null;
  }
}

export default getCachedSettings;
