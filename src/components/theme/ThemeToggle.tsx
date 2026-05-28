'use client';

import { useState } from 'react';
import { useTheme, Theme } from '@/lib/theme';

import { Monitor, Moon, Sun } from 'lucide-react';
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const themes: { key: Theme; label: string }[] = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ];

  const cycleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const currentIdx = order.indexOf(theme);
    const nextIdx = (currentIdx + 1) % order.length;
    setTheme(order[nextIdx]);
  };

  return (
    <div className="relative">
      <button
        onClick={cycleTheme}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative w-9 h-9 rounded-lg bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center transition-colors group"
        aria-label={`Current theme: ${theme}. Click to change.`}
      >
        {/* Sun icon (light) */}
        <svg
          className={`w-4 h-4 absolute transition-all duration-300 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100 text-amber-400'
              : 'opacity-0 rotate-90 scale-50 text-gray-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon icon (dark) */}
        <svg
          className={`w-4 h-4 absolute transition-all duration-300 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100 text-indigo-400'
              : 'opacity-0 -rotate-90 scale-50 text-gray-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>

        {/* System icon */}
        <svg
          className={`w-4 h-4 absolute transition-all duration-300 ${
            theme === 'system'
              ? 'opacity-100 rotate-0 scale-100 text-gray-300'
              : 'opacity-0 rotate-90 scale-50 text-gray-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-slate-900 border border-slate-700 rounded-md whitespace-nowrap z-50">
          {theme === 'light' ? <><Sun className="w-4 h-4 inline" /> Light</> : theme === 'dark' ? <><Moon className="w-4 h-4 inline" /> Dark</> : <><Monitor className="w-4 h-4 inline" /> System</>}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
        </div>
      )}
    </div>
  );
}
