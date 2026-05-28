import ytdl from "ytdl-core";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "@/lib/s3";
import { PassThrough } from "stream";

// ============================================================
// Types
// ============================================================

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number; // seconds
  author: string;
  formats: YouTubeFormat[];
}

export interface YouTubeFormat {
  itag: number;
  quality: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  contentLength: string | undefined;
}

export type DownloadQuality = "highest" | "lowest" | "audioonly" | "videoonly";

export interface YouTubeDownloadJob {
  id: string;
  url: string;
  status: "pending" | "downloading" | "processing" | "completed" | "failed";
  progress: number;
  fileId: string | null;
  error: string | null;
}

// ============================================================
// URL Validation
// ============================================================

const YOUTUBE_URL_PATTERNS = [
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export function validateYouTubeUrl(url: string): {
  valid: boolean;
  videoId: string | null;
} {
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      // Video ID is in the last capture group
      const videoId = match[match.length - 1];
      return { valid: true, videoId };
    }
  }
  return { valid: false, videoId: null };
}

// ============================================================
// Video Information
// ============================================================

export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  const info = await ytdl.getInfo(url);

  const formats: YouTubeFormat[] = info.formats.map((f) => ({
    itag: f.itag,
    quality: f.qualityLabel ?? f.quality ?? "unknown",
    container: f.container ?? "unknown",
    hasVideo: f.hasVideo ?? false,
    hasAudio: f.hasAudio ?? false,
    contentLength: f.contentLength,
  }));

  const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10) || 0;

  return {
    videoId: info.videoDetails.videoId,
    title: info.videoDetails.title,
    thumbnail:
      info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]
        ?.url ?? "",
    duration: durationSeconds,
    author: info.videoDetails.author?.name ?? "Unknown",
    formats,
  };
}

// ============================================================
// Download Video to S3
// ============================================================

interface DownloadToS3Options {
  url: string;
  quality: DownloadQuality;
  s3Key: string;
  bucket: string;
  onProgress?: (percent: number) => void;
}

export async function downloadVideoToS3(
  options: DownloadToS3Options
): Promise<{ size: number; contentType: string }> {
  const { url, quality, s3Key, bucket, onProgress } = options;

  const info = await ytdl.getInfo(url);

  const filterMap: Record<DownloadQuality, ytdl.Filter> = {
    highest: "audioandvideo",
    lowest: "audioandvideo",
    audioonly: "audioonly",
    videoonly: "videoonly",
  };

  const filter = filterMap[quality];

  const format = ytdl.chooseFormat(info.formats, {
    quality: quality === "highest" ? "highestvideo" : quality === "lowest" ? "lowestvideo" : quality,
    filter,
  });

  const contentType = format.mimeType?.split(";")[0] ?? "video/mp4";
  const totalBytes = parseInt(format.contentLength ?? "0", 10);

  const videoStream = ytdl.downloadFromInfo(info, { format });
  const passThrough = new PassThrough();

  let downloadedBytes = 0;

  videoStream.on("data", (chunk: Buffer) => {
    downloadedBytes += chunk.length;
    if (totalBytes > 0 && onProgress) {
      onProgress(Math.round((downloadedBytes / totalBytes) * 100));
    }
  });

  videoStream.pipe(passThrough);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: s3Key,
      Body: passThrough,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024, // 5MB parts
  });

  upload.on("httpUploadProgress", (progress) => {
    if (progress.loaded && totalBytes > 0 && onProgress) {
      onProgress(Math.round((progress.loaded / totalBytes) * 100));
    }
  });

  await upload.done();

  return {
    size: downloadedBytes,
    contentType,
  };
}
