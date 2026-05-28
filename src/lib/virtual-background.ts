/**
 * Virtual Background Processor
 * Supports: blur, virtual images, green screen (chroma key), and none
 *
 * Uses Canvas API + requestAnimationFrame for real-time processing.
 * For production at scale, consider @mediapipe/selfie_segmentation
 * or LiveKit's @livekit/track-processors for GPU-accelerated segmentation.
 */

export type BackgroundMode = "none" | "blur" | "image" | "greenscreen";

export interface VirtualBackgroundConfig {
  mode: BackgroundMode;
  /** Blur intensity (px) — used when mode is "blur" */
  blurIntensity?: number;
  /** Image URL — used when mode is "image" */
  imageUrl?: string;
  /** Chroma key color (hex) — used when mode is "greenscreen" */
  chromaKeyColor?: string;
  /** Chroma key tolerance 0-1 — used when mode is "greenscreen" */
  chromaKeyTolerance?: number;
  /** Chroma key smoothness 0-1 — used when mode is "greenscreen" */
  chromaKeySmoothness?: number;
}

const DEFAULT_CONFIG: VirtualBackgroundConfig = {
  mode: "none",
  blurIntensity: 10,
  chromaKeyColor: "#00ff00",
  chromaKeyTolerance: 0.3,
  chromaKeySmoothness: 0.1,
};

/**
 * Hex color string to {r, g, b} (0-255)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 255, b: 0 };
}

/**
 * Compute color distance in RGB space (0-1 normalized)
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return (
    Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) / 441.67 // sqrt(255^2 * 3)
  );
}

export class VirtualBackgroundProcessor {
  private config: VirtualBackgroundConfig;
  private sourceVideo: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D;
  private backgroundImage: HTMLImageElement | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private outputStream: MediaStream | null = null;

  constructor(config?: Partial<VirtualBackgroundConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Hidden processing canvas
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;

    // Output canvas (what the user/others see)
    this.outputCanvas = document.createElement("canvas");
    this.outputCtx = this.outputCanvas.getContext("2d")!;
  }

  /**
   * Update configuration (can be called while running)
   */
  updateConfig(config: Partial<VirtualBackgroundConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.imageUrl && config.mode === "image") {
      this.loadBackgroundImage(config.imageUrl);
    }
  }

  /**
   * Load a background image from URL
   */
  async loadBackgroundImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.backgroundImage = img;
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Start processing a video track.
   * Returns a new MediaStream with the processed video track.
   */
  async start(videoTrack: MediaStreamTrack): Promise<MediaStream> {
    // Create a video element to read from
    this.sourceVideo = document.createElement("video");
    this.sourceVideo.srcObject = new MediaStream([videoTrack]);
    this.sourceVideo.autoplay = true;
    this.sourceVideo.muted = true;
    this.sourceVideo.playsInline = true;
    await this.sourceVideo.play();

    // Match canvas size to video
    const settings = videoTrack.getSettings();
    const width = settings.width || 640;
    const height = settings.height || 480;
    this.canvas.width = width;
    this.canvas.height = height;
    this.outputCanvas.width = width;
    this.outputCanvas.height = height;

    // Pre-load background image if set
    if (this.config.mode === "image" && this.config.imageUrl) {
      await this.loadBackgroundImage(this.config.imageUrl);
    }

    // Start the processing loop
    this.isRunning = true;
    this.processFrame();

    // Capture output stream
    this.outputStream = this.outputCanvas.captureStream(30);
    return this.outputStream;
  }

  /**
   * Stop processing and clean up
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.sourceVideo) {
      this.sourceVideo.pause();
      this.sourceVideo.srcObject = null;
      this.sourceVideo = null;
    }
    if (this.outputStream) {
      this.outputStream.getTracks().forEach((t) => t.stop());
      this.outputStream = null;
    }
  }

  /**
   * Get the output canvas element (for direct rendering)
   */
  getOutputCanvas(): HTMLCanvasElement {
    return this.outputCanvas;
  }

  // ────────────────────────────────────────────────────────
  // Frame Processing
  // ────────────────────────────────────────────────────────

  private processFrame = (): void => {
    if (!this.isRunning || !this.sourceVideo) return;

    // Draw source video onto hidden canvas
    this.ctx.drawImage(
      this.sourceVideo,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    switch (this.config.mode) {
      case "none":
        this.processNone();
        break;
      case "blur":
        this.processBlur();
        break;
      case "image":
        this.processVirtualImage();
        break;
      case "greenscreen":
        this.processGreenScreen();
        break;
    }

    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  /**
   * No processing — pass through
   */
  private processNone(): void {
    this.outputCtx.drawImage(this.canvas, 0, 0);
  }

  /**
   * Background blur using CSS filter on canvas
   */
  private processBlur(): void {
    const intensity = this.config.blurIntensity || 10;

    // Draw original frame
    this.outputCtx.drawImage(this.canvas, 0, 0);

    // Apply blur (full frame — for proper person segmentation, use MediaPipe)
    // This is a simplified version that blurs the entire frame and composites
    this.outputCtx.filter = `blur(${intensity}px)`;
    this.outputCtx.drawImage(this.canvas, 0, 0);
    this.outputCtx.filter = "none";

    // Draw center region unblurred (approximation of person in center)
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.2;
    const cy = h * 0.05;
    const cw = w * 0.6;
    const ch = h * 0.9;

    this.outputCtx.save();
    this.outputCtx.beginPath();
    this.outputCtx.ellipse(
      cx + cw / 2,
      cy + ch / 2,
      cw / 2,
      ch / 2,
      0,
      0,
      Math.PI * 2
    );
    this.outputCtx.clip();
    this.outputCtx.drawImage(this.canvas, 0, 0);
    this.outputCtx.restore();
  }

  /**
   * Virtual background image — replaces background using chroma or center mask
   */
  private processVirtualImage(): void {
    if (!this.backgroundImage) {
      this.processNone();
      return;
    }

    // Draw background image scaled to fit
    this.outputCtx.drawImage(
      this.backgroundImage,
      0,
      0,
      this.outputCanvas.width,
      this.outputCanvas.height
    );

    // Overlay the person (center ellipse mask — for production, use MediaPipe)
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w * 0.2;
    const cy = h * 0.05;
    const cw = w * 0.6;
    const ch = h * 0.9;

    this.outputCtx.save();
    this.outputCtx.beginPath();
    this.outputCtx.ellipse(
      cx + cw / 2,
      cy + ch / 2,
      cw / 2,
      ch / 2,
      0,
      0,
      Math.PI * 2
    );
    this.outputCtx.clip();
    this.outputCtx.drawImage(this.canvas, 0, 0);
    this.outputCtx.restore();
  }

  /**
   * Green Screen (Chroma Key) — replaces a specific color with transparency or background
   */
  private processGreenScreen(): void {
    const { chromaKeyColor, chromaKeyTolerance, chromaKeySmoothness } =
      this.config;
    const keyColor = hexToRgb(chromaKeyColor || "#00ff00");
    const tolerance = chromaKeyTolerance ?? 0.3;
    const smoothness = chromaKeySmoothness ?? 0.1;

    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const data = imageData.data;

    // If we have a background image, draw it first
    if (this.backgroundImage) {
      this.outputCtx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.outputCanvas.width,
        this.outputCanvas.height
      );
    } else {
      // Default: transparent / dark background
      this.outputCtx.fillStyle = "#1a1a2e";
      this.outputCtx.fillRect(
        0,
        0,
        this.outputCanvas.width,
        this.outputCanvas.height
      );
    }

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = colorDistance(r, g, b, keyColor.r, keyColor.g, keyColor.b);

      if (dist < tolerance) {
        // Within tolerance — make fully transparent
        data[i + 3] = 0;
      } else if (dist < tolerance + smoothness) {
        // Edge smoothing — partial transparency
        const alpha =
          ((dist - tolerance) / smoothness) * 255;
        data[i + 3] = Math.min(255, Math.max(0, alpha));
      }
      // else: keep original pixel
    }

    // Draw the processed frame on top of background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.putImageData(imageData, 0, 0);

    this.outputCtx.drawImage(tempCanvas, 0, 0);
  }
}

// ────────────────────────────────────────────────────────
// Preset virtual backgrounds
// ────────────────────────────────────────────────────────

export interface PresetBackground {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
  category: "office" | "nature" | "abstract" | "education";
}

export const PRESET_BACKGROUNDS: PresetBackground[] = [
  {
    id: "office-1",
    name: "Modern Office",
    thumbnail: "/backgrounds/thumbs/office-1.jpg",
    url: "/backgrounds/office-1.jpg",
    category: "office",
  },
  {
    id: "office-2",
    name: "Bookshelf",
    thumbnail: "/backgrounds/thumbs/office-2.jpg",
    url: "/backgrounds/office-2.jpg",
    category: "office",
  },
  {
    id: "office-3",
    name: "Conference Room",
    thumbnail: "/backgrounds/thumbs/office-3.jpg",
    url: "/backgrounds/office-3.jpg",
    category: "office",
  },
  {
    id: "nature-1",
    name: "Beach Sunset",
    thumbnail: "/backgrounds/thumbs/nature-1.jpg",
    url: "/backgrounds/nature-1.jpg",
    category: "nature",
  },
  {
    id: "nature-2",
    name: "Mountain Lake",
    thumbnail: "/backgrounds/thumbs/nature-2.jpg",
    url: "/backgrounds/nature-2.jpg",
    category: "nature",
  },
  {
    id: "nature-3",
    name: "Forest Path",
    thumbnail: "/backgrounds/thumbs/nature-3.jpg",
    url: "/backgrounds/nature-3.jpg",
    category: "nature",
  },
  {
    id: "abstract-1",
    name: "Gradient Blue",
    thumbnail: "/backgrounds/thumbs/abstract-1.jpg",
    url: "/backgrounds/abstract-1.jpg",
    category: "abstract",
  },
  {
    id: "abstract-2",
    name: "Neon Grid",
    thumbnail: "/backgrounds/thumbs/abstract-2.jpg",
    url: "/backgrounds/abstract-2.jpg",
    category: "abstract",
  },
  {
    id: "edu-1",
    name: "Classroom",
    thumbnail: "/backgrounds/thumbs/edu-1.jpg",
    url: "/backgrounds/edu-1.jpg",
    category: "education",
  },
  {
    id: "edu-2",
    name: "Library",
    thumbnail: "/backgrounds/thumbs/edu-2.jpg",
    url: "/backgrounds/edu-2.jpg",
    category: "education",
  },
];
