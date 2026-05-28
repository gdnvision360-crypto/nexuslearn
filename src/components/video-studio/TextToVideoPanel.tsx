"use client";

import { useState } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Image,
  Palette,
  Type,
  Music,
  Mic,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  RefreshCw,
  Wand2,
  Film,
  Settings,
  Upload,
} from "lucide-react";

type VideoStyle = "professional" | "casual" | "cinematic" | "educational" | "social-media" | "minimal";
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

interface GeneratedScene {
  order: number;
  narration: string;
  visualDescription: string;
  duration: number;
  transition: string;
  backgroundImageUrl?: string;
}

interface GeneratedVideo {
  projectId: string;
  title: string;
  description: string;
  scenes: GeneratedScene[];
  voiceoverUrl?: string;
  estimatedDuration: number;
}

const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", desc: "Neutral, balanced" },
  { id: "echo", name: "Echo", desc: "Warm, conversational" },
  { id: "fable", name: "Fable", desc: "Expressive, storytelling" },
  { id: "onyx", name: "Onyx", desc: "Deep, authoritative" },
  { id: "nova", name: "Nova", desc: "Friendly, upbeat" },
  { id: "shimmer", name: "Shimmer", desc: "Soft, calm" },
];

const STYLE_OPTIONS: { id: VideoStyle; label: string; desc: string; colors: string }[] = [
  { id: "professional", label: "Professional", desc: "Clean corporate style", colors: "from-blue-600 to-indigo-600" },
  { id: "casual", label: "Casual", desc: "Fun and friendly", colors: "from-pink-500 to-orange-400" },
  { id: "cinematic", label: "Cinematic", desc: "Movie-quality visuals", colors: "from-gray-800 to-gray-600" },
  { id: "educational", label: "Educational", desc: "Clear and informative", colors: "from-green-600 to-teal-500" },
  { id: "social-media", label: "Social Media", desc: "Viral-ready content", colors: "from-purple-600 to-pink-500" },
  { id: "minimal", label: "Minimal", desc: "Simple and elegant", colors: "from-gray-300 to-gray-100" },
];

const MUSIC_TRACKS = [
  { id: "none", name: "No Music" },
  { id: "upbeat", name: "Upbeat Corporate" },
  { id: "calm", name: "Calm & Relaxing" },
  { id: "inspiring", name: "Inspiring" },
  { id: "energetic", name: "Energetic" },
  { id: "cinematic", name: "Cinematic Epic" },
  { id: "lofi", name: "Lo-Fi Chill" },
  { id: "acoustic", name: "Acoustic Warm" },
];

export function TextToVideoPanel() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<VideoStyle>("professional");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [resolution, setResolution] = useState<"720p" | "1080p" | "4k">("1080p");
  const [duration, setDuration] = useState(30);
  const [voiceover, setVoiceover] = useState(true);
  const [voiceId, setVoiceId] = useState("alloy");
  const [musicTrack, setMusicTrack] = useState("none");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brandLogo, setBrandLogo] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#6366f1");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#8b5cf6");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setGeneratedVideo(null);

    try {
      const response = await fetch("/api/video-studio/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          voiceover,
          voiceId,
          musicTrack,
          duration,
          aspectRatio,
          resolution,
          branding: {
            logo: brandLogo || undefined,
            primaryColor: brandPrimaryColor,
            secondaryColor: brandSecondaryColor,
          },
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      setGeneratedVideo(data);
    } catch (err) {
      setError("Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const promptSuggestions = [
    "Introduce our online course platform with key features and benefits",
    "Create a 30-second promo for a web development bootcamp",
    "Explain how machine learning works in simple terms",
    "Announce our upcoming live webinar on AI in education",
    "Showcase student success stories and testimonials",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <div className="space-y-6">
        {/* Prompt */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Describe Your Video
            </h2>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want your video to show. Be specific about content, mood, and key messages..."
            rows={5}
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  {suggestion.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Style</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStyle(opt.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  style === opt.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${opt.colors} mb-2`} />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Format</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["16:9", "9:16", "1:1", "4:3"] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-2 rounded-lg border text-sm font-medium ${
                      aspectRatio === ratio
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 dark:border-gray-700 text-gray-600"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            {/* Resolution */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as "720p" | "1080p" | "4k")}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </div>
          </div>
          {/* Duration slider */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Target Duration: {duration}s
            </label>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>
        </div>

        {/* Voice & Music */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voice & Music
            </h2>
          </div>
          {/* Voiceover toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {voiceover ? <Volume2 className="w-4 h-4 text-green-500" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              <span className="text-sm text-gray-700 dark:text-gray-300">AI Voiceover</span>
            </div>
            <button
              onClick={() => setVoiceover(!voiceover)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                voiceover ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  voiceover ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          {/* Voice selection */}
          {voiceover && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setVoiceId(voice.id)}
                  className={`p-2 rounded-lg border text-left ${
                    voiceId === voice.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{voice.name}</p>
                  <p className="text-xs text-gray-500">{voice.desc}</p>
                </button>
              ))}
            </div>
          )}
          {/* Music */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Background Music
            </label>
            <select
              value={musicTrack}
              onChange={(e) => setMusicTrack(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              {MUSIC_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced / Branding */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Settings className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
              Branding
            </h2>
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandPrimaryColor}
                      onChange={(e) => setBrandPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandPrimaryColor}
                      onChange={(e) => setBrandPrimaryColor(e.target.value)}
                      className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandSecondaryColor}
                      onChange={(e) => setBrandSecondaryColor(e.target.value)}
                      className="flex-1 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Video
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Right: Preview */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            Preview
          </h2>

          {isGenerating ? (
            <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <p className="text-white font-medium">Generating your video...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a minute</p>
              <div className="mt-6 w-64">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Writing script...</span>
                  <span>AI working</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
            </div>
          ) : generatedVideo ? (
            <div>
              {/* Video title */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {generatedVideo.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{generatedVideo.description}</p>

              {/* Scene preview */}
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative mb-4">
                {generatedVideo.scenes[activeSceneIndex]?.backgroundImageUrl ? (
                  <img
                    src={generatedVideo.scenes[activeSceneIndex].backgroundImageUrl}
                    alt={`Scene ${activeSceneIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                    <Film className="w-16 h-16 text-white/30" />
                  </div>
                )}
                {/* Narration overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white text-sm">
                    {generatedVideo.scenes[activeSceneIndex]?.narration}
                  </p>
                </div>
                {/* Scene counter */}
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Scene {activeSceneIndex + 1} / {generatedVideo.scenes.length}
                </div>
              </div>

              {/* Scene thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {generatedVideo.scenes.map((scene, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSceneIndex(i)}
                    className={`flex-shrink-0 w-20 h-12 rounded-md overflow-hidden border-2 ${
                      i === activeSceneIndex ? "border-purple-500" : "border-transparent"
                    }`}
                  >
                    {scene.backgroundImageUrl ? (
                      <img
                        src={scene.backgroundImageUrl}
                        alt={`Scene ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                        {i + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Duration & Actions */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  Duration: {generatedVideo.estimatedDuration}s | Scenes: {generatedVideo.scenes.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg flex flex-col items-center justify-center">
              <Wand2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 font-medium">Your video preview will appear here</p>
              <p className="text-gray-400 text-sm mt-1">Enter a prompt and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
