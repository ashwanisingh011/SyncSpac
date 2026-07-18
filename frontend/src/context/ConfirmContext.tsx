"use client";

import { useState, useRef, useCallback } from 'react';
import ConfirmDialog, { type ConfirmVariant } from '@/components/ConfirmDialog';
import ConfirmContext from './confirmContextInstance';
import type { ConfirmOptions } from './useConfirm';

interface ConfirmProviderProps {
  children: React.ReactNode;
}

export const ConfirmProvider = ({ children }: ConfirmProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirm');
  const [cancelText, setCancelText] = useState('Cancel');
  const [variant, setVariant] = useState<ConfirmVariant>('danger');

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      // If there's an existing pending confirmation, resolve it as false
      if (resolveRef.current) {
        resolveRef.current(false);
      }

      setTitle(options.title || 'Confirm Action');
      setMessage(options.message);
      setConfirmText(options.confirmText || 'Confirm');
      setCancelText(options.cancelText || 'Cancel');
      setVariant(options.variant || 'danger');
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        variant={variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};
