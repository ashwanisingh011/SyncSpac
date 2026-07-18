"use client";

import { useEffect, useState } from 'react';
import AuthContext from './authContextInstance';
import type { AuthUser } from './authContextInstance';
import { clearOrganizationSession } from '@/lib/orgSession';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): React.JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem('user');
        setUser(stored ? (JSON.parse(stored) as AuthUser) : null);
      } catch {
        setUser(null);
      }
    };

    loadUser();
    setIsAuthReady(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
      } else if (e.key === 'token' && !e.newValue) {
        // Handle logout from another tab
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData: AuthUser, token: string): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthReady(true);
  };

  const updateUser = (userData: AuthUser): void => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearOrganizationSession();
    setUser(null);
    setIsAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthReady, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
