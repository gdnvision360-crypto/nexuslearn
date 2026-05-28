"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Languages, Type, X } from "lucide-react";

// ============================================================
// Types
// ============================================================

interface TranscriptionOverlayProps {
  meetingId: string;
  isEnabled: boolean;
  onClose: () => void;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  language: string;
}

type FontSize = "S" | "M" | "L";

const FONT_SIZE_MAP: Record<FontSize, string> = {
  S: "text-sm",
  M: "text-base",
  L: "text-lg",
};

const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "pt-BR", label: "Portuguese" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "zh-CN", label: "Chinese" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ar-SA", label: "Arabic" },
];

// ============================================================
// TranscriptionOverlay
// ============================================================

export function TranscriptionOverlay({
  meetingId,
  isEnabled,
  onClose,
}: TranscriptionOverlayProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [currentSegment, setCurrentSegment] =
    useState<TranscriptSegment | null>(null);
  const [fontSize, setFontSize] = useState<FontSize>("M");
  const [language, setLanguage] = useState("en-US");
  const [showSettings, setShowSettings] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const segmentIdCounter = useRef(0);

  // Save transcript to API
  const saveTranscript = useCallback(
    async (segment: TranscriptSegment) => {
      try {
        await fetch(`/api/meetings/${meetingId}/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: segment.text,
            language: segment.language,
            timestamp: new Date(segment.timestamp).toISOString(),
          }),
        });
      } catch (error) {
        console.error("Failed to save transcript:", error);
      }
    },
    [meetingId]
  );

  // Initialize Web Speech API
  useEffect(() => {
    if (!isEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      if (isFinal) {
        const segment: TranscriptSegment = {
          id: `seg-${++segmentIdCounter.current}`,
          speaker: "You",
          text: transcript,
          timestamp: Date.now(),
          isFinal: true,
          language,
        };
        setSegments((prev) => [...prev.slice(-50), segment]); // Keep last 50
        setCurrentSegment(null);
        saveTranscript(segment);
      } else {
        setCurrentSegment({
          id: "current",
          speaker: "You",
          text: transcript,
          timestamp: Date.now(),
          isFinal: false,
          language,
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled
      if (isEnabled && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isEnabled, language, saveTranscript]);

  // Update language on change
  useEffect(() => {
    if (recognitionRef.current && isEnabled) {
      recognitionRef.current.stop();
      recognitionRef.current.lang = language;
      try {
        recognitionRef.current.start();
      } catch {
        // Will restart via onend
      }
    }
  }, [language, isEnabled]);

  if (!isEnabled) return null;

  const cycleFontSize = () => {
    const sizes: FontSize[] = ["S", "M", "L"];
    const currentIndex = sizes.indexOf(fontSize);
    setFontSize(sizes[(currentIndex + 1) % sizes.length]);
  };

  const latestSegments = segments.slice(-3);

  return (
    <div className="absolute bottom-24 left-1/2 z-20 w-full max-w-2xl -translate-x-1/2 px-4">
      {/* Settings dropdown */}
      {showSettings && (
        <div className="mb-2 rounded-xl bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm">
          <div className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Caption Language
          </div>
          <div className="grid grid-cols-2 gap-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setShowSettings(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-left text-sm ${
                  language === lang.code
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caption display */}
      <div className="rounded-xl bg-black/80 px-4 py-3 backdrop-blur-sm">
        {/* Controls */}
        <div className="mb-2 flex items-center justify-end gap-1">
          <button
            onClick={cycleFontSize}
            className="rounded p-1 text-gray-400 hover:text-white"
            title={`Font size: ${fontSize}`}
          >
            <Type className="h-4 w-4" />
            <span className="ml-0.5 text-xs">{fontSize}</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded p-1 text-gray-400 hover:text-white"
            title="Language"
          >
            <Languages className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-white"
            title="Close captions"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Transcript lines */}
        <div className="space-y-1">
          {latestSegments.map((seg) => (
            <div
              key={seg.id}
              className={`${FONT_SIZE_MAP[fontSize]} text-white`}
            >
              <span className="mr-2 font-semibold text-blue-400">
                {seg.speaker}:
              </span>
              {seg.text}
            </div>
          ))}
          {currentSegment && (
            <div
              className={`${FONT_SIZE_MAP[fontSize]} text-gray-400 italic`}
            >
              <span className="mr-2 font-semibold text-blue-400/60">
                {currentSegment.speaker}:
              </span>
              {currentSegment.text}
            </div>
          )}
          {latestSegments.length === 0 && !currentSegment && (
            <p className="text-center text-sm text-gray-500">
              Listening for speech...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
