'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { globalSearch, ISearchResults } from '@/api/search';
import {
  Search,
  Folder,
  CheckSquare,
  User,
  Loader2,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<ISearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults(null);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await globalSearch(query);
      if (response.success) {
        setResults(response.data);
      }
    } catch (err) {
      console.error('Search query failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasResults =
    results &&
    (results.projects.length > 0 || results.tasks.length > 0 || results.users.length > 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="border-b border-line pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-content flex items-center gap-2">
          <Search className="w-6 h-6 text-content-tertiary" /> Search Results
        </h1>
        <p className="text-sm text-content-tertiary mt-1">
          {query.trim() ? (
            <span>
              Showing matches for &ldquo;<strong className="text-content">{query}</strong>&rdquo;
            </span>
          ) : (
            'Enter a keyword to search across the workspace.'
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-content-tertiary">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm mt-2">Searching the workspace...</span>
        </div>
      ) : error ? (
        <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm font-semibold">{error}</div>
      ) : !query.trim() ? (
        <div className="text-center p-12 text-content-tertiary">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-semibold">Workspace Search</p>
          <p className="text-xs text-content-tertiary">Find projects, tasks, and users in your organization.</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center p-12 text-content-tertiary">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-semibold">No results found</p>
          <p className="text-xs text-content-tertiary">We couldn&apos;t find any items matching &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Projects */}
          {results.projects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-content-tertiary uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Projects ({results.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project.key}`}
                    className="flex items-center gap-3 p-4 bg-surface border border-line rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 bg-indigo-55/70 text-indigo-700 flex items-center justify-center rounded-lg font-bold text-sm shrink-0">
                      {project.key.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-content block truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] text-content-tertiary uppercase font-black tracking-wider">
                        Key: {project.key}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-content-tertiary" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-content-tertiary uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Tasks ({results.tasks.length})
              </h2>
              <div className="bg-surface rounded-xl border border-line overflow-hidden divide-y divide-line shadow-sm">
                {results.tasks.map((task) => (
                  <Link
                    key={task._id}
                    href={`/projects/${task.project?.key}/issues/${task.taskKey}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-content-tertiary mb-0.5">
                        <span className="uppercase">{task.taskKey}</span>
                        <span>&bull;</span>
                        <span className="truncate">{task.project?.name}</span>
                      </div>
                      <span className="text-sm font-medium text-content block truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.status === 'done'
                          ? 'bg-success/10 text-success'
                          : task.status === 'in-progress'
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-surface-hover text-content-secondary'
                      }`}>
                        {task.status}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.priority === 'high' || task.priority === 'highest'
                          ? 'bg-danger/10 text-danger'
                          : task.priority === 'low' || task.priority === 'lowest'
                          ? 'bg-surface-hover text-content-tertiary'
                          : 'bg-primary-subtle text-primary'
                      }`}>
                        {task.priority}
                      </span>
                      <ChevronRight className="w-4 h-4 text-content-tertiary" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {results.users.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-content-tertiary uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Organization Members ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 bg-surface border border-line rounded-xl"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-surface-hover text-content-tertiary flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-content block truncate">
                        {user.name}
                      </span>
                      <span className="text-xs text-content-tertiary block truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-content-tertiary mt-2">Loading search params...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
