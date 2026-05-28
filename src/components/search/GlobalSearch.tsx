'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { BookOpen, Calendar, CheckCircle, FileText, Folder, MessageSquare, Search, Users, Video } from 'lucide-react';
type SearchCategory =
  | 'all'
  | 'meetings'
  | 'messages'
  | 'documents'
  | 'tasks'
  | 'courses'
  | 'files'
  | 'people';

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon?: string;
  highlight?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  url: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-meeting', label: 'Create meeting', icon: <Video className="w-4 h-4" />, url: '/meetings?action=create' },
  { id: 'new-task', label: 'New task', icon: <CheckCircle className="w-4 h-4" />, url: '/tasks?action=create' },
  { id: 'upload-file', label: 'Upload file', icon: <Folder className="w-4 h-4" />, url: '/files?action=upload' },
  { id: 'new-course', label: 'Create course', icon: <BookOpen className="w-4 h-4" />, url: '/courses?action=create' },
];

const CATEGORY_ICONS: Record<SearchCategory, string> = {
  all: <Search className="w-4 h-4" />,
  meetings: <Video className="w-4 h-4" />,
  messages: <MessageSquare className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />,
  tasks: <CheckCircle className="w-4 h-4" />,
  courses: <BookOpen className="w-4 h-4" />,
  files: <Folder className="w-4 h-4" />,
  people: <Users className="w-4 h-4" />,
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  all: 'All',
  meetings: 'Meetings',
  messages: 'Messages',
  documents: 'Documents',
  tasks: 'Tasks',
  courses: 'Courses',
  files: 'Files',
  people: 'People',
};

const STORAGE_KEY = 'nexuslearn_recent_searches';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setCategory('all');
    }
  }, [isOpen]);

  // Debounced search
  const search = useCallback(
    async (q: string, cat: SearchCategory) => {
      if (!q.trim()) {
        setResults([]);
        setCategoryCounts({});
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q, ...(cat !== 'all' && { category: cat }) });
        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.results || []);
        setCategoryCounts(data.counts || {});
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, category), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category, search]);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (query) saveRecentSearch(query);
    setIsOpen(false);
    window.location.href = result.url;
  };

  const handleQuickAction = (action: QuickAction) => {
    setIsOpen(false);
    window.location.href = action.url;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = query ? results.length : QUICK_ACTIONS.length + recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(totalItems, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (!query && selectedIndex < QUICK_ACTIONS.length) {
        handleQuickAction(QUICK_ACTIONS[selectedIndex]);
      } else if (!query) {
        const searchIdx = selectedIndex - QUICK_ACTIONS.length;
        if (recentSearches[searchIdx]) {
          setQuery(recentSearches[searchIdx]);
        }
      }
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-indigo-500/30 text-indigo-300 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const categories: SearchCategory[] = [
    'all', 'meetings', 'messages', 'documents', 'tasks', 'courses', 'files', 'people',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search meetings, tasks, courses, people..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm
                       outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-500 bg-slate-700 rounded border border-slate-600">
            ESC
          </kbd>
        </div>

        {/* Category Tabs (shown when searching) */}
        {query && (
          <div className="flex gap-1 px-4 py-2 border-b border-slate-700 overflow-x-auto">
            {categories.map((cat) => {
              const count = cat === 'all'
                ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
                : categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg
                    whitespace-nowrap transition-colors
                    ${category === cat
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-slate-700/50'}`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-gray-500">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query ? (
            results.length === 0 && !loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-gray-500 mt-1">Try different keywords or categories</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-500/10 text-white'
                          : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="text-lg flex-shrink-0">
                      {CATEGORY_ICONS[result.type] || <FileText className="w-4 h-4" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {highlightMatch(result.title, query)}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 uppercase">{result.type}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              {/* Quick Actions */}
              <div className="py-2">
                <p className="px-4 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </p>
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left
                      transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-500/10 text-white'
                          : 'text-gray-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-sm">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="py-2 border-t border-slate-700">
                  <p className="px-4 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </p>
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left
                        transition-colors ${
                          index + QUICK_ACTIONS.length === selectedIndex
                            ? 'bg-indigo-500/10 text-white'
                            : 'text-gray-400 hover:bg-slate-700/50'
                        }`}
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700 text-[10px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded border border-slate-600">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded border border-slate-600">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-700 rounded border border-slate-600">⌘K</kbd>
            Toggle search
          </span>
        </div>
      </div>
    </div>
  );
}
