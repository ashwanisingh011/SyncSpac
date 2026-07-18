'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { uploadAvatar } from '@/api/upload';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { normalizeAuthUser } from '@/lib/userRoles';

const MAX_SIZE_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/jpg';

function getApiErrorMessage(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string } } })?.response
    ?.data?.message;
  return msg ?? fallback;
}

interface AvatarUploadProps {
  size?: 'md' | 'lg';
}

export default function AvatarUpload({ size = 'lg' }: AvatarUploadProps) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const authUser = user as { name?: string; avatar?: string } | null;
  const dimension = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`Image must be under ${MAX_SIZE_MB} MB.`, 'error');
      return;
    }

    setIsUploading(true);
    try {
      const updated = await uploadAvatar(file);
      const normalizedUser = normalizeAuthUser({ ...authUser, ...updated, avatar: updated.avatar });
      updateUser(normalizedUser as any);
      showToast('Profile photo updated.', 'success');
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Failed to upload photo.'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <div
          className={`${dimension} rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center`}
        >
          {authUser?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authUser.avatar}
              alt={authUser.name ?? 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:opacity-60 transition-colors"
          aria-label="Upload profile photo"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Profile photo
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          Uploaded to Cloudinary via your account. JPG, PNG, or WebP up to {MAX_SIZE_MB} MB.
        </p>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-50"
        >
          {isUploading ? 'Uploading…' : 'Change photo'}
        </button>
      </div>
    </div>
  );
}
