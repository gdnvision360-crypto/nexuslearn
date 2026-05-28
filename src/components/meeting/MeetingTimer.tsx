"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  Timer,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  X,
  Settings,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface MeetingTimerProps {
  elapsedTime: number;
  isHost: boolean;
  onTimerExpire?: () => void;
}

// ============================================================
// MeetingTimer
// ============================================================

export function MeetingTimer({
  elapsedTime,
  isHost,
  onTimerExpire,
}: MeetingTimerProps) {
  const [isCountdownMode, setIsCountdownMode] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState(0); // in seconds
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupMinutes, setSetupMinutes] = useState(30);
  const [autoEnd, setAutoEnd] = useState(false);
  const [warning5Shown, setWarning5Shown] = useState(false);
  const [warning1Shown, setWarning1Shown] = useState(false);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  // Countdown timer
  useEffect(() => {
    if (!isCountdownRunning || countdownRemaining <= 0) return;

    countdownRef.current = setInterval(() => {
      setCountdownRemaining((prev) => {
        const next = prev - 1;

        // 5 minute warning
        if (next === 300 && !warning5Shown) {
          setWarning5Shown(true);
          setShowWarning("5 minutes remaining");
          setTimeout(() => setShowWarning(null), 5000);
        }

        // 1 minute warning
        if (next === 60 && !warning1Shown) {
          setWarning1Shown(true);
          setShowWarning("1 minute remaining!");
          setTimeout(() => setShowWarning(null), 5000);
        }

        // Timer expired
        if (next <= 0) {
          setIsCountdownRunning(false);
          setShowWarning("Time is up!");
          if (autoEnd) {
            onTimerExpire?.();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isCountdownRunning, countdownRemaining, autoEnd, onTimerExpire, warning5Shown, warning1Shown]);

  const startCountdown = () => {
    const seconds = setupMinutes * 60;
    setCountdownDuration(seconds);
    setCountdownRemaining(seconds);
    setIsCountdownRunning(true);
    setIsCountdownMode(true);
    setShowSetup(false);
    setWarning5Shown(false);
    setWarning1Shown(false);
  };

  const togglePause = () => {
    setIsCountdownRunning(!isCountdownRunning);
  };

  const resetCountdown = () => {
    setCountdownRemaining(countdownDuration);
    setIsCountdownRunning(false);
    setWarning5Shown(false);
    setWarning1Shown(false);
  };

  const cancelCountdown = () => {
    setIsCountdownMode(false);
    setIsCountdownRunning(false);
    setCountdownRemaining(0);
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCountdownColor = () => {
    if (countdownRemaining <= 60) return "text-red-400";
    if (countdownRemaining <= 300) return "text-yellow-400";
    return "text-gray-400";
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Warning Banner */}
      {showWarning && (
        <div className="absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">
              {showWarning}
            </span>
          </div>
        </div>
      )}

      {/* Elapsed time */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDuration(elapsedTime)}</span>
      </div>

      {/* Countdown display */}
      {isCountdownMode && (
        <>
          <span className="text-gray-600">|</span>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${getCountdownColor()}`}>
            <Timer className="h-3.5 w-3.5" />
            <span>{formatDuration(countdownRemaining)}</span>

            {isHost && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={togglePause}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                  title={isCountdownRunning ? "Pause" : "Resume"}
                >
                  {isCountdownRunning ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={resetCountdown}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
                  title="Reset"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={cancelCountdown}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-red-400"
                  title="Cancel timer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Host: Set timer */}
      {isHost && !isCountdownMode && (
        <div className="relative">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-white"
            title="Set countdown timer"
          >
            <Timer className="h-3.5 w-3.5" />
          </button>

          {showSetup && (
            <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-700 bg-gray-800 p-3 shadow-xl">
              <h4 className="mb-2 text-sm font-medium text-white">
                Countdown Timer
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={setupMinutes}
                    onChange={(e) => setSetupMinutes(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={480}
                    className="w-20 rounded bg-gray-700 px-2 py-1.5 text-center text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">minutes</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoEnd}
                    onChange={(e) => setAutoEnd(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600"
                  />
                  <span className="text-xs text-gray-300">
                    Auto-end meeting when timer expires
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={startCountdown}
                    className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => setShowSetup(false)}
                    className="flex-1 rounded-lg bg-gray-700 py-1.5 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
