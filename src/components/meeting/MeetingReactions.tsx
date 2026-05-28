"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  SmilePlus,
  ThumbsUp,
  ThumbsDown,
  FastForward,
  Rewind,
  Coffee,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  startY: number;
  createdAt: number;
  senderName?: string;
}

interface MeetingReactionsProps {
  onSendReaction: (emoji: string) => void;
  onSendFeedback?: (type: string) => void;
  reactions: { emoji: string; senderId: string; senderName?: string; timestamp: number }[];
}

const EMOJI_OPTIONS = ["👏", "❤️", "😂", "😮", "🎉", "👍", "🔥", "🤔"];

const FEEDBACK_OPTIONS = [
  { type: "thumbs_up", icon: ThumbsUp, label: "Thumbs Up" },
  { type: "thumbs_down", icon: ThumbsDown, label: "Thumbs Down" },
  { type: "speed_up", icon: FastForward, label: "Speed Up" },
  { type: "slow_down", icon: Rewind, label: "Slow Down" },
  { type: "need_break", icon: Coffee, label: "Need Break" },
];

// ============================================================
// FloatingEmoji
// ============================================================

function FloatingEmoji({ reaction }: { reaction: FloatingReaction }) {
  const [opacity, setOpacity] = useState(1);
  const [y, setY] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Float up with easing
      setY(-200 * progress);
      // Fade out in last 30%
      setOpacity(progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none absolute transition-none"
      style={{
        left: `${reaction.x}%`,
        bottom: "80px",
        transform: `translateY(${y}px) translateX(-50%)`,
        opacity,
      }}
    >
      <div className="flex flex-col items-center">
        <span className="text-4xl drop-shadow-lg">{reaction.emoji}</span>
        {reaction.senderName && (
          <span className="mt-0.5 whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/80">
            {reaction.senderName}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MeetingReactions
// ============================================================

export function MeetingReactions({
  onSendReaction,
  onSendFeedback,
  reactions,
}: MeetingReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const lastProcessedRef = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Convert incoming reactions to floating animations
  useEffect(() => {
    const newReactions = reactions.filter(
      (r) => r.timestamp > lastProcessedRef.current
    );
    if (newReactions.length > 0) {
      lastProcessedRef.current = Math.max(
        ...newReactions.map((r) => r.timestamp)
      );

      const floating = newReactions.map((r) => ({
        id: `${r.timestamp}-${Math.random().toString(36).slice(2)}`,
        emoji: r.emoji,
        x: 20 + Math.random() * 60, // Random x between 20-80%
        startY: 0,
        createdAt: Date.now(),
        senderName: r.senderName,
      }));

      setFloatingReactions((prev) => [...prev, ...floating]);
    }
  }, [reactions]);

  // Clean up expired reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingReactions((prev) =>
        prev.filter((r) => now - r.createdAt < 3500)
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setShowFeedback(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onSendReaction(emoji);

    // Immediately show local floating reaction
    const localReaction: FloatingReaction = {
      id: `local-${Date.now()}`,
      emoji,
      x: 20 + Math.random() * 60,
      startY: 0,
      createdAt: Date.now(),
      senderName: "You",
    };
    setFloatingReactions((prev) => [...prev, localReaction]);
    setShowPicker(false);
  };

  return (
    <>
      {/* Floating Reactions Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floatingReactions.map((reaction) => (
          <FloatingEmoji key={reaction.id} reaction={reaction} />
        ))}
      </div>

      {/* Reaction Picker */}
      <div ref={pickerRef} className="relative">
        {showPicker && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 rounded-2xl bg-gray-800/95 p-2 shadow-2xl backdrop-blur-sm">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="rounded-xl p-2 text-2xl transition-transform hover:scale-125 hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Non-verbal feedback */}
            {onSendFeedback && (
              <div className="mt-1 flex justify-center gap-1 border-t border-gray-700 pt-1">
                {FEEDBACK_OPTIONS.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      onSendFeedback(type);
                      setShowPicker(false);
                    }}
                    className="group relative rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
