"use client";

import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { useMeetingContext } from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface NetworkStats {
  quality: number; // 1-5
  latency: number; // ms
  packetLoss: number; // percentage
  bandwidth: number; // kbps
  jitter: number; // ms
}

interface NetworkQualityProps {
  showDetails?: boolean;
}

// ============================================================
// NetworkQuality
// ============================================================

export function NetworkQuality({ showDetails = false }: NetworkQualityProps) {
  const { room } = useMeetingContext();
  const [stats, setStats] = useState<NetworkStats>({
    quality: 5,
    latency: 0,
    packetLoss: 0,
    bandwidth: 0,
    jitter: 0,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Poll connection stats
  useEffect(() => {
    const updateStats = async () => {
      if (!room) return;

      try {
        const localParticipant = room.localParticipant;
        const connectionQuality = localParticipant.connectionQuality;

        // Map LiveKit connection quality to 1-5
        let quality = 5;
        switch (connectionQuality) {
          case "excellent":
            quality = 5;
            break;
          case "good":
            quality = 4;
            break;
          case "poor":
            quality = 2;
            break;
          case "lost":
            quality = 1;
            break;
          default:
            quality = 3;
        }

        // Try to get WebRTC stats
        let latency = 0;
        let packetLoss = 0;
        let bandwidth = 0;
        let jitter = 0;

        try {
          const sender = localParticipant.getTrackPublications();
          // Get stats from peer connection if available
          const pc = (room as any).engine?.pcManager?.publisher?.pc;
          if (pc) {
            const rtcStats = await pc.getStats();
            rtcStats.forEach((report: any) => {
              if (report.type === "candidate-pair" && report.state === "succeeded") {
                latency = report.currentRoundTripTime
                  ? report.currentRoundTripTime * 1000
                  : 0;
                bandwidth = report.availableOutgoingBitrate
                  ? report.availableOutgoingBitrate / 1000
                  : 0;
              }
              if (report.type === "outbound-rtp" && report.kind === "video") {
                if (report.packetsSent > 0 && report.packetsLost) {
                  packetLoss =
                    (report.packetsLost /
                      (report.packetsSent + report.packetsLost)) *
                    100;
                }
                jitter = report.jitter ? report.jitter * 1000 : 0;
              }
            });
          }
        } catch {
          // Stats not available
        }

        const newStats = { quality, latency, packetLoss, bandwidth, jitter };
        setStats(newStats);

        // Show warning if quality drops
        if (quality <= 2 && !showWarning) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }
      } catch (err) {
        // Silently fail
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  const getQualityColor = (q: number) => {
    if (q >= 4) return "text-green-500";
    if (q >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  const getBarColor = (q: number, index: number) => {
    if (index >= q) return "bg-gray-600";
    if (q >= 4) return "bg-green-500";
    if (q >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getQualityLabel = (q: number) => {
    if (q >= 4) return "Good";
    if (q >= 3) return "Fair";
    if (q >= 2) return "Poor";
    return "Lost";
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Quality bars */}
      <button className="flex items-end gap-0.5 px-1 py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${getBarColor(
              stats.quality,
              i
            )}`}
            style={{ height: `${6 + i * 3}px` }}
          />
        ))}
      </button>

      {/* Warning banner */}
      {showWarning && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-950/90 p-3 shadow-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-300">
                Connection quality is low
              </p>
              <p className="mt-0.5 text-xs text-red-400/70">
                You may experience lag or dropped frames. Try turning off your
                camera or switching to a better network.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip with details */}
      {showTooltip && !showWarning && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-gray-700 bg-gray-800 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">
              Connection Quality
            </span>
            <span className={`text-xs font-semibold ${getQualityColor(stats.quality)}`}>
              {getQualityLabel(stats.quality)}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Latency</span>
              <span className="text-gray-300">
                {stats.latency > 0 ? `${Math.round(stats.latency)}ms` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Packet Loss</span>
              <span className="text-gray-300">
                {stats.packetLoss > 0
                  ? `${stats.packetLoss.toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Bandwidth</span>
              <span className="text-gray-300">
                {stats.bandwidth > 0
                  ? `${Math.round(stats.bandwidth)} kbps`
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Jitter</span>
              <span className="text-gray-300">
                {stats.jitter > 0 ? `${stats.jitter.toFixed(1)}ms` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
