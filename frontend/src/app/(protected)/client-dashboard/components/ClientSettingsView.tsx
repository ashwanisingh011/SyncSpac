'use client';

import { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Monitor,
  Smartphone,
  LogOut,
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle,
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

export default function ClientSettingsView(): React.JSX.Element {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Profile fields state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [profileDesignation, setProfileDesignation] = useState(user?.designation || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Avatar Uploading
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  // Submit Profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.patch('/users/profile', {
        name: profileName.trim(),
        phoneNumber: profilePhone.trim(),
        designation: profileDesignation.trim(),
      });
      if (response.data.success) {
        updateUser(response.data.data);
        showToast('Profile updated successfully', 'success');
      }
    } catch {
      showToast('Failed to update profile details', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    try {
      const response = await api.patch('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        updateUser(response.data.data);
        showToast('Avatar updated successfully', 'success');
      }
    } catch {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Submit Password update
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

  // Revoke session
  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    const isConfirmed = await confirm({
      title: 'Revoke Session',
      message: isCurrent
        ? 'Logging out of this session will end your current connection. Proceed?'
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

  // Sign out all
  const handleRevokeAll = async () => {
    const isConfirmed = await confirm({
      title: 'Sign Out All Devices',
      message: 'Sign out of all devices? This will end your active session as well.',
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Profile & Avatar Editing */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
            <UserIcon className="h-4.5 w-4.5 text-blue-650" />
            <h3 className="text-sm font-bold text-slate-800">Profile Information</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Avatar block */}
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.[0] || 'U'
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50 transition-colors shrink-0">
                <Upload className="h-3 w-3" /> Upload Photo
                <input
                  type="file"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </label>
            </div>

            {/* Profile fields form */}
            <form onSubmit={handleProfileSubmit} className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={profileLoading}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled={true}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  disabled={profileLoading}
                  placeholder="e.g. +91 99999 99999"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation / Role</label>
                <input
                  type="text"
                  value={profileDesignation}
                  onChange={(e) => setProfileDesignation(e.target.value)}
                  disabled={profileLoading}
                  placeholder="e.g. Client Partner"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Sessions Management */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col h-full max-h-[500px]">
        <div className="flex justify-between items-start border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Active Devices</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              These are the devices currently logged into your account.
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
  );
}
