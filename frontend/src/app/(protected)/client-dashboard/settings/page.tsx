'use client';

import { useState, useEffect } from 'react';
import {
  Lock,
  Monitor,
  Smartphone,
  Loader2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import api from '@/api/axios';
import { UAParser } from 'ua-parser-js';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';

interface SessionItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

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

export default function ClientSettingsPage(): React.JSX.Element {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('All password fields are required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (!validatePassword(newPassword)) {
      showToast(PASSWORD_VALIDATION_ERROR_MSG, 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      showToast(msg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    const isConfirmed = await confirm({
      title: 'Revoke Session',
      message: isCurrent
        ? 'Logging out of this session will end your connection immediately. Proceed?'
        : 'Are you sure you want to sign out this device?',
      confirmText: 'Sign Out Device',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    setRevokingId(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showToast(
        isCurrent ? 'Current session revoked. Logging out…' : 'Session revoked successfully.',
        'success'
      );
      if (isCurrent) {
        logout();
        window.location.href = '/login';
      } else {
        await fetchSessions();
      }
    } catch {
      showToast('Failed to revoke session.', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    const isConfirmed = await confirm({
      title: 'Sign Out All Devices',
      message: 'Sign out of all devices? This will also end your active connection.',
      confirmText: 'Sign Out All',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    setRevokingAll(true);
    try {
      await api.post('/auth/logout-all');
      showToast('All sessions revoked. Logging out…', 'success');
      logout();
      window.location.href = '/login';
    } catch {
      showToast('Failed to revoke all sessions.', 'error');
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <SettingsIcon className="h-5 w-5 text-blue-650" /> Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust credential details and manage login sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Password Reset panel */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <Lock className="h-4.5 w-4.5 text-blue-650" />
              <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Sessions Audits */}
        <div>
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col h-full max-h-[500px]">
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Active Devices</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  These are the devices logged into your account.
                </p>
              </div>
              {sessions.length > 0 && (
                <button
                  type="button"
                  disabled={revokingAll}
                  onClick={handleRevokeAll}
                  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-650 hover:bg-red-50"
                >
                  {revokingAll ? 'Signing out…' : 'Sign out all'}
                </button>
              )}
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 scrollbar-thin">
              {sessionsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-650" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No active sessions found.</p>
              ) : (
                sessions.map((session) => {
                  const ua = parseUA(session.userAgent);
                  const isCurrent = session.isCurrent;
                  const DeviceIconComponent = isMobileUA(session.userAgent) ? Smartphone : Monitor;

                  return (
                    <div
                      key={session.id}
                      className="flex gap-3 border border-slate-100 rounded-xl p-3 hover:bg-slate-50/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-450 border border-slate-100">
                        <DeviceIconComponent className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-slate-800">{ua.os}</p>
                          {isCurrent && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-black uppercase text-blue-700 tracking-wide">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 truncate">
                          {ua.browser} • {session.ipAddress}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">
                          Logged in: {formatDate(session.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={revokingId === session.id}
                        onClick={() => handleRevokeSession(session.id, isCurrent)}
                        className="shrink-0 self-start text-[10px] font-bold text-red-650 hover:underline"
                      >
                        {revokingId === session.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
