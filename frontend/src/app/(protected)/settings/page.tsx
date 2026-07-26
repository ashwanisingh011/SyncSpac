"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import api from '@/api/axios';
import type { AxiosError } from 'axios';
import { UAParser } from 'ua-parser-js';
import { Monitor, Smartphone, LogOut, ChevronRight, Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseUA = (userAgent: string) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  return {
    browser: `${result.browser.name || 'Unknown'}${result.browser.version ? ` ${result.browser.version}` : ''}`.trim(),
    os: `${result.os.name || 'Unknown OS'}${result.os.version ? ` ${result.os.version}` : ''}`.trim(),
    device:
      result.device.model ||
      result.device.vendor ||
      (result.os.name === 'iOS' || result.os.name === 'Android' ? 'Mobile Device' : 'Desktop'),
  };
};

const isMobileUA = (ua: string) => {
  const l = ua.toLowerCase();
  return l.includes('phone') || l.includes('mobile') || l.includes('android') || l.includes('iphone');
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}>
    {children}
  </div>
);

// ─── Session device icon ──────────────────────────────────────────────────────
const DeviceIcon = ({ userAgent, color }: { userAgent: string; color: string }) => {
  const Icon = isMobileUA(userAgent) ? Smartphone : Monitor;
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

const SESSION_COLORS = [
  'bg-primary-subtle text-primary',
  'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
];

// ─── Main page ────────────────────────────────────────────────────────────────
const SettingsPage = (): React.JSX.Element => {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [toggleLoading, setToggleLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const twoFactorEnabled = Boolean(user?.isTwoFactorEnabled);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const { data } = await api.get('/auth/sessions');
      setSessions(data.data || []);
    } catch {
      showToast('Failed to fetch active sessions.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleToggle2FA = async () => {
    const nextEnabled = !twoFactorEnabled;
    setToggleLoading(true);
    try {
      const { data } = await api.patch('/auth/2fa', { enabled: nextEnabled });
      updateUser({ ...user, isTwoFactorEnabled: data?.data?.isTwoFactorEnabled ?? nextEnabled });
      showToast(
        nextEnabled
          ? 'Two-factor authentication enabled.'
          : 'Two-factor authentication disabled.',
        'success',
      );
    } catch (error) {
      const msg = (error as AxiosError<{ message?: string }>)?.response?.data?.message || 'Unable to update 2FA settings.';
      showToast(msg, 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    setRevokingId(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showToast(
        isCurrent ? 'Current session revoked. Logging out…' : 'Session revoked successfully.',
        'success',
      );
      if (isCurrent) logout();
      else await fetchSessions();
    } catch {
      showToast('Failed to revoke session.', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    const isConfirmed = await confirm({
      title: 'Sign Out All Devices',
      message: 'Sign out of all devices? This will also end your current session.',
      confirmText: 'Sign Out All',
      variant: 'warning',
    });
    if (!isConfirmed) return;
    setRevokingAll(true);
    try {
      await api.post('/auth/logout-all');
      showToast('All sessions revoked. Logging out…', 'success');
      logout();
    } catch {
      showToast('Failed to revoke all sessions.', 'error');
    } finally {
      setRevokingAll(false);
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const visibleOther = showAll ? otherSessions : otherSessions.slice(0, 3);

  return (
    <div className="min-h-full w-full bg-surface-sunken/30 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-6 max-w-3xl xl:max-w-5xl mx-auto">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-content-tertiary">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-content-secondary font-medium">Settings</span>
        </nav>
        <h1 className="text-2xl font-bold text-content tracking-tight">Settings</h1>
      </div>

      {/* ── Two-column grid on xl+ ─────────────────────── */}
      <div className="max-w-3xl xl:max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: main content ─────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* ─ Two-Factor Authentication card ─────────── */}
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-content">
                    Two-Factor Authentication
                  </h2>
                  <p className="mt-1 text-sm text-content-tertiary">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                {/* 2FA status badge */}
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    twoFactorEnabled
                      ? 'bg-emerald-100 text-success'
                      : 'bg-amber-100 text-warning'
                  }`}
                >
                  {twoFactorEnabled ? '2FA on' : '2FA off'}
                </span>
              </div>

              {/* Status row */}
              <div className={`mt-5 flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 ${
                twoFactorEnabled
                  ? 'bg-success/10'
                  : 'bg-surface-sunken/60'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  {twoFactorEnabled
                    ? <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
                    : <ShieldOff className="h-5 w-5 shrink-0 text-content-tertiary" />
                  }
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      twoFactorEnabled
                        ? 'text-success'
                        : 'text-content-secondary'
                    }`}>
                      {twoFactorEnabled ? '2FA is currently enabled' : '2FA is currently disabled'}
                    </p>
                    <p className="text-xs text-content-tertiary mt-0.5">
                      {twoFactorEnabled
                        ? 'You will be asked for a verification code after entering your password.'
                        : 'Enable to require an email code at each login.'}
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFactorEnabled}
                  aria-label="Toggle two-factor authentication"
                  disabled={toggleLoading}
                  onClick={handleToggle2FA}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    twoFactorEnabled ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  {toggleLoading
                    ? <Loader2 className="absolute left-1/2 h-4 w-4 -translate-x-1/2 animate-spin text-white" />
                    : <span className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  }
                </button>
              </div>

              {/* Manage 2FA link */}
              <div className="mt-4">
                <a
                  href="/2fa"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-4 py-2 text-sm font-semibold text-content-secondary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                >
                  Manage 2FA
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Card>

          {/* ─ Active Sessions card ────────────────────── */}
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-content">Active Sessions</h2>
                  <p className="mt-1 text-sm text-content-tertiary">
                    These are the devices currently logged into your TaskBridge account.
                  </p>
                </div>
                {sessions.length > 0 && (
                  <button
                    type="button"
                    disabled={revokingAll}
                    onClick={handleRevokeAll}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors focus:outline-none focus:ring-2 focus:ring-danger/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {revokingAll
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing out…</>
                      : <><LogOut className="h-3.5 w-3.5" /> Sign out of all devices</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Sessions list */}
            <div className="border-t border-line">
              {sessionsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="py-8 text-center text-sm text-content-tertiary">
                  No active sessions found.
                </p>
              ) : (
                <div className="divide-y divide-line">

                  {/* Current session */}
                  {currentSession && (
                    <SessionRow
                      key={currentSession.id}
                      session={currentSession}
                      colorClass={SESSION_COLORS[0]}
                      revokingId={revokingId}
                      onRevoke={handleRevokeSession}
                    />
                  )}

                  {/* Other sessions */}
                  {visibleOther.map((s, i) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      colorClass={SESSION_COLORS[(i + 1) % SESSION_COLORS.length]}
                      revokingId={revokingId}
                      onRevoke={handleRevokeSession}
                    />
                  ))}

                  {/* Show more / less */}
                  {otherSessions.length > 3 && (
                    <div className="px-5 py-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => setShowAll((p) => !p)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        {showAll ? 'Show fewer sessions' : `Show ${otherSessions.length - 3} more session${otherSessions.length - 3 > 1 ? 's' : ''}`}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: sidebar on xl+ ──────────────────────── */}
        <div className="hidden xl:flex flex-col gap-5">

          {/* Security status card */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary mb-4">
              Security status
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${twoFactorEnabled ? 'bg-success/10' : 'bg-warning/10'}`}>
                  <Shield className={`h-5 w-5 ${twoFactorEnabled ? 'text-success' : 'text-warning'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-content">
                    {twoFactorEnabled ? 'Good security' : 'Low security'}
                  </p>
                  <p className="text-xs text-content-tertiary">
                    {twoFactorEnabled ? '2FA is active' : 'Enable 2FA to improve'}
                  </p>
                </div>
              </div>

              <div className="border-t border-line pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-content-tertiary">2FA</span>
                  <span className={`font-semibold ${twoFactorEnabled ? 'text-success' : 'text-warning'}`}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-content-tertiary">Active sessions</span>
                  <span className="font-semibold text-content-secondary">{sessions.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-content-tertiary">Other devices</span>
                  <span className="font-semibold text-content-secondary">{otherSessions.length}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Security tips card */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary mb-3">
              Security tips
            </p>
            <ul className="space-y-2.5 text-xs text-content-tertiary">
              {[
                'Enable 2FA for stronger protection.',
                'Review active sessions regularly.',
                'Sign out from unfamiliar devices.',
                'Never share your verification codes.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="mt-10 max-w-3xl xl:max-w-5xl mx-auto border-t border-line pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-content-tertiary">
        <span>© {new Date().getFullYear()} TaskBridge. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <a href="#" className="hover:text-content transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-content transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
};

// ─── Session row sub-component ────────────────────────────────────────────────
interface SessionRowProps {
  session: SessionItem;
  colorClass: string;
  revokingId: string | null;
  onRevoke: (id: string, isCurrent: boolean) => void;
}

function SessionRow({ session, colorClass, revokingId, onRevoke }: SessionRowProps) {
  const parsed = parseUA(session.userAgent);
  const isRevoking = revokingId === session.id;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${
        session.isCurrent ? 'bg-blue-50/60' : ''
      }`}
    >
      <DeviceIcon userAgent={session.userAgent} color={colorClass} />

      <div className="min-w-0 flex-1">
        {/* Name + badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-content truncate">
            {parsed.device}
          </span>
          {session.isCurrent ? (
            <span className="inline-flex items-center rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-blue-600/20">
              Current Device
            </span>
          ) : (
            <span className="text-xs text-content-tertiary">
              {formatDate(session.lastActivityAt || session.createdAt)}
            </span>
          )}
          {session.isCurrent && (
            <span className="text-xs font-medium text-success">Active now</span>
          )}
        </div>

        {/* Meta info */}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-content-tertiary">
          <span>{parsed.browser} · {parsed.os}</span>
          <span>IP: {session.ipAddress}</span>
        </div>
      </div>

      {/* Revoke button (not shown for current session) */}
      {!session.isCurrent && (
        <button
          type="button"
          disabled={isRevoking}
          onClick={() => onRevoke(session.id, session.isCurrent)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors focus:outline-none focus:ring-2 focus:ring-danger/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRevoking
            ? <><Loader2 className="h-3 w-3 animate-spin" />Revoking…</>
            : 'Revoke'
          }
        </button>
      )}
    </div>
  );
}

export default SettingsPage;
