"use client";

// ============================================================
// File Type & Size Validation
// ============================================================

export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  videos: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/x-m4a", "audio/mp4"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
    "text/csv",
  ],
};

export const MAX_FILE_SIZES: Record<string, number> = {
  images: 10 * 1024 * 1024, // 10 MB
  videos: 500 * 1024 * 1024, // 500 MB
  audio: 100 * 1024 * 1024, // 100 MB
  documents: 50 * 1024 * 1024, // 50 MB
};

const ALL_ALLOWED_TYPES = Object.values(ALLOWED_FILE_TYPES).flat();

export function getFileCategory(mimeType: string): string | null {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return null;
}

interface ValidateFileOptions {
  allowedTypes?: string[];
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options?: ValidateFileOptions
): FileValidationResult {
  const allowedTypes = options?.allowedTypes ?? ALL_ALLOWED_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Accepted types: ${allowedTypes.join(", ")}`,
    };
  }

  const category = getFileCategory(file.type);
  const maxSize =
    options?.maxSize ?? (category ? MAX_FILE_SIZES[category] : 50 * 1024 * 1024);

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

// ============================================================
// Upload with Progress
// ============================================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadFile(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to a network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was cancelled"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

// ============================================================
// Thumbnail Generation
// ============================================================

export async function generateThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<Blob | null> {
  if (file.type.startsWith("image/")) {
    return generateImageThumbnail(file, maxWidth, maxHeight);
  }
  if (file.type.startsWith("video/")) {
    return generateVideoThumbnail(file, maxWidth, maxHeight);
  }
  return null;
}

function generateImageThumbnail(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

function generateVideoThumbnail(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.preload = "metadata";
    video.src = url;
  });
}

// ============================================================
// Helpers
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "presentation";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType === "text/plain" || mimeType === "text/markdown") return "text";
  if (mimeType === "text/csv") return "spreadsheet";
  return "file";
}
