"use client";

import { useState, useRef } from "react";
import {
  Image,
  Upload,
  Loader2,
  Download,
  Sparkles,
  FileVideo,
  Palette,
  Type,
  RefreshCw,
  Check,
  Wand2,
  Grid3X3,
  Clock,
  Zap,
} from "lucide-react";

interface GeneratedThumbnail {
  url: string;
  width: number;
  height: number;
  format: string;
  timestamp?: number;
}

type ThumbnailStyle = "clean" | "bold" | "gradient" | "photo" | "minimal" | "youtube";

export function ThumbnailGeneratorPanel() {
  const [mode, setMode] = useState<"ai" | "extract" | "auto">("ai");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [style, setStyle] = useState<ThumbnailStyle>("bold");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1" | "4:3">("16:9");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [timestamp, setTimestamp] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles: { id: ThumbnailStyle; label: string; desc: string }[] = [
    { id: "clean", label: "Clean", desc: "Professional & minimal" },
    { id: "bold", label: "Bold", desc: "Eye-catching & vibrant" },
    { id: "gradient", label: "Gradient", desc: "Colorful gradients" },
    { id: "photo", label: "Photo", desc: "Photo-realistic" },
    { id: "minimal", label: "Minimal", desc: "Simple & elegant" },
    { id: "youtube", label: "YouTube", desc: "Optimized for YT" },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setThumbnails([]);
    try {
      if (mode === "ai") {
        const response = await fetch("/api/video-studio/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate-ai",
            title,
            subtitle,
            style,
            aspectRatio,
          }),
        });
        const data = await response.json();
        if (data.url) {
          setThumbnails([data]);
        }
      } else if (mode === "extract") {
        const response = await fetch("/api/video-studio/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "extract-frame",
            videoUrl,
            timestamp,
          }),
        });
        const data = await response.json();
        if (data.url) {
          setThumbnails([data]);
        }
      } else {
        const response = await fetch("/api/video-studio/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "auto-generate",
            videoUrl,
            count: 6,
          }),
        });
        const data = await response.json();
        if (data.thumbnails) {
          setThumbnails(data.thumbnails);
        }
      }
    } catch (err) {
      console.error("Thumbnail generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleDownload = (thumb: GeneratedThumbnail) => {
    const a = document.createElement("a");
    a.href = thumb.url;
    a.download = `thumbnail.${thumb.format || "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls */}
      <div className="space-y-6">
        {/* Mode selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Thumbnail Generator
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setMode("ai")}
              className={`p-3 rounded-lg border text-center ${
                mode === "ai"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xs font-medium">AI Generate</p>
            </button>
            <button
              onClick={() => setMode("extract")}
              className={`p-3 rounded-lg border text-center ${
                mode === "extract"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <FileVideo className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xs font-medium">Extract Frame</p>
            </button>
            <button
              onClick={() => setMode("auto")}
              className={`p-3 rounded-lg border text-center ${
                mode === "auto"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <Zap className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xs font-medium">Auto-Pick</p>
            </button>
          </div>

          {/* AI mode controls */}
          {mode === "ai" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Optional subtitle"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              {/* Style */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-2 rounded-lg border text-left ${
                        style === s.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Aspect Ratio */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["16:9", "1:1", "4:3"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`p-2 text-xs rounded-lg border ${
                        aspectRatio === ratio
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Extract/Auto mode: needs video */}
          {(mode === "extract" || mode === "auto") && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {videoFile ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <FileVideo className="w-6 h-6 text-purple-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{videoFile.name}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 text-center"
                >
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Upload video</p>
                </button>
              )}
              {mode === "extract" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Timestamp: {timestamp}s
                  </label>
                  <input
                    type="number"
                    value={timestamp}
                    onChange={(e) => setTimestamp(Number(e.target.value))}
                    min={0}
                    step={0.5}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === "ai" && !title) || ((mode === "extract" || mode === "auto") && !videoFile)}
            className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Generate Thumbnails</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-purple-500" />
            Generated Thumbnails
          </h3>

          {isGenerating ? (
            <div className="py-20 text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Creating thumbnails...</p>
            </div>
          ) : thumbnails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {thumbnails.map((thumb, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedThumb(i)}
                  className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedThumb === i
                      ? "border-purple-500 shadow-lg"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={thumb.url}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                  {selectedThumb === i && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {thumb.timestamp != null && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {Math.floor(thumb.timestamp)}s
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(thumb); }}
                      className="p-1.5 bg-black/60 text-white rounded hover:bg-black/80"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Generated thumbnails will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
