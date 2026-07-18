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
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-slate-400" /> Search Results
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {query.trim() ? (
            <span>
              Showing matches for &ldquo;<strong className="text-slate-800 dark:text-slate-200">{query}</strong>&rdquo;
            </span>
          ) : (
            'Enter a keyword to search across the workspace.'
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm mt-2">Searching the workspace...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-semibold">{error}</div>
      ) : !query.trim() ? (
        <div className="text-center p-12 text-slate-400">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-semibold">Workspace Search</p>
          <p className="text-xs text-slate-500">Find projects, tasks, and users in your organization.</p>
        </div>
      ) : !hasResults ? (
        <div className="text-center p-12 text-slate-400">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-semibold">No results found</p>
          <p className="text-xs text-slate-500">We couldn&apos;t find any items matching &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Projects */}
          {results.projects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Projects ({results.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.projects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project.key}`}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 bg-indigo-55/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center rounded-lg font-bold text-sm shrink-0">
                      {project.key.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">
                        Key: {project.key}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-350" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Tasks ({results.tasks.length})
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
                {results.tasks.map((task) => (
                  <Link
                    key={task._id}
                    href={`/projects/${task.project?.key}/issues/${task.taskKey}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 mb-0.5">
                        <span className="uppercase">{task.taskKey}</span>
                        <span>&bull;</span>
                        <span className="truncate">{task.project?.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.status === 'done'
                          ? 'bg-emerald-50 text-emerald-600'
                          : task.status === 'in-progress'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        task.priority === 'high' || task.priority === 'highest'
                          ? 'bg-red-50 text-red-650'
                          : task.priority === 'low' || task.priority === 'lowest'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-blue-50 text-blue-550'
                      }`}>
                        {task.priority}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-350" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {results.users.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-50 pb-1.5">
                Organization Members ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-550 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-805 dark:text-slate-200 block truncate">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-400 block truncate">
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 mt-2">Loading search params...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
