// ============================================================
// Video Studio — FFmpeg Processing API
// Handles trim, merge, split, overlay, filter, aspect-ratio,
// extract-audio, replace-audio, to-gif operations
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";

const PROCESSING_DIR = path.join(os.tmpdir(), "nexuslearn-video");
const OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || "./public/videos";

type FFmpegOperation =
  | "trim"
  | "merge"
  | "split"
  | "overlay"
  | "filter"
  | "aspect-ratio"
  | "extract-audio"
  | "replace-audio"
  | "to-gif";

interface ProcessRequest {
  operation: FFmpegOperation;
  input?: string;
  [key: string]: unknown;
}

// ============================================================
// FFmpeg command builder
// ============================================================

function buildFFmpegArgs(req: ProcessRequest, inputPath: string, outputPath: string): string[] {
  switch (req.operation) {
    case "trim":
      return [
        "-i", inputPath,
        "-ss", String(req.startTime || 0),
        "-to", String(req.endTime || 10),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-y", outputPath,
      ];

    case "split": {
      // FFmpeg will be called twice for split
      const splitAt = Number(req.splitAt) || 5;
      return [
        "-i", inputPath,
        "-ss", "0",
        "-to", String(splitAt),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "fast",
        "-y", outputPath,
      ];
    }

    case "overlay": {
      const overlay = req.overlay as {
        type: string;
        content: string;
        position: { x: number; y: number };
        startTime: number;
        endTime: number;
        style?: { fontSize?: number; color?: string };
      };
      if (overlay?.type === "text") {
        const fontSize = overlay.style?.fontSize || 48;
        const color = (overlay.style?.color || "#ffffff").replace("#", "");
        const escapedText = overlay.content.replace(/'/g, "\\'").replace(/:/g, "\\:");
        return [
          "-i", inputPath,
          "-vf", `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=0x${color}:x=${overlay.position.x}:y=${overlay.position.y}:enable='between(t,${overlay.startTime},${overlay.endTime})'`,
          "-c:v", "libx264",
          "-c:a", "copy",
          "-preset", "fast",
          "-y", outputPath,
        ];
      }
      // Image overlay
      return [
        "-i", inputPath,
        "-c:v", "libx264",
        "-c:a", "copy",
        "-y", outputPath,
      ];
    }

    case "filter": {
      const filters = req.filters as Record<string, unknown>;
      const vfParts: string[] = [];
      if (filters?.brightness != null) vfParts.push(`eq=brightness=${filters.brightness}`);
      if (filters?.contrast != null) vfParts.push(`eq=contrast=${filters.contrast}`);
      if (filters?.saturation != null) vfParts.push(`eq=saturation=${filters.saturation}`);
      if (filters?.blur) vfParts.push(`boxblur=${filters.blur}`);
      if (filters?.sharpen) vfParts.push(`unsharp=5:5:${filters.sharpen}`);
      if (filters?.grayscale) vfParts.push("hue=s=0");
      if (filters?.sepia) vfParts.push("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131");
      if (filters?.vignette) vfParts.push("vignette");
      if (filters?.reverse) vfParts.push("reverse");

      const vf = vfParts.length > 0 ? vfParts.join(",") : "null";
      const args = ["-i", inputPath, "-vf", vf, "-c:v", "libx264", "-c:a", "copy", "-preset", "fast", "-y", outputPath];

      if (filters?.speed && Number(filters.speed) !== 1) {
        const speed = Number(filters.speed);
        const atempoFilters: string[] = [];
        let remaining = speed;
        while (remaining > 2) { atempoFilters.push("atempo=2.0"); remaining /= 2; }
        while (remaining < 0.5) { atempoFilters.push("atempo=0.5"); remaining /= 0.5; }
        atempoFilters.push(`atempo=${remaining}`);
        args.splice(args.indexOf("-vf") + 1, 1, `${vf},setpts=${1 / speed}*PTS`);
        args.splice(args.indexOf("-c:a"), 2, "-af", atempoFilters.join(","), "-c:v", "libx264");
      }

      return args;
    }

    case "aspect-ratio": {
      const ratioMap: Record<string, string> = {
        "16:9": "1920:1080",
        "9:16": "1080:1920",
        "1:1": "1080:1080",
        "4:3": "1440:1080",
      };
      const size = ratioMap[req.ratio as string] || "1920:1080";
      return [
        "-i", inputPath,
        "-vf", `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2`,
        "-c:v", "libx264",
        "-c:a", "copy",
        "-preset", "fast",
        "-y", outputPath,
      ];
    }

    case "extract-audio": {
      const audioFormat = (req.format as string) || "mp3";
      const codecMap: Record<string, string> = { mp3: "libmp3lame", wav: "pcm_s16le", aac: "aac" };
      return [
        "-i", inputPath,
        "-vn",
        "-c:a", codecMap[audioFormat] || "libmp3lame",
        "-y", outputPath.replace(/\.\w+$/, `.${audioFormat}`),
      ];
    }

    case "replace-audio":
      return [
        "-i", inputPath,
        "-i", req.audioUrl as string,
        "-c:v", "copy",
        "-c:a", "aac",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        "-y", outputPath,
      ];

    case "to-gif": {
      const w = Number(req.width) || 480;
      return [
        "-i", inputPath,
        "-ss", String(req.startTime || 0),
        "-t", String(req.duration || 5),
        "-vf", `fps=15,scale=${w}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        "-loop", "0",
        "-y", outputPath.replace(/\.\w+$/, ".gif"),
      ];
    }

    default:
      return ["-i", inputPath, "-c", "copy", "-y", outputPath];
  }
}

// ============================================================
// Run FFmpeg process
// ============================================================

async function runFFmpeg(args: string[]): Promise<{ success: boolean; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", args);
    let stderr = "";
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    proc.on("close", (code) => {
      resolve({ success: code === 0, stderr });
    });
    proc.on("error", (err) => {
      resolve({ success: false, stderr: err.message });
    });
  });
}

// ============================================================
// Download file to temp
// ============================================================

async function downloadToTemp(url: string, filename: string): Promise<string> {
  await mkdir(PROCESSING_DIR, { recursive: true });
  const filePath = path.join(PROCESSING_DIR, filename);

  if (url.startsWith("/") || url.startsWith("./")) {
    // Local file — just return the path
    return url;
  }

  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buffer);
  return filePath;
}

// ============================================================
// POST handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProcessRequest = await req.json();
    const { operation } = body;

    if (!operation) {
      return NextResponse.json({ error: "Missing operation" }, { status: 400 });
    }

    const jobId = uuidv4();
    await mkdir(PROCESSING_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Download input file
    let inputPath = "";
    if (body.input) {
      inputPath = await downloadToTemp(body.input, `${jobId}-input.mp4`);
    }

    const outputExt = operation === "to-gif" ? "gif" : operation === "extract-audio" ? (body.format as string || "mp3") : "mp4";
    const outputFilename = `${jobId}-output.${outputExt}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Handle merge separately (multiple inputs)
    if (operation === "merge") {
      const clips = body.clips as { url: string; startTime?: number; endTime?: number }[];
      if (!clips || clips.length === 0) {
        return NextResponse.json({ error: "No clips provided" }, { status: 400 });
      }

      // Download all clips
      const clipPaths: string[] = [];
      const concatListPath = path.join(PROCESSING_DIR, `${jobId}-concat.txt`);
      let concatContent = "";

      for (let i = 0; i < clips.length; i++) {
        const clipPath = await downloadToTemp(clips[i].url, `${jobId}-clip-${i}.mp4`);

        // Trim clip if needed
        if (clips[i].startTime != null || clips[i].endTime != null) {
          const trimmedPath = path.join(PROCESSING_DIR, `${jobId}-clip-${i}-trimmed.mp4`);
          await runFFmpeg([
            "-i", clipPath,
            "-ss", String(clips[i].startTime || 0),
            ...(clips[i].endTime ? ["-to", String(clips[i].endTime)] : []),
            "-c:v", "libx264", "-c:a", "aac", "-preset", "fast",
            "-y", trimmedPath,
          ]);
          clipPaths.push(trimmedPath);
          concatContent += `file '${trimmedPath}'\n`;
        } else {
          clipPaths.push(clipPath);
          concatContent += `file '${clipPath}'\n`;
        }
      }

      await writeFile(concatListPath, concatContent);

      const mergeArgs = [
        "-f", "concat", "-safe", "0",
        "-i", concatListPath,
        "-c:v", "libx264", "-c:a", "aac", "-preset", "fast",
        "-y", outputPath,
      ];

      const result = await runFFmpeg(mergeArgs);

      // Cleanup temp clips
      for (const p of clipPaths) { try { await unlink(p); } catch {} }
      try { await unlink(concatListPath); } catch {}

      if (!result.success) {
        return NextResponse.json({ error: "Merge failed", details: result.stderr }, { status: 500 });
      }

      const outputUrl = `/videos/${outputFilename}`;

      // Save to database
      await prisma.videoProject.update({
        where: { id: jobId },
        data: { status: "completed", outputUrl },
      }).catch(() => {}); // Ignore if no project record

      return NextResponse.json({ outputUrl, jobId });
    }

    // Handle split (two outputs)
    if (operation === "split") {
      const splitAt = Number(body.splitAt) || 5;
      const part1Path = path.join(OUTPUT_DIR, `${jobId}-part1.mp4`);
      const part2Path = path.join(OUTPUT_DIR, `${jobId}-part2.mp4`);

      const result1 = await runFFmpeg([
        "-i", inputPath,
        "-ss", "0", "-to", String(splitAt),
        "-c:v", "libx264", "-c:a", "aac", "-preset", "fast",
        "-y", part1Path,
      ]);

      const result2 = await runFFmpeg([
        "-i", inputPath,
        "-ss", String(splitAt),
        "-c:v", "libx264", "-c:a", "aac", "-preset", "fast",
        "-y", part2Path,
      ]);

      if (!result1.success || !result2.success) {
        return NextResponse.json({ error: "Split failed" }, { status: 500 });
      }

      return NextResponse.json({
        part1Url: `/videos/${jobId}-part1.mp4`,
        part2Url: `/videos/${jobId}-part2.mp4`,
        jobId,
      });
    }

    // Standard single-input operations
    const args = buildFFmpegArgs(body, inputPath, outputPath);
    const result = await runFFmpeg(args);

    // Cleanup temp input
    if (body.input && !body.input.startsWith("/") && !body.input.startsWith("./")) {
      try { await unlink(inputPath); } catch {}
    }

    if (!result.success) {
      return NextResponse.json({ error: `${operation} failed`, details: result.stderr }, { status: 500 });
    }

    const outputUrl = `/videos/${outputFilename}`;

    return NextResponse.json({ outputUrl, jobId });
  } catch (error) {
    console.error("Video processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
