// ============================================================
// Thumbnail Generator API — AI + FFmpeg + Canvas
// Generate thumbnails, extract frames, create variations
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";

const OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || "./public/videos";

// ============================================================
// POST — Generate thumbnails
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await mkdir(OUTPUT_DIR, { recursive: true });

    // ---- Extract frame from video ----
    if (action === "extract-frame") {
      const { videoUrl, timestamp } = body;
      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl required" }, { status: 400 });
      }

      const jobId = uuidv4();
      const outputPath = path.join(OUTPUT_DIR, `${jobId}-thumb.png`);
      const time = timestamp || 1;

      return new Promise<NextResponse>((resolve) => {
        const proc = spawn("ffmpeg", [
          "-i", videoUrl,
          "-ss", String(time),
          "-frames:v", "1",
          "-q:v", "2",
          "-y", outputPath,
        ]);

        proc.on("close", (code) => {
          if (code === 0) {
            resolve(
              NextResponse.json({
                url: `/videos/${jobId}-thumb.png`,
                width: 1920,
                height: 1080,
                format: "png",
              })
            );
          } else {
            resolve(NextResponse.json({ error: "Frame extraction failed" }, { status: 500 }));
          }
        });

        proc.on("error", () => {
          resolve(NextResponse.json({ error: "FFmpeg not found" }, { status: 500 }));
        });
      });
    }

    // ---- Generate AI thumbnail ----
    if (action === "generate-ai") {
      const { title, subtitle, style, aspectRatio } = body;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });
      }

      const sizeMap: Record<string, string> = {
        "16:9": "1792x1024",
        "1:1": "1024x1024",
        "4:3": "1024x1024",
        "9:16": "1024x1792",
      };

      const prompt = `Create a professional ${style || "clean"} video thumbnail. 
        Title: "${title || "Video"}". ${subtitle ? `Subtitle: "${subtitle}".` : ""}
        Style: ${style || "professional"}, modern, eye-catching.
        Include bold text overlay with the title.
        High quality, 4K resolution look.`;

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          size: sizeMap[aspectRatio || "16:9"] || "1792x1024",
          quality: "hd",
          n: 1,
        }),
      });

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        return NextResponse.json({ error: "Thumbnail generation failed" }, { status: 500 });
      }

      return NextResponse.json({
        url: imageUrl,
        width: aspectRatio === "9:16" ? 1024 : 1792,
        height: aspectRatio === "9:16" ? 1792 : 1024,
        format: "png",
      });
    }

    // ---- Auto-generate multiple thumbnails from video ----
    if (action === "auto-generate" || !action) {
      const { videoUrl, count } = body;
      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl required" }, { status: 400 });
      }

      const numThumbs = Math.min(count || 4, 10);
      const jobId = uuidv4();

      // Get video duration
      const duration = await getVideoDuration(videoUrl);
      const interval = duration / (numThumbs + 1);

      const thumbnails: { url: string; timestamp: number }[] = [];

      for (let i = 1; i <= numThumbs; i++) {
        const timestamp = interval * i;
        const outputPath = path.join(OUTPUT_DIR, `${jobId}-thumb-${i}.png`);

        await new Promise<void>((resolve) => {
          const proc = spawn("ffmpeg", [
            "-i", videoUrl,
            "-ss", String(timestamp),
            "-frames:v", "1",
            "-q:v", "2",
            "-y", outputPath,
          ]);
          proc.on("close", () => resolve());
          proc.on("error", () => resolve());
        });

        thumbnails.push({
          url: `/videos/${jobId}-thumb-${i}.png`,
          timestamp,
        });
      }

      return NextResponse.json({ thumbnails });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Thumbnail API error:", error);
    return NextResponse.json({ error: "Thumbnail generation failed" }, { status: 500 });
  }
}

// ============================================================
// Get video duration using ffprobe
// ============================================================

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);
    let output = "";
    proc.stdout.on("data", (data) => { output += data.toString(); });
    proc.on("close", () => {
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 60 : duration);
    });
    proc.on("error", () => resolve(60));
  });
}
