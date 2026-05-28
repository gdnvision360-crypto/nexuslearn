'use client';

import { useState, useEffect, useCallback } from 'react';

interface A11ySettings {
  fontSize: number; // 0=normal, -2 to +4
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
  focusIndicator: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  reducedMotion: false,
  dyslexiaFont: false,
  focusIndicator: false,
};

export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('nexuslearn-a11y');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {}
    }
  }, []);

  // Apply settings
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const baseSizePx = 16 + settings.fontSize * 2;
    root.style.fontSize = `${baseSizePx}px`;

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0ms');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--transition-duration');
      root.classList.remove('reduce-motion');
    }

    // Dyslexia font
    root.classList.toggle('dyslexia-font', settings.dyslexiaFont);

    // Enhanced focus indicators
    root.classList.toggle('enhanced-focus', settings.focusIndicator);

    // Persist
    localStorage.setItem('nexuslearn-a11y', JSON.stringify(settings));
  }, [settings]);

  // Keyboard shortcut: ? for shortcuts reference
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const updateSetting = useCallback(<K extends keyof A11ySettings>(
    key: K, value: A11ySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const announce = (message: string) => {
    const region = document.getElementById('a11y-live-region');
    if (region) {
      region.textContent = '';
      setTimeout(() => { region.textContent = message; }, 50);
    }
  };

  const resetAll = () => {
    setSettings(DEFAULT_SETTINGS);
    announce('Accessibility settings reset to defaults');
  };

  const shortcuts = [
    { keys: '⌘/Ctrl + K', action: 'Global search' },
    { keys: '?', action: 'Keyboard shortcuts' },
    { keys: 'Esc', action: 'Close dialog / panel' },
    { keys: 'Tab', action: 'Navigate forward' },
    { keys: 'Shift + Tab', action: 'Navigate backward' },
    { keys: 'Enter / Space', action: 'Activate button' },
    { keys: '↑ ↓', action: 'Navigate list items' },
    { keys: 'Alt + 1', action: 'Go to Dashboard' },
    { keys: 'Alt + 2', action: 'Go to Meetings' },
    { keys: 'Alt + 3', action: 'Go to Courses' },
  ];

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]
                 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg
                 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div
        id="a11y-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility options"
        aria-expanded={isOpen}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-800 border border-slate-700
                 hover:border-indigo-500 shadow-lg flex items-center justify-center transition-all
                 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <circle cx="12" cy="8" r="2" fill="currentColor" />
          <path strokeLinecap="round" strokeWidth="2" d="M12 12v6M9 18h6" />
        </svg>
      </button>

      {/* Toolbar Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Accessibility settings"
          className="fixed bottom-16 right-4 z-50 w-72 bg-slate-800 border border-slate-700
                   rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-white">Accessibility</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close accessibility toolbar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {/* Font Size */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Font Size ({settings.fontSize > 0 ? '+' : ''}{settings.fontSize})
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (settings.fontSize > -2) {
                      updateSetting('fontSize', settings.fontSize - 1);
                      announce(`Font size decreased to ${settings.fontSize - 1}`);
                    }
                  }}
                  disabled={settings.fontSize <= -2}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                  aria-label="Decrease font size"
                >
                  A-
                </button>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${((settings.fontSize + 2) / 6) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (settings.fontSize < 4) {
                      updateSetting('fontSize', settings.fontSize + 1);
                      announce(`Font size increased to ${settings.fontSize + 1}`);
                    }
                  }}
                  disabled={settings.fontSize >= 4}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-bold"
                  aria-label="Increase font size"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Toggle Options */}
            {[
              {
                key: 'highContrast' as const,
                label: 'High Contrast',
                desc: 'Increase color contrast',
                icon: '◐',
              },
              {
                key: 'reducedMotion' as const,
                label: 'Reduced Motion',
                desc: 'Minimize animations',
                icon: '⏸',
              },
              {
                key: 'dyslexiaFont' as const,
                label: 'Dyslexia Font',
                desc: 'Use OpenDyslexic-style font',
                icon: 'Aa',
              },
              {
                key: 'focusIndicator' as const,
                label: 'Focus Indicators',
                desc: 'Enhanced keyboard focus styling',
                icon: '⊡',
              },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs">
                    {icon}
                  </span>
                  <div>
                    <p className="text-xs text-gray-300">{label}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => {
                    updateSetting(key, !settings[key]);
                    announce(`${label} ${!settings[key] ? 'enabled' : 'disabled'}`);
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    settings[key] ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings[key] ? 'translate-x-4' : ''
                  }`} />
                </button>
              </div>
            ))}

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white
                       bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <span>⌨️</span>
              <span>Keyboard Shortcuts</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-slate-700 border border-slate-600 rounded">?</kbd>
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
             onClick={() => setShowShortcuts(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.keys} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-300">{s.action}</span>
                  <kbd className="px-2 py-1 text-xs font-mono text-gray-300 bg-slate-700 border border-slate-600 rounded">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Injected Styles */}
      <style jsx global>{`
        .high-contrast {
          filter: contrast(1.3);
        }
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0ms !important;
          transition-duration: 0ms !important;
        }
        .dyslexia-font {
          font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
          letter-spacing: 0.05em;
          word-spacing: 0.1em;
          line-height: 1.8;
        }
        .enhanced-focus *:focus-visible {
          outline: 3px solid #6366f1 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2) !important;
        }
      `}</style>
    </>
  );
}
