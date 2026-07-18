'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Folder, Check } from 'lucide-react';
import UserProfileMenu from '@/components/profile/UserProfileMenu';
import NotificationBell from '@/components/NotificationBell';
import type { Project } from '@/types/projects';

interface ClientHeaderProps {
  displayName: string;
  roleLabel: string;
  unreadCount: number;
  onMenuClick: () => void;
  projects: Project[];
  selectedProject: Project | null;
  onProjectChange: (project: Project | null) => void;
}

export default function ClientHeader({
  displayName,
  roleLabel,
  unreadCount,
  onMenuClick,
  projects,
  selectedProject,
  onProjectChange,
}: ClientHeaderProps): React.JSX.Element {
  const [profileOpen, setProfileOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProjOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Project Switcher */}
        {projects.length > 0 ? (
          <div ref={dropdownRef} className="relative shrink-0">
            {projects.length > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setProjOpen(!projOpen);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all font-semibold text-slate-700 text-xs shadow-sm cursor-pointer"
              >
                {selectedProject?.logo ? (
                  <img
                    src={selectedProject.logo}
                    alt=""
                    className="w-4 h-4 rounded object-cover shrink-0"
                  />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10 shrink-0" />
                )}
                <span className="truncate max-w-[110px] sm:max-w-[200px]">
                  {selectedProject?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 font-semibold text-slate-705 text-xs">
                {selectedProject?.logo ? (
                  <img
                    src={selectedProject.logo}
                    alt=""
                    className="w-4 h-4 rounded object-cover shrink-0"
                  />
                ) : (
                  <Folder className="w-4 h-4 text-blue-500 fill-blue-500/10 shrink-0" />
                )}
                <span className="truncate max-w-[130px] sm:max-w-[220px]">
                  {selectedProject?.name}
                </span>
              </div>
            )}

            {projOpen && (
              <div className="absolute left-0 top-10 w-64 bg-white rounded-xl shadow-xl border border-slate-150 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1.5 duration-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1.5">
                  Your Assigned Projects
                </p>
                <div className="max-h-60 overflow-y-auto py-1">
                  {projects.map((proj) => {
                    const isActive = proj._id === selectedProject?._id;
                    return (
                      <button
                        key={proj._id}
                        type="button"
                        onClick={() => {
                          onProjectChange(proj);
                          setProjOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-xs font-semibold ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {proj.logo ? (
                          <img
                            src={proj.logo}
                            alt=""
                            className="w-5 h-5 rounded object-cover shrink-0"
                          />
                        ) : (
                          <Folder className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{proj.name}</p>
                          <p className="text-[9px] text-slate-455 font-mono mt-0.5">{proj.key}</p>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-xs font-bold text-slate-705 flex items-center gap-1.5 shrink-0">
            <Folder className="w-4 h-4 text-slate-400" /> Client Dashboard
          </h1>
        )}
        <h1 className="text-base font-semibold text-slate-800 hidden sm:block">Project Dashboard</h1>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <NotificationBell />

        <UserProfileMenu
          isOpen={profileOpen}
          onOpenChange={(open) => {
            setProfileOpen(open);
          }}
          profileHref="/client-dashboard/profile"
          settingsHref="/client-dashboard/settings"
        />
      </div>
    </header>
  );
}