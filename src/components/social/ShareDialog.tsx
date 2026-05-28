"use client";

import { useState } from "react";
import { AlertCircle, Camera, CheckCircle, ExternalLink, Loader2, Share2, X } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: "recording" | "certificate" | "course" | "webinar";
  sourceId: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

const PLATFORMS = [
  { key: "TWITTER", name: "Twitter / X", color: "bg-sky-500", icon: "𝕏" },
  { key: "LINKEDIN", name: "LinkedIn", color: "bg-blue-700", icon: "in" },
  { key: "FACEBOOK", name: "Facebook", color: "bg-blue-600", icon: "f" },
  { key: "INSTAGRAM", name: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: <Camera className="w-4 h-4" /> },
];

interface ShareResult {
  platform: string;
  success: boolean;
  platformUrl?: string;
  error?: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  sourceType,
  sourceId,
  title,
  description,
}: ShareDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [results, setResults] = useState<ShareResult[]>([]);
  const [step, setStep] = useState<"compose" | "results">("compose");

  if (!isOpen) return null;

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) return;
    setSharing(true);

    try {
      const res = await fetch("/api/social/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          platforms: selectedPlatforms,
          customMessage: customMessage || undefined,
          useWebIntent: false,
        }),
      });

      const data = await res.json();

      if (data.results) {
        setResults(data.results);
        setStep("results");
      } else if (data.intentUrls) {
        // Fall back to web intents
        for (const [platform, url] of Object.entries(data.intentUrls)) {
          window.open(url as string, "_blank", "width=600,height=400");
        }
        onClose();
      }
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setSharing(false);
    }
  };

  const handleWebIntentShare = async () => {
    try {
      const res = await fetch("/api/social/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          platforms: selectedPlatforms,
          customMessage: customMessage || undefined,
          useWebIntent: true,
        }),
      });

      const data = await res.json();
      if (data.intentUrls) {
        for (const url of Object.values(data.intentUrls)) {
          window.open(url as string, "_blank", "width=600,height=400");
        }
      }
      onClose();
    } catch (error) {
      console.error("Web intent share failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share to Social Media
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "compose" ? (
            <div className="space-y-4">
              {/* Content Preview */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </p>
                {description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {description}
                  </p>
                )}
                <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {sourceType}
                </span>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      onClick={() => togglePlatform(platform.key)}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedPlatforms.includes(platform.key)
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold ${platform.color}`}
                      >
                        {platform.icon}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Message (optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a personal message to your share..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  disabled={sharing || selectedPlatforms.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {sharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Share Now
                </button>
                <button
                  onClick={handleWebIntentShare}
                  disabled={selectedPlatforms.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  title="Open in platform's share dialog"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Share Results
              </h3>
              {results.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.platform}
                    </span>
                    {result.success ? (
                      result.platformUrl && (
                        <a
                          href={result.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-indigo-600 hover:text-indigo-700 truncate"
                        >
                          View post →
                        </a>
                      )
                    ) : (
                      <p className="text-xs text-red-500">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
