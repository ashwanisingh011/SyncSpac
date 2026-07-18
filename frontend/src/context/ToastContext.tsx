"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Toast from '@/components/Toast';
import ToastContext from './toastContextInstance';
import type { ToastVariant } from './useToast';

// ─── Internal toast state shape ───────────────────────────────────────────────

interface ToastState {
  message: string;
  variant: ToastVariant;
}

// ─── Provider Props ───────────────────────────────────────────────────────────

interface ToastProviderProps {
  children: React.ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION_MS = 2500;

// ─── Component ────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: ToastProviderProps): React.JSX.Element => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = DEFAULT_DURATION_MS): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ message, variant });

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setToast(null);
          timerRef.current = null;
        }, duration);
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};
