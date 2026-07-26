'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  Menu,
  Calendar,
  Plus,
  Loader2,
  CheckSquare,
  Folder,
  User,
  X,
} from 'lucide-react';
import UserProfileMenu from '@/components/profile/UserProfileMenu';
import NotificationBell from '@/components/NotificationBell';
import { useOrganization } from '@/context/useOrganization';
import { globalSearch, type ISearchResults } from '@/api/search';
import Link from 'next/link';

interface OrgHeaderProps {
  onMenuClick: () => void;
  onSearchSelect: (type: 'project' | 'task' | 'user', item: any) => void;
  daysFilter: string;
  setDaysFilter: (days: string) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export default function OrgHeader({
  onMenuClick,
  onSearchSelect,
  daysFilter,
  setDaysFilter,
  onProfileClick,
  onSettingsClick,
}: OrgHeaderProps) {
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();

  const [wsOpen, setWsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ISearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setWsOpen(false);
    setProfileOpen(false);
    setShowSearchDropdown(false);
    setDateOpen(false);
  };

  // Close search and date dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await globalSearch(searchQuery);
        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Workspace search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const wsColor = 'var(--primary)';
  const wsInitials = currentOrg?.name
    ? currentOrg.name.substring(0, 2).toUpperCase()
    : 'AC';

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-5 bg-surface border-b border-line sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-content-tertiary hover:bg-surface-hover transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Workspace selector */}
      <div className="relative">
        <button
          onClick={() => {
            closeAll();
            setWsOpen(!wsOpen);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors border border-line hover:border-line-strong"
        >
          {currentOrg?.logoUrl ? (
            <img
              src={currentOrg.logoUrl}
              alt=""
              className="w-5 h-5 rounded object-cover shrink-0"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: wsColor }}
            >
              {wsInitials}
            </div>
          )}
          <span className="hidden sm:block text-sm font-semibold text-content-secondary max-w-[140px] truncate">
            {currentOrg?.name || 'Workspace'}
          </span>
          <ChevronDown className="w-3 h-3 text-content-tertiary shrink-0" />
        </button>

        {wsOpen && (
          <div className="absolute left-0 top-11 w-64 bg-surface rounded-lg shadow-lg border border-line overflow-hidden z-50">
            <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider px-4 pt-3 pb-2">
              Your Workspaces
            </p>
            <div className="max-h-60 overflow-y-auto">
              {organizations.map((ws) => {
                const isActive = ws.id === currentOrg?.id;
                const initials = ws.name.substring(0, 2).toUpperCase();
                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      setCurrentOrg(ws);
                      setWsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover cursor-pointer transition-colors ${
                      isActive ? 'bg-[#DEEBFF] text-primary' : ''
                    }`}
                  >
                    {ws.logoUrl ? (
                      <img
                        src={ws.logoUrl}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: wsColor }}
                      >
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-content">
                        {ws.name}
                      </p>
                      <p className="text-[10px] text-content-tertiary capitalize">
                        {ws.plan} Plan
                      </p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-line">
              <Link
                href="/dashboard/workspace/create"
                onClick={() => setWsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-[#DEEBFF]/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create new workspace
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        <div className="flex items-center gap-2 bg-surface-sunken border border-line rounded-lg px-3 py-1.5 w-48 lg:w-64 focus-within:border-[#0052CC] focus-within:bg-white transition-all">
          <Search className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
          <input
            type="text"
            placeholder="Search tasks, projects…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="flex-1 bg-transparent text-sm text-content-secondary placeholder:text-content-tertiary outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}
              className="p-0.5 rounded-full hover:bg-surface-hover text-content-tertiary hover:text-content"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div className="absolute right-0 top-11 w-[320px] bg-surface rounded-lg shadow-lg border border-line overflow-hidden z-50 p-2 space-y-2 max-h-[400px] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-content-tertiary text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Searching workspace...
              </div>
            ) : searchResults &&
              (searchResults.projects.length > 0 ||
                searchResults.tasks.length > 0 ||
                searchResults.users.length > 0) ? (
              <div className="space-y-3">
                {/* Projects Section */}
                {searchResults.projects.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider px-2 py-1">
                      Projects
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.projects.slice(0, 3).map((proj) => (
                        <button
                          key={proj._id}
                          onClick={() => {
                            onSearchSelect('project', proj);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                        >
                          <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-content truncate">
                              {proj.name}
                            </p>
                            <p className="text-[9px] text-content-tertiary uppercase font-black">
                              {proj.key}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {searchResults.tasks.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider px-2 py-1">
                      Tasks
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.tasks.slice(0, 5).map((task) => (
                        <button
                          key={task._id}
                          onClick={() => {
                            onSearchSelect('task', task);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-warning shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-content truncate">
                              {task.title}
                            </p>
                            <p className="text-[9px] text-content-tertiary uppercase font-black">
                              {task.taskKey} &bull; {task.status}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-content-tertiary uppercase tracking-wider px-2 py-1">
                      Members
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.users.slice(0, 3).map((u) => (
                        <button
                          key={u._id}
                          onClick={() => {
                            onSearchSelect('user', u);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                        >
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <User className="w-3.5 h-3.5 text-success shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-content truncate">
                              {u.name}
                            </p>
                            <p className="text-[9px] text-content-tertiary truncate">
                              {u.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-content-tertiary">
                No results found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date range selector */}
      <div className="relative" ref={dateRef}>
        <button
          onClick={() => {
            closeAll();
            setDateOpen(!dateOpen);
          }}
          className="hidden sm:flex items-center gap-1.5 text-sm text-content-secondary bg-surface-sunken border border-line rounded-lg px-3 py-1.5 hover:bg-surface-hover hover:border-line-strong transition-all font-sans cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
          <span className="font-medium text-xs text-content-secondary">
            {daysFilter === 'all' ? 'All time' : `Last ${daysFilter} days`}
          </span>
          <ChevronDown className="w-3 h-3 text-content-tertiary" />
        </button>

        {dateOpen && (
          <div className="absolute right-0 mt-1.5 w-40 rounded-lg border border-line bg-surface p-1 shadow-[0_12px_24px_rgba(9,30,66,0.12)] z-30">
            {[
              { value: '7',   label: 'Last 7 days' },
              { value: '14',  label: 'Last 14 days' },
              { value: '30',  label: 'Last 30 days' },
              { value: '90',  label: 'Last 90 days' },
              { value: 'all', label: 'All time' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setDaysFilter(opt.value);
                  setDateOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  daysFilter === opt.value
                    ? 'bg-[#DEEBFF] text-primary'
                    : 'text-content-secondary hover:bg-surface-hover hover:text-content'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Notifications */}
      <NotificationBell />

      <UserProfileMenu
        avatarSize="sm"
        isOpen={profileOpen}
        onOpenChange={(open) => {
          if (open) {
            setWsOpen(false);
          }
          setProfileOpen(open);
        }}
        profileHref={null}
        settingsHref={null}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
      />
    </header>
  );
}
