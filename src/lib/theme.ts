'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, createElement } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('nexuslearn-theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
      setResolvedTheme(resolveTheme(stored));
    } else {
      setResolvedTheme(getSystemTheme());
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    const root = document.documentElement;

    // Add transition class for smooth switching
    root.style.setProperty('--theme-transition', 'background-color 0.3s ease, color 0.3s ease');

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Apply CSS variables
    applyThemeVariables(resolved);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
      applyThemeVariables(e.matches ? 'dark' : 'light');
      if (e.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexuslearn-theme', newTheme);
  }, []);

  return createElement(
    ThemeContext.Provider,
    { value: { theme, resolvedTheme, setTheme } },
    children
  );
}

function applyThemeVariables(theme: 'light' | 'dark') {
  const root = document.documentElement;
  const vars = themeTokens[theme];

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

const themeTokens: Record<'light' | 'dark', Record<string, string>> = {
  dark: {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--bg-elevated': '#1e293b',
    '--text-primary': '#f8fafc',
    '--text-secondary': '#94a3b8',
    '--text-tertiary': '#64748b',
    '--border-primary': '#334155',
    '--border-secondary': '#475569',
    '--accent': '#6366f1',
    '--accent-hover': '#818cf8',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--shadow': '0 4px 6px -1px rgba(0,0,0,0.3)',
  },
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#e2e8f0',
    '--bg-elevated': '#ffffff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-tertiary': '#94a3b8',
    '--border-primary': '#e2e8f0',
    '--border-secondary': '#cbd5e1',
    '--accent': '#6366f1',
    '--accent-hover': '#4f46e5',
    '--success': '#16a34a',
    '--warning': '#d97706',
    '--error': '#dc2626',
    '--shadow': '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
};

/**
 * Script to inject in <head> to prevent flash of wrong theme.
 * Runs before React hydration.
 */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('nexuslearn-theme') || 'system';
    var d = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.add(d);
  } catch(e){}
})()
`;
