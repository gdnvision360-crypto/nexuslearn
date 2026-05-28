"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LayoutGrid,
  Presentation,
  PanelRight,
  PictureInPicture2,
  Maximize,
  Minimize,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

export type ViewMode = "gallery" | "speaker" | "sidebar" | "pip";

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
  participantCount: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const VIEW_MODES = [
  {
    mode: "gallery" as ViewMode,
    icon: LayoutGrid,
    label: "Gallery View",
    description: "See everyone in a grid",
  },
  {
    mode: "speaker" as ViewMode,
    icon: Presentation,
    label: "Speaker View",
    description: "Active speaker fills screen",
  },
  {
    mode: "sidebar" as ViewMode,
    icon: PanelRight,
    label: "Sidebar View",
    description: "Content large, participants sidebar",
  },
  {
    mode: "pip" as ViewMode,
    icon: PictureInPicture2,
    label: "Floating View",
    description: "Minimize to small window",
  },
];

// ============================================================
// ViewModeSwitcher
// ============================================================

export function ViewModeSwitcher({
  currentMode,
  onModeChange,
  gridSize = 25,
  onGridSizeChange,
  participantCount,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: ViewModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, []);

  const currentView = VIEW_MODES.find((v) => v.mode === currentMode) || VIEW_MODES[0];

  return (
    <div className="flex items-center gap-2">
      {/* View Mode Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <currentView.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentView.label}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 py-1 shadow-xl">
            {VIEW_MODES.map(({ mode, icon: Icon, label, description }) => (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  setIsOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-700 ${
                  currentMode === mode
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-gray-300"
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </button>
            ))}

            {/* Grid size adjustment */}
            {currentMode === "gallery" && onGridSizeChange && (
              <div className="border-t border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Grid size: {gridSize}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onGridSizeChange(Math.max(4, gridSize - 1))}
                      className="rounded bg-gray-700 p-1 text-gray-300 hover:bg-gray-600"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onGridSizeChange(Math.min(49, gridSize + 1))}
                      className="rounded bg-gray-700 p-1 text-gray-300 hover:bg-gray-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination for gallery view */}
      {currentMode === "gallery" && totalPages > 1 && onPageChange && (
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded px-1.5 py-0.5 hover:bg-gray-700 hover:text-white disabled:opacity-30"
          >
            ‹
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded px-1.5 py-0.5 hover:bg-gray-700 hover:text-white disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      {/* Fullscreen Toggle */}
      <button
        onClick={handleToggleFullscreen}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
        title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullScreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
