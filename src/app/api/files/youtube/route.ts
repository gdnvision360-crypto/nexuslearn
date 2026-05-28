import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { youtubeDownloadSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = youtubeDownloadSchema.parse(body);

    // Extract video ID from URL
    const urlObj = new URL(validated.url);
    let videoId = urlObj.searchParams.get("v");
    if (!videoId) {
      // Handle youtu.be short URLs
      videoId = urlObj.pathname.replace("/", "").replace("shorts/", "").replace("embed/", "");
    }

    if (!videoId) {
      return Response.json({ error: "Could not extract video ID" }, { status: 400 });
    }

    const title = validated.title || `YouTube Video - ${videoId}`;
    const key = `youtube/${user.id}/${videoId}-${Date.now()}`;

    // Create a pending file record
    const file = await prisma.file.create({
      data: {
        name: `${title}.mp4`,
        originalName: `${title}.mp4`,
        mimeType: "video/mp4",
        size: BigInt(0),
        url: validated.url,
        key,
        uploadedById: user.id,
        parentType: null,
        parentId: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "YOUTUBE_DOWNLOAD_QUEUED",
        entityType: "FILE",
        entityId: file.id,
        metadata: { url: validated.url, videoId },
      },
    });

    return Response.json(
      {
        fileId: file.id,
        videoId,
        status: "pending",
        message: "YouTube download has been queued for processing",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
