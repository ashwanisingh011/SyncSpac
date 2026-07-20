'use client';

import { useAuth } from '@/context/useAuth';
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Shield,
  ChevronRight,
  X,
  Grid,
  Layers,
} from 'lucide-react';
import { IAdminStats } from '@/api/admin';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  onActiveItemChange: (item: string) => void;
  stats?: IAdminStats | null;
}

export default function Sidebar({ isOpen, onClose, activeItem, onActiveItemChange, stats }: SidebarProps) {
  const { user } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organizations', icon: Building2, badge: stats?.orgsCount ? stats.orgsCount.toLocaleString() : undefined },
    { id: 'users', label: 'Users', icon: Users, badge: stats?.usersCount ? `${Math.round(stats.usersCount / 1000)}K+` : undefined },
    { id: 'subscriptions', label: 'Subscription Plans', icon: Layers },
    { id: 'activity', label: 'Activity Logs', icon: ScrollText },
    { id: 'system', label: 'System Health', icon: Shield },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 flex flex-col
          bg-white border-r border-slate-100 shadow-sm
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
          dark:bg-slate-900 dark:border-slate-800
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <Grid className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight">SyncSpac</span>
              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest -mt-0.5">Super Admin</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Platform</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onActiveItemChange(item.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                      font-medium transition-all duration-150 group cursor-pointer
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-white'
                      }
                    `}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-450' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-350'
                        }`}
                      />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span
                        className={`
                          text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                          bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400
                        `}
                      >
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-405 dark:text-blue-500" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom admin card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 dark:from-slate-800/30 dark:to-slate-800/20 dark:border-slate-800/80 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate">{user?.email || 'admin@taskbridge.io'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
