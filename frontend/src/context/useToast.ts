"use client";

import { useContext } from 'react';
import ToastContext from './toastContextInstance';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  hideToast: () => void;
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
