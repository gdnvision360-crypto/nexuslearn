"use client";

import { useState, useRef, useEffect } from "react";
import {
  Scissors,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Type,
  Image,
  Music,
  Layers,
  Sliders,
  Crop,
  FlipHorizontal,
  Film,
  Loader2,
  Download,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Move,
  Square,
  Circle,
  Triangle,
  Palette,
  Eye,
  EyeOff,
  GripVertical,
  Clock,
  Wand2,
  Sparkles,
  FileVideo,
} from "lucide-react";

type EditorTool = "select" | "trim" | "split" | "text" | "image" | "shape" | "audio" | "filter";
type TimelineTrackType = "video" | "audio" | "text" | "image" | "shape";

interface TimelineClip {
  id: string;
  type: TimelineTrackType;
  name: string;
  startTime: number;
  endTime: number;
  trackIndex: number;
  src?: string;
  content?: string;
  color: string;
}

interface VideoFilter {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  speed: number;
  grayscale: boolean;
  sepia: boolean;
}

const DEFAULT_FILTERS: VideoFilter = {
  brightness: 0,
  contrast: 0,
  saturation: 1,
  blur: 0,
  speed: 1,
  grayscale: false,
  sepia: false,
};

export function VideoEditorPanel() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VideoFilter>(DEFAULT_FILTERS);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [undoStack, setUndoStack] = useState<TimelineClip[][]>([]);
  const [redoStack, setRedoStack] = useState<TimelineClip[][]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { id: EditorTool; icon: typeof Scissors; label: string }[] = [
    { id: "select", icon: Move, label: "Select" },
    { id: "trim", icon: Scissors, label: "Trim" },
    { id: "split", icon: Layers, label: "Split" },
    { id: "text", icon: Type, label: "Text" },
    { id: "image", icon: Image, label: "Image" },
    { id: "shape", icon: Square, label: "Shape" },
    { id: "audio", icon: Music, label: "Audio" },
    { id: "filter", icon: Sliders, label: "Filters" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setClips([
        {
          id: "main-video",
          type: "video",
          name: file.name,
          startTime: 0,
          endTime: 0, // Will be set when metadata loads
          trackIndex: 0,
          src: url,
          color: "#8b5cf6",
        },
      ]);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(dur);
      setClips((prev) =>
        prev.map((c) => (c.id === "main-video" ? { ...c, endTime: dur } : c))
      );
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const handleTrim = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/video-studio/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "trim",
          input: videoUrl,
          startTime: trimStart,
          endTime: trimEnd,
        }),
      });
      const data = await response.json();
      if (data.outputUrl) {
        setVideoUrl(data.outputUrl);
      }
    } catch (err) {
      console.error("Trim failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/video-studio/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "split",
          input: videoUrl,
          splitAt: currentTime,
        }),
      });
      const data = await response.json();
      if (data.part1Url && data.part2Url) {
        // Add split clips to timeline
        setClips((prev) => [
          ...prev.filter((c) => c.id !== "main-video"),
          {
            id: "split-part1",
            type: "video",
            name: "Part 1",
            startTime: 0,
            endTime: currentTime,
            trackIndex: 0,
            src: data.part1Url,
            color: "#8b5cf6",
          },
          {
            id: "split-part2",
            type: "video",
            name: "Part 2",
            startTime: currentTime,
            endTime: duration,
            trackIndex: 0,
            src: data.part2Url,
            color: "#6366f1",
          },
        ]);
      }
    } catch (err) {
      console.error("Split failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyFilters = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);
    try {
      const response = await fetch("/api/video-studio/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "filter",
          input: videoUrl,
          filters,
        }),
      });
      const data = await response.json();
      if (data.outputUrl) {
        setVideoUrl(data.outputUrl);
      }
    } catch (err) {
      console.error("Filter failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `edited-${videoFile?.name || "video"}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const addTextOverlay = () => {
    const newClip: TimelineClip = {
      id: `text-${Date.now()}`,
      type: "text",
      name: "Text Overlay",
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      trackIndex: 1,
      content: "Your text here",
      color: "#f59e0b",
    };
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {!videoUrl ? (
        /* Upload screen */
        <div className="p-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <FileVideo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upload a video to start editing
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Supports MP4, WebM, MOV, AVI — up to 2GB
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Upload className="w-5 h-5" />
              Upload Video
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              <Film className="w-5 h-5" />
              From Recordings
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* Undo/Redo */}
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Undo">
              <Undo2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Redo">
              <Redo2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            {/* Tools */}
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm ${
                  activeTool === tool.id
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={tool.label}
              >
                <tool.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tool.label}</span>
              </button>
            ))}
            <div className="flex-1" />
            {/* Zoom */}
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
              <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex">
            {/* Side Panel */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 hidden lg:block">
              {activeTool === "trim" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Trim Video</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Time</label>
                      <input
                        type="number"
                        value={trimStart}
                        onChange={(e) => setTrimStart(Number(e.target.value))}
                        step={0.1}
                        min={0}
                        max={duration}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">End Time</label>
                      <input
                        type="number"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                        step={0.1}
                        min={0}
                        max={duration}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={handleTrim}
                      disabled={isProcessing}
                      className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isProcessing ? "Processing..." : "Apply Trim"}
                    </button>
                  </div>
                </div>
              )}

              {activeTool === "split" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Split Video</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Split at current position: {formatTime(currentTime)}
                  </p>
                  <button
                    onClick={handleSplit}
                    disabled={isProcessing}
                    className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isProcessing ? "Splitting..." : "Split Here"}
                  </button>
                </div>
              )}

              {activeTool === "text" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Text Overlay</h3>
                  <button
                    onClick={addTextOverlay}
                    className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Text
                  </button>
                </div>
              )}

              {activeTool === "filter" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Filters</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 flex justify-between">
                        <span>Brightness</span>
                        <span>{filters.brightness}</span>
                      </label>
                      <input type="range" min={-1} max={1} step={0.1} value={filters.brightness} onChange={(e) => setFilters((f) => ({ ...f, brightness: Number(e.target.value) }))} className="w-full accent-purple-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex justify-between">
                        <span>Contrast</span>
                        <span>{filters.contrast}</span>
                      </label>
                      <input type="range" min={-1} max={1} step={0.1} value={filters.contrast} onChange={(e) => setFilters((f) => ({ ...f, contrast: Number(e.target.value) }))} className="w-full accent-purple-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex justify-between">
                        <span>Saturation</span>
                        <span>{filters.saturation}</span>
                      </label>
                      <input type="range" min={0} max={2} step={0.1} value={filters.saturation} onChange={(e) => setFilters((f) => ({ ...f, saturation: Number(e.target.value) }))} className="w-full accent-purple-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex justify-between">
                        <span>Blur</span>
                        <span>{filters.blur}</span>
                      </label>
                      <input type="range" min={0} max={20} step={1} value={filters.blur} onChange={(e) => setFilters((f) => ({ ...f, blur: Number(e.target.value) }))} className="w-full accent-purple-600" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex justify-between">
                        <span>Speed</span>
                        <span>{filters.speed}x</span>
                      </label>
                      <input type="range" min={0.25} max={4} step={0.25} value={filters.speed} onChange={(e) => setFilters((f) => ({ ...f, speed: Number(e.target.value) }))} className="w-full accent-purple-600" />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        <input type="checkbox" checked={filters.grayscale} onChange={(e) => setFilters((f) => ({ ...f, grayscale: e.target.checked }))} className="rounded accent-purple-600" />
                        Grayscale
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        <input type="checkbox" checked={filters.sepia} onChange={(e) => setFilters((f) => ({ ...f, sepia: e.target.checked }))} className="rounded accent-purple-600" />
                        Sepia
                      </label>
                    </div>
                    <button
                      onClick={handleApplyFilters}
                      disabled={isProcessing}
                      className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isProcessing ? "Applying..." : "Apply Filters"}
                    </button>
                    <button
                      onClick={() => setFilters(DEFAULT_FILTERS)}
                      className="w-full py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Main preview area */}
            <div className="flex-1">
              {/* Video player */}
              <div className="bg-black aspect-video relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full"
                  style={{
                    filter: `brightness(${1 + filters.brightness}) contrast(${1 + filters.contrast}) saturate(${filters.saturation}) blur(${filters.blur}px) ${filters.grayscale ? "grayscale(1)" : ""} ${filters.sepia ? "sepia(1)" : ""}`,
                  }}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm">Processing...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Playback controls */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <button onClick={() => seek(0)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <SkipBack className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button onClick={togglePlay} className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => seek(duration)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <SkipForward className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>

                  <span className="text-xs text-gray-500 font-mono w-24">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => seek(Number(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  {/* Volume */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                      if (videoRef.current) videoRef.current.volume = Number(e.target.value);
                    }}
                    className="w-20 accent-purple-600"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3 bg-gray-100 dark:bg-gray-900 min-h-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Timeline</span>
                </div>
                {/* Timeline tracks */}
                <div className="space-y-1">
                  {[0, 1, 2].map((trackIdx) => {
                    const trackClips = clips.filter((c) => c.trackIndex === trackIdx);
                    const trackLabels = ["Video", "Overlay", "Audio"];
                    return (
                      <div key={trackIdx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {trackLabels[trackIdx]}
                        </span>
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-800 rounded relative overflow-hidden">
                          {trackClips.map((clip) => {
                            const left = duration > 0 ? (clip.startTime / duration) * 100 : 0;
                            const width = duration > 0 ? ((clip.endTime - clip.startTime) / duration) * 100 : 100;
                            return (
                              <div
                                key={clip.id}
                                onClick={() => setSelectedClipId(clip.id)}
                                className={`absolute top-0.5 bottom-0.5 rounded cursor-pointer flex items-center px-2 text-xs text-white font-medium ${
                                  selectedClipId === clip.id ? "ring-2 ring-white" : ""
                                }`}
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  backgroundColor: clip.color,
                                  minWidth: "30px",
                                }}
                              >
                                <span className="truncate">{clip.name}</span>
                              </div>
                            );
                          })}
                          {/* Playhead */}
                          {duration > 0 && (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                              style={{ left: `${(currentTime / duration) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
