// ============================================================
// Video Studio Engine — Text-to-Video, Editor, Captions
// Powered by Remotion + FFmpeg + AI
// ============================================================

import { v4 as uuidv4 } from "uuid";

// ============================================================
// Types & Interfaces
// ============================================================

export type VideoProjectStatus = "draft" | "processing" | "completed" | "failed";
export type VideoProjectType = "text-to-video" | "edited" | "template" | "recording";
export type TransitionType = "fade" | "dissolve" | "wipe-left" | "wipe-right" | "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "none";
export type TextAnimationType = "fade-in" | "typewriter" | "slide-up" | "bounce" | "none";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: VideoProjectType;
  status: VideoProjectStatus;
  aspectRatio: AspectRatio;
  resolution: "720p" | "1080p" | "4k";
  fps: number;
  duration: number; // seconds
  outputUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoScene {
  id: string;
  projectId: string;
  order: number;
  duration: number; // seconds
  transition: TransitionType;
  transitionDuration: number; // seconds
  backgroundColor: string;
  backgroundMediaUrl?: string;
  backgroundMediaType?: "image" | "video" | "gradient";
  elements: SceneElement[];
}

export interface SceneElement {
  id: string;
  type: "text" | "image" | "video" | "shape" | "audio" | "caption";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  rotation: number; // degrees
  opacity: number; // 0-1
  startTime: number; // seconds from scene start
  endTime: number; // seconds from scene start
  animation: TextAnimationType;
  animationDuration: number;
  properties: TextProperties | ImageProperties | VideoProperties | ShapeProperties | AudioProperties | CaptionProperties;
}

export interface TextProperties {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "light";
  fontStyle: "normal" | "italic";
  color: string;
  backgroundColor?: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  textShadow?: string;
  stroke?: { color: string; width: number };
}

export interface ImageProperties {
  type: "image";
  src: string;
  fit: "cover" | "contain" | "fill";
  borderRadius: number;
  filter?: string;
}

export interface VideoProperties {
  type: "video";
  src: string;
  startAt: number; // trim start
  endAt: number; // trim end
  muted: boolean;
  playbackRate: number;
  fit: "cover" | "contain" | "fill";
}

export interface ShapeProperties {
  type: "shape";
  shape: "rectangle" | "circle" | "triangle" | "line" | "arrow";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface AudioProperties {
  type: "audio";
  src: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  startAt: number;
  endAt: number;
  loop: boolean;
}

export interface CaptionProperties {
  type: "caption";
  captions: CaptionEntry[];
  style: CaptionStyle;
}

export interface CaptionEntry {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: "top" | "center" | "bottom";
  maxWidth: number; // percentage
}

// ============================================================
// Text-to-Video AI Engine
// ============================================================

export interface TextToVideoRequest {
  prompt: string;
  style: "professional" | "casual" | "cinematic" | "educational" | "social-media" | "minimal";
  voiceover: boolean;
  voiceId?: string;
  musicTrack?: string;
  duration: number; // target seconds
  aspectRatio: AspectRatio;
  resolution: "720p" | "1080p" | "4k";
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export interface TextToVideoResult {
  projectId: string;
  scenes: VideoScene[];
  script: string;
  voiceoverUrl?: string;
  estimatedDuration: number;
}

export class TextToVideoEngine {
  // Parse user prompt into structured scenes using AI
  async generateFromPrompt(request: TextToVideoRequest): Promise<TextToVideoResult> {
    const projectId = uuidv4();

    // Step 1: Generate script from prompt using AI
    const script = await this.generateScript(request.prompt, request.style, request.duration);

    // Step 2: Break script into scenes
    const sceneTexts = this.splitIntoScenes(script, request.duration);

    // Step 3: Generate scene visuals
    const scenes: VideoScene[] = await Promise.all(
      sceneTexts.map((text, index) =>
        this.createScene(projectId, text, index, request)
      )
    );

    // Step 4: Generate voiceover if requested
    let voiceoverUrl: string | undefined;
    if (request.voiceover) {
      voiceoverUrl = await this.generateVoiceover(script, request.voiceId);
    }

    return {
      projectId,
      scenes,
      script,
      voiceoverUrl,
      estimatedDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
    };
  }

  private async generateScript(prompt: string, style: string, targetDuration: number): Promise<string> {
    // Call AI API (OpenAI/Anthropic) to generate video script
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "text",
        prompt: `Generate a video script for: "${prompt}". 
          Style: ${style}. Target duration: ${targetDuration}s.
          Format each scene on a new line with [SCENE X] markers.
          Include visual descriptions in [VISUAL: ...] tags.
          Include narration text directly.
          Keep it engaging and concise.`,
      }),
    });
    const data = await response.json();
    return data.text || prompt;
  }

  private splitIntoScenes(script: string, targetDuration: number): string[] {
    const sceneMarker = /\[SCENE\s*\d+\]/gi;
    const parts = script.split(sceneMarker).filter((s) => s.trim());
    if (parts.length === 0) {
      // If no scene markers, split by paragraphs
      return script.split(/\n\n+/).filter((s) => s.trim());
    }
    return parts;
  }

  private async createScene(
    projectId: string,
    text: string,
    index: number,
    request: TextToVideoRequest
  ): Promise<VideoScene> {
    // Extract visual description if present
    const visualMatch = text.match(/\[VISUAL:\s*(.*?)\]/i);
    const narration = text.replace(/\[VISUAL:.*?\]/gi, "").trim();

    const sceneId = uuidv4();
    const sceneDuration = Math.max(3, Math.min(15, narration.split(" ").length * 0.4));

    const elements: SceneElement[] = [];

    // Add title/narration text
    if (narration) {
      elements.push({
        id: uuidv4(),
        type: "text",
        x: 10,
        y: 60,
        width: 80,
        height: 30,
        rotation: 0,
        opacity: 1,
        startTime: 0.5,
        endTime: sceneDuration - 0.5,
        animation: request.style === "cinematic" ? "fade-in" : "typewriter",
        animationDuration: 0.8,
        properties: {
          type: "text",
          content: narration,
          fontFamily: request.branding?.fontFamily || this.getDefaultFont(request.style),
          fontSize: 48,
          fontWeight: "bold",
          fontStyle: "normal",
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.4,
          letterSpacing: 0,
          textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
        },
      });
    }

    // Add branding logo if provided
    if (request.branding?.logo && index === 0) {
      elements.push({
        id: uuidv4(),
        type: "image",
        x: 5,
        y: 5,
        width: 15,
        height: 10,
        rotation: 0,
        opacity: 0.9,
        startTime: 0,
        endTime: sceneDuration,
        animation: "fade-in",
        animationDuration: 0.5,
        properties: {
          type: "image",
          src: request.branding.logo,
          fit: "contain",
          borderRadius: 0,
        },
      });
    }

    return {
      id: sceneId,
      projectId,
      order: index,
      duration: sceneDuration,
      transition: index === 0 ? "none" : this.getTransition(request.style),
      transitionDuration: 0.5,
      backgroundColor: request.branding?.primaryColor || this.getDefaultBg(request.style),
      backgroundMediaUrl: visualMatch ? await this.generateBackgroundImage(visualMatch[1]) : undefined,
      backgroundMediaType: visualMatch ? "image" : undefined,
      elements,
    };
  }

  private async generateBackgroundImage(description: string): Promise<string> {
    // Call AI image generation API
    const response = await fetch("/api/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: description, size: "1920x1080" }),
    });
    const data = await response.json();
    return data.url || "";
  }

  private async generateVoiceover(script: string, voiceId?: string): Promise<string> {
    // Call TTS API (ElevenLabs / Azure / Google)
    const response = await fetch("/api/ai/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: script.replace(/\[.*?\]/g, ""),
        voiceId: voiceId || "default",
      }),
    });
    const data = await response.json();
    return data.audioUrl || "";
  }

  private getDefaultFont(style: string): string {
    const fonts: Record<string, string> = {
      professional: "Inter",
      casual: "Poppins",
      cinematic: "Playfair Display",
      educational: "Open Sans",
      "social-media": "Montserrat",
      minimal: "Helvetica Neue",
    };
    return fonts[style] || "Inter";
  }

  private getDefaultBg(style: string): string {
    const bgs: Record<string, string> = {
      professional: "#1a1a2e",
      casual: "#667eea",
      cinematic: "#0f0f0f",
      educational: "#2d3436",
      "social-media": "#6c5ce7",
      minimal: "#ffffff",
    };
    return bgs[style] || "#1a1a2e";
  }

  private getTransition(style: string): TransitionType {
    const transitions: Record<string, TransitionType> = {
      professional: "fade",
      casual: "slide-left",
      cinematic: "dissolve",
      educational: "wipe-right",
      "social-media": "zoom-in",
      minimal: "fade",
    };
    return transitions[style] || "fade";
  }
}

// ============================================================
// Video Editor Engine — FFmpeg-based processing
// ============================================================

export interface TrimOptions {
  startTime: number;
  endTime: number;
}

export interface MergeOptions {
  clips: { url: string; startTime?: number; endTime?: number }[];
  transition: TransitionType;
  transitionDuration: number;
}

export interface OverlayOptions {
  type: "text" | "image" | "watermark";
  content: string; // text content or image URL
  position: { x: number; y: number };
  size: { width: number; height: number };
  startTime: number;
  endTime: number;
  style?: Partial<TextProperties>;
}

export interface VideoFilterOptions {
  brightness?: number; // -1 to 1
  contrast?: number; // -1 to 1
  saturation?: number; // 0 to 2
  blur?: number; // 0 to 20
  sharpen?: number; // 0 to 5
  speed?: number; // 0.25 to 4
  reverse?: boolean;
  grayscale?: boolean;
  sepia?: boolean;
  vignette?: boolean;
}

export class VideoEditorEngine {
  private ffmpegEndpoint = "/api/video-studio/process";

  // Trim a video
  async trim(videoUrl: string, options: TrimOptions): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "trim",
        input: videoUrl,
        startTime: options.startTime,
        endTime: options.endTime,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Merge multiple clips
  async merge(options: MergeOptions): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "merge",
        clips: options.clips,
        transition: options.transition,
        transitionDuration: options.transitionDuration,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Split video at timestamp
  async split(videoUrl: string, splitAt: number): Promise<{ part1: string; part2: string }> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "split",
        input: videoUrl,
        splitAt,
      }),
    });
    const data = await response.json();
    return { part1: data.part1Url, part2: data.part2Url };
  }

  // Add text/image overlays
  async addOverlay(videoUrl: string, overlay: OverlayOptions): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "overlay",
        input: videoUrl,
        overlay,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Apply filters
  async applyFilters(videoUrl: string, filters: VideoFilterOptions): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "filter",
        input: videoUrl,
        filters,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Change aspect ratio
  async changeAspectRatio(videoUrl: string, ratio: AspectRatio): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "aspect-ratio",
        input: videoUrl,
        ratio,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Extract audio from video
  async extractAudio(videoUrl: string, format: "mp3" | "wav" | "aac" = "mp3"): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extract-audio",
        input: videoUrl,
        format,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Replace audio track
  async replaceAudio(videoUrl: string, audioUrl: string): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "replace-audio",
        input: videoUrl,
        audioUrl,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Generate GIF from video
  async toGif(videoUrl: string, startTime: number, duration: number, width: number = 480): Promise<string> {
    const response = await fetch(this.ffmpegEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "to-gif",
        input: videoUrl,
        startTime,
        duration,
        width,
      }),
    });
    const data = await response.json();
    return data.outputUrl;
  }
}

// ============================================================
// Caption Generator Engine — Whisper-based
// ============================================================

export interface CaptionGenerateOptions {
  videoUrl: string;
  language?: string;
  translateTo?: string;
  format: "srt" | "vtt" | "json" | "txt";
  speakerDiarization?: boolean;
  maxWordsPerLine?: number;
  highlightActiveWord?: boolean;
}

export interface GeneratedCaptions {
  entries: CaptionEntry[];
  srt: string;
  vtt: string;
  language: string;
  confidence: number;
  duration: number;
}

export class CaptionGeneratorEngine {
  // Generate captions from audio/video
  async generate(options: CaptionGenerateOptions): Promise<GeneratedCaptions> {
    const response = await fetch("/api/video-studio/captions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    return response.json();
  }

  // Translate existing captions
  async translate(captions: CaptionEntry[], targetLanguage: string): Promise<CaptionEntry[]> {
    const response = await fetch("/api/video-studio/captions/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captions, targetLanguage }),
    });
    const data = await response.json();
    return data.captions;
  }

  // Burn captions into video
  async burnCaptions(
    videoUrl: string,
    captions: CaptionEntry[],
    style: CaptionStyle
  ): Promise<string> {
    const response = await fetch("/api/video-studio/captions/burn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, captions, style }),
    });
    const data = await response.json();
    return data.outputUrl;
  }

  // Format captions to SRT
  toSrt(captions: CaptionEntry[]): string {
    return captions
      .map((entry, i) => {
        const start = this.formatTimestamp(entry.startTime);
        const end = this.formatTimestamp(entry.endTime);
        const speaker = entry.speaker ? `[${entry.speaker}] ` : "";
        return `${i + 1}\n${start} --> ${end}\n${speaker}${entry.text}\n`;
      })
      .join("\n");
  }

  // Format captions to WebVTT
  toVtt(captions: CaptionEntry[]): string {
    const lines = captions.map((entry) => {
      const start = this.formatTimestamp(entry.startTime);
      const end = this.formatTimestamp(entry.endTime);
      const speaker = entry.speaker ? `<v ${entry.speaker}>` : "";
      return `${start} --> ${end}\n${speaker}${entry.text}`;
    });
    return `WEBVTT\n\n${lines.join("\n\n")}`;
  }

  private formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
  }
}

// ============================================================
// Thumbnail Generator Engine
// ============================================================

export interface ThumbnailOptions {
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  style: "clean" | "bold" | "gradient" | "photo" | "minimal" | "youtube";
  aspectRatio: "16:9" | "1:1" | "4:3";
  customBackground?: string;
  overlayImage?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  textPosition: "center" | "left" | "right" | "bottom";
  extractFrameAt?: number; // extract frame from video at timestamp
}

export interface GeneratedThumbnail {
  url: string;
  width: number;
  height: number;
  format: "png" | "jpg" | "webp";
}

export class ThumbnailGeneratorEngine {
  // Generate thumbnail from options
  async generate(options: ThumbnailOptions): Promise<GeneratedThumbnail[]> {
    const response = await fetch("/api/video-studio/thumbnail/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    return response.json();
  }

  // Extract frame from video as thumbnail
  async extractFrame(videoUrl: string, timestamp: number): Promise<GeneratedThumbnail> {
    const response = await fetch("/api/video-studio/thumbnail/extract-frame", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, timestamp }),
    });
    return response.json();
  }

  // Generate multiple thumbnail variations
  async generateVariations(baseOptions: ThumbnailOptions, count: number = 4): Promise<GeneratedThumbnail[]> {
    const styles: ThumbnailOptions["style"][] = ["clean", "bold", "gradient", "photo", "minimal", "youtube"];
    const variations: GeneratedThumbnail[] = [];

    for (let i = 0; i < Math.min(count, styles.length); i++) {
      const thumbs = await this.generate({ ...baseOptions, style: styles[i] });
      variations.push(...thumbs);
    }

    return variations;
  }

  // Generate with canvas (client-side)
  async generateClientSide(options: ThumbnailOptions): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const aspectRatios = { "16:9": [1920, 1080], "1:1": [1080, 1080], "4:3": [1440, 1080] };
    const [width, height] = aspectRatios[options.aspectRatio] || [1920, 1080];
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Background
    if (options.customBackground) {
      const img = await this.loadImage(options.customBackground);
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, options.branding?.primaryColor || "#6366f1");
      gradient.addColorStop(1, options.branding?.secondaryColor || "#8b5cf6");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Overlay dimming
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, width, height);

    // Title text
    if (options.title) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.floor(height * 0.08)}px Inter, sans-serif`;
      ctx.textAlign = options.textPosition === "center" ? "center" : "left";
      const x = options.textPosition === "center" ? width / 2 : width * 0.08;
      const y = options.textPosition === "bottom" ? height * 0.75 : height * 0.45;
      this.wrapText(ctx, options.title, x, y, width * 0.84, height * 0.1);
    }

    // Subtitle
    if (options.subtitle) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = `${Math.floor(height * 0.04)}px Inter, sans-serif`;
      const x = options.textPosition === "center" ? width / 2 : width * 0.08;
      ctx.fillText(options.subtitle, x, height * 0.58, width * 0.84);
    }

    // Logo
    if (options.branding?.logo) {
      const logo = await this.loadImage(options.branding.logo);
      ctx.drawImage(logo, width * 0.04, height * 0.04, width * 0.12, height * 0.12);
    }

    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line.trim(), x, currentY);
        line = word + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }
}

// ============================================================
// Video Template Engine
// ============================================================

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: "course-intro" | "course-outro" | "announcement" | "promo" | "social" | "tutorial" | "certificate" | "testimonial" | "countdown" | "lower-third";
  thumbnail: string;
  duration: number;
  aspectRatio: AspectRatio;
  scenes: VideoScene[];
  customizableFields: CustomizableField[];
}

export interface CustomizableField {
  id: string;
  label: string;
  type: "text" | "image" | "color" | "video" | "audio";
  elementId: string; // links to SceneElement.id
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
}

export const VIDEO_TEMPLATES: Omit<VideoTemplate, "scenes">[] = [
  {
    id: "course-intro-professional",
    name: "Professional Course Intro",
    description: "Clean, professional intro with logo, course title, and instructor name",
    category: "course-intro",
    thumbnail: "/templates/course-intro-pro.jpg",
    duration: 8,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "title", label: "Course Title", type: "text", elementId: "title-el", defaultValue: "Course Title", maxLength: 60 },
      { id: "subtitle", label: "Instructor Name", type: "text", elementId: "subtitle-el", defaultValue: "Your Name", maxLength: 40 },
      { id: "logo", label: "Logo", type: "image", elementId: "logo-el", defaultValue: "" },
      { id: "bg-color", label: "Background Color", type: "color", elementId: "bg-el", defaultValue: "#1a1a2e" },
    ],
  },
  {
    id: "course-outro-cta",
    name: "Course Outro with CTA",
    description: "End screen with call-to-action, social links, and next course suggestion",
    category: "course-outro",
    thumbnail: "/templates/course-outro-cta.jpg",
    duration: 10,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "cta-text", label: "Call to Action", type: "text", elementId: "cta-el", defaultValue: "Subscribe for more!", maxLength: 50 },
      { id: "next-course", label: "Next Course Title", type: "text", elementId: "next-el", defaultValue: "Coming Soon", maxLength: 60 },
      { id: "bg-color", label: "Brand Color", type: "color", elementId: "bg-el", defaultValue: "#6366f1" },
    ],
  },
  {
    id: "announcement-bold",
    name: "Bold Announcement",
    description: "Eye-catching announcement video for events, updates, or launches",
    category: "announcement",
    thumbnail: "/templates/announcement-bold.jpg",
    duration: 12,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "headline", label: "Headline", type: "text", elementId: "headline-el", defaultValue: "Big Announcement!", maxLength: 40 },
      { id: "details", label: "Details", type: "text", elementId: "details-el", defaultValue: "Something amazing is coming...", maxLength: 100 },
      { id: "date", label: "Date", type: "text", elementId: "date-el", defaultValue: "Coming Soon", maxLength: 30 },
    ],
  },
  {
    id: "social-promo-reel",
    name: "Social Media Promo Reel",
    description: "Vertical video optimized for Instagram Reels, TikTok, and YouTube Shorts",
    category: "social",
    thumbnail: "/templates/social-reel.jpg",
    duration: 15,
    aspectRatio: "9:16",
    customizableFields: [
      { id: "hook", label: "Hook Text", type: "text", elementId: "hook-el", defaultValue: "Did you know?", maxLength: 30 },
      { id: "body", label: "Main Message", type: "text", elementId: "body-el", defaultValue: "Your message here", maxLength: 80 },
      { id: "cta", label: "CTA", type: "text", elementId: "cta-el", defaultValue: "Link in bio!", maxLength: 25 },
    ],
  },
  {
    id: "tutorial-step-by-step",
    name: "Step-by-Step Tutorial",
    description: "Numbered steps with screen recording placeholders and narration zones",
    category: "tutorial",
    thumbnail: "/templates/tutorial-steps.jpg",
    duration: 30,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "title", label: "Tutorial Title", type: "text", elementId: "title-el", defaultValue: "How to...", maxLength: 60 },
      { id: "step1", label: "Step 1", type: "text", elementId: "step1-el", defaultValue: "First, do this", maxLength: 80 },
      { id: "step2", label: "Step 2", type: "text", elementId: "step2-el", defaultValue: "Then, do that", maxLength: 80 },
      { id: "step3", label: "Step 3", type: "text", elementId: "step3-el", defaultValue: "Finally, done!", maxLength: 80 },
    ],
  },
  {
    id: "certificate-animation",
    name: "Certificate Celebration",
    description: "Animated certificate reveal with confetti and student name",
    category: "certificate",
    thumbnail: "/templates/certificate-anim.jpg",
    duration: 8,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "student-name", label: "Student Name", type: "text", elementId: "name-el", defaultValue: "Student Name", maxLength: 50 },
      { id: "course-name", label: "Course Name", type: "text", elementId: "course-el", defaultValue: "Course Title", maxLength: 60 },
      { id: "org-name", label: "Organization", type: "text", elementId: "org-el", defaultValue: "NexusLearn", maxLength: 40 },
    ],
  },
  {
    id: "testimonial-quote",
    name: "Testimonial / Quote",
    description: "Student testimonial with photo, quote, and rating stars",
    category: "testimonial",
    thumbnail: "/templates/testimonial.jpg",
    duration: 10,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "quote", label: "Quote", type: "text", elementId: "quote-el", defaultValue: '"This course changed my life!"', maxLength: 120 },
      { id: "name", label: "Student Name", type: "text", elementId: "name-el", defaultValue: "Jane Doe", maxLength: 40 },
      { id: "photo", label: "Student Photo", type: "image", elementId: "photo-el", defaultValue: "" },
    ],
  },
  {
    id: "countdown-event",
    name: "Event Countdown",
    description: "Animated countdown timer for upcoming events, webinars, or launches",
    category: "countdown",
    thumbnail: "/templates/countdown.jpg",
    duration: 15,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "event-name", label: "Event Name", type: "text", elementId: "event-el", defaultValue: "Live Webinar", maxLength: 50 },
      { id: "date", label: "Event Date", type: "text", elementId: "date-el", defaultValue: "January 1, 2025", maxLength: 30 },
      { id: "bg-image", label: "Background", type: "image", elementId: "bg-el", defaultValue: "" },
    ],
  },
  {
    id: "lower-third-speaker",
    name: "Speaker Lower Third",
    description: "Animated lower-third overlay for speaker identification",
    category: "lower-third",
    thumbnail: "/templates/lower-third.jpg",
    duration: 5,
    aspectRatio: "16:9",
    customizableFields: [
      { id: "name", label: "Speaker Name", type: "text", elementId: "name-el", defaultValue: "Speaker Name", maxLength: 40 },
      { id: "title", label: "Title / Role", type: "text", elementId: "title-el", defaultValue: "CEO & Founder", maxLength: 40 },
      { id: "color", label: "Accent Color", type: "color", elementId: "accent-el", defaultValue: "#6366f1" },
    ],
  },
];
