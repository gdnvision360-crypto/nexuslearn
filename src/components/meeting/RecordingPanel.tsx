"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Circle,
  Square,
  Pause,
  Play,
  Download,
  Upload,
  Monitor,
  Video,
  Camera,
  Eye,
  X,
  Settings,
  Trash2,
  HardDrive,
  Clock,
  ChevronDown,
} from "lucide-react";
import {
  RecordingEngine,
  type RecordingOptions,
  type RecordingState,
  type RecordingResult,
  DEFAULT_RECORDING_OPTIONS,
  downloadRecording,
  uploadRecording,
  formatRecordingDuration,
  formatFileSize,
} from "@/lib/recording-engine";
import {
  type EyeContactConfig,
  DEFAULT_EYE_CONTACT_CONFIG,
} from "@/lib/eye-contact";

// ============================================================
// RecordingPanel — Full recording + screencast control panel
// ============================================================

interface RecordingPanelProps {
  meetingId: string;
  onClose: () => void;
  eyeContactConfig: EyeContactConfig;
  onEyeContactChange: (config: Partial<EyeContactConfig>) => void;
}

export function RecordingPanel({
  meetingId,
  onClose,
  eyeContactConfig,
  onEyeContactChange,
}: RecordingPanelProps) {
  const [activeTab, setActiveTab] = useState<"record" | "recordings" | "eye-contact">("record");
  const [options, setOptions] = useState<RecordingOptions>(DEFAULT_RECORDING_OPTIONS);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    mode: "meeting",
    fileSize: 0,
  });
  const [recordings, setRecordings] = useState<RecordingResult[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const engineRef = useRef<RecordingEngine | null>(null);

  useEffect(() => {
    engineRef.current = new RecordingEngine(setRecordingState);
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  // ----------------------------------------------------------
  // Recording controls
  // ----------------------------------------------------------
  const handleStart = useCallback(async () => {
    try {
      await engineRef.current?.start(options);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [options]);

  const handleStop = useCallback(async () => {
    const result = await engineRef.current?.stop();
    if (result) {
      setRecordings((prev) => [result, ...prev]);
    }
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleUpload = useCallback(
    async (recording: RecordingResult) => {
      setIsUploading(recording.timestamp);
      try {
        await uploadRecording(recording, meetingId);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(null);
      }
    },
    [meetingId]
  );

  const handleDelete = useCallback((timestamp: string) => {
    setRecordings((prev) => {
      const recording = prev.find((r) => r.timestamp === timestamp);
      if (recording) URL.revokeObjectURL(recording.url);
      return prev.filter((r) => r.timestamp !== timestamp);
    });
  }, []);

  // ----------------------------------------------------------
  // Tabs
  // ----------------------------------------------------------
  const tabs = [
    { id: "record" as const, label: "Record", icon: Circle },
    { id: "recordings" as const, label: `Recordings (${recordings.length})`, icon: HardDrive },
    { id: "eye-contact" as const, label: "Eye Contact", icon: Eye },
  ];

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-700 bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 p-3">
        <h3 className="font-semibold text-white">Recording Studio</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "record" && (
          <RecordTab
            options={options}
            onOptionsChange={(updates) => setOptions((prev) => ({ ...prev, ...updates }))}
            recordingState={recordingState}
            showSettings={showSettings}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onStart={handleStart}
            onStop={handleStop}
            onPause={handlePause}
            onResume={handleResume}
          />
        )}

        {activeTab === "recordings" && (
          <RecordingsTab
            recordings={recordings}
            isUploading={isUploading}
            onDownload={(r) => downloadRecording(r)}
            onUpload={handleUpload}
            onDelete={handleDelete}
          />
        )}

        {activeTab === "eye-contact" && (
          <EyeContactTab
            config={eyeContactConfig}
            onChange={onEyeContactChange}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// RecordTab — Recording mode selection + controls
// ============================================================

function RecordTab({
  options,
  onOptionsChange,
  recordingState,
  showSettings,
  onToggleSettings,
  onStart,
  onStop,
  onPause,
  onResume,
}: {
  options: RecordingOptions;
  onOptionsChange: (updates: Partial<RecordingOptions>) => void;
  recordingState: RecordingState;
  showSettings: boolean;
  onToggleSettings: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const { isRecording, isPaused, duration, fileSize } = recordingState;

  const modes = [
    {
      id: "meeting" as const,
      label: "Meeting",
      desc: "Record your camera & mic",
      icon: Video,
    },
    {
      id: "screencast" as const,
      label: "Screencast",
      desc: "Screen + webcam PiP overlay",
      icon: Monitor,
    },
    {
      id: "screen-only" as const,
      label: "Screen Only",
      desc: "Screen capture without webcam",
      icon: Monitor,
    },
    {
      id: "camera-only" as const,
      label: "Camera Only",
      desc: "Webcam at full resolution",
      icon: Camera,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Recording status */}
      {isRecording && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-red-400">
            <Circle className="h-3 w-3 animate-pulse fill-red-500" />
            <span className="text-sm font-medium">
              {isPaused ? "Paused" : "Recording"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRecordingDuration(duration)}
            </span>
            <span>{formatFileSize(fileSize)}</span>
          </div>
        </div>
      )}

      {/* Mode selection */}
      {!isRecording && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">Recording Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onOptionsChange({ mode: mode.id })}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  options.mode === mode.id
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                }`}
              >
                <mode.icon className="mb-1 h-4 w-4" />
                <div className="text-xs font-medium">{mode.label}</div>
                <div className="text-[10px] opacity-70">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Webcam PiP options (screencast mode) */}
      {!isRecording && options.mode === "screencast" && (
        <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-750 p-3">
          <label className="text-xs font-medium text-gray-400">Webcam Overlay</label>

          {/* Position */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-500">Position</span>
            <div className="grid grid-cols-4 gap-1">
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map(
                (pos) => (
                  <button
                    key={pos}
                    onClick={() => onOptionsChange({ webcamPosition: pos })}
                    className={`rounded px-2 py-1 text-[10px] ${
                      options.webcamPosition === pos
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {pos.split("-").map((w) => w[0].toUpperCase()).join("")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-500">Size</span>
            <div className="grid grid-cols-3 gap-1">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onOptionsChange({ webcamSize: size })}
                  className={`rounded px-2 py-1 text-[10px] capitalize ${
                    options.webcamSize === size
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Shape */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-500">Shape</span>
            <div className="grid grid-cols-2 gap-1">
              {(["circle", "rectangle"] as const).map((shape) => (
                <button
                  key={shape}
                  onClick={() => onOptionsChange({ webcamShape: shape })}
                  className={`rounded px-2 py-1 text-[10px] capitalize ${
                    options.webcamShape === shape
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced settings */}
      {!isRecording && (
        <>
          <button
            onClick={onToggleSettings}
            className="flex w-full items-center gap-2 text-xs text-gray-400 hover:text-gray-200"
          >
            <Settings className="h-3.5 w-3.5" />
            Advanced Settings
            <ChevronDown
              className={`ml-auto h-3.5 w-3.5 transition-transform ${showSettings ? "rotate-180" : ""}`}
            />
          </button>

          {showSettings && (
            <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-750 p-3">
              {/* Resolution */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500">Resolution</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["720p", "1080p", "4k"] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => onOptionsChange({ resolution: res })}
                      className={`rounded px-2 py-1 text-[10px] ${
                        options.resolution === res
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame rate */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500">Frame Rate</span>
                <div className="grid grid-cols-2 gap-1">
                  {([30, 60] as const).map((fps) => (
                    <button
                      key={fps}
                      onClick={() => onOptionsChange({ frameRate: fps })}
                      className={`rounded px-2 py-1 text-[10px] ${
                        options.frameRate === fps
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio toggles */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={options.includeAudio}
                    onChange={(e) => onOptionsChange({ includeAudio: e.target.checked })}
                    className="h-3 w-3 rounded border-gray-600"
                  />
                  Include microphone audio
                </label>
                <label className="flex items-center gap-2 text-[10px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={options.includeSystemAudio}
                    onChange={(e) => onOptionsChange({ includeSystemAudio: e.target.checked })}
                    className="h-3 w-3 rounded border-gray-600"
                  />
                  Include system audio (screen share)
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {!isRecording ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <Circle className="h-4 w-4 fill-white" />
            Start Recording
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                <Play className="h-4 w-4 fill-white" />
                Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-2 rounded-full bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            )}
            <button
              onClick={onStop}
              className="flex items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
            >
              <Square className="h-4 w-4 fill-white" />
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// RecordingsTab — List of saved recordings
// ============================================================

function RecordingsTab({
  recordings,
  isUploading,
  onDownload,
  onUpload,
  onDelete,
}: {
  recordings: RecordingResult[];
  isUploading: string | null;
  onDownload: (r: RecordingResult) => void;
  onUpload: (r: RecordingResult) => void;
  onDelete: (timestamp: string) => void;
}) {
  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <HardDrive className="mb-3 h-10 w-10 text-gray-600" />
        <p className="text-sm text-gray-400">No recordings yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Start a recording to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recordings.map((recording) => (
        <div
          key={recording.timestamp}
          className="rounded-lg border border-gray-700 bg-gray-750 p-3"
        >
          {/* Preview */}
          <video
            src={recording.url}
            controls
            className="mb-2 w-full rounded-md bg-black"
            style={{ maxHeight: "150px" }}
          />

          {/* Info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRecordingDuration(recording.duration)}
            </span>
            <span>{formatFileSize(recording.fileSize)}</span>
            <span className="capitalize">{recording.mode}</span>
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onDownload(recording)}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-blue-500/20 px-2 py-1.5 text-xs text-blue-400 hover:bg-blue-500/30"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
            <button
              onClick={() => onUpload(recording)}
              disabled={isUploading === recording.timestamp}
              className="flex flex-1 items-center justify-center gap-1 rounded bg-green-500/20 px-2 py-1.5 text-xs text-green-400 hover:bg-green-500/30 disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              {isUploading === recording.timestamp ? "Uploading..." : "Save to Cloud"}
            </button>
            <button
              onClick={() => onDelete(recording.timestamp)}
              className="rounded p-1.5 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// EyeContactTab — AI gaze correction controls
// ============================================================

function EyeContactTab({
  config,
  onChange,
}: {
  config: EyeContactConfig;
  onChange: (updates: Partial<EyeContactConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Hero description */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">AI Eye Contact</span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Uses AI face landmark detection to subtly adjust your gaze direction
          so you appear to be looking directly at the camera, even when reading
          notes or looking at other participants.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">Enable Eye Contact</label>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.enabled ? "bg-blue-500" : "bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Intensity slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Correction Intensity</label>
              <span className="text-xs text-gray-500">
                {Math.round(config.intensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={config.intensity * 100}
              onChange={(e) => onChange({ intensity: Number(e.target.value) / 100 })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Subtle</span>
              <span>Natural</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Smoothing slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Temporal Smoothing</label>
              <span className="text-xs text-gray-500">
                {Math.round(config.smoothing * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={config.smoothing * 100}
              onChange={(e) => onChange({ smoothing: Number(e.target.value) / 100 })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Responsive</span>
              <span>Smooth</span>
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-750 p-3">
            <p className="text-xs font-medium text-gray-300">Tips for best results</p>
            <ul className="space-y-1 text-[10px] text-gray-500">
              <li>• Ensure good, even lighting on your face</li>
              <li>• Position camera at eye level</li>
              <li>• Keep 50-70% intensity for natural look</li>
              <li>• Higher smoothing reduces jitter</li>
              <li>• Works best when facing the camera</li>
            </ul>
          </div>

          {/* Tech note */}
          <div className="rounded bg-gray-750 p-2 text-[10px] text-gray-600">
            Powered by TensorFlow.js + MediaPipe FaceMesh with iris landmark tracking.
            Processing runs locally in your browser — no video data is sent to any server.
          </div>
        </>
      )}
    </div>
  );
}
