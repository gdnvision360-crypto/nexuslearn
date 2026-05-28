"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, BarChart3, AlertTriangle, Clock } from "lucide-react";
import { useMeetingContext } from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface SpeakerStatsProps {
  onClose: () => void;
}

interface SpeakerStat {
  identity: string;
  name: string;
  speakingTime: number; // in seconds
  isSpeaking: boolean;
}

// ============================================================
// SpeakerStats
// ============================================================

export function SpeakerStats({ onClose }: SpeakerStatsProps) {
  const { participants } = useMeetingContext();
  const [stats, setStats] = useState<Map<string, SpeakerStat>>(new Map());
  const lastUpdateRef = useRef<number>(Date.now());
  const speakingStartRef = useRef<Map<string, number>>(new Map());

  // Track speaking time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setStats((prev) => {
        const updated = new Map(prev);

        participants.forEach((p) => {
          const existing = updated.get(p.identity) || {
            identity: p.identity,
            name: p.name,
            speakingTime: 0,
            isSpeaking: false,
          };

          if (p.isSpeaking) {
            existing.speakingTime += elapsed;
            existing.isSpeaking = true;
          } else {
            existing.isSpeaking = false;
          }

          existing.name = p.name;
          updated.set(p.identity, existing);
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [participants]);

  const sortedStats = useMemo(
    () => [...stats.values()].sort((a, b) => b.speakingTime - a.speakingTime),
    [stats]
  );

  const totalTime = useMemo(
    () => sortedStats.reduce((sum, s) => sum + s.speakingTime, 0),
    [sortedStats]
  );

  const dominantSpeaker = sortedStats.length > 0 && totalTime > 60
    ? sortedStats[0]
    : null;

  const isDominating =
    dominantSpeaker &&
    totalTime > 0 &&
    dominantSpeaker.speakingTime / totalTime > 0.6;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const barColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4" />
          Speaker Stats
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Domination Warning */}
      {isDominating && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
          <div>
            <p className="text-xs font-medium text-yellow-400">
              Speaking imbalance detected
            </p>
            <p className="text-xs text-yellow-500/70">
              {dominantSpeaker!.name} has spoken{" "}
              {Math.round((dominantSpeaker!.speakingTime / totalTime) * 100)}% of
              the time
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {sortedStats.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-600" />
            <p className="text-sm text-gray-400">Tracking speaking time...</p>
            <p className="mt-1 text-xs text-gray-500">
              Stats will appear as participants speak
            </p>
          </div>
        ) : (
          sortedStats.map((stat, idx) => {
            const percentage =
              totalTime > 0 ? (stat.speakingTime / totalTime) * 100 : 0;

            return (
              <div key={stat.identity} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-white">
                      {stat.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{stat.name}</span>
                    {stat.isSpeaking && (
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(stat.speakingTime)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        barColors[idx % barColors.length]
                      }`}
                      style={{ width: `${Math.max(percentage, 1)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-500">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {totalTime > 0 && (
        <div className="border-t border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total speaking time</span>
            <span>{formatTime(totalTime)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>Participants tracked</span>
            <span>{sortedStats.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
