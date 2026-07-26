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
    color: 'text-status-review',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-status-review/12',
  },
  TASK_ASSIGNED: {
    icon: ClipboardList,
    color: 'text-primary',
    dotColor: 'bg-primary',
    bgColor: 'bg-primary-subtle',
  },
  TASK_COMPLETED: {
    icon: CheckSquare,
    color: 'text-success',
    dotColor: 'bg-success',
    bgColor: 'bg-emerald-100',
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: 'text-warning',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-100',
  },
  PROJECT_UPDATED: {
    icon: FolderOpen,
    color: 'text-content-secondary',
    dotColor: 'bg-content-tertiary',
    bgColor: 'bg-surface-hover',
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
        transition-colors duration-150 border-b border-line
        last:border-b-0 group
        ${notification.isRead
          ? 'hover:bg-surface-hover/50'
          : 'bg-primary-subtle/40 hover:bg-primary-subtle/70'
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
          <p className={`text-sm font-medium leading-tight truncate ${notification.isRead ? 'text-content-secondary' : 'text-content'}`}>
            {notification.title}
          </p>
          {/* Unread dot */}
          {!notification.isRead && (
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${cfg.dotColor}`} />
          )}
        </div>
        <p className="text-xs text-content-tertiary mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[11px] text-content-tertiary mt-1">
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
        className="relative p-1.5 hover:bg-surface-hover rounded-full text-content-secondary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="fixed left-4 right-4 top-14 mt-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[360px] z-50 bg-surface border border-line rounded-xl shadow-overlay overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-content">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-subtle text-primary text-[11px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm text-content-tertiary">Loading notifications…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                  <Bell className="w-5 h-5 text-content-tertiary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-content-secondary">
                    You're all caught up!
                  </p>
                  <p className="text-xs text-content-tertiary mt-1">No notifications yet.</p>
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
            <div className="border-t border-line px-4 py-2.5">
              <p className="text-[11px] text-content-tertiary text-center">
                Showing latest {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                {' · '}
                <span className="text-primary">refreshes every 30s</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
