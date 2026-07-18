'use client';

import { createContext } from 'react';

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
  isTwoFactorEnabled?: boolean;
  phoneNumber?: string;
  designation?: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthReady: boolean;
  login: (userData: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default AuthContext;
