"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import api from '@/api/axios';
import type { AxiosError } from 'axios';
import AvatarUpload from '@/components/profile/AvatarUpload';
import { normalizeAuthUser } from '@/lib/userRoles';
import { Lock, Mail, Pencil, ChevronRight, X, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';

// ─── Reusable field component ─────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  name?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const Field = ({
  label,
  value,
  name,
  type = 'text',
  disabled = false,
  readOnly = false,
  onChange,
  placeholder,
  icon,
  required = false,
}: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${disabled || readOnly
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500'
          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-600 dark:focus:border-blue-500'
          } ${icon ? 'pr-10' : ''}`}
      />
      {icon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
    </div>
  </div>
);

// ─── Section card wrapper ─────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
    {children}
  </div>
);

// ─── Credential row (like the screenshot) ────────────────────────────────────
interface CredRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBg: string;
  onClick: () => void;
}

const CredRow = ({ icon, title, subtitle, iconBg, onClick }: CredRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 group"
  >
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{subtitle}</p>
    </div>
    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
  </button>
);

// ─── Expandable password panel ────────────────────────────────────────────────
interface PasswordPanelProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  data: { currentPassword: string; newPassword: string; confirmPassword: string };
  onChange: (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => void;
  loading: boolean;
}

const PasswordPanel = ({ onClose, onSubmit, data, onChange, loading }: PasswordPanelProps) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-3">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field
          label="Current password"
          type={showCurrent ? 'text' : 'password'}
          value={data.currentPassword}
          onChange={(e) => onChange('currentPassword', e.target.value)}
          placeholder="••••••••"
          icon={
            <button
              type="button"
              onClick={() => setShowCurrent(prev => !prev)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none flex items-center justify-center"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Field
          label="New password"
          type={showNew ? 'text' : 'password'}
          value={data.newPassword}
          onChange={(e) => onChange('newPassword', e.target.value)}
          placeholder="••••••••"
          icon={
            <button
              type="button"
              onClick={() => setShowNew(prev => !prev)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none flex items-center justify-center"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Field
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={data.confirmPassword}
          onChange={(e) => onChange('confirmPassword', e.target.value)}
          placeholder="••••••••"
          icon={
            <button
              type="button"
              onClick={() => setShowConfirm(prev => !prev)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none flex items-center justify-center"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {loading ? 'Updating…' : 'Update password'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Expandable email panel ───────────────────────────────────────────────────
interface EmailPanelProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

const EmailPanel = ({ onClose, onSubmit, value, onChange, loading }: EmailPanelProps) => (
  <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-3">
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label="New email address"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
      />
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        A verification link will be sent to the new address. Your email won't change until you confirm it.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          {loading ? 'Sending…' : 'Request change'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </form>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ProfilePage = (): React.JSX.Element => {
  const { user, updateUser } = useAuth();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCredPanel, setActiveCredPanel] = useState<null | 'password' | 'email'>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    designation: user?.designation || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailData, setEmailData] = useState({ newEmail: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        if (data?.data) {
          updateUser(normalizeAuthUser({ ...user, ...data.data }) as any);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      designation: user?.designation || '',
    });
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/users/profile', formData);
      updateUser(normalizeAuthUser({ ...user, ...data.data }) as any);
      setIsEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      const msg = (error as AxiosError<{ message?: string }>)?.response?.data?.message || 'Unable to update profile.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (!validatePassword(passwordData.newPassword)) {
      showToast(PASSWORD_VALIDATION_ERROR_MSG, 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast('Password changed successfully', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveCredPanel(null);
    } catch (error) {
      const msg = (error as AxiosError<{ message?: string }>)?.response?.data?.message || 'Unable to change password.';
      showToast(msg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.newEmail) {
      showToast('Please provide a new email address', 'error');
      return;
    }
    setEmailLoading(true);
    try {
      await api.post('/auth/request-email-change', { newEmail: emailData.newEmail });
      showToast('Verification link sent to the new email address', 'success');
      setEmailData({ newEmail: '' });
      setActiveCredPanel(null);
    } catch (error) {
      const msg = (error as AxiosError<{ message?: string }>)?.response?.data?.message || 'Unable to request email change.';
      showToast(msg, 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const toggleCredPanel = (panel: 'password' | 'email') => {
    setActiveCredPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-900/30 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-6 max-w-3xl xl:max-w-5xl mx-auto">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">My Profile</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">My Profile</h1>
      </div>

      {/* ── Two-column grid on xl+ ─────────────────────── */}
      <div className="max-w-3xl xl:max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN (main content) ─────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Profile Information card */}
          <Card>
            <div className="p-5 sm:p-6">
              {/* Card header: title + Edit button (outside the form to avoid DOM reuse submit bug) */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Profile Information
                </h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Avatar row */}
              <div className="mb-6">
                <AvatarUpload />
              </div>

              {/* Fields – form only handles Save/Cancel, never the Edit button */}
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Your full name"
                  />
                  <Field
                    label="Email Address"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    icon={<Lock className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Role"
                    value={user?.role ? user.role.replace(/_/g, ' ') : ''}
                    readOnly
                    icon={<Lock className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Organization / Workspace"
                    value={currentOrg?.name || 'N/A'}
                    readOnly
                    icon={<Lock className="h-3.5 w-3.5" />}
                  />
                  <Field
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                  />
                  <Field
                    label="Designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                {/* Save / Cancel – only visible in edit mode */}
                {isEditing && (
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          phoneNumber: user?.phoneNumber || '',
                          designation: user?.designation || '',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {loading ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </Card>

          {/* Credential Settings card */}
          <Card>
            <div className="p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Credential Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Manage your password and email address.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
              {/* Change Password row */}
              <div>
                <CredRow
                  icon={<Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                  iconBg="bg-blue-50 dark:bg-blue-950/40"
                  title="Change Password"
                  subtitle="Update your account password to keep your account secure."
                  onClick={() => toggleCredPanel('password')}
                />
                {activeCredPanel === 'password' && (
                  <PasswordPanel
                    onClose={() => {
                      setActiveCredPanel(null);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    onSubmit={handlePasswordSubmit}
                    data={passwordData}
                    onChange={(field, value) => setPasswordData((prev) => ({ ...prev, [field]: value }))}
                    loading={passwordLoading}
                  />
                )}
              </div>

              {/* Change Email row */}
              <div>
                <CredRow
                  icon={<Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                  iconBg="bg-violet-50 dark:bg-violet-950/40"
                  title="Change Email"
                  subtitle="Update your email address with verification."
                  onClick={() => toggleCredPanel('email')}
                />
                {activeCredPanel === 'email' && (
                  <EmailPanel
                    onClose={() => setActiveCredPanel(null)}
                    onSubmit={handleEmailSubmit}
                    value={emailData.newEmail}
                    onChange={(v) => setEmailData({ newEmail: v })}
                    loading={emailLoading}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (sidebar info on xl+) ─────────── */}
        <div className="hidden xl:flex flex-col gap-5">

          {/* Quick info card */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-4">Account overview</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || '—'}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Role</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{user?.role?.replace(/_/g, ' ') || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Organization</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px] text-right">{currentOrg?.name || '—'}</span>
                </div>
                {user?.designation && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Designation</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px] text-right">{user.designation}</span>
                  </div>
                )}
                {user?.phoneNumber && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Phone</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{user.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Security tips card */}
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Security tips</p>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              {[
                'Use a strong, unique password.',
                'Enable two-factor authentication.',
                'Never share your login details.',
                'Review active sessions regularly.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
