import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import {
  validateYouTubeUrl,
  getVideoInfo,
  downloadVideoToS3,
  type DownloadQuality,
} from "@/lib/youtube";
import { buildStorageKey, getPublicUrl } from "@/lib/s3";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { url, quality = "highest", folderId } = body as {
      url: string;
      quality?: DownloadQuality;
      folderId?: string;
    };

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    const { valid, videoId } = validateYouTubeUrl(url);
    if (!valid || !videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get video info
    const videoInfo = await getVideoInfo(url);

    // Generate S3 key
    const uuid = randomUUID();
    const sanitizedTitle = videoInfo.title
      .replace(/[^a-zA-Z0-9\s_-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 100);
    const extension = quality === "audioonly" ? "m4a" : "mp4";
    const filename = `${sanitizedTitle}.${extension}`;
    const s3Key = buildStorageKey(
      user.id,
      "youtube",
      videoId,
      uuid,
      filename
    );

    const bucket = process.env.S3_BUCKET!;

    // Create file record with pending status
    const fileRecord = await prisma.file.create({
      data: {
        name: filename,
        originalName: `${videoInfo.title}.${extension}`,
        mimeType: quality === "audioonly" ? "audio/mp4" : "video/mp4",
        size: 0,
        url: "",
        key: s3Key,
        uploadedById: user.id,
        folderId: folderId ?? null,
        parentType: "COURSE",
        parentId: null,
      },
    });

    // Start download in background
    // In production, this would be a queue job (Bull, SQS, etc.)
    // For now, we run it and return immediately with the file ID
    downloadVideoToS3({
      url,
      quality,
      s3Key,
      bucket,
      onProgress: (percent) => {
        // In production: update progress via WebSocket or polling endpoint
        console.log(`Download progress for ${fileRecord.id}: ${percent}%`);
      },
    })
      .then(async ({ size, contentType }) => {
        const publicUrl = getPublicUrl(s3Key);
        await prisma.file.update({
          where: { id: fileRecord.id },
          data: {
            url: publicUrl,
            size: BigInt(size),
            mimeType: contentType,
          },
        });
        console.log(`YouTube download completed: ${fileRecord.id}`);
      })
      .catch(async (error) => {
        console.error(`YouTube download failed for ${fileRecord.id}:`, error);
        // Mark file as failed by deleting the record
        await prisma.file.delete({
          where: { id: fileRecord.id },
        }).catch(() => {
          // Ignore if already deleted
        });
      });

    return NextResponse.json({
      fileId: fileRecord.id,
      videoInfo: {
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        author: videoInfo.author,
      },
      status: "processing",
      message: "Download started. Check file status for progress.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
