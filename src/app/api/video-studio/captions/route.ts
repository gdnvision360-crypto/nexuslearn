// ============================================================
// Caption Generator API — Whisper AI + Translation
// Generate, translate, and burn captions into videos
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "nexuslearn-captions");

interface CaptionEntry {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: "top" | "center" | "bottom";
  maxWidth: number;
}

// ============================================================
// Whisper-based transcription
// ============================================================

async function transcribeWithWhisper(
  audioPath: string,
  language?: string
): Promise<{ segments: CaptionEntry[]; language: string; confidence: number }> {
  // Use OpenAI Whisper API
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const audioBuffer = await readFile(audioPath);
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer]), "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");
  if (language) formData.append("language", language);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.statusText}`);
  }

  const data = await response.json();

  const segments: CaptionEntry[] = (data.segments || []).map(
    (seg: { start: number; end: number; text: string }) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text.trim(),
    })
  );

  return {
    segments,
    language: data.language || language || "en",
    confidence: data.segments?.reduce(
      (sum: number, seg: { avg_logprob?: number }) => sum + (seg.avg_logprob || 0),
      0
    ) / (data.segments?.length || 1),
  };
}

// ============================================================
// Speaker diarization (basic — splits by silence gaps)
// ============================================================

function addSpeakerDiarization(segments: CaptionEntry[]): CaptionEntry[] {
  let currentSpeaker = 1;
  return segments.map((seg, i) => {
    // Simple heuristic: if gap > 2s, new speaker
    if (i > 0 && seg.startTime - segments[i - 1].endTime > 2) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
    }
    return { ...seg, speaker: `Speaker ${currentSpeaker}` };
  });
}

// ============================================================
// Extract audio from video
// ============================================================

async function extractAudio(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", videoPath,
      "-vn", "-c:a", "libmp3lame", "-q:a", "2",
      "-y", outputPath,
    ]);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error("Audio extraction failed"))));
    proc.on("error", reject);
  });
}

// ============================================================
// Format timestamps
// ============================================================

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

function formatVttTime(seconds: number): string {
  return formatSrtTime(seconds).replace(",", ".");
}

function toSrt(captions: CaptionEntry[]): string {
  return captions
    .map((entry, i) => {
      const start = formatSrtTime(entry.startTime);
      const end = formatSrtTime(entry.endTime);
      const speaker = entry.speaker ? `[${entry.speaker}] ` : "";
      return `${i + 1}\n${start} --> ${end}\n${speaker}${entry.text}\n`;
    })
    .join("\n");
}

function toVtt(captions: CaptionEntry[]): string {
  const lines = captions.map((entry) => {
    const start = formatVttTime(entry.startTime);
    const end = formatVttTime(entry.endTime);
    const speaker = entry.speaker ? `<v ${entry.speaker}>` : "";
    return `${start} --> ${end}\n${speaker}${entry.text}`;
  });
  return `WEBVTT\n\n${lines.join("\n\n")}`;
}

// ============================================================
// POST — Generate captions
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await mkdir(TEMP_DIR, { recursive: true });

    // ---- Generate captions from video/audio ----
    if (!action || action === "generate") {
      const { videoUrl, language, speakerDiarization, format } = body;

      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl required" }, { status: 400 });
      }

      const jobId = uuidv4();
      const inputPath = path.join(TEMP_DIR, `${jobId}-input.mp4`);
      const audioPath = path.join(TEMP_DIR, `${jobId}-audio.mp3`);

      // Download video
      if (videoUrl.startsWith("/") || videoUrl.startsWith("./")) {
        // Local file
      } else {
        const res = await fetch(videoUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        await writeFile(inputPath, buffer);
      }

      // Extract audio
      await extractAudio(videoUrl.startsWith("/") ? videoUrl : inputPath, audioPath);

      // Transcribe
      let { segments, language: detectedLang, confidence } = await transcribeWithWhisper(audioPath, language);

      // Add speaker diarization if requested
      if (speakerDiarization) {
        segments = addSpeakerDiarization(segments);
      }

      // Calculate duration
      const duration = segments.length > 0 ? segments[segments.length - 1].endTime : 0;

      // Save caption record
      await prisma.videoCaption.create({
        data: {
          id: jobId,
          userId: session.user.id,
          videoUrl,
          language: detectedLang,
          entries: JSON.stringify(segments),
          srt: toSrt(segments),
          vtt: toVtt(segments),
        },
      }).catch(() => {}); // Ignore if table doesn't exist yet

      // Cleanup
      try { await unlink(inputPath); } catch {}
      try { await unlink(audioPath); } catch {}

      return NextResponse.json({
        id: jobId,
        entries: segments,
        srt: toSrt(segments),
        vtt: toVtt(segments),
        language: detectedLang,
        confidence,
        duration,
      });
    }

    // ---- Translate captions ----
    if (action === "translate") {
      const { captions, targetLanguage } = body;

      if (!captions || !targetLanguage) {
        return NextResponse.json({ error: "captions and targetLanguage required" }, { status: 400 });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });
      }

      // Translate using GPT
      const textsToTranslate = captions.map((c: CaptionEntry) => c.text);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Translate the following texts to ${targetLanguage}. Return a JSON array of translated strings, maintaining the same order and count.`,
            },
            {
              role: "user",
              content: JSON.stringify(textsToTranslate),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const aiData = await response.json();
      let translatedTexts: string[];

      try {
        const parsed = JSON.parse(aiData.choices[0].message.content);
        translatedTexts = parsed.translations || parsed.texts || Object.values(parsed);
      } catch {
        translatedTexts = textsToTranslate; // Fallback to originals
      }

      const translatedCaptions: CaptionEntry[] = captions.map(
        (c: CaptionEntry, i: number) => ({
          ...c,
          text: translatedTexts[i] || c.text,
        })
      );

      return NextResponse.json({ captions: translatedCaptions });
    }

    // ---- Burn captions into video ----
    if (action === "burn") {
      const { videoUrl, captions, style } = body as {
        videoUrl: string;
        captions: CaptionEntry[];
        style: CaptionStyle;
      };

      if (!videoUrl || !captions) {
        return NextResponse.json({ error: "videoUrl and captions required" }, { status: 400 });
      }

      const jobId = uuidv4();
      const srtContent = toSrt(captions);
      const srtPath = path.join(TEMP_DIR, `${jobId}.srt`);
      await writeFile(srtPath, srtContent);

      const outputPath = path.join(
        process.env.VIDEO_OUTPUT_DIR || "./public/videos",
        `${jobId}-captioned.mp4`
      );

      const fontSize = style?.fontSize || 24;
      const fontColor = (style?.color || "#ffffff").replace("#", "") + "@1";
      const bgColor = (style?.backgroundColor || "#000000").replace("#", "") + `@${style?.backgroundOpacity || 0.5}`;
      const alignment = style?.position === "top" ? 6 : style?.position === "center" ? 10 : 2;

      const inputPath = videoUrl.startsWith("/") ? videoUrl : path.join(TEMP_DIR, `${jobId}-input.mp4`);
      if (!videoUrl.startsWith("/")) {
        const res = await fetch(videoUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        await writeFile(inputPath, buffer);
      }

      return new Promise<NextResponse>((resolve) => {
        const proc = spawn("ffmpeg", [
          "-i", inputPath,
          "-vf", `subtitles=${srtPath}:force_style='FontSize=${fontSize},PrimaryColour=&H${fontColor},BackColour=&H${bgColor},Alignment=${alignment}'`,
          "-c:v", "libx264",
          "-c:a", "copy",
          "-preset", "fast",
          "-y", outputPath,
        ]);

        proc.on("close", async (code) => {
          try { await unlink(srtPath); } catch {}
          if (!videoUrl.startsWith("/")) try { await unlink(inputPath); } catch {}

          if (code === 0) {
            resolve(NextResponse.json({ outputUrl: `/videos/${jobId}-captioned.mp4` }));
          } else {
            resolve(NextResponse.json({ error: "Caption burn failed" }, { status: 500 }));
          }
        });

        proc.on("error", () => {
          resolve(NextResponse.json({ error: "FFmpeg not found" }, { status: 500 }));
        });
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Caption API error:", error);
    return NextResponse.json({ error: "Caption processing failed" }, { status: 500 });
  }
}
