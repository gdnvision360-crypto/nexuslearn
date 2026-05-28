"use client";

import { useState, useRef, useCallback } from "react";
import {
  type BackgroundMode,
  type VirtualBackgroundConfig,
  PRESET_BACKGROUNDS,
  type PresetBackground,
} from "@/lib/virtual-background";
import { Eye, EyeOff, Image as ImageIcon, Lightbulb, Monitor, Paintbrush, Pipette, Sliders, Upload, X } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface VirtualBackgroundProps {
  config: VirtualBackgroundConfig;
  onConfigChange: (config: Partial<VirtualBackgroundConfig>) => void;
  onClose: () => void;
}

type TabId = "backgrounds" | "greenscreen" | "upload";

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function VirtualBackgroundPanel({
  config,
  onConfigChange,
  onClose,
}: VirtualBackgroundProps) {
  const [activeTab, setActiveTab] = useState<TabId>("backgrounds");
  const [selectedCategory, setSelectedCategory] = useState<
    PresetBackground["category"] | "all"
  >("all");
  const [customImages, setCustomImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──────────────────────────────

  const handleModeChange = useCallback(
    (mode: BackgroundMode) => {
      onConfigChange({ mode });
    },
    [onConfigChange]
  );

  const handleSelectPreset = useCallback(
    (bg: PresetBackground) => {
      onConfigChange({ mode: "image", imageUrl: bg.url });
    },
    [onConfigChange]
  );

  const handleCustomUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setCustomImages((prev) => [...prev, url]);
      onConfigChange({ mode: "image", imageUrl: url });
    },
    [onConfigChange]
  );

  const handleBlurChange = useCallback(
    (intensity: number) => {
      onConfigChange({ mode: "blur", blurIntensity: intensity });
    },
    [onConfigChange]
  );

  // ── Filter presets ────────────────────────

  const filteredPresets =
    selectedCategory === "all"
      ? PRESET_BACKGROUNDS
      : PRESET_BACKGROUNDS.filter((bg) => bg.category === selectedCategory);

  const categories: Array<{ id: PresetBackground["category"] | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "office", label: "Office" },
    { id: "nature", label: "Nature" },
    { id: "abstract", label: "Abstract" },
    { id: "education", label: "Education" },
  ];

  // ── Tabs ──────────────────────────────────

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    {
      id: "backgrounds",
      label: "Backgrounds",
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: "greenscreen",
      label: "Green Screen",
      icon: <Paintbrush className="h-4 w-4" />,
    },
    {
      id: "upload",
      label: "Upload",
      icon: <Upload className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Virtual Background
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Mode Buttons */}
      <div className="flex gap-2 border-b border-gray-800 p-3">
        <button
          onClick={() => handleModeChange("none")}
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
            config.mode === "none"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <EyeOff className="h-4 w-4" />
          None
        </button>
        <button
          onClick={() => handleModeChange("blur")}
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
            config.mode === "blur"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <Eye className="h-4 w-4" />
          Blur
        </button>
        <button
          onClick={() => {
            setActiveTab("greenscreen");
            handleModeChange("greenscreen");
          }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
            config.mode === "greenscreen"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <Paintbrush className="h-4 w-4" />
          Chroma
        </button>
      </div>

      {/* Blur Slider (show when blur active) */}
      {config.mode === "blur" && (
        <div className="border-b border-gray-800 px-4 py-3">
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
            <Sliders className="h-3.5 w-3.5" />
            Blur Intensity
          </label>
          <input
            type="range"
            min="2"
            max="30"
            value={config.blurIntensity || 10}
            onChange={(e) => handleBlurChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span>Light</span>
            <span>{config.blurIntensity || 10}px</span>
            <span>Heavy</span>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ── Backgrounds Tab ── */}
        {activeTab === "backgrounds" && (
          <div className="space-y-3">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredPresets.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleSelectPreset(bg)}
                  className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                    config.imageUrl === bg.url && config.mode === "image"
                      ? "border-blue-500 ring-1 ring-blue-500/50"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="aspect-video bg-gray-800">
                    {/* In production, these would be actual image thumbnails */}
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-xs text-gray-400">
                      <ImageIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="p-1.5 text-center text-[10px] text-gray-400 group-hover:text-white">
                    {bg.name}
                  </div>
                  {config.imageUrl === bg.url && config.mode === "image" && (
                    <div className="absolute right-1 top-1 rounded-full bg-blue-600 p-0.5">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Green Screen Tab ── */}
        {activeTab === "greenscreen" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-3">
              <p className="text-xs text-gray-400">
                Use a physical green screen behind you. Adjust the color picker
                and tolerance to match your screen for best results.
              </p>
            </div>

            {/* Chroma Key Color */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                <Pipette className="h-3.5 w-3.5" />
                Key Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.chromaKeyColor || "#00ff00"}
                  onChange={(e) =>
                    onConfigChange({ chromaKeyColor: e.target.value })
                  }
                  className="h-10 w-10 cursor-pointer rounded-lg border-2 border-gray-700 bg-transparent"
                />
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {[
                    { color: "#00ff00", label: "Green" },
                    { color: "#0000ff", label: "Blue" },
                    { color: "#ff00ff", label: "Magenta" },
                    { color: "#ffffff", label: "White" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() =>
                        onConfigChange({ chromaKeyColor: preset.color })
                      }
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] ${
                        config.chromaKeyColor === preset.color
                          ? "bg-gray-700 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-gray-600"
                        style={{ backgroundColor: preset.color }}
                      />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tolerance */}
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-medium text-gray-400">
                <span>Tolerance</span>
                <span className="text-gray-500">
                  {Math.round((config.chromaKeyTolerance ?? 0.3) * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="5"
                max="80"
                value={Math.round((config.chromaKeyTolerance ?? 0.3) * 100)}
                onChange={(e) =>
                  onConfigChange({
                    chromaKeyTolerance: Number(e.target.value) / 100,
                  })
                }
                className="w-full accent-green-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span>Strict</span>
                <span>Loose</span>
              </div>
            </div>

            {/* Smoothness / Edge Feathering */}
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-medium text-gray-400">
                <span>Edge Smoothness</span>
                <span className="text-gray-500">
                  {Math.round((config.chromaKeySmoothness ?? 0.1) * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={Math.round((config.chromaKeySmoothness ?? 0.1) * 100)}
                onChange={(e) =>
                  onConfigChange({
                    chromaKeySmoothness: Number(e.target.value) / 100,
                  })
                }
                className="w-full accent-green-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span>Sharp</span>
                <span>Feathered</span>
              </div>
            </div>

            {/* Replacement Background */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">
                Replacement Background
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onConfigChange({ imageUrl: undefined })}
                  className={`rounded-lg border p-3 text-center text-[10px] ${
                    !config.imageUrl
                      ? "border-green-500 bg-green-600/10 text-green-400"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <Monitor className="mx-auto mb-1 h-5 w-5" />
                  Dark
                </button>
                {PRESET_BACKGROUNDS.slice(0, 2).map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() =>
                      onConfigChange({ imageUrl: bg.url })
                    }
                    className={`rounded-lg border p-3 text-center text-[10px] ${
                      config.imageUrl === bg.url
                        ? "border-green-500 bg-green-600/10 text-green-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <ImageIcon className="mx-auto mb-1 h-5 w-5" />
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Upload Tab ── */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-700 p-6 text-gray-400 transition-colors hover:border-blue-500 hover:text-blue-400"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">Upload Custom Image</span>
              <span className="text-[10px] text-gray-500">
                JPG, PNG, WebP — max 5MB
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              className="hidden"
            />

            {/* Custom Images Grid */}
            {customImages.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-gray-400">
                  Your Uploads
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {customImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        onConfigChange({ mode: "image", imageUrl: url })
                      }
                      className={`overflow-hidden rounded-lg border-2 ${
                        config.imageUrl === url && config.mode === "image"
                          ? "border-blue-500"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Custom ${i + 1}`}
                        className="aspect-video w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div className="border-t border-gray-800 px-4 py-2">
        <p className="text-center text-[10px] text-gray-600">
          <Lightbulb className="w-4 h-4 inline" /> For best results, use good lighting and a solid-color background
        </p>
      </div>
    </div>
  );
}
