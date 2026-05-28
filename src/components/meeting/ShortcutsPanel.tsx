"use client";

import { X, Keyboard } from "lucide-react";
import { MEETING_SHORTCUTS, type ShortcutDefinition } from "@/lib/meeting-shortcuts";

// ============================================================
// Types
// ============================================================

interface ShortcutsPanelProps {
  onClose: () => void;
}

// ============================================================
// ShortcutsPanel
// ============================================================

export function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
  const categories = {
    audio: { label: "Audio", shortcuts: [] as ShortcutDefinition[] },
    video: { label: "Video", shortcuts: [] as ShortcutDefinition[] },
    general: { label: "General", shortcuts: [] as ShortcutDefinition[] },
    navigation: { label: "Navigation", shortcuts: [] as ShortcutDefinition[] },
  };

  MEETING_SHORTCUTS.forEach((s) => {
    categories[s.category].shortcuts.push(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {Object.entries(categories).map(
              ([key, { label, shortcuts }]) =>
                shortcuts.length > 0 && (
                  <div key={key}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {label}
                    </h3>
                    <div className="space-y-1">
                      {shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.action}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-800/50"
                        >
                          <span className="text-sm text-gray-300">
                            {shortcut.description}
                          </span>
                          <kbd className="ml-4 inline-flex items-center gap-1 rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-xs font-mono font-medium text-gray-300">
                            {shortcut.label}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-3">
          <p className="text-xs text-gray-500">
            Shortcuts are disabled when typing in text fields
          </p>
        </div>
      </div>
    </div>
  );
}
