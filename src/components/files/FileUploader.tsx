"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileIcon,
  ImageIcon,
  VideoIcon,
  Music,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  validateFile,
  uploadFile,
  formatFileSize,
  getFileCategory,
  getFileIcon,
  ALLOWED_FILE_TYPES,
  type UploadProgress,
} from "@/lib/upload";

// ============================================================
// Types
// ============================================================

interface FileUploaderProps {
  parentType?: string;
  parentId?: string;
  allowedCategories?: string[];
  maxFiles?: number;
  onUploadComplete?: (files: UploadedFileInfo[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  key: string;
}

interface FileUploadState {
  id: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  result?: UploadedFileInfo;
  previewUrl?: string;
}

type TabFilter = "all" | "images" | "videos" | "audio" | "documents";

const TABS: { label: string; value: TabFilter; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "All Files", value: "all", icon: FileIcon },
  { label: "Images", value: "images", icon: ImageIcon },
  { label: "Video", value: "videos", icon: VideoIcon },
  { label: "Audio", value: "audio", icon: Music },
  { label: "Documents", value: "documents", icon: FileText },
];

// ============================================================
// FileUploader
// ============================================================

export function FileUploader({
  parentType,
  parentId,
  allowedCategories,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  className = "",
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());

  const allowedTypes = allowedCategories
    ? allowedCategories.flatMap((c) => ALLOWED_FILE_TYPES[c] ?? [])
    : undefined;

  // Process files for upload
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxFiles - uploads.length;
      const toProcess = fileArray.slice(0, remaining);

      if (fileArray.length > remaining) {
        onUploadError?.(`Maximum ${maxFiles} files allowed`);
      }

      const newUploads: FileUploadState[] = [];

      for (const file of toProcess) {
        const validation = validateFile(file, {
          allowedTypes,
        });

        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        if (!validation.valid) {
          newUploads.push({
            id: uploadId,
            file,
            status: "error",
            progress: 0,
            error: validation.error,
          });
          continue;
        }

        // Generate preview for images
        let previewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          previewUrl = URL.createObjectURL(file);
        }

        newUploads.push({
          id: uploadId,
          file,
          status: "pending",
          progress: 0,
          previewUrl,
        });
      }

      setUploads((prev) => [...prev, ...newUploads]);

      // Start uploading valid files
      for (const upload of newUploads) {
        if (upload.status === "error") continue;
        uploadSingleFile(upload);
      }
    },
    [uploads.length, maxFiles, allowedTypes, onUploadError] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const uploadSingleFile = async (upload: FileUploadState) => {
    try {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "uploading" } : u
        )
      );

      // 1. Get presigned URL from API
      const presignRes = await fetch("/api/files/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: upload.file.name,
          contentType: upload.file.type,
          size: upload.file.size,
          parentType,
          parentId,
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key, fileId } = await presignRes.json();

      // 2. Upload file to S3
      await uploadFile(upload.file, uploadUrl, (progress: UploadProgress) => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, progress: progress.percent } : u
          )
        );
      });

      // 3. Confirm upload
      const confirmRes = await fetch("/api/files/confirm-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, key }),
      });

      if (!confirmRes.ok) {
        throw new Error("Failed to confirm upload");
      }

      const fileData = await confirmRes.json();

      const result: UploadedFileInfo = {
        id: fileData.id,
        name: fileData.name,
        size: fileData.size,
        mimeType: fileData.mimeType,
        url: fileData.url,
        key: fileData.key,
      };

      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? { ...u, status: "completed", progress: 100, result }
            : u
        )
      );

      // Notify parent of completed uploads
      const allCompleted = uploads
        .filter((u) => u.status === "completed" && u.result)
        .map((u) => u.result!);
      onUploadComplete?.([...allCompleted, result]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Upload failed";
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "error", error: errorMsg } : u
        )
      );
      onUploadError?.(errorMsg);
    }
  };

  const cancelUpload = (uploadId: string) => {
    const xhr = xhrMap.current.get(uploadId);
    if (xhr) {
      xhr.abort();
      xhrMap.current.delete(uploadId);
    }
    setUploads((prev) => {
      const upload = prev.find((u) => u.id === uploadId);
      if (upload?.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter((u) => u.id !== uploadId);
    });
  };

  const removeUpload = (uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.id === uploadId);
      if (upload?.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return prev.filter((u) => u.id !== uploadId);
    });
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Filter accept string based on active tab
  const getAcceptString = (): string | undefined => {
    if (activeTab === "all") return undefined;
    return ALLOWED_FILE_TYPES[activeTab]?.join(",");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Type Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {TABS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === value
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        }`}
      >
        <Upload
          className={`mx-auto h-10 w-10 ${
            isDragging ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragging
            ? "Drop files here"
            : "Drag and drop files, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files. Images up to 10MB, videos up to 500MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={getAcceptString()}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Preview / Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                {upload.previewUrl ? (
                  <img
                    src={upload.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {getFileIcon(upload.file.type)}
                  </span>
                )}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>

                {/* Progress Bar */}
                {upload.status === "uploading" && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {/* Error */}
                {upload.status === "error" && upload.error && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {upload.error}
                  </div>
                )}
              </div>

              {/* Status / Actions */}
              <div className="flex-shrink-0">
                {upload.status === "uploading" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {upload.progress}%
                    </span>
                    <button
                      onClick={() => cancelUpload(upload.id)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {upload.status === "pending" && (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                )}
                {upload.status === "completed" && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {upload.status === "error" && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
