'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch, ISearchResults } from '@/api/search';
import {
  Search,
  Folder,
  CheckSquare,
  User,
  Loader2,
  CornerDownLeft
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ISearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle global keydown to toggle palette
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounce search input
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await globalSearch(query);
        if (response.success) {
          setResults(response.data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Compile flat list of items to simplify keyboard navigation
  const getFlattenedItems = () => {
    if (!results) return [];
    const items: Array<{ type: 'project' | 'task' | 'user'; data: any; href?: string }> = [];

    results.projects.forEach((p) => {
      items.push({ type: 'project', data: p, href: `/projects/${p.key}` });
    });
    results.tasks.forEach((t) => {
      items.push({ type: 'task', data: t, href: `/projects/${t.project?.key}/issues/${t.taskKey}` });
    });
    results.users.forEach((u) => {
      items.push({ type: 'user', data: u });
    });

    return items;
  };

  const flatItems = getFlattenedItems();

  // Handle arrow keys and enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          if (selected.href) {
            router.push(selected.href);
            onClose();
          } else if (selected.type === 'user') {
            // No action or navigate to user profile
          }
        } else if (query.trim()) {
          // Go to dedicated search page
          router.push(`/search?q=${encodeURIComponent(query)}`);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/40 backdrop-blur-sm px-4">
      {/* Backdrop click closer */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main command palette dialog */}
      <div
        ref={containerRef}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[500px]"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
            placeholder="Search projects, tasks, members... (Esc to close)"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
        </div>

        {/* Results body */}
        <div className="flex-1 overflow-y-auto py-2">
          {!query.trim() ? (
            <div className="text-center py-12 text-slate-400">
              <Search className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-semibold">Workspace Command Palette</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Start typing to search projects, tasks, and members.</p>
            </div>
          ) : flatItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-xs font-semibold">No results found</span>
              <p className="text-[10px] text-slate-500 mt-0.5">We couldn&apos;t find anything matching your query.</p>
              {query.trim() && (
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    onClose();
                  }}
                  className="mt-3 text-xs text-blue-600 hover:underline font-bold"
                >
                  Search everywhere for &ldquo;{query}&rdquo;
                </button>
              )}
            </div>
          ) : (
            <div className="px-2 space-y-4">
              
              {/* Projects group */}
              {results && results.projects.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-1">
                    Projects
                  </span>
                  {results.projects.map((p) => {
                    const idx = flatItems.findIndex((item) => item.type === 'project' && item.data._id === p._id);
                    const isSelected = selectedIndex === idx;

                    return (
                      <button
                        key={p._id}
                        onClick={() => {
                          router.push(`/projects/${p.key}`);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-[#85B8FF]' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">({p.key})</span>
                        </span>
                        {isSelected && <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tasks group */}
              {results && results.tasks.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-1">
                    Tasks
                  </span>
                  {results.tasks.map((t) => {
                    const idx = flatItems.findIndex((item) => item.type === 'task' && item.data._id === t._id);
                    const isSelected = selectedIndex === idx;

                    return (
                      <button
                        key={t._id}
                        onClick={() => {
                          router.push(`/projects/${t.project?.key}/issues/${t.taskKey}`);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-[#85B8FF]' : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate pr-4">
                          <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-semibold text-[10px] uppercase text-slate-450 shrink-0">{t.taskKey}</span>
                          <span className="truncate">{t.title}</span>
                        </span>
                        {isSelected && <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Members group */}
              {results && results.users.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 block mb-1">
                    Members
                  </span>
                  {results.users.map((u) => {
                    const idx = flatItems.findIndex((item) => item.type === 'user' && item.data._id === u._id);
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={u._id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          isSelected ? 'bg-blue-50/50 text-blue-700' : 'text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="font-medium">{u.name}</span>
                        <span className="text-[10px] text-slate-400">({u.email})</span>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Command palette footer */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span>
              <kbd className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 font-sans shadow-sm mr-1">↑↓</kbd>
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 font-sans shadow-sm mr-1">Enter</kbd>
              to select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 font-sans shadow-sm mr-1">Esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
