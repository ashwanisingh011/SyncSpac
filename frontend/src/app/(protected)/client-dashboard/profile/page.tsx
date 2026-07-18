'use client';

import { useState } from 'react';
import { User as UserIcon, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import api from '@/api/axios';

export default function ClientProfilePage(): React.JSX.Element {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [profileDesignation, setProfileDesignation] = useState(user?.designation || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <UserIcon className="h-5 w-5 text-blue-650" /> My Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details and account profile picture.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-50 pb-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden">
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

          <div className="flex-1 w-full space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-800">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Role: {user?.role || 'Client'}
            </p>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={profileLoading}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled={true}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designation / Role</label>
            <input
              type="text"
              value={profileDesignation}
              onChange={(e) => setProfileDesignation(e.target.value)}
              disabled={profileLoading}
              placeholder="e.g. Project Stakeholder"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
