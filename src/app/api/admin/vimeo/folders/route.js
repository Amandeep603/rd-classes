import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { getVimeoFolders } from "@/server/services/vimeoService.js";

export async function GET() {
  try {
    await requireAdmin();

    const { folders, tree } = await getVimeoFolders();

    return NextResponse.json({
      success: true,
      folders,
      tree,
      count: folders.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch Vimeo folders",
      },
      { status: 400 }
    );
  }
}

