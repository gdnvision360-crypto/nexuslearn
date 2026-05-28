"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Radio,
  Plus,
  Trash2,
  Play,
  Square,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  Activity,
  Eye,
  Clock,
  ChevronDown,
  Wifi,
  WifiOff,
  Settings,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

type StreamPlatform = "youtube" | "twitch" | "facebook" | "custom";
type StreamStatus = "idle" | "connecting" | "live" | "error";

interface StreamTarget {
  id: string;
  platform: StreamPlatform;
  rtmpUrl: string;
  streamKey: string;
  status: StreamStatus;
  startedAt?: string;
  viewerCount?: number;
  errorMessage?: string;
}

interface StreamHealth {
  bitrate: number;
  droppedFrames: number;
  fps: number;
  resolution: string;
  uptime: number;
}

interface LiveStreamPanelProps {
  meetingId: string;
  isHost: boolean;
  onClose: () => void;
}

const PLATFORM_INFO: Record<StreamPlatform, { name: string; color: string; defaultUrl: string }> = {
  youtube: { name: "YouTube Live", color: "#FF0000", defaultUrl: "rtmp://a.rtmp.youtube.com/live2" },
  twitch: { name: "Twitch", color: "#9146FF", defaultUrl: "rtmp://live.twitch.tv/app" },
  facebook: { name: "Facebook Live", color: "#1877F2", defaultUrl: "rtmps://live-api-s.facebook.com:443/rtmp/" },
  custom: { name: "Custom RTMP", color: "#6B7280", defaultUrl: "" },
};

// ============================================================
// LiveStreamPanel
// ============================================================

export function LiveStreamPanel({ meetingId, isHost, onClose }: LiveStreamPanelProps) {
  const [targets, setTargets] = useState<StreamTarget[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamHealth, setStreamHealth] = useState<StreamHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  const [egressId, setEgressId] = useState<string | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New target form state
  const [newPlatform, setNewPlatform] = useState<StreamPlatform>("youtube");
  const [newStreamKey, setNewStreamKey] = useState("");
  const [newRtmpUrl, setNewRtmpUrl] = useState("");

  // Stream duration timer
  useEffect(() => {
    if (isStreaming) {
      durationRef.current = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
      setStreamDuration(0);
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [isStreaming]);

  // Poll stream status
  useEffect(() => {
    if (!isStreaming || !egressId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}/stream`);
        if (response.ok) {
          const data = (await response.json()) as {
            status?: StreamStatus;
            health?: StreamHealth;
            targets?: StreamTarget[];
          };
          if (data.health) setStreamHealth(data.health);
          if (data.targets) setTargets(data.targets);
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isStreaming, egressId, meetingId]);

  // Add stream target
  const addTarget = useCallback(() => {
    if (!newStreamKey.trim()) return;

    const target: StreamTarget = {
      id: crypto.randomUUID(),
      platform: newPlatform,
      rtmpUrl: newRtmpUrl || PLATFORM_INFO[newPlatform].defaultUrl,
      streamKey: newStreamKey,
      status: "idle",
    };

    setTargets((prev) => [...prev, target]);
    setNewStreamKey("");
    setNewRtmpUrl("");
    setShowAddTarget(false);
  }, [newPlatform, newStreamKey, newRtmpUrl]);

  // Remove target
  const removeTarget = useCallback((targetId: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
  }, []);

  // Start streaming with countdown
  const startStream = useCallback(async () => {
    if (targets.length === 0) {
      setError("Add at least one stream target");
      return;
    }

    // Countdown
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to start stream");
      }

      const data = (await response.json()) as { egressId: string; targets: StreamTarget[] };
      setEgressId(data.egressId);
      setTargets(data.targets);
      setIsStreaming(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream failed");
      setTargets((prev) => prev.map((t) => ({ ...t, status: "error" as StreamStatus })));
    } finally {
      setLoading(false);
    }
  }, [meetingId, targets]);

  // Stop streaming
  const stopStream = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`/api/meetings/${meetingId}/stream`, {
        method: "DELETE",
      });
      setIsStreaming(false);
      setEgressId(null);
      setStreamHealth(null);
      setTargets((prev) => prev.map((t) => ({ ...t, status: "idle" as StreamStatus })));
    } catch (err) {
      setError("Failed to stop stream");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatBitrate = (bps: number): string => {
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
    if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} Kbps`;
    return `${bps} bps`;
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Live Stream</h2>
          {isStreaming && (
            <span className="flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mb-4 text-8xl font-bold text-white">{countdown}</div>
            <p className="text-lg text-gray-400">Going live...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isHost ? (
          <div className="rounded-lg bg-gray-800/50 p-6 text-center">
            <Radio className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-sm text-gray-400">
              Only the host can manage live streaming.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stream Status */}
            {isStreaming && (
              <div className="rounded-xl bg-gray-800 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm text-white">
                      {formatDuration(streamDuration)}
                    </span>
                  </div>
                  {streamHealth && (
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{streamHealth.fps} fps</span>
                      <span>{streamHealth.resolution}</span>
                    </div>
                  )}
                </div>

                {/* Health indicators */}
                {streamHealth && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-gray-700/50 p-2">
                      <div className="mb-0.5 text-xs text-gray-400">Bitrate</div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-green-400" />
                        <span className="text-sm font-medium text-white">
                          {formatBitrate(streamHealth.bitrate)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-2">
                      <div className="mb-0.5 text-xs text-gray-400">Dropped</div>
                      <div className="flex items-center gap-1">
                        {streamHealth.droppedFrames > 10 ? (
                          <WifiOff className="h-3 w-3 text-red-400" />
                        ) : (
                          <Wifi className="h-3 w-3 text-green-400" />
                        )}
                        <span className="text-sm font-medium text-white">
                          {streamHealth.droppedFrames} frames
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stream Targets */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-400">
                  Stream Destinations
                </h3>
                {!isStreaming && (
                  <button
                    onClick={() => setShowAddTarget(true)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-blue-400 hover:bg-gray-800"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className="rounded-lg bg-gray-800 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PLATFORM_INFO[target.platform].color }}
                        />
                        <span className="text-sm font-medium text-white">
                          {PLATFORM_INFO[target.platform].name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            target.status === "live"
                              ? "text-green-400"
                              : target.status === "connecting"
                                ? "text-yellow-400"
                                : target.status === "error"
                                  ? "text-red-400"
                                  : "text-gray-500"
                          }`}
                        >
                          {target.status}
                        </span>
                        {!isStreaming && (
                          <button
                            onClick={() => removeTarget(target.id)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {target.viewerCount !== undefined && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="h-3 w-3" />
                        {target.viewerCount.toLocaleString()} viewers
                      </div>
                    )}
                    {target.errorMessage && (
                      <p className="mt-1 text-xs text-red-400">
                        {target.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
                {targets.length === 0 && (
                  <div className="rounded-lg bg-gray-800/50 p-4 text-center text-sm text-gray-500">
                    No stream destinations configured
                  </div>
                )}
              </div>
            </div>

            {/* Add Target Form */}
            {showAddTarget && (
              <div className="rounded-xl bg-gray-800 p-4 space-y-3">
                <h4 className="text-sm font-medium text-white">
                  Add Stream Destination
                </h4>

                {/* Platform */}
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Platform
                  </label>
                  <div className="relative">
                    <select
                      value={newPlatform}
                      onChange={(e) => {
                        const platform = e.target.value as StreamPlatform;
                        setNewPlatform(platform);
                        setNewRtmpUrl(PLATFORM_INFO[platform].defaultUrl);
                      }}
                      className="w-full appearance-none rounded-lg bg-gray-700 px-3 py-2 pr-8 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(PLATFORM_INFO).map(([key, info]) => (
                        <option key={key} value={key}>
                          {info.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* RTMP URL (only for custom) */}
                {newPlatform === "custom" && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">
                      RTMP URL
                    </label>
                    <input
                      type="text"
                      value={newRtmpUrl}
                      onChange={(e) => setNewRtmpUrl(e.target.value)}
                      placeholder="rtmp://your-server/live"
                      className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Stream Key */}
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    Stream Key
                  </label>
                  <input
                    type="password"
                    value={newStreamKey}
                    onChange={(e) => setNewStreamKey(e.target.value)}
                    placeholder="Enter your stream key"
                    className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAddTarget(false);
                      setNewStreamKey("");
                      setNewRtmpUrl("");
                    }}
                    className="flex-1 rounded-lg bg-gray-700 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTarget}
                    disabled={!newStreamKey.trim()}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-600/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Go Live / Stop */}
            <div className="pt-2">
              {!isStreaming ? (
                <button
                  onClick={startStream}
                  disabled={targets.length === 0 || loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  Go Live
                </button>
              ) : (
                <button
                  onClick={stopStream}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  End Stream
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
