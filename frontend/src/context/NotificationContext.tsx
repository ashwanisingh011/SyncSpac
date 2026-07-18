'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type INotification,
} from '@/api/notifications';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/context/useAuth';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // Re-fetch every 30 seconds

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { useEventListener } = useSocket();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyNotifications(1, 20);
      setNotifications(result.notifications);
    } catch {
      // Fail silently — don't break the app if notifications fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark one notification as read — optimistic update then confirm from server
  const markOneRead = useCallback(async (id: string) => {
    // 1. Optimistic: flip isRead immediately so the UI responds instantly
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      // 2. Persist to backend
      const updated = await markNotificationRead(id);
      // 3. Confirm with actual server value (idempotent)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, ...updated } : n))
      );
    } catch {
      // 4. On failure: revert the optimistic flag
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n))
      );
    }
  }, []);

  // Mark all as read — optimistic update then confirm from server
  const markAllRead = useCallback(async () => {
    // 1. Optimistic: mark every notification as read in state
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      // 2. Persist to backend
      await markAllNotificationsRead();
    } catch {
      // 3. On failure: re-fetch real state from server
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  // Initial load + polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    intervalRef.current = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, user]);

  const handleNotificationReceived = useCallback((notification: INotification) => {
    setNotifications((prev) => {
      const withoutDuplicate = prev.filter((item) => item._id !== notification._id);
      return [notification, ...withoutDuplicate].slice(0, 20);
    });
  }, []);

  useEventListener('notification:received', handleNotificationReceived);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, fetchNotifications, markOneRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a <NotificationProvider />');
  return ctx;
}
