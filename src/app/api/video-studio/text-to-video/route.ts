// ============================================================
// Text-to-Video API — AI-powered video generation
// Converts text prompts into complete video projects
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// Types
// ============================================================

interface TextToVideoRequest {
  prompt: string;
  style: "professional" | "casual" | "cinematic" | "educational" | "social-media" | "minimal";
  voiceover: boolean;
  voiceId?: string;
  musicTrack?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3";
  resolution: "720p" | "1080p" | "4k";
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

interface GeneratedScene {
  order: number;
  narration: string;
  visualDescription: string;
  duration: number;
  transition: string;
  backgroundImageUrl?: string;
  elements: {
    type: string;
    content: string;
    position: string;
    animation: string;
  }[];
}

// ============================================================
// POST — Generate video from text
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TextToVideoRequest = await req.json();
    const { prompt, style, voiceover, voiceId, duration, aspectRatio, resolution, branding } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const projectId = uuidv4();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured" }, { status: 500 });
    }

    // ---- Step 1: Generate video script & scenes via AI ----
    const scriptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional video script writer. Generate a structured video script based on the user's prompt.
            
Return a JSON object with:
- "title": Video title
- "description": Brief description
- "scenes": Array of scene objects, each with:
  - "order": Scene number (starting from 0)
  - "narration": Text to be spoken/displayed
  - "visualDescription": Description of background/visuals for this scene
  - "duration": Duration in seconds (3-15)
  - "transition": One of: fade, dissolve, wipe-left, slide-left, zoom-in, none
  - "elements": Array of visual elements with type, content, position, animation

Target total duration: ${duration || 30} seconds.
Style: ${style || "professional"}.
Aspect ratio: ${aspectRatio || "16:9"}.
Make it engaging, concise, and visually descriptive.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      }),
    });

    const scriptData = await scriptResponse.json();
    let parsedScript;

    try {
      parsedScript = JSON.parse(scriptData.choices[0].message.content);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI script" }, { status: 500 });
    }

    const scenes: GeneratedScene[] = parsedScript.scenes || [];

    // ---- Step 2: Generate background images for each scene ----
    const scenesWithImages = await Promise.all(
      scenes.map(async (scene) => {
        try {
          const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: `${scene.visualDescription}. Style: ${style}, cinematic quality, ${aspectRatio} aspect ratio. No text in the image.`,
              size: aspectRatio === "9:16" ? "1024x1792" : "1792x1024",
              quality: "hd",
              n: 1,
            }),
          });
          const imgData = await imgResponse.json();
          return {
            ...scene,
            backgroundImageUrl: imgData.data?.[0]?.url || undefined,
          };
        } catch {
          return scene;
        }
      })
    );

    // ---- Step 3: Generate voiceover if requested ----
    let voiceoverUrl: string | undefined;
    if (voiceover) {
      const fullNarration = scenes.map((s) => s.narration).join(" ");

      // Try ElevenLabs first, fall back to OpenAI TTS
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          const ttsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "21m00Tcm4TlvDq8ikWAM"}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: fullNarration,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
              }),
            }
          );
          if (ttsResponse.ok) {
            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const audioPath = `./public/videos/${projectId}-voiceover.mp3`;
            const { writeFile: wf } = await import("fs/promises");
            await wf(audioPath, audioBuffer);
            voiceoverUrl = `/videos/${projectId}-voiceover.mp3`;
          }
        } catch {}
      }

      // Fallback to OpenAI TTS
      if (!voiceoverUrl) {
        try {
          const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1-hd",
              voice: voiceId || "alloy",
              input: fullNarration,
              response_format: "mp3",
            }),
          });

          if (ttsResponse.ok) {
            const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
            const audioPath = `./public/videos/${projectId}-voiceover.mp3`;
            const { writeFile: wf } = await import("fs/promises");
            await wf(audioPath, audioBuffer);
            voiceoverUrl = `/videos/${projectId}-voiceover.mp3`;
          }
        } catch {}
      }
    }

    // ---- Step 4: Save project to database ----
    const project = await prisma.videoProject.create({
      data: {
        id: projectId,
        userId: session.user.id,
        title: parsedScript.title || "Untitled Video",
        description: parsedScript.description || "",
        type: "text-to-video",
        status: "draft",
        aspectRatio: aspectRatio || "16:9",
        resolution: resolution || "1080p",
        fps: 30,
        duration: scenes.reduce((sum, s) => sum + s.duration, 0),
        scenes: JSON.stringify(scenesWithImages),
        voiceoverUrl,
        branding: branding ? JSON.stringify(branding) : undefined,
      },
    });

    return NextResponse.json({
      projectId: project.id,
      title: parsedScript.title,
      description: parsedScript.description,
      scenes: scenesWithImages,
      voiceoverUrl,
      estimatedDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      status: "draft",
    });
  } catch (error) {
    console.error("Text-to-video error:", error);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}

// ============================================================
// GET — List user's video projects
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      prisma.videoProject.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.videoProject.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Video projects fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
