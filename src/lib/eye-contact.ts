"use client";

// ============================================================
// AI Eye Contact Correction
// Uses TensorFlow.js + Face Landmarks Detection to correct
// gaze direction so you appear to look at the camera.
// ============================================================

export interface EyeContactConfig {
  enabled: boolean;
  intensity: number; // 0-1, how much to correct gaze
  smoothing: number; // 0-1, temporal smoothing between frames
}

export const DEFAULT_EYE_CONTACT_CONFIG: EyeContactConfig = {
  enabled: false,
  intensity: 0.7,
  smoothing: 0.5,
};

// ============================================================
// EyeContactProcessor
// Real-time gaze correction using canvas manipulation
// ============================================================

export class EyeContactProcessor {
  private config: EyeContactConfig = DEFAULT_EYE_CONTACT_CONFIG;
  private inputVideo: HTMLVideoElement | null = null;
  private outputCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private isProcessing: boolean = false;

  // Face detection model (lazy-loaded)
  private faceDetector: any = null;
  private modelLoading: boolean = false;
  private modelLoaded: boolean = false;

  // Smoothing state
  private prevLeftEye: { x: number; y: number } | null = null;
  private prevRightEye: { x: number; y: number } | null = null;

  // --------------------------------------------------------
  // Initialize with video element
  // --------------------------------------------------------
  async initialize(
    inputVideo: HTMLVideoElement,
    outputCanvas: HTMLCanvasElement
  ): Promise<void> {
    this.inputVideo = inputVideo;
    this.outputCanvas = outputCanvas;
    this.ctx = outputCanvas.getContext("2d", { willReadFrequently: true })!;

    // Match canvas size to video
    outputCanvas.width = inputVideo.videoWidth || 640;
    outputCanvas.height = inputVideo.videoHeight || 480;

    // Load face detection model
    await this.loadModel();
  }

  // --------------------------------------------------------
  // Load TensorFlow.js face landmarks model
  // --------------------------------------------------------
  private async loadModel(): Promise<void> {
    if (this.modelLoaded || this.modelLoading) return;
    this.modelLoading = true;

    try {
      // Dynamic import to avoid bundling TF.js when not needed
      const [tf, faceLandmarksDetection] = await Promise.all([
        import("@tensorflow/tfjs-core"),
        import("@tensorflow-models/face-landmarks-detection"),
      ]);

      // Load WebGL backend
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.setBackend("webgl");
      await tf.ready();

      // Create face detector with MediaPipe FaceMesh
      this.faceDetector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: true, // Enables iris tracking
          maxFaces: 1,
        }
      );

      this.modelLoaded = true;
      console.log("[EyeContact] Face landmarks model loaded");
    } catch (error) {
      console.error("[EyeContact] Failed to load model:", error);
      // Fall back to simplified gaze correction
      this.modelLoaded = false;
    } finally {
      this.modelLoading = false;
    }
  }

  // --------------------------------------------------------
  // Update configuration
  // --------------------------------------------------------
  updateConfig(config: Partial<EyeContactConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && !this.isProcessing) {
      this.startProcessing();
    } else if (!this.config.enabled && this.isProcessing) {
      this.stopProcessing();
    }
  }

  // --------------------------------------------------------
  // Start the processing loop
  // --------------------------------------------------------
  startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processFrame();
  }

  // --------------------------------------------------------
  // Stop processing
  // --------------------------------------------------------
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // --------------------------------------------------------
  // Main processing loop
  // --------------------------------------------------------
  private processFrame = async (): Promise<void> => {
    if (!this.isProcessing || !this.inputVideo || !this.ctx || !this.outputCanvas) {
      return;
    }

    const { videoWidth, videoHeight } = this.inputVideo;
    if (videoWidth === 0 || videoHeight === 0) {
      this.animationFrameId = requestAnimationFrame(this.processFrame);
      return;
    }

    // Ensure canvas matches video size
    if (this.outputCanvas.width !== videoWidth || this.outputCanvas.height !== videoHeight) {
      this.outputCanvas.width = videoWidth;
      this.outputCanvas.height = videoHeight;
    }

    // Draw the current video frame
    this.ctx.drawImage(this.inputVideo, 0, 0);

    if (this.config.enabled && this.modelLoaded && this.faceDetector) {
      try {
        await this.applyGazeCorrection();
      } catch {
        // If detection fails, just show original frame
      }
    } else if (this.config.enabled && !this.modelLoaded) {
      // Simplified gaze correction (without ML model)
      this.applySimplifiedCorrection();
    }

    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  // --------------------------------------------------------
  // ML-based gaze correction using face landmarks
  // --------------------------------------------------------
  private async applyGazeCorrection(): Promise<void> {
    if (!this.inputVideo || !this.ctx || !this.outputCanvas) return;

    const faces = await this.faceDetector.estimateFaces(this.inputVideo, {
      flipHorizontal: false,
    });

    if (faces.length === 0) return;

    const face = faces[0];
    const keypoints = face.keypoints;

    // MediaPipe FaceMesh iris landmarks (468-477)
    // Left iris: indices 468-472, Right iris: indices 473-477
    // Left eye outline: 33, 133, 159, 145, 160, 144, 153, 154, 155, 157, 158, 173
    // Right eye outline: 263, 362, 386, 374, 387, 373, 380, 381, 382, 384, 385, 398

    const leftIrisCenter = keypoints[468]; // Left iris center
    const rightIrisCenter = keypoints[473]; // Right iris center

    // Eye corners for reference
    const leftEyeInner = keypoints[133];
    const leftEyeOuter = keypoints[33];
    const rightEyeInner = keypoints[362];
    const rightEyeOuter = keypoints[263];

    if (!leftIrisCenter || !rightIrisCenter) return;

    // Calculate current gaze offset from center
    const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
    const leftEyeCenterY = (leftEyeInner.y + leftEyeOuter.y) / 2;
    const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;
    const rightEyeCenterY = (rightEyeInner.y + rightEyeOuter.y) / 2;

    // How far iris is from center of eye
    const leftOffsetX = leftIrisCenter.x - leftEyeCenterX;
    const leftOffsetY = leftIrisCenter.y - leftEyeCenterY;
    const rightOffsetX = rightIrisCenter.x - rightEyeCenterX;
    const rightOffsetY = rightIrisCenter.y - rightEyeCenterY;

    // Calculate correction (move iris toward center = looking at camera)
    const intensity = this.config.intensity;
    const leftCorrX = -leftOffsetX * intensity * 0.6;
    const leftCorrY = -leftOffsetY * intensity * 0.3; // Less vertical correction
    const rightCorrX = -rightOffsetX * intensity * 0.6;
    const rightCorrY = -rightOffsetY * intensity * 0.3;

    // Apply temporal smoothing
    const smooth = this.config.smoothing;
    const leftTarget = {
      x: leftCorrX,
      y: leftCorrY,
    };
    const rightTarget = {
      x: rightCorrX,
      y: rightCorrY,
    };

    if (this.prevLeftEye) {
      leftTarget.x = this.prevLeftEye.x * smooth + leftTarget.x * (1 - smooth);
      leftTarget.y = this.prevLeftEye.y * smooth + leftTarget.y * (1 - smooth);
    }
    if (this.prevRightEye) {
      rightTarget.x = this.prevRightEye.x * smooth + rightTarget.x * (1 - smooth);
      rightTarget.y = this.prevRightEye.y * smooth + rightTarget.y * (1 - smooth);
    }

    this.prevLeftEye = { ...leftTarget };
    this.prevRightEye = { ...rightTarget };

    // Get eye bounding boxes for pixel manipulation
    const eyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x) * 1.4;
    const eyeHeight = eyeWidth * 0.6;

    // Warp left eye region
    this.warpEyeRegion(
      leftEyeCenterX - eyeWidth / 2,
      leftEyeCenterY - eyeHeight / 2,
      eyeWidth,
      eyeHeight,
      leftTarget.x,
      leftTarget.y
    );

    // Warp right eye region
    this.warpEyeRegion(
      rightEyeCenterX - eyeWidth / 2,
      rightEyeCenterY - eyeHeight / 2,
      eyeWidth,
      eyeHeight,
      rightTarget.x,
      rightTarget.y
    );
  }

  // --------------------------------------------------------
  // Warp an eye region by shifting pixels
  // --------------------------------------------------------
  private warpEyeRegion(
    x: number,
    y: number,
    w: number,
    h: number,
    shiftX: number,
    shiftY: number
  ): void {
    if (!this.ctx || !this.outputCanvas) return;

    const sx = Math.max(0, Math.round(x));
    const sy = Math.max(0, Math.round(y));
    const sw = Math.min(Math.round(w), this.outputCanvas.width - sx);
    const sh = Math.min(Math.round(h), this.outputCanvas.height - sy);

    if (sw <= 0 || sh <= 0) return;

    try {
      const imageData = this.ctx.getImageData(sx, sy, sw, sh);
      const newImageData = this.ctx.createImageData(sw, sh);

      const shiftPxX = Math.round(shiftX);
      const shiftPxY = Math.round(shiftY);

      for (let py = 0; py < sh; py++) {
        for (let px = 0; px < sw; px++) {
          // Elliptical mask — stronger in center
          const cx = (px / sw - 0.5) * 2;
          const cy = (py / sh - 0.5) * 2;
          const dist = cx * cx + cy * cy;

          if (dist > 1) {
            // Outside the ellipse — copy original
            const idx = (py * sw + px) * 4;
            newImageData.data[idx] = imageData.data[idx];
            newImageData.data[idx + 1] = imageData.data[idx + 1];
            newImageData.data[idx + 2] = imageData.data[idx + 2];
            newImageData.data[idx + 3] = imageData.data[idx + 3];
          } else {
            // Inside — apply shift with falloff
            const factor = 1 - dist; // Smooth falloff
            const srcX = Math.round(px - shiftPxX * factor);
            const srcY = Math.round(py - shiftPxY * factor);
            const clampedX = Math.max(0, Math.min(sw - 1, srcX));
            const clampedY = Math.max(0, Math.min(sh - 1, srcY));

            const srcIdx = (clampedY * sw + clampedX) * 4;
            const dstIdx = (py * sw + px) * 4;
            newImageData.data[dstIdx] = imageData.data[srcIdx];
            newImageData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
            newImageData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
            newImageData.data[dstIdx + 3] = imageData.data[srcIdx + 3];
          }
        }
      }

      this.ctx.putImageData(newImageData, sx, sy);
    } catch {
      // getImageData can fail if canvas is tainted
    }
  }

  // --------------------------------------------------------
  // Simplified correction (no ML model — brightness-based)
  // --------------------------------------------------------
  private applySimplifiedCorrection(): void {
    if (!this.ctx || !this.outputCanvas) return;
    // Apply a subtle brightening to the upper eye area to simulate
    // more attentive gaze. This is a visual approximation.
    // Real eye contact requires the ML model above.
    const w = this.outputCanvas.width;
    const h = this.outputCanvas.height;

    // Estimate eye region (approximately 30-40% from top, 25-75% width)
    const eyeY = Math.round(h * 0.3);
    const eyeH = Math.round(h * 0.12);
    const eyeX = Math.round(w * 0.25);
    const eyeW = Math.round(w * 0.5);

    try {
      const imageData = this.ctx.getImageData(eyeX, eyeY, eyeW, eyeH);
      const data = imageData.data;
      const brighten = 5 * this.config.intensity;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + brighten);
        data[i + 1] = Math.min(255, data[i + 1] + brighten);
        data[i + 2] = Math.min(255, data[i + 2] + brighten);
      }

      this.ctx.putImageData(imageData, eyeX, eyeY);
    } catch {
      // Ignore canvas tainting errors
    }
  }

  // --------------------------------------------------------
  // Get output stream from the processed canvas
  // --------------------------------------------------------
  getOutputStream(frameRate: number = 30): MediaStream | null {
    if (!this.outputCanvas) return null;
    return this.outputCanvas.captureStream(frameRate);
  }

  // --------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------
  destroy(): void {
    this.stopProcessing();
    this.faceDetector = null;
    this.inputVideo = null;
    this.outputCanvas = null;
    this.ctx = null;
    this.prevLeftEye = null;
    this.prevRightEye = null;
  }
}
