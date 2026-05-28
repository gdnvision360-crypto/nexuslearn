"use client";

import { useState, useRef } from "react";
import {
  Captions,
  Upload,
  Loader2,
  Download,
  Languages,
  Mic,
  Eye,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  FileVideo,
  Settings,
  Palette,
  Type,
  AlignCenter,
  Flame,
} from "lucide-react";

interface CaptionEntry {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface CaptionResult {
  entries: CaptionEntry[];
  srt: string;
  vtt: string;
  language: string;
  confidence: number;
  duration: number;
}

const LANGUAGES = [
  { code: "auto", name: "Auto-detect" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
];

export function CaptionGeneratorPanel() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState("auto");
  const [translateTo, setTranslateTo] = useState("");
  const [speakerDiarization, setSpeakerDiarization] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState({
    fontSize: 24,
    color: "#ffffff",
    backgroundColor: "#000000",
    backgroundOpacity: 0.5,
    position: "bottom" as "top" | "center" | "bottom",
  });
  const [activeView, setActiveView] = useState<"generate" | "edit" | "style" | "export">("generate");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!videoUrl) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/video-studio/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          videoUrl,
          language: language === "auto" ? undefined : language,
          speakerDiarization,
        }),
      });
      const data = await response.json();
      setResult(data);
      setActiveView("edit");
    } catch (err) {
      console.error("Caption generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranslate = async () => {
    if (!result || !translateTo) return;
    setIsTranslating(true);
    try {
      const response = await fetch("/api/video-studio/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate",
          captions: result.entries,
          targetLanguage: translateTo,
        }),
      });
      const data = await response.json();
      if (data.captions) {
        setResult((prev) => prev ? { ...prev, entries: data.captions } : null);
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleBurnCaptions = async () => {
    if (!result || !videoUrl) return;
    setIsBurning(true);
    try {
      const response = await fetch("/api/video-studio/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "burn",
          videoUrl,
          captions: result.entries,
          style: captionStyle,
        }),
      });
      const data = await response.json();
      if (data.outputUrl) {
        const a = document.createElement("a");
        a.href = data.outputUrl;
        a.download = "captioned-video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Burn captions failed:", err);
    } finally {
      setIsBurning(false);
    }
  };

  const saveEdit = (index: number) => {
    if (!result) return;
    const updated = [...result.entries];
    updated[index] = { ...updated[index], text: editText };
    setResult({ ...result, entries: updated });
    setEditingIndex(null);
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Captions className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Caption Generator
            </h2>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {videoFile ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
              <FileVideo className="w-8 h-8 text-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{videoFile.name}</p>
                <p className="text-xs text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button
                onClick={() => { setVideoFile(null); setVideoUrl(""); setResult(null); }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 transition-colors text-center"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload video or audio</p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM, MP3, WAV</p>
            </button>
          )}

          {/* Settings */}
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={speakerDiarization}
                onChange={(e) => setSpeakerDiarization(e.target.checked)}
                className="rounded accent-purple-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Speaker Detection</p>
                <p className="text-xs text-gray-500">Identify different speakers</p>
              </div>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!videoFile || isGenerating}
            className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Captions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Captions
              </>
            )}
          </button>
        </div>

        {/* Translate */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Translate</h2>
            </div>
            <select
              value={translateTo}
              onChange={(e) => setTranslateTo(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm mb-3"
            >
              <option value="">Select target language</option>
              {LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                <option key={lang.code} value={lang.name}>{lang.name}</option>
              ))}
            </select>
            <button
              onClick={handleTranslate}
              disabled={!translateTo || isTranslating}
              className="w-full py-2.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTranslating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Translating...</>
              ) : (
                <><Languages className="w-4 h-4" /> Translate</>
              )}
            </button>
          </div>
        )}

        {/* Caption Style */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Caption Style</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Size: {captionStyle.fontSize}px</label>
                <input type="range" min={12} max={72} value={captionStyle.fontSize} onChange={(e) => setCaptionStyle((s) => ({ ...s, fontSize: Number(e.target.value) }))} className="w-full accent-purple-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Text Color</label>
                  <input type="color" value={captionStyle.color} onChange={(e) => setCaptionStyle((s) => ({ ...s, color: e.target.value }))} className="w-full h-8 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Background</label>
                  <input type="color" value={captionStyle.backgroundColor} onChange={(e) => setCaptionStyle((s) => ({ ...s, backgroundColor: e.target.value }))} className="w-full h-8 rounded cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setCaptionStyle((s) => ({ ...s, position: pos }))}
                      className={`p-2 text-xs rounded border ${captionStyle.position === pos ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"}`}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleBurnCaptions}
                disabled={isBurning}
                className="w-full py-2.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBurning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Burning captions...</>
                ) : (
                  <><Flame className="w-4 h-4" /> Burn into Video</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-2">
        {result ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Stats bar */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900 dark:text-white">{result.entries.length}</span> segments
              </span>
              <span className="text-sm text-gray-500">
                Language: <span className="font-semibold text-gray-900 dark:text-white">{result.language}</span>
              </span>
              <span className="text-sm text-gray-500">
                Duration: <span className="font-semibold text-gray-900 dark:text-white">{formatTime(result.duration)}</span>
              </span>
              <div className="flex-1" />
              {/* Export buttons */}
              <button
                onClick={() => copyToClipboard(result.srt, "srt")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {copiedFormat === "srt" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                SRT
              </button>
              <button
                onClick={() => copyToClipboard(result.vtt, "vtt")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {copiedFormat === "vtt" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                VTT
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([result.srt], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "captions.srt";
                  a.click();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>

            {/* Caption entries */}
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {result.entries.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="text-xs text-gray-500 font-mono w-24 pt-1 flex-shrink-0">
                    {formatTime(entry.startTime)} → {formatTime(entry.endTime)}
                  </div>
                  {entry.speaker && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                      {entry.speaker}
                    </span>
                  )}
                  <div className="flex-1">
                    {editingIndex === i ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(i)}
                          className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-purple-500 rounded text-sm focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(i)}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p
                        onClick={() => { setEditingIndex(i); setEditText(entry.text); }}
                        className="text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded px-2 py-1 -mx-2 -my-1"
                      >
                        {entry.text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Captions className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI-Powered Captions
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Upload a video or audio file and our AI will automatically generate accurate captions.
              Edit, translate to 20+ languages, and burn them into your video.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
