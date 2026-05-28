"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Hand, X, ChevronDown, Volume2 } from "lucide-react";
import { useMeetingContext, type HandRaise } from "@/lib/livekit-client";

// ============================================================
// Types
// ============================================================

interface HandRaiseManagerProps {
  isHost: boolean;
  isHandRaised: boolean;
  onToggleHand: () => void;
  onLowerAll?: () => void;
}

// ============================================================
// HandRaiseButton
// ============================================================

export function HandRaiseButton({
  isRaised,
  onClick,
}: {
  isRaised: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
        isRaised
          ? "bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/40"
          : "bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 hover:text-white"
      }`}
      title={isRaised ? "Lower hand" : "Raise hand"}
    >
      <Hand
        className={`h-5 w-5 transition-transform ${
          isRaised ? "animate-bounce" : ""
        }`}
      />
      {isRaised && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500" />
        </span>
      )}
    </button>
  );
}

// ============================================================
// HandRaiseManager
// ============================================================

export function HandRaiseManager({
  isHost,
  isHandRaised,
  onToggleHand,
  onLowerAll,
}: HandRaiseManagerProps) {
  const { handRaises } = useMeetingContext();
  const [showQueue, setShowQueue] = useState(false);
  const prevCountRef = useRef(handRaises.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sortedHands = [...handRaises].sort((a, b) => a.raisedAt - b.raisedAt);

  // Play notification sound for host when new hand raised
  useEffect(() => {
    if (isHost && handRaises.length > prevCountRef.current) {
      // Play a subtle notification
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.stop(ctx.currentTime + 0.3);
      } catch {
        // Audio context might not be available
      }
    }
    prevCountRef.current = handRaises.length;
  }, [handRaises.length, isHost]);

  return (
    <div className="relative">
      {/* Main button */}
      <HandRaiseButton isRaised={isHandRaised} onClick={onToggleHand} />

      {/* Badge showing count */}
      {handRaises.length > 0 && (
        <button
          onClick={() => setShowQueue(!showQueue)}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-gray-900"
        >
          {handRaises.length}
        </button>
      )}

      {/* Queue dropdown */}
      {showQueue && handRaises.length > 0 && (
        <div className="absolute -top-2 left-14 z-50 w-64 -translate-y-full rounded-xl border border-gray-700 bg-gray-800 py-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 px-3 pb-2">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-yellow-400">
              <Hand className="h-4 w-4" />
              Raised Hands ({sortedHands.length})
            </h4>
            {isHost && onLowerAll && (
              <button
                onClick={() => {
                  onLowerAll();
                  setShowQueue(false);
                }}
                className="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                Lower all
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {sortedHands.map((hr, index) => (
              <div
                key={hr.participantId}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700/50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-gray-300">
                  {hr.participantName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeSince(hr.raisedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HandRaiseIndicator (for participant tiles)
// ============================================================

export function HandRaiseIndicator({ isRaised }: { isRaised: boolean }) {
  if (!isRaised) return null;

  return (
    <div className="absolute right-2 top-2 z-10">
      <div className="relative">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-40" />
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 shadow-lg">
          <Hand className="h-4 w-4 text-gray-900" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function formatTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}
