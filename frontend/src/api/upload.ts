import api from './axios';
import type { AuthUser } from '@/context/authContextInstance';

/**
 * PATCH /api/uploads/avatar
 * Field name must be "avatar" (multer single('avatar') + Cloudinary).
 */
export const uploadAvatar = async (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const { data } = await api.patch('/uploads/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const user = data?.data as Record<string, unknown>;
  return {
    ...user,
    id: String(user?.id ?? user?._id ?? ''),
    avatar: (user?.avatar as string) || undefined,
  } as AuthUser;
};

/**
 * POST /api/uploads/logo
 * Field name must be "logo".
 */
export const uploadLogo = async (file: File): Promise<{ success: boolean; url: string }> => {
  const formData = new FormData();
  formData.append('logo', file);

  const { data } = await api.post('/uploads/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};
