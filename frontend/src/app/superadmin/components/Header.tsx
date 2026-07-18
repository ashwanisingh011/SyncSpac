"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Menu, Calendar, Loader2, User, Building, X } from 'lucide-react';
import UserProfileMenu from '@/components/profile/UserProfileMenu';
import ThemeToggle from '@/components/ThemeToggle';
import { useToast } from '@/context/useToast';
import { getPlatformUsers, getPlatformOrganizations, IAdminUser, IAdminOrganization } from '@/api/admin';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function Header({ onMenuClick, pageTitle = 'Dashboard', pageSubtitle = 'Platform overview' }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const { showToast } = useToast();

  const notifications: any[] = [];

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{ users: IAdminUser[], orgs: IAdminOrganization[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Date range states
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
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
        const [usersRes, orgsRes] = await Promise.all([
          getPlatformUsers({ search: searchQuery }),
          getPlatformOrganizations({ search: searchQuery })
        ]);
        setSearchResults({
          users: usersRes.success ? usersRes.data : [],
          orgs: orgsRes.success ? orgsRes.data : []
        });
      } catch (err) {
        console.error('Superadmin search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="h-16 flex items-center gap-4 px-4 lg:px-6 bg-white border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-10">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="hidden sm:block">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white leading-none">{pageTitle}</h1>
        <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">{pageSubtitle}</p>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div ref={searchRef} className="relative hidden md:block">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg px-3 py-2 w-56 lg:w-72 transition-all focus-within:border-blue-450 focus-within:bg-white focus-within:shadow-sm focus-within:shadow-blue-100 dark:focus-within:bg-slate-950/60 dark:focus-within:border-blue-500/50">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search orgs, users…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}
              className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden lg:inline text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-1.5 py-0.5 rounded">⌘K</kbd>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div className="absolute right-0 top-12 w-[320px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden z-50 p-2 space-y-2 max-h-[400px] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Searching platform...
              </div>
            ) : searchResults && (searchResults.orgs.length > 0 || searchResults.users.length > 0) ? (
              <div className="space-y-3">
                {/* Organizations */}
                {searchResults.orgs.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                      Organizations
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.orgs.slice(0, 3).map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            showToast(`Selected org: ${org.name}`, 'info');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{org.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-black">{org.plan} Plan</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Users */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                      Users
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.users.slice(0, 5).map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            showToast(`Selected user: ${u.name}`, 'info');
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                        >
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
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
            setNotifOpen(false);
            setProfileOpen(false);
            setShowSearchDropdown(false);
            setDateOpen(!dateOpen);
          }}
          className="hidden sm:flex items-center gap-1.5 text-sm text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all font-sans cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-450" />
          <span className="font-medium text-xs text-slate-750">
            {dateRange === 'all' ? 'All time' : dateRange === 'Last 30 days' ? 'Last 30 days' : `Last ${dateRange} days`}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {dateOpen && (
          <div className="absolute right-0 mt-1.5 w-40 rounded-lg border border-[#DFE1E6] bg-white p-1 shadow-[0_12px_24px_rgba(9,30,66,0.12)] z-30 dark:bg-slate-950 dark:border-slate-850">
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
                  setDateRange(opt.value);
                  setDateOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  (dateRange === opt.value || (dateRange === 'Last 30 days' && opt.value === '30'))
                    ? 'bg-blue-50 text-blue-600 dark:bg-slate-900 dark:text-blue-300'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-850 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">Mark all read</span>
            </div>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    n.dot === 'red' ? 'bg-red-500' :
                    n.dot === 'amber' ? 'bg-amber-400' : 'bg-blue-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-205">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 truncate">{n.desc}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No new notifications
              </div>
            )}
            <div className="px-4 py-2.5 text-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">View all notifications</span>
            </div>
          </div>
        )}
      </div>

      <UserProfileMenu
        isOpen={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (open) setNotifOpen(false);
        }}
        profileHref="/superadmin/profile"
        settingsHref="/superadmin/settings"
      />
    </header>
  );
}
