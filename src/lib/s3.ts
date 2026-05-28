import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_REGION = process.env.S3_REGION ?? "us-east-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID!;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY!;
const S3_BUCKET = process.env.S3_BUCKET!;
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === "true";

export const s3Client = new S3Client({
  region: S3_REGION,
  ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
  forcePathStyle: S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a presigned PUT URL for direct client upload.
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  maxSize?: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(maxSize ? { ContentLength: maxSize } : {}),
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Generate a presigned GET URL for file download.
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3.
 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get file metadata (size, content-type, etc).
 */
export async function getObjectMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    etag: response.ETag,
    metadata: response.Metadata,
  };
}

/**
 * Build a storage key for file uploads.
 * Format: {userId}/{parentType}/{parentId}/{uuid}-{filename}
 */
export function buildStorageKey(
  userId: string,
  parentType: string,
  parentId: string,
  uuid: string,
  filename: string
): string {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${parentType}/${parentId}/${uuid}-${sanitizedFilename}`;
}

/**
 * Get public URL for a file (for public buckets or CDN).
 */
export function getPublicUrl(key: string): string {
  const cdnUrl = process.env.S3_CDN_URL;
  if (cdnUrl) {
    return `${cdnUrl}/${key}`;
  }
  if (S3_ENDPOINT) {
    return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
  }
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}
