import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session.js";
import { getVimeoFolderVideos } from "@/server/services/vimeoService.js";

export async function GET(request, { params }) {
  try {
    await requireAdmin();
    const resolvedParams = await params;
    const folderId = resolvedParams?.id;

    if (!folderId) {
      return NextResponse.json(
        { success: false, error: "Missing folder ID" },
        { status: 400 }
      );
    }

    const videos = await getVimeoFolderVideos(folderId);

    return NextResponse.json({
      success: true,
      folderId,
      videos,
      count: videos.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch folder videos",
      },
      { status: 400 }
    );
  }
}

