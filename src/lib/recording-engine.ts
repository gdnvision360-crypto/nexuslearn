"use client";

// ============================================================
// Recording Engine — Local + Screencast + Cloud Upload
// Handles MediaRecorder, screen capture, PiP composition
// ============================================================

export type RecordingMode = "meeting" | "screencast" | "screen-only" | "camera-only";

export interface RecordingOptions {
  mode: RecordingMode;
  includeAudio: boolean;
  includeSystemAudio: boolean;
  webcamPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  webcamSize: "small" | "medium" | "large";
  webcamShape: "circle" | "rectangle";
  resolution: "720p" | "1080p" | "4k";
  frameRate: 30 | 60;
  format: "webm" | "mp4";
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mode: RecordingMode;
  fileSize: number;
}

export const DEFAULT_RECORDING_OPTIONS: RecordingOptions = {
  mode: "meeting",
  includeAudio: true,
  includeSystemAudio: true,
  webcamPosition: "bottom-right",
  webcamSize: "small",
  webcamShape: "circle",
  resolution: "1080p",
  frameRate: 30,
  format: "webm",
};

const RESOLUTION_MAP = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

const WEBCAM_SIZE_MAP = {
  small: 0.15,
  medium: 0.22,
  large: 0.3,
};

// ============================================================
// RecordingEngine class
// ============================================================

export class RecordingEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private compositeStream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private webcamVideo: HTMLVideoElement | null = null;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;
  private options: RecordingOptions = DEFAULT_RECORDING_OPTIONS;
  private onStateChange: ((state: RecordingState) => void) | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;

  constructor(onStateChange?: (state: RecordingState) => void) {
    this.onStateChange = onStateChange ?? null;
  }

  // ----------------------------------------------------------
  // Start recording
  // ----------------------------------------------------------
  async start(options: Partial<RecordingOptions> = {}): Promise<void> {
    this.options = { ...DEFAULT_RECORDING_OPTIONS, ...options };
    this.recordedChunks = [];

    const { mode } = this.options;
    const resolution = RESOLUTION_MAP[this.options.resolution];

    try {
      // Get streams based on mode
      if (mode === "screencast" || mode === "screen-only") {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
            frameRate: { ideal: this.options.frameRate },
          },
          audio: this.options.includeSystemAudio,
        });

        // Handle user cancellation of screen picker
        this.screenStream.getVideoTracks()[0].onended = () => {
          this.stop();
        };
      }

      if (mode === "screencast" || mode === "camera-only" || mode === "meeting") {
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: mode === "camera-only" ? resolution.width : 640 },
            height: { ideal: mode === "camera-only" ? resolution.height : 480 },
            frameRate: { ideal: this.options.frameRate },
          },
          audio: this.options.includeAudio,
        });
      }

      // Compose the final stream
      let recordStream: MediaStream;

      if (mode === "screencast") {
        // Composite screen + webcam PiP on canvas
        recordStream = await this.createCompositeStream(resolution);
      } else if (mode === "screen-only") {
        recordStream = this.screenStream!;
      } else if (mode === "camera-only" || mode === "meeting") {
        recordStream = this.webcamStream!;
      } else {
        recordStream = this.webcamStream || this.screenStream!;
      }

      // Add audio tracks
      const audioTracks: MediaStreamTrack[] = [];
      if (this.options.includeAudio && this.webcamStream) {
        audioTracks.push(...this.webcamStream.getAudioTracks());
      }
      if (this.options.includeSystemAudio && this.screenStream) {
        audioTracks.push(...this.screenStream.getAudioTracks());
      }

      // If composite mode, audio needs to be mixed in
      if (mode === "screencast" && audioTracks.length > 0) {
        const audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        audioTracks.forEach((track) => {
          const source = audioCtx.createMediaStreamSource(new MediaStream([track]));
          source.connect(dest);
        });
        dest.stream.getAudioTracks().forEach((t) => recordStream.addTrack(t));
      } else {
        audioTracks.forEach((t) => recordStream.addTrack(t));
      }

      // Choose codec
      const mimeType = this.options.format === "webm"
        ? "video/webm;codecs=vp9,opus"
        : "video/webm;codecs=h264,opus"; // Will remux to mp4 if needed

      const supportedMime = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : "video/webm";

      this.mediaRecorder = new MediaRecorder(recordStream, {
        mimeType: supportedMime,
        videoBitsPerSecond: this.options.resolution === "4k" ? 12_000_000 : 6_000_000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.emitState();
        }
      };

      this.mediaRecorder.onstop = () => {
        this.cleanup();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();

      // Duration timer
      this.durationInterval = setInterval(() => this.emitState(), 1000);
      this.emitState();
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  // ----------------------------------------------------------
  // Create composite stream (screen + webcam PiP)
  // ----------------------------------------------------------
  private async createCompositeStream(
    resolution: { width: number; height: number }
  ): Promise<MediaStream> {
    this.canvas = document.createElement("canvas");
    this.canvas.width = resolution.width;
    this.canvas.height = resolution.height;
    this.ctx = this.canvas.getContext("2d")!;

    // Create video elements
    this.screenVideo = document.createElement("video");
    this.screenVideo.srcObject = this.screenStream!;
    this.screenVideo.muted = true;
    await this.screenVideo.play();

    this.webcamVideo = document.createElement("video");
    this.webcamVideo.srcObject = this.webcamStream!;
    this.webcamVideo.muted = true;
    await this.webcamVideo.play();

    // Start compositing loop
    this.drawComposite();

    this.compositeStream = this.canvas.captureStream(this.options.frameRate);
    return this.compositeStream;
  }

  // ----------------------------------------------------------
  // Composite drawing loop
  // ----------------------------------------------------------
  private drawComposite = (): void => {
    if (!this.ctx || !this.canvas || !this.screenVideo || !this.webcamVideo) return;

    const { width, height } = this.canvas;

    // Draw screen capture as background
    this.ctx.drawImage(this.screenVideo, 0, 0, width, height);

    // Draw webcam PiP
    const sizeFactor = WEBCAM_SIZE_MAP[this.options.webcamSize];
    const pipW = Math.round(width * sizeFactor);
    const pipH = Math.round(pipW * (3 / 4)); // 4:3 aspect ratio
    const margin = 20;

    let pipX = 0;
    let pipY = 0;

    switch (this.options.webcamPosition) {
      case "top-left":
        pipX = margin;
        pipY = margin;
        break;
      case "top-right":
        pipX = width - pipW - margin;
        pipY = margin;
        break;
      case "bottom-left":
        pipX = margin;
        pipY = height - pipH - margin;
        break;
      case "bottom-right":
        pipX = width - pipW - margin;
        pipY = height - pipH - margin;
        break;
    }

    this.ctx.save();

    if (this.options.webcamShape === "circle") {
      // Circular webcam overlay
      const centerX = pipX + pipW / 2;
      const centerY = pipY + pipH / 2;
      const radius = Math.min(pipW, pipH) / 2;

      // Shadow
      this.ctx.shadowColor = "rgba(0,0,0,0.5)";
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;

      // Clip to circle
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.closePath();
      this.ctx.clip();

      // Draw webcam (crop to circle)
      const scale = Math.max(pipW / this.webcamVideo.videoWidth, pipH / this.webcamVideo.videoHeight);
      const drawW = this.webcamVideo.videoWidth * scale;
      const drawH = this.webcamVideo.videoHeight * scale;
      this.ctx.drawImage(
        this.webcamVideo,
        centerX - drawW / 2,
        centerY - drawH / 2,
        drawW,
        drawH
      );

      // Border ring
      this.ctx.restore();
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(255,255,255,0.9)";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      // Rounded rectangle webcam overlay
      const borderRadius = 12;
      this.ctx.shadowColor = "rgba(0,0,0,0.5)";
      this.ctx.shadowBlur = 15;

      this.ctx.beginPath();
      this.ctx.roundRect(pipX, pipY, pipW, pipH, borderRadius);
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(this.webcamVideo, pipX, pipY, pipW, pipH);

      // Border
      this.ctx.restore();
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(255,255,255,0.9)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(pipX, pipY, pipW, pipH, borderRadius);
      this.ctx.stroke();
    }

    this.ctx.restore();

    // Recording indicator
    this.ctx.save();
    this.ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
    this.ctx.beginPath();
    this.ctx.arc(width - 50, 30, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 14px sans-serif";
    this.ctx.fillText("REC", width - 40, 35);
    this.ctx.restore();

    this.animationFrameId = requestAnimationFrame(this.drawComposite);
  };

  // ----------------------------------------------------------
  // Pause / Resume
  // ----------------------------------------------------------
  pause(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
      this.pauseStartTime = Date.now();
      this.emitState();
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
      this.pausedDuration += Date.now() - this.pauseStartTime;
      this.emitState();
    }
  }

  // ----------------------------------------------------------
  // Stop + produce file
  // ----------------------------------------------------------
  async stop(): Promise<RecordingResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType ?? "video/webm",
        });

        const duration = this.getDuration();
        const result: RecordingResult = {
          blob,
          url: URL.createObjectURL(blob),
          duration,
          fileSize: blob.size,
          format: this.options.format,
          mode: this.options.mode,
          timestamp: new Date().toISOString(),
          filename: `recording-${Date.now()}.${this.options.format === "mp4" ? "webm" : "webm"}`,
        };

        this.cleanup();
        resolve(result);
      };

      this.mediaRecorder.stop();
    });
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  private getDuration(): number {
    if (!this.startTime) return 0;
    const pauseAdjust = this.mediaRecorder?.state === "paused"
      ? Date.now() - this.pauseStartTime
      : 0;
    return Date.now() - this.startTime - this.pausedDuration - pauseAdjust;
  }

  private getFileSize(): number {
    return this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange({
        isRecording: this.mediaRecorder?.state === "recording",
        isPaused: this.mediaRecorder?.state === "paused",
        duration: this.getDuration(),
        mode: this.options.mode,
        fileSize: this.getFileSize(),
      });
    }
  }

  private cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.webcamStream?.getTracks().forEach((t) => t.stop());
    this.compositeStream?.getTracks().forEach((t) => t.stop());
    this.screenStream = null;
    this.webcamStream = null;
    this.compositeStream = null;
    this.canvas = null;
    this.ctx = null;
    this.screenVideo = null;
    this.webcamVideo = null;
    this.emitState();
  }

  getState(): RecordingState {
    return {
      isRecording: this.mediaRecorder?.state === "recording",
      isPaused: this.mediaRecorder?.state === "paused",
      duration: this.getDuration(),
      mode: this.options.mode,
      fileSize: this.getFileSize(),
    };
  }
}

// ============================================================
// Types
// ============================================================

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
  fileSize: number;
  format: string;
  mode: RecordingMode;
  timestamp: string;
  filename: string;
}

// ============================================================
// Utility: Download recording
// ============================================================

export function downloadRecording(result: RecordingResult, customName?: string): void {
  const a = document.createElement("a");
  a.href = result.url;
  a.download = customName ?? result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ============================================================
// Utility: Upload recording to server
// ============================================================

export async function uploadRecording(
  result: RecordingResult,
  meetingId: string
): Promise<{ url: string; id: string }> {
  const formData = new FormData();
  formData.append("file", result.blob, result.filename);
  formData.append("meetingId", meetingId);
  formData.append("duration", String(result.duration));
  formData.append("mode", result.mode);

  const res = await fetch("/api/meetings/recordings/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload recording");
  return res.json();
}

// ============================================================
// Utility: Format duration
// ============================================================

export function formatRecordingDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// ============================================================
// Utility: Format file size
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
