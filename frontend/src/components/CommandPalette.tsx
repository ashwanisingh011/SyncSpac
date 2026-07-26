'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { globalSearch, ISearchResults } from '@/api/search';
import {
  Search,
  Folder,
  CheckSquare,
  User,
  Loader2,
  CornerDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mr-1 rounded border border-line bg-surface px-1.5 py-0.5 font-sans shadow-card">
      {children}
    </kbd>
  );
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

  const rowClass = (isSelected: boolean) =>
    cn(
      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer',
      isSelected
        ? 'bg-primary-subtle text-primary'
        : 'text-content-secondary hover:bg-surface-hover'
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Main command palette dialog */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="relative z-10 flex max-h-[500px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface-overlay shadow-overlay"
          >
            {/* Search header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-5 w-5 text-content-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 border-none bg-transparent text-sm text-content placeholder:text-content-tertiary focus:outline-none"
                placeholder="Search projects, tasks, members... (Esc to close)"
              />
              {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
            </div>

            {/* Results body */}
            <div className="flex-1 overflow-y-auto py-2">
              {!query.trim() ? (
                <div className="py-12 text-center text-content-tertiary">
                  <Search className="mx-auto mb-2 h-10 w-10 opacity-30" />
                  <p className="text-xs font-semibold">Workspace Command Palette</p>
                  <p className="mt-0.5 text-[10px]">Start typing to search projects, tasks, and members.</p>
                </div>
              ) : flatItems.length === 0 ? (
                <div className="py-12 text-center text-content-tertiary">
                  <span className="text-xs font-semibold">No results found</span>
                  <p className="mt-0.5 text-[10px]">We couldn&apos;t find anything matching your query.</p>
                  {query.trim() && (
                    <button
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                        onClose();
                      }}
                      className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Search everywhere for &ldquo;{query}&rdquo;
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 px-2">

                  {/* Projects group */}
                  {results && results.projects.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
                        Projects
                      </span>
                      {results.projects.map((p, i) => {
                        const idx = flatItems.findIndex((item) => item.type === 'project' && item.data._id === p._id);
                        const isSelected = selectedIndex === idx;

                        return (
                          <motion.button
                            key={p._id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.02 }}
                            onClick={() => {
                              router.push(`/projects/${p.key}`);
                              onClose();
                            }}
                            className={rowClass(isSelected)}
                          >
                            <span className="flex items-center gap-2">
                              <Folder className="h-4 w-4 shrink-0 text-primary" />
                              <span className="font-semibold">{p.name}</span>
                              <span className="text-[9px] font-bold uppercase text-content-tertiary">({p.key})</span>
                            </span>
                            {isSelected && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks group */}
                  {results && results.tasks.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
                        Tasks
                      </span>
                      {results.tasks.map((t, i) => {
                        const idx = flatItems.findIndex((item) => item.type === 'task' && item.data._id === t._id);
                        const isSelected = selectedIndex === idx;

                        return (
                          <motion.button
                            key={t._id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.02 }}
                            onClick={() => {
                              router.push(`/projects/${t.project?.key}/issues/${t.taskKey}`);
                              onClose();
                            }}
                            className={rowClass(isSelected)}
                          >
                            <span className="flex items-center gap-2 truncate pr-4">
                              <CheckSquare className="h-4 w-4 shrink-0 text-content-tertiary" />
                              <span className="shrink-0 text-[10px] font-semibold uppercase text-content-tertiary">{t.taskKey}</span>
                              <span className="truncate">{t.title}</span>
                            </span>
                            {isSelected && <CornerDownLeft className="h-3.5 w-3.5 opacity-60" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Members group */}
                  {results && results.users.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="mb-1 block px-2 text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
                        Members
                      </span>
                      {results.users.map((u) => {
                        const idx = flatItems.findIndex((item) => item.type === 'user' && item.data._id === u._id);
                        const isSelected = selectedIndex === idx;

                        return (
                          <div
                            key={u._id}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                              isSelected ? 'bg-primary-subtle text-primary' : 'text-content-secondary'
                            )}
                          >
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 shrink-0 text-content-tertiary" />
                            )}
                            <span className="font-medium">{u.name}</span>
                            <span className="text-[10px] text-content-tertiary">({u.email})</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Command palette footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-line bg-surface-sunken px-4 py-2 text-[10px] text-content-tertiary">
              <div className="flex items-center gap-2.5">
                <span><Kbd>↑↓</Kbd>to navigate</span>
                <span><Kbd>Enter</Kbd>to select</span>
              </div>
              <span><Kbd>Esc</Kbd>to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
