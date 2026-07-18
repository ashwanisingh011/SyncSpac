'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  UserPlus,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import type { INotification, NotificationType } from '@/api/notifications';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface TypeConfig {
  icon: React.ElementType;
  color: string;       // icon color class
  dotColor: string;    // unread dot color class
  bgColor: string;     // icon background class
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  INVITATION_RECEIVED: {
    icon: UserPlus,
    color: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-violet-100 dark:bg-violet-950',
  },
  TASK_ASSIGNED: {
    icon: ClipboardList,
    color: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  TASK_COMPLETED: {
    icon: CheckSquare,
    color: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950',
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
  },
  PROJECT_UPDATED: {
    icon: FolderOpen,
    color: 'text-slate-600 dark:text-slate-300',
    dotColor: 'bg-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
};

// ─── Single Notification Row ──────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: INotification;
  onMarkRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.PROJECT_UPDATED;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification._id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left flex items-start gap-3 px-4 py-3
        transition-colors duration-150 border-b border-slate-100 dark:border-slate-800
        last:border-b-0 group
        ${notification.isRead
          ? 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
          : 'bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40'
        }
      `}
    >
      {/* Icon */}
      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bgColor}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight truncate ${notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
            {notification.title}
          </p>
          {/* Unread dot */}
          {!notification.isRead && (
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dotColor}`} />
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationBell(): React.JSX.Element {
  const { notifications, unreadCount, loading, markOneRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    await markAllRead();
    setMarkingAll(false);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-1.5 hover:bg-slate-100 rounded-full text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-950 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="
            fixed left-4 right-4 top-14 mt-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[360px] z-50
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-xl shadow-2xl shadow-slate-200/60 dark:shadow-black/40
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-150
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {markingAll
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCheck className="w-3.5 h-3.5" />
              }
              Mark all read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm text-slate-400">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    You're all caught up!
                  </p>
                  <p className="text-xs text-slate-400 mt-1">No notifications yet.</p>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onMarkRead={markOneRead}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Showing latest {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {' · '}
                <span className="text-blue-500">refreshes every 30s</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
